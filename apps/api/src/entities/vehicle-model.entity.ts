import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * No organization_id. "Chevrolet NHR" is reference data nobody owns or
 * edits, so a copy per organization would duplicate rows for nothing.
 */
@Index('vehicle_models_make_name_unique', ['make', 'name'], { unique: true })
@Entity('vehicle_models')
export class VehicleModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  make: string;

  @Column({ type: 'varchar' })
  name: string;
}
