import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Permission } from './enums';
import { Role } from './role.entity';

/**
 * One permission a role grants. A row rather than an array column, so
 * the table stays in first normal form and the diagram shows the
 * relationship instead of hiding it inside a value.
 *
 * The key is the pair, which is what stops the same grant being written
 * twice.
 */
@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn({ type: 'int', name: 'role_id' })
  roleId: number;

  @PrimaryColumn({ type: 'enum', enum: Permission, enumName: 'permission' })
  permission: Permission;

  /** deleting the role takes its grants with it: they mean nothing alone */
  @ManyToOne(() => Role, (role) => role.permissions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
