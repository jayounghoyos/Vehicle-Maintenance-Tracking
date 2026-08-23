import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { hashPassword } from '../auth/password';
import { ServiceEvent, User, UserRole } from '../entities';
import type { CreateWorkerDto, ImportTeamDto } from './dto';
import { temporaryPassword } from './password-generator';

export type TeamMember = {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
};

/** An account the import created, with the password to hand its owner.
 *  This is the only time the password exists in readable form. */
export type ImportedMember = TeamMember & { temporaryPassword: string };

export type ImportResult = {
  created: ImportedMember[];
  /** row is the caller's index, so the screen can point at the line */
  skipped: { row: number; email: string; reason: string }[];
};

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(ServiceEvent)
    private readonly events: Repository<ServiceEvent>,
  ) {}

  async list(organizationId: number): Promise<TeamMember[]> {
    const rows = await this.users.find({
      where: { organizationId },
      order: { createdAt: 'ASC' },
    });
    // password_hash is never in the shape this returns
    return rows.map(({ id, fullName, email, role, createdAt }) => ({
      id,
      fullName,
      email,
      role,
      createdAt,
    }));
  }

  async create(organizationId: number, dto: CreateWorkerDto): Promise<TeamMember> {
    const taken = await this.users.findOne({ where: { email: dto.email } });
    if (taken) throw new ConflictException('That email is already registered');

    const user = await this.users.save(
      this.users.create({
        organizationId,
        fullName: dto.fullName,
        email: dto.email,
        passwordHash: await hashPassword(dto.password),
        role: dto.role,
      }),
    );
    const { id, fullName, email, role, createdAt } = user;
    return { id, fullName, email, role, createdAt };
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

    // one query for every address rather than one query each
    const taken = await this.users.find({
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
    // argon2 is slow by design and the binding runs off the main thread,
    // so hashing the batch together beats hashing it one at a time
    const passwords = pending.map(() => temporaryPassword());
    const hashes = await Promise.all(passwords.map((plain) => hashPassword(plain)));

    const saved = await this.users.save(
      pending.map(({ member }, index) =>
        this.users.create({
          organizationId,
          fullName: member.fullName,
          email: member.email,
          passwordHash: hashes[index],
          role: member.role,
        }),
      ),
    );

    return {
      created: saved.map((user, index) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        temporaryPassword: passwords[index],
      })),
      skipped: skipped.sort((a, b) => a.row - b.row),
    };
  }

  async remove(organizationId: number, actingUserId: number, id: number): Promise<void> {
    if (id === actingUserId) {
      throw new BadRequestException('You cannot remove your own account');
    }
    // scoped by organization, so an id from another client matches nothing
    const member = await this.users.findOne({ where: { id, organizationId } });
    if (!member) throw new ConflictException('No such team member');

    // service_events.recorded_by cannot be null, so the events cannot
    // outlive the account. Refusing is better than erasing who did the
    // work, and better than the foreign key failing as a 500.
    const recorded = await this.events.count({ where: { recordedBy: id } });
    if (recorded > 0) {
      throw new ConflictException(
        `${member.fullName} has recorded ${recorded} service ${
          recorded === 1 ? 'event' : 'events'
        }, so the account cannot be removed`,
      );
    }

    await this.users.delete({ id, organizationId });
  }
}
