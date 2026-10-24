import type { ServiceType } from '../entities';
import type { Performer } from './performer';

export type ServiceEventPhotoItem = {
  id: number;
  storageKey: string;
  url: string;
};

/** One row of the fleet-wide service log. */
export type ServiceLogRow = Performer & {
  id: number;
  performedAt: string;
  vehicleId: number;
  plate: string;
  make: string;
  model: string;
  task: string;
  type: ServiceType;
  odometerKm: number | null;
  notes: string | null;
  recorder: string;
  photos: ServiceEventPhotoItem[];
};

/** A member who can be named as having done the work. */
export type PerformerItem = {
  id: number;
  fullName: string;
};

export type TaskItem = {
  id: number;
  name: string;
};
