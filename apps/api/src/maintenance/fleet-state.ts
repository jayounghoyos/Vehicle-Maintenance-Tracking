import type { MaintenanceSchedule } from '../entities';
import {
  STATE_ORDER,
  kmUntil,
  scheduleState,
  worstState,
  type MaintenanceState,
} from './maintenance';

/** A schedule together with the state its due date and km put it in. */
export type StatedSchedule = {
  schedule: MaintenanceSchedule;
  state: MaintenanceState;
  /** kilometres left before it is due by distance; null with no km interval */
  kmLeft: number | null;
};

/** What a vehicle is judged by: its worst schedule, and which one. */
export type VehicleMaintenance = {
  state: MaintenanceState;
  nextTask: string | null;
  nextDueDate: string | null;
  kmLeft: number | null;
};

/**
 * Every schedule with its state, worst first, and within a state the
 * soonest due date first.
 *
 * The order is the point: whoever reads this list can take the first
 * entry for a vehicle and know it is the one that decides how that
 * vehicle looks.
 *
 * Expects the `vehicle` relation to be loaded: the odometer is half of
 * what a schedule is judged by.
 */
export function stateSchedules(
  schedules: MaintenanceSchedule[],
  today = new Date(),
): StatedSchedule[] {
  return schedules
    .map((schedule) => ({
      schedule,
      state: scheduleState(schedule, schedule.vehicle.odometerKm, today),
      kmLeft: kmUntil(schedule.nextDueKm, schedule.vehicle.odometerKm),
    }))
    .sort((a, b) => {
      const byState = STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state);
      if (byState !== 0) return byState;
      // a schedule with no due date sorts after every dated one
      return (a.schedule.nextDueDate ?? '9999').localeCompare(
        b.schedule.nextDueDate ?? '9999',
      );
    });
}

/**
 * Collapses those schedules into one verdict per vehicle: a vehicle is
 * as bad as its worst schedule, and the task it is named by is the one
 * that made it that bad.
 *
 * Expects the `task` relation to be loaded. A vehicle with no schedules
 * is simply absent from the map; the caller decides what that means,
 * which is on_track everywhere so far.
 */
export function maintenanceByVehicle(
  stated: StatedSchedule[],
): Map<number, VehicleMaintenance> {
  const byVehicle = new Map<number, VehicleMaintenance>();
  const states = new Map<number, MaintenanceState[]>();

  for (const { schedule, state, kmLeft } of stated) {
    states.set(schedule.vehicleId, [...(states.get(schedule.vehicleId) ?? []), state]);
    // stated is already worst first, so the first schedule seen for a
    // vehicle is the one it is judged by
    if (!byVehicle.has(schedule.vehicleId)) {
      byVehicle.set(schedule.vehicleId, {
        state,
        nextTask: schedule.task?.name ?? null,
        nextDueDate: schedule.nextDueDate,
        kmLeft,
      });
    }
  }

  // the worst of all of them, which for the first-seen entry is itself
  for (const [vehicleId, all] of states) {
    const found = byVehicle.get(vehicleId);
    if (found) found.state = worstState(all);
  }

  return byVehicle;
}
