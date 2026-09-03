import type { MaintenanceState } from '../maintenance/maintenance';

/** One row of the fleet-wide maintenance plan. */
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
  nextDueDate: string | null;
  nextDueKm: number | null;
  state: MaintenanceState;
};

export type TaskItem = {
  id: number;
  name: string;
};
