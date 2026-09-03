import type { MaintenanceState } from '../maintenance/maintenance';

/** One row of the fleet's maintenance schedule. */
export type ScheduleRow = {
  id: number;
  vehicleId: number;
  plate: string;
  make: string;
  model: string;
  taskId: number;
  task: string;
  intervalDays: number | null;
  intervalKm: number | null;
  /** the most recent service event logged against this schedule, if
   *  any — a date for a day-based schedule, an odometer reading for a
   *  km-only one. Display only; which interval governs next due is
   *  still open (issue #11). */
  lastServiceDate: string | null;
  lastServiceOdometerKm: number | null;
  nextDueDate: string | null;
  nextDueKm: number | null;
  state: MaintenanceState;
};

export type TaskItem = {
  id: number;
  name: string;
};
