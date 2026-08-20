import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Organization } from './organization.entity';
import { ServiceEvent } from './service-event.entity';
import { User } from './user.entity';

/** Metadata only. The file itself lives in the object store and
 *  storage_key points at it. */
@Index('service_event_photos_service_event_idx', ['serviceEventId'])
@Entity('service_event_photos')
export class ServiceEventPhoto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'organization_id' })
  organizationId: number;

  /** "stores" in the diagram */
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'int', name: 'service_event_id' })
  serviceEventId: number;

  /** "documents" in the diagram */
  @ManyToOne(() => ServiceEvent, { nullable: false })
  @JoinColumn({ name: 'service_event_id' })
  serviceEvent: ServiceEvent;

  @Column({ type: 'varchar', name: 'storage_key', unique: true })
  storageKey: string;

  @Column({ type: 'int', name: 'uploaded_by' })
  uploadedBy: number;

  /** "uploads" in the diagram */
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @Column({ type: 'timestamp', name: 'created_at', default: () => 'now()' })
  createdAt: Date;
}
