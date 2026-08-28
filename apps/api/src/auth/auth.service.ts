import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Organization, PlatformAdmin, Role, User } from '../entities';
import { BASE_ROLES, OWNER_ROLE } from '../roles/base-roles';
import type { AuthResponse, JwtPayload, Principal } from './auth.types';
import type { LoginDto, RegisterOrganizationDto } from './dto';
import { hashPassword, verifyPassword } from './password';

/** The role and its grants come along on every read of a user, because
 *  the principal is worthless without them. */
const WITH_ROLE = { organization: true, role: { permissions: true } } as const;

function principalOf(user: User): Principal {
  return {
    kind: 'user',
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions: user.role.permissions.map((granted) => granted.permission),
    organizationId: user.organizationId,
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(PlatformAdmin)
    private readonly admins: Repository<PlatformAdmin>,
    private readonly jwt: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  /** Creates the organization and the person who runs it together. */
  async register(dto: RegisterOrganizationDto): Promise<AuthResponse> {
    const taken = await this.users.findOne({ where: { email: dto.email } });
    if (taken) throw new ConflictException('That email is already registered');

    const passwordHash = await hashPassword(dto.password);

    // one transaction: an organization with nobody able to sign into it
    // would be unreachable and impossible to clean up from the UI
    const created = await this.dataSource.transaction(async (manager) => {
      const org = await manager.save(
        manager.create(Organization, {
          name: dto.organizationName,
          ownerName: dto.ownerName,
          address: dto.address,
          phone: dto.phone,
          email: dto.organizationEmail,
          isActive: true,
          deletedAt: null,
        }),
      );

      const roles = await manager.save(
        BASE_ROLES.map(({ name, permissions }) =>
          manager.create(Role, {
            organizationId: org.id,
            name,
            permissions: permissions.map((permission) => ({ permission })),
          }),
        ),
      );

      return manager.save(
        manager.create(User, {
          organizationId: org.id,
          fullName: dto.fullName,
          email: dto.email,
          passwordHash,
          // whoever registers runs the fleet, and that is the role that
          // can then create the rest of the team
          roleId: roles.find((role) => role.name === OWNER_ROLE)!.id,
        }),
      );
    });

    // read back rather than assemble by hand, so registering and signing
    // in produce the same principal from the same query
    const user = await this.users.findOne({
      where: { id: created.id },
      relations: WITH_ROLE,
    });

    return this.issueForUser(user!);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const admin = await this.admins.findOne({ where: { email: dto.email } });
    if (admin) {
      if (!(await verifyPassword(admin.passwordHash, dto.password))) {
        throw new UnauthorizedException('Wrong email or password');
      }
      const principal: Principal = {
        kind: 'admin',
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
      };
      return {
        accessToken: this.sign({ sub: admin.id, kind: 'admin' }),
        principal,
      };
    }

    const user = await this.users.findOne({
      where: { email: dto.email },
      relations: WITH_ROLE,
    });
    // the same message either way, so the response cannot be used to
    // find out which addresses are registered
    if (!user || !(await verifyPassword(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Wrong email or password');
    }

    // checked after the password, so this cannot be used to find out
    // which addresses belong to somebody who left
    if (user.deletedAt !== null) {
      throw new ForbiddenException('This account is no longer active');
    }
    if (user.organization.deletedAt !== null) {
      throw new ForbiddenException('This organization no longer exists');
    }
    if (!user.organization.isActive) {
      throw new ForbiddenException('This organization is suspended');
    }

    return this.issueForUser(user);
  }

  private issueForUser(user: User): AuthResponse {
    return {
      accessToken: this.sign({
        sub: user.id,
        kind: 'user',
        organizationId: user.organizationId,
      }),
      principal: principalOf(user),
    };
  }

  private sign(payload: JwtPayload): string {
    return this.jwt.sign(payload);
  }

  /** Re-read on every request that needs the principal, so a suspended
   *  organization stops working immediately instead of when the token
   *  happens to expire. */
  async principalFor(payload: JwtPayload): Promise<Principal> {
    if (payload.kind === 'admin') {
      const admin = await this.admins.findOne({ where: { id: payload.sub } });
      if (!admin) throw new UnauthorizedException();
      return {
        kind: 'admin',
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
      };
    }

    const user = await this.users.findOne({
      where: { id: payload.sub },
      relations: WITH_ROLE,
    });
    if (!user || user.deletedAt !== null) throw new UnauthorizedException();
    if (user.organization.deletedAt !== null || !user.organization.isActive) {
      throw new ForbiddenException('This organization is not available');
    }
    return principalOf(user);
  }
}
