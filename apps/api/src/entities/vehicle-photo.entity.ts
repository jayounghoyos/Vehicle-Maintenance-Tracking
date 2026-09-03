import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Organization } from './organization.entity';
import { User } from './user.entity';
import { Vehicle } from './vehicle.entity';

/** Metadata only, like service_event_photos: the file lives in the
 *  object store and storage_key points at it. The main picture stays on
 *  vehicles.photo_key, so the fleet table still draws a thumbnail
 *  without a join. */
@Index('vehicle_photos_vehicle_idx', ['vehicleId'])
@Index('vehicle_photos_organization_idx', ['organizationId'])
@Index('vehicle_photos_uploaded_by_idx', ['uploadedBy'])
@Entity('vehicle_photos')
export class VehiclePhoto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'organization_id' })
  organizationId: number;

  /** "stores" in the diagram */
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'int', name: 'vehicle_id' })
  vehicleId: number;

  /** "illustrates" in the diagram */
  @ManyToOne(() => Vehicle, { nullable: false })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ type: 'varchar', name: 'storage_key', unique: true })
  storageKey: string;

  /** A gallery has an order and a coordinator will want to change it,
   *  which an attachment on an event never needed. */
  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'int', name: 'uploaded_by' })
  uploadedBy: number;

  /** "uploads" in the diagram */
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @Column({ type: 'timestamp', name: 'created_at', default: () => 'now()' })
  createdAt: Date;
}
