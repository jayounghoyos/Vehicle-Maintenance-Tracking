import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Organization } from './organization.entity';

/**
 * Per organization, not shared: the coordinator edits this list, so one
 * client renaming a task would change another client's schedules.
 */
@Index('maintenance_tasks_organization_name_unique', ['organizationId', 'name'], {
  unique: true,
})
@Entity('maintenance_tasks')
export class MaintenanceTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'organization_id' })
  organizationId: number;

  /** "defines" in the diagram */
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar' })
  name: string;
}
