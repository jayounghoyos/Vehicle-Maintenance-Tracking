import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Organization } from './organization.entity';
import { Role } from './role.entity';

@Index('users_organization_idx', ['organizationId'])
@Index('users_role_idx', ['roleId'])
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'organization_id' })
  organizationId: number;

  /** "employs" in the diagram */
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar', name: 'full_name' })
  fullName: string;

  /**
   * Globally unique: it is the login identifier and the sign-in screen
   * does not ask for an organization.
   */
  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'int', name: 'role_id' })
  roleId: number;

  /** "is_assigned" in the diagram. Restricted rather than cascading: a
   *  role somebody holds cannot be deleted out from under them. */
  @ManyToOne(() => Role, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  /** set when the person leaves: the row stays so the service events
   *  they recorded still say who did the work, and the account stops
   *  working at once */
  @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'timestamp', name: 'created_at', default: () => 'now()' })
  createdAt: Date;
}
