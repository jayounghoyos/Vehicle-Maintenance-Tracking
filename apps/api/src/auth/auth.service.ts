import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Organization, PlatformAdmin, User, UserRole } from '../entities';
import type { AuthResponse, JwtPayload, Principal } from './auth.types';
import type { LoginDto, RegisterOrganizationDto } from './dto';
import { hashPassword, verifyPassword } from './password';

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
    const user = await this.dataSource.transaction(async (manager) => {
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

      return manager.save(
        manager.create(User, {
          organizationId: org.id,
          fullName: dto.fullName,
          email: dto.email,
          passwordHash,
          // whoever registers runs the fleet, and that is the role that
          // can then create the rest of the team
          role: UserRole.FLEET_COORDINATOR,
        }),
      );
    });

    return this.issueForUser(user);
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
      relations: { organization: true },
    });
    // the same message either way, so the response cannot be used to
    // find out which addresses are registered
    if (!user || !(await verifyPassword(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Wrong email or password');
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
        role: user.role,
      }),
      principal: {
        kind: 'user',
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
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
      relations: { organization: true },
    });
    if (!user) throw new UnauthorizedException();
    if (user.organization.deletedAt !== null || !user.organization.isActive) {
      throw new ForbiddenException('This organization is not available');
    }
    return {
      kind: 'user',
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
  }
}
