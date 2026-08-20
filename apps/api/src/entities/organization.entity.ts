import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Each client brand with its own fleet. The MVP seeds one row.
 *
 * name is unique only among the organizations that are not deleted, so
 * a soft-deleted row does not squat its own name forever. dbdiagram
 * cannot express a partial index; postgres can.
 */
@Index('organizations_name_unique', ['name'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  /** the director or owner: who you call about the account */
  @Column({ type: 'varchar', name: 'owner_name' })
  ownerName: string;

  @Column({ type: 'varchar' })
  address: string;

  @Column({ type: 'varchar' })
  phone: string;

  /** a contact address, not a login. the login namespace is users.email */
  @Column({ type: 'varchar' })
  email: string;

  /** false is a suspension the organization comes back from */
  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  /** set once and never unset: gone, but the history stays readable */
  @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'timestamp', name: 'created_at', default: () => 'now()' })
  createdAt: Date;
}
