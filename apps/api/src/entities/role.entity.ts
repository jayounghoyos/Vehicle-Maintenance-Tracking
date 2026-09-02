import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Organization } from './organization.entity';
import { RolePermission } from './role-permission.entity';

/**
 * A job title one client invented, and what it is allowed to do.
 *
 * The role used to be an enum, which is why every client had the same
 * three and nobody could add a fourth. Now each organization owns its
 * own rows: "Mechanic" here and "Mechanic" somewhere else are different
 * roles that may grant different things.
 */
@Index('roles_organization_name_unique', ['organizationId', 'name'], { unique: true })
@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'organization_id' })
  organizationId: number;

  /** "sets_up" in the diagram */
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar' })
  name: string;

  /** "grants" in the diagram */
  @OneToMany(() => RolePermission, (granted) => granted.role, { cascade: ['insert'] })
  permissions: RolePermission[];

  @Column({ type: 'timestamp', name: 'created_at', default: () => 'now()' })
  createdAt: Date;
}
