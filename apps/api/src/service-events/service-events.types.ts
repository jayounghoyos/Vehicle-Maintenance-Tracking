import type { ServiceType } from '../entities';

/** One row of the fleet-wide service log. */
export type ServiceLogRow = {
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
  photoUrl: string | null;
};

