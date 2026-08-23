import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { Organization, User } from '../entities';
import { TenantRepositories } from '../tenant/tenant-repository';
import type { UpdateOrganizationDto } from './dto';

/** What the organization tab shows. No is_active or deleted_at: either
 *  of them blocks sign-in, so nobody reading this could be in that state. */
export type OrganizationProfile = {
  id: number;
  name: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  memberCount: number;
  createdAt: Date;
};

/** postgres unique_violation */
const UNIQUE_VIOLATION = '23505';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizations: Repository<Organization>,
    private readonly tenants: TenantRepositories,
  ) {}

  async get(organizationId: number): Promise<OrganizationProfile> {
    const org = await this.organizations.findOne({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('No such organization');

    const memberCount = await this.tenants.for(User, organizationId).count();
    return {
      id: org.id,
      name: org.name,
      ownerName: org.ownerName,
      address: org.address,
      phone: org.phone,
      email: org.email,
      memberCount,
      createdAt: org.createdAt,
    };
  }

  async update(
    organizationId: number,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationProfile> {
    // an empty body is a no-op, not a request to blank the row
    if (Object.keys(dto).length > 0) {
      try {
        await this.organizations.update({ id: organizationId }, dto);
      } catch (err: unknown) {
        // the name is unique among the organizations that are not
        // deleted, and a taken name is the caller's mistake, not ours
        if (this.isUniqueViolation(err)) {
          throw new ConflictException('Another organization already uses that name');
        }
        throw err;
      }
    }
    return this.get(organizationId);
  }

  private isUniqueViolation(err: unknown): boolean {
    if (!(err instanceof QueryFailedError)) return false;
    return (err.driverError as { code?: string } | undefined)?.code === UNIQUE_VIOLATION;
  }
}
