import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Whoever runs the service, not a member of any fleet.
 *
 * Separate from users on purpose: users.organization_id is not null, and
 * that rule is what stops a query escaping from one client into another.
 * There is no organization_id here and there never should be.
 */
@Entity('platform_admins')
export class PlatformAdmin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'timestamp', name: 'created_at', default: () => 'now()' })
  createdAt: Date;
}
