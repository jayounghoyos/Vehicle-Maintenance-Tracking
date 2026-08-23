import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IsNull, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { hashPassword } from '../auth/password';
import { ServiceEvent, User, UserRole } from '../entities';
import { TenantRepositories, type TenantRepository } from '../tenant/tenant-repository';
import type { CreateWorkerDto, ImportTeamDto, UpdateMemberDto } from './dto';
import { temporaryPassword } from './password-generator';

export type TeamMember = {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  /** false once the person has left: the row stays, the login does not */
  active: boolean;
  /** how much history is attached to them, which is what decides
   *  whether the account can be removed rather than only retired */
  recordedEvents: number;
  createdAt: Date;
};

/** An account the import created. temporaryPassword is null when the
 *  list carried one, since the caller already knows what they chose;
 *  when it is set, this is the only time it exists in readable form. */
export type ImportedMember = TeamMember & { temporaryPassword: string | null };

export type ImportResult = {
  created: ImportedMember[];
  /** row is the caller's index, so the screen can point at the line */
  skipped: { row: number; email: string; reason: string }[];
};

@Injectable()
export class TeamService {
  constructor(
    private readonly tenants: TenantRepositories,
    /** the whole users table, only ever read to find out whether an
     *  address is taken somewhere else on the platform */
    @InjectRepository(User) private readonly everyUser: Repository<User>,
  ) {}

  private scoped(organizationId: number): {
    users: TenantRepository<User>;
    events: TenantRepository<ServiceEvent>;
  } {
    return {
      users: this.tenants.for(User, organizationId),
      events: this.tenants.for(ServiceEvent, organizationId),
    };
  }

  async list(organizationId: number): Promise<TeamMember[]> {
    const rows = await this.scoped(organizationId).users.find({
      order: { createdAt: 'ASC' },
    });
    const counts = await this.eventCounts(organizationId);
    // password_hash is never in the shape this returns
    return rows.map((user) => this.asMember(user, counts.get(user.id) ?? 0));
  }

  /** One grouped query rather than one per member. */
  private async eventCounts(organizationId: number): Promise<Map<number, number>> {
    const rows = await this.scoped(organizationId)
      .events.builder('event')
      .select('event.recorded_by', 'userId')
      .addSelect('count(*)', 'count')
      .groupBy('event.recorded_by')
      .getRawMany<{ userId: number; count: string }>();
    return new Map(rows.map((row) => [Number(row.userId), Number(row.count)]));
  }

  private asMember(user: User, recordedEvents: number): TeamMember {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      active: user.deletedAt === null,
      recordedEvents,
      createdAt: user.createdAt,
    };
  }

  async create(organizationId: number, dto: CreateWorkerDto): Promise<TeamMember> {
    // across the platform, not this organization: the login namespace is
    // shared, so an address taken anywhere is taken here
    const taken = await this.everyUser.findOne({ where: { email: dto.email } });
    if (taken) throw new ConflictException('That email is already registered');

    const users = this.scoped(organizationId).users;
    const user = await users.save(
      users.create({
        fullName: dto.fullName,
        email: dto.email,
        passwordHash: await hashPassword(dto.password),
        role: dto.role,
      }),
    );
    // brand new, so nothing is attached to them yet
    return this.asMember(user, 0);
  }

  /**
   * Partial success on purpose. Refusing the whole paste because one
   * address is taken would make the coordinator hunt for the bad row and
   * send the other forty-six again; they get created, and the report says
   * which ones did not and why.
   */
  async importMany(organizationId: number, dto: ImportTeamDto): Promise<ImportResult> {
    const skipped: ImportResult['skipped'] = [];
    const wanted = new Map<
      string,
      { row: number; member: ImportTeamDto['members'][0] }
    >();

    // the same address twice in one paste is the caller's typo, and the
    // first occurrence is the one that wins
    dto.members.forEach((member, index) => {
      const email = member.email.toLowerCase();
      if (wanted.has(email)) {
        skipped.push({
          row: index,
          email: member.email,
          reason: 'Repeated in this list',
        });
        return;
      }
      wanted.set(email, { row: index, member });
    });

    // one query for every address rather than one query each, and over
    // the whole platform, since the login namespace is shared
    const taken = await this.everyUser.find({
      where: [...wanted.keys()].map((email) => ({ email })),
      select: { email: true },
    });
    for (const { email } of taken) {
      const entry = wanted.get(email.toLowerCase());
      if (!entry) continue;
      // no mention of which organization holds it: that would tell one
      // client who else uses the service
      skipped.push({ row: entry.row, email, reason: 'That email is already registered' });
      wanted.delete(email.toLowerCase());
    }

    const pending = [...wanted.values()].sort((a, b) => a.row - b.row);
    // a row that carried a password keeps it; a row that left the column
    // empty gets one generated, to be changed by whoever receives it
    const chosen = pending.map(({ member }) => member.password ?? null);
    const passwords = chosen.map((given) => given ?? temporaryPassword());
    // argon2 is slow by design and the binding runs off the main thread,
    // so hashing the batch together beats hashing it one at a time
    const hashes = await Promise.all(passwords.map((plain) => hashPassword(plain)));

    const users = this.scoped(organizationId).users;
    const saved = await users.save(
      pending.map(({ member }, index) =>
        users.create({
          fullName: member.fullName,
          email: member.email,
          passwordHash: hashes[index],
          role: member.role,
        }),
      ),
    );

    return {
      created: saved.map((user, index) => ({
        ...this.asMember(user, 0),
        // nothing to hand back for a password the caller already chose
        temporaryPassword: chosen[index] === null ? passwords[index] : null,
      })),
      skipped: skipped.sort((a, b) => a.row - b.row),
    };
  }

  /**
   * Change a role, or retire somebody and bring them back.
   *
   * Never on yourself. A coordinator demoting or retiring their own
   * account could leave an organization nobody can administer, and the
   * rule is simpler to hold than the states it prevents.
   */
  async update(
    organizationId: number,
    actingUserId: number,
    id: number,
    dto: UpdateMemberDto,
  ): Promise<TeamMember> {
    if (id === actingUserId) {
      throw new BadRequestException('You cannot change your own account here');
    }
    const users = this.scoped(organizationId).users;
    const member = await users.findOne({ where: { id } });
    if (!member) throw new NotFoundException('No such team member');

    const losesCoordinator =
      member.role === UserRole.FLEET_COORDINATOR &&
      ((dto.role !== undefined && dto.role !== UserRole.FLEET_COORDINATOR) ||
        dto.active === false);

    if (losesCoordinator && (await this.otherCoordinators(organizationId, id)) === 0) {
      throw new ConflictException(
        'The organization would be left with no fleet coordinator',
      );
    }

    if (dto.role !== undefined) member.role = dto.role;
    if (dto.active !== undefined) member.deletedAt = dto.active ? null : new Date();

    const saved = await users.save(member);
    const counts = await this.eventCounts(organizationId);
    return this.asMember(saved, counts.get(saved.id) ?? 0);
  }

  private otherCoordinators(organizationId: number, exceptId: number): Promise<number> {
    return this.scoped(organizationId).users.count({
      where: {
        role: UserRole.FLEET_COORDINATOR,
        deletedAt: IsNull(),
        id: Not(exceptId),
      },
    });
  }

  /**
   * Permanent, and only for an account nothing is attached to yet: the
   * mistyped address that was never used. Anybody who has recorded work
   * is retired instead, so the events keep saying who did them.
   */
  async remove(organizationId: number, actingUserId: number, id: number): Promise<void> {
    if (id === actingUserId) {
      throw new BadRequestException('You cannot remove your own account');
    }
    const { users, events } = this.scoped(organizationId);
    // an id from another client matches nothing here, by construction
    const member = await users.findOne({ where: { id } });
    if (!member) throw new NotFoundException('No such team member');

    // service_events.recorded_by cannot be null, so the events cannot
    // outlive the account. Refusing is better than erasing who did the
    // work, and better than the foreign key failing as a 500.
    const recorded = await events.count({ where: { recordedBy: id } });
    if (recorded > 0) {
      throw new ConflictException(
        `${member.fullName} has recorded ${recorded} service ${
          recorded === 1 ? 'event' : 'events'
        }, so the account can only be retired`,
      );
    }

    await users.delete({ id });
  }
}
