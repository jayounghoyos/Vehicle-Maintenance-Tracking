import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { ServiceType } from './enums';
import { MaintenanceSchedule } from './maintenance-schedule.entity';
import { MaintenanceTask } from './maintenance-task.entity';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';

@Entity('service_events')
export class ServiceEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'organization_id' })
  organizationId: number;

  /** "logs" in the diagram */
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'int', name: 'vehicle_id' })
  vehicleId: number;

  /** "services" in the diagram */
  @ManyToOne(() => Vehicle, { nullable: false })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  /** null when the work was not planned, e.g. a breakdown */
  @Column({ type: 'int', name: 'schedule_id', nullable: true })
  scheduleId: number | null;

  /** "fulfills" in the diagram */
  @ManyToOne(() => MaintenanceSchedule, { nullable: true })
  @JoinColumn({ name: 'schedule_id' })
  schedule: MaintenanceSchedule | null;

  @Column({ type: 'int', name: 'task_id' })
  taskId: number;

  /** "performs" in the diagram */
  @ManyToOne(() => MaintenanceTask, { nullable: false })
  @JoinColumn({ name: 'task_id' })
  task: MaintenanceTask;

  @Column({ type: 'int', name: 'recorded_by' })
  recordedBy: number;

  /** "records" in the diagram */
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'recorded_by' })
  recorder: User;

  @Column({ type: 'enum', enum: ServiceType, enumName: 'service_type' })
  type: ServiceType;

  @Column({ type: 'date', name: 'performed_at' })
  performedAt: string;

  @Column({ type: 'int', name: 'odometer_km', nullable: true })
  odometerKm: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamp', name: 'created_at', default: () => 'now()' })
  createdAt: Date;
}
