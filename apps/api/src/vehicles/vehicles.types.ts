import type { MaintenanceState } from '../maintenance/maintenance';
import type { ServiceType, VehicleStatus } from '../entities';

/** One line of the fleet list. */
export type VehicleRow = {
  id: number;
  plate: string;
  make: string;
  model: string;
  year: number | null;
  odometerKm: number;
  /** where the vehicle is: on the road, in the shop, retired */
  status: VehicleStatus;
  /** whether its maintenance is behind, which is a different question */
  state: MaintenanceState;
  nextTask: string | null;
  nextDueDate: string | null;
  /** ready to put in an <img>, already sized for whoever asked: the
   *  list gets a thumbnail, the profile gets the big one. Null when
   *  nobody has added a picture. */
  photoUrl: string | null;
  /** what is attached to it, and so whether it can be deleted at all */
  scheduleCount: number;
  serviceEventCount: number;
  createdAt: Date;
};

export type ScheduleItem = {
  id: number;
  task: string;
  intervalDays: number | null;
  intervalKm: number | null;
  nextDueDate: string | null;
  nextDueKm: number | null;
  state: MaintenanceState;
};

export type ServiceEventPhotoItem = {
  id: number;
  storageKey: string;
  url: string;
};

export type ServiceEventItem = {
  id: number;
  task: string;
  type: ServiceType;
  performedAt: string;
  odometerKm: number | null;
  notes: string | null;
  recorder: string;
  photos: ServiceEventPhotoItem[];
};

/** Everything the profile panel shows about one vehicle. */
export type VehicleDetail = VehicleRow & {
  schedules: ScheduleItem[];
  recentEvents: ServiceEventItem[];
  /** The pictures beyond the main one, which stays on photoUrl. */
  photos: ServiceEventPhotoItem[];
};

export type ImportResult = {
  created: VehicleRow[];
  /** row is the index into the list that was sent, so the screen can map
   *  it back to the line somebody pasted */
  skipped: { row: number; plate: string; reason: string }[];
  /**
   * Models that did not exist and had to be created. vehicle_models is
   * shared by every organization, so a typo here is a typo everybody
   * sees; naming them lets the coordinator catch it.
   */
  createdModels: string[];
};
