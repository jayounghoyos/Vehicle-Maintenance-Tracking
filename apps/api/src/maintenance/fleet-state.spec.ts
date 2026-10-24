import type { MaintenanceSchedule } from '../entities';
import { maintenanceByVehicle, stateSchedules } from './fleet-state';

// a local date, so the suite gives the same answer in any time zone
const today = () => new Date(2026, 9, 24, 12, 0);

const ODOMETER = 50_000;

let nextId = 1;
function schedule(
  vehicleId: number,
  taskName: string,
  nextDueDate: string | null,
  nextDueKm: number | null = null,
): MaintenanceSchedule {
  return {
    id: nextId++,
    vehicleId,
    nextDueDate,
    nextDueKm,
    vehicle: { odometerKm: ODOMETER },
    task: { name: taskName },
  } as MaintenanceSchedule;
}

describe('fleet-state', () => {
  describe('stateSchedules', () => {
    it('states each schedule and sorts worst first, soonest first within a state', () => {
      const result = stateSchedules(
        [
          schedule(1, 'Tyres', '2027-03-01'),
          schedule(1, 'Brakes', '2026-10-30'),
          schedule(2, 'Oil change', '2026-10-20'),
          schedule(2, 'Filters', '2026-10-01'),
          schedule(3, 'Battery', '2026-10-24'),
        ],
        today(),
      );

      expect(result.map(({ schedule, state }) => [schedule.task.name, state])).toEqual([
        ['Filters', 'overdue'],
        ['Oil change', 'overdue'],
        ['Battery', 'due_soon'],
        ['Brakes', 'due_soon'],
        ['Tyres', 'on_track'],
      ]);
    });

    it('puts a schedule with no due date after the dated ones in its state', () => {
      const result = stateSchedules(
        [schedule(1, 'Tyres', '2027-03-01'), schedule(1, 'Inspection', null)],
        today(),
      );

      expect(result.map(({ schedule }) => schedule.task.name)).toEqual([
        'Tyres',
        'Inspection',
      ]);
      expect(result.every(({ state }) => state === 'on_track')).toBe(true);
    });

    it('states a schedule overdue by kilometres when its date is far off', () => {
      const [stated] = stateSchedules(
        [schedule(1, 'Oil change', '2027-04-01', ODOMETER - 200)],
        today(),
      );

      expect(stated).toMatchObject({ state: 'overdue', kmLeft: -200 });
    });

    it('returns an empty list for no schedules', () => {
      expect(stateSchedules([], today())).toEqual([]);
    });
  });

  describe('maintenanceByVehicle', () => {
    it('judges each vehicle by its worst schedule and names that task', () => {
      const byVehicle = maintenanceByVehicle(
        stateSchedules(
          [
            schedule(1, 'Tyres', '2027-03-01'),
            schedule(1, 'Oil change', '2026-10-20'),
            schedule(1, 'Brakes', '2026-10-30'),
            schedule(2, 'Brakes', '2026-11-01'),
            schedule(2, 'Tyres', '2027-01-01'),
            schedule(3, 'Tyres', '2027-01-01'),
          ],
          today(),
        ),
      );

      expect(byVehicle.get(1)).toEqual({
        state: 'overdue',
        nextTask: 'Oil change',
        nextDueDate: '2026-10-20',
        kmLeft: null,
      });
      expect(byVehicle.get(2)).toEqual({
        state: 'due_soon',
        nextTask: 'Brakes',
        nextDueDate: '2026-11-01',
        kmLeft: null,
      });
      expect(byVehicle.get(3)).toEqual({
        state: 'on_track',
        nextTask: 'Tyres',
        nextDueDate: '2027-01-01',
        kmLeft: null,
      });
    });

    it('names the most overdue task when several are overdue', () => {
      const byVehicle = maintenanceByVehicle(
        stateSchedules(
          [schedule(1, 'Oil change', '2026-10-20'), schedule(1, 'Filters', '2026-09-01')],
          today(),
        ),
      );

      expect(byVehicle.get(1)?.nextTask).toBe('Filters');
    });

    it('leaves a vehicle with no schedules out of the map', () => {
      const byVehicle = maintenanceByVehicle(
        stateSchedules([schedule(1, 'Tyres', '2027-01-01')], today()),
      );

      expect(byVehicle.has(2)).toBe(false);
      expect(byVehicle.size).toBe(1);
    });

    it('falls back to a null task name when the relation is not loaded', () => {
      const bare = {
        id: 99,
        vehicleId: 4,
        nextDueDate: '2026-10-01',
        nextDueKm: null,
        vehicle: { odometerKm: ODOMETER },
      } as MaintenanceSchedule;

      expect(maintenanceByVehicle(stateSchedules([bare], today())).get(4)).toEqual({
        state: 'overdue',
        nextTask: null,
        nextDueDate: '2026-10-01',
        kmLeft: null,
      });
    });

    it('names a dated on_track schedule over an undated one', () => {
      const byVehicle = maintenanceByVehicle(
        stateSchedules(
          [schedule(1, 'Inspection', null), schedule(1, 'Tyres', '2027-03-01')],
          today(),
        ),
      );

      expect(byVehicle.get(1)).toEqual({
        state: 'on_track',
        nextTask: 'Tyres',
        nextDueDate: '2027-03-01',
        kmLeft: null,
      });
    });
  });
});
