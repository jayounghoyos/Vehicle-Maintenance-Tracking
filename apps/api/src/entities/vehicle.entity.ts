import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { VehicleStatus } from './enums';
import { Organization } from './organization.entity';
import { VehicleModel } from './vehicle-model.entity';

/**
 * The plate was globally unique. Two client brands could not both own
 * ABC123, so it is unique per organization.
 */
@Index('vehicles_organization_plate_unique', ['organizationId', 'plate'], {
  unique: true,
})
@Index('vehicles_model_idx', ['modelId'])
@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'organization_id' })
  organizationId: number;

  /** "owns" in the diagram */
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar' })
  plate: string;

  @Column({ type: 'int', name: 'model_id' })
  modelId: number;

  /** "classifies" in the diagram */
  @ManyToOne(() => VehicleModel, { nullable: false })
  @JoinColumn({ name: 'model_id' })
  model: VehicleModel;

  @Column({ type: 'int', nullable: true })
  year: number | null;

  @Column({ type: 'int', name: 'odometer_km', default: 0 })
  odometerKm: number;

  /**
   * The operational state of the vehicle. Whether maintenance is overdue
   * is worked out from schedules against events and never stored here.
   */
  @Column({
    type: 'enum',
    enum: VehicleStatus,
    enumName: 'vehicle_status',
    default: VehicleStatus.ACTIVE,
  })
  status: VehicleStatus;

  @Column({ type: 'timestamp', name: 'created_at', default: () => 'now()' })
  createdAt: Date;
}
