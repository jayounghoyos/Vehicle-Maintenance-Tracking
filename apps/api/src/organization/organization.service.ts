import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { Organization, User } from '../entities';
import { PhotoStorage } from '../photos/photo-storage.service';
import { TenantRepositories } from '../tenant/tenant-repository';
import type { UpdateOrganizationDto } from './dto';

/* The logo sits in a sidebar next to a 36px mark, so it never needs to
 * arrive bigger than a retina copy of that. */
const LOGO_WIDTH = 96;

/** What the organization tab shows. No is_active or deleted_at: either
 *  of them blocks sign-in, so nobody reading this could be in that state. */
export type OrganizationProfile = {
  id: number;
  name: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  /** Their own logo, ready for an <img>, or null for the default mark. */
  logoUrl: string | null;
  /** #rrggbb, or null when they have not picked one and the interface
   *  should stay on the colour in the brand manual. */
  accentColor: string | null;
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
    private readonly photos: PhotoStorage,
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
      logoUrl: this.photos.url(org.logoKey, LOGO_WIDTH),
      accentColor: org.accentColor,
      memberCount,
      createdAt: org.createdAt,
    };
  }

  /**
   * The logo replaces whatever was there. Same order as a vehicle
   * picture: point the row at the new file first, so a failed delete
   * costs a leftover image rather than a brand that vanished.
   */
  async setLogo(organizationId: number, file: Buffer): Promise<OrganizationProfile> {
    const org = await this.require(organizationId);
    const previous = org.logoKey;
    org.logoKey = await this.photos.upload(file, organizationId);
    await this.organizations.save(org);
    if (previous) await this.photos.remove(previous);
    return this.get(organizationId);
  }

  /** Back to the default mark, which is what null has always meant. */
  async removeLogo(organizationId: number): Promise<OrganizationProfile> {
    const org = await this.require(organizationId);
    const previous = org.logoKey;
    org.logoKey = null;
    await this.organizations.save(org);
    if (previous) await this.photos.remove(previous);
    return this.get(organizationId);
  }

  private async require(organizationId: number): Promise<Organization> {
    const org = await this.organizations.findOne({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('No such organization');
    return org;
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
