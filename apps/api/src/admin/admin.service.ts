import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { Organization, User } from '../entities';

export type AdminOrganization = {
  id: number;
  name: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  deletedAt: string | null;
  memberCount: number;
  createdAt: Date;
};

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizations: Repository<Organization>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  /** Deleted organizations are listed too. Soft delete keeps the rows so
   *  somebody can see what happened and undo it. */
  async list(): Promise<AdminOrganization[]> {
    const orgs = await this.organizations.find({ order: { id: 'ASC' } });
    const counts = await this.users
      .createQueryBuilder('u')
      .select('u.organization_id', 'orgId')
      .addSelect('count(*)', 'count')
      .groupBy('u.organization_id')
      .getRawMany<{ orgId: number; count: string }>();
    const byOrg = new Map(counts.map((c) => [Number(c.orgId), Number(c.count)]));

    return orgs.map((o) => ({
      id: o.id,
      name: o.name,
      ownerName: o.ownerName,
      address: o.address,
      phone: o.phone,
      email: o.email,
      isActive: o.isActive,
      deletedAt: o.deletedAt ? o.deletedAt.toISOString() : null,
      memberCount: byOrg.get(o.id) ?? 0,
      createdAt: o.createdAt,
    }));
  }

  async setActive(id: number, isActive: boolean): Promise<AdminOrganization> {
    await this.mustExist(id);
    await this.organizations.update({ id }, { isActive });
    return this.one(id);
  }

  /** Soft delete: the rows stay, so the service history stays readable
   *  and the decision can be undone. */
  async setDeleted(id: number, deleted: boolean): Promise<AdminOrganization> {
    await this.mustExist(id);
    await this.organizations.update(
      { id },
      { deletedAt: deleted ? new Date() : null },
    );
    return this.one(id);
  }

  private async mustExist(id: number): Promise<void> {
    const found = await this.organizations.findOne({ where: { id } });
    if (!found) throw new NotFoundException('No such organization');
  }

  private async one(id: number): Promise<AdminOrganization> {
    const all = await this.list();
    const found = all.find((o) => o.id === id);
    if (!found) throw new NotFoundException('No such organization');
    return found;
  }

  async stats(): Promise<{ total: number; active: number; deleted: number }> {
    const [total, deleted, active] = await Promise.all([
      this.organizations.count(),
      this.organizations.count({ where: { deletedAt: IsNull() } }),
      this.organizations.count({ where: { isActive: true, deletedAt: IsNull() } }),
    ]);
    return { total, active, deleted: total - deleted };
  }
}
