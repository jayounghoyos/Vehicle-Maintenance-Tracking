import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Permission, Role, RolePermission, User } from '../entities';
import { TenantRepositories, type TenantRepository } from '../tenant/tenant-repository';
import type { SaveRoleDto } from './dto';

export type RoleSummary = {
  id: number;
  name: string;
  permissions: Permission[];
  /** how many accounts hold it, which is what decides whether it can be
   *  deleted rather than only left empty */
  members: number;
};

@Injectable()
export class RolesService {
  constructor(
    private readonly tenants: TenantRepositories,
    /** reached only through a role already checked to belong to the
     *  caller's organization, which is where the scoping happens */
    @InjectRepository(RolePermission)
    private readonly grants: Repository<RolePermission>,
  ) {}

  private roles(organizationId: number): TenantRepository<Role> {
    return this.tenants.for(Role, organizationId);
  }

  async list(organizationId: number): Promise<RoleSummary[]> {
    const rows = await this.roles(organizationId).find({
      relations: { permissions: true },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    const counts = await this.memberCounts(organizationId);
    return rows.map((role) => ({
      id: role.id,
      name: role.name,
      permissions: role.permissions.map((granted) => granted.permission),
      members: counts.get(role.id) ?? 0,
    }));
  }

  /** The one place that decides whether a role id may be assigned to
   *  somebody: it has to be one of this organization's own. Grants come
   *  along because the caller usually needs to know what it allows. */
  async require(organizationId: number, roleId: number): Promise<Role> {
    const role = await this.roles(organizationId).findOne({
      where: { id: roleId },
      relations: { permissions: true },
    });
    if (!role) throw new NotFoundException('No such role');
    return role;
  }

  async create(organizationId: number, dto: SaveRoleDto): Promise<RoleSummary> {
    await this.rejectDuplicateName(organizationId, dto.name);
    const roles = this.roles(organizationId);
    const role = await roles.save(roles.create({ name: dto.name }));
    await this.setPermissions(role.id, dto.permissions);
    // brand new, so nobody holds it yet
    return { id: role.id, name: role.name, permissions: dto.permissions, members: 0 };
  }

  async update(
    organizationId: number,
    id: number,
    dto: SaveRoleDto,
  ): Promise<RoleSummary> {
    const roles = this.roles(organizationId);
    const role = await roles.findOne({ where: { id }, relations: { permissions: true } });
    if (!role) throw new NotFoundException('No such role');
    if (dto.name !== role.name) await this.rejectDuplicateName(organizationId, dto.name);

    const had = role.permissions.some((g) => g.permission === Permission.MANAGE_TEAM);
    const loses = had && !dto.permissions.includes(Permission.MANAGE_TEAM);
    if (loses && (await this.managersLeft(organizationId, id)) === 0) {
      throw new ConflictException(
        'Nobody would be left who can manage the team, so this role has to keep it',
      );
    }

    role.name = dto.name;
    await roles.save(role);
    await this.setPermissions(id, dto.permissions);

    const counts = await this.memberCounts(organizationId);
    return {
      id,
      name: dto.name,
      permissions: dto.permissions,
      members: counts.get(id) ?? 0,
    };
  }

  async remove(organizationId: number, id: number): Promise<void> {
    const role = await this.require(organizationId, id);
    const members = (await this.memberCounts(organizationId)).get(id) ?? 0;
    if (members > 0) {
      throw new ConflictException(
        `${role.name} is still assigned to ${members} ${
          members === 1 ? 'person' : 'people'
        }, so give them another role first`,
      );
    }
    await this.roles(organizationId).delete({ id });
  }

  /**
   * Working accounts that would still be able to staff the organization
   * if this role stopped granting it. Zero means the client is one click
   * from locking itself out of its own team screen, which only a platform
   * admin could then undo.
   */
  private managersLeft(organizationId: number, exceptRoleId: number): Promise<number> {
    return this.tenants
      .for(User, organizationId)
      .builder('member')
      .innerJoin(
        'role_permissions',
        'granted',
        'granted.role_id = member.role_id AND granted.permission = :permission',
        { permission: Permission.MANAGE_TEAM },
      )
      .andWhere('member.deleted_at IS NULL')
      .andWhere('member.role_id <> :exceptRole', { exceptRole: exceptRoleId })
      .getCount();
  }

  /** Replaced rather than merged: what was sent is what the role grants,
   *  so dropping one is expressed by leaving it out. */
  private async setPermissions(roleId: number, permissions: Permission[]): Promise<void> {
    await this.grants.delete({ roleId });
    if (permissions.length === 0) return;
    await this.grants.insert(permissions.map((permission) => ({ roleId, permission })));
  }

  /** One grouped query rather than one per role. */
  private async memberCounts(organizationId: number): Promise<Map<number, number>> {
    const rows = await this.tenants
      .for(User, organizationId)
      .builder('member')
      .select('member.role_id', 'roleId')
      .addSelect('count(*)', 'count')
      .groupBy('member.role_id')
      .getRawMany<{ roleId: number; count: string }>();
    return new Map(rows.map((row) => [Number(row.roleId), Number(row.count)]));
  }

  private async rejectDuplicateName(organizationId: number, name: string): Promise<void> {
    const taken = await this.roles(organizationId).findOne({ where: { name } });
    if (taken) throw new ConflictException(`There is already a role called ${name}`);
  }
}
