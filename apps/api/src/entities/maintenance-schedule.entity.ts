import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { MaintenanceTask } from './maintenance-task.entity';
import { Organization } from './organization.entity';
import { Vehicle } from './vehicle.entity';

/** The rule: every N days or N kilometres. At least one interval is set. */
@Entity('maintenance_schedules')
export class MaintenanceSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'organization_id' })
  organizationId: number;

  /** "plans" in the diagram */
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'int', name: 'vehicle_id' })
  vehicleId: number;

  /** "is_scheduled_for" in the diagram */
  @ManyToOne(() => Vehicle, { nullable: false })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ type: 'int', name: 'task_id' })
  taskId: number;

  /** "repeats" in the diagram */
  @ManyToOne(() => MaintenanceTask, { nullable: false })
  @JoinColumn({ name: 'task_id' })
  task: MaintenanceTask;

  @Column({ type: 'int', name: 'interval_days', nullable: true })
  intervalDays: number | null;

  @Column({ type: 'int', name: 'interval_km', nullable: true })
  intervalKm: number | null;

  /** due date passed and nobody logged that service = overdue */
  @Column({ type: 'date', name: 'next_due_date', nullable: true })
  nextDueDate: string | null;

  @Column({ type: 'int', name: 'next_due_km', nullable: true })
  nextDueKm: number | null;

  @Column({ type: 'timestamp', name: 'created_at', default: () => 'now()' })
  createdAt: Date;
}
