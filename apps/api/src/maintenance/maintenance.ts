/** The three states the brand manual defines. There is no fourth. */
export type MaintenanceState = 'overdue' | 'due_soon' | 'on_track';

/** "Within the next 14 days", per the Due soon tile. */
export const DUE_SOON_DAYS = 14;

/** The kilometre side of the same warning: within the next 1,000 km. */
export const DUE_SOON_KM = 1_000;

/** What a schedule is judged by. */
export type Due = {
  nextDueDate: string | null;
  nextDueKm: number | null;
};

function atMidnight(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * A due date is a calendar day, not an instant. new Date('2026-10-24')
 * would read it as UTC midnight, which west of UTC is still the 23rd,
 * and a schedule would turn overdue on its own due date. Read from its
 * parts, it is that day wherever the server runs.
 */
function calendarDay(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Whole days from today to `iso`. Negative once the date has passed. */
export function daysUntil(iso: string, today: Date = new Date()): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((atMidnight(calendarDay(iso)) - atMidnight(today)) / MS_PER_DAY);
}

/** Kilometres left before `nextDueKm`. Zero or negative once reached. */
export function kmUntil(nextDueKm: number | null, odometerKm: number): number | null {
  return nextDueKm === null ? null : nextDueKm - odometerKm;
}

/**
 * Whichever interval is reached first decides, the way a service book
 * reads "every 6 months or 10,000 km, whichever comes first" (decided in
 * #11 and #13). Overdue once the due date has passed or the odometer has
 * reached the due reading; due soon within DUE_SOON_DAYS or DUE_SOON_KM.
 */
export function scheduleState(
  due: Due,
  odometerKm: number,
  today: Date = new Date(),
): MaintenanceState {
  const days = due.nextDueDate === null ? null : daysUntil(due.nextDueDate, today);
  const km = kmUntil(due.nextDueKm, odometerKm);
  if ((days !== null && days < 0) || (km !== null && km <= 0)) return 'overdue';
  if ((days !== null && days <= DUE_SOON_DAYS) || (km !== null && km <= DUE_SOON_KM)) {
    return 'due_soon';
  }
  return 'on_track';
}

/** What a schedule's intervals count from: its last service, or for a
 *  schedule never serviced, the day it was created and the odometer
 *  then (decided in #7). */
export type Baseline = { date: string; km: number };

/** `date` as YYYY-MM-DD, the calendar day it falls on locally. */
export function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(iso: string, days: number): string {
  const day = calendarDay(iso);
  day.setDate(day.getDate() + days);
  return isoDay(day);
}

/**
 * When a schedule next comes due, counted from `from`. An interval that
 * is not set leaves its side null, so removing one clears what it set.
 * The one place this is worked out: logging a service, creating a
 * schedule and editing its intervals all come here.
 */
export function nextDue(
  intervals: { intervalDays: number | null; intervalKm: number | null },
  from: Baseline,
): Due {
  return {
    nextDueDate: intervals.intervalDays
      ? addDays(from.date, intervals.intervalDays)
      : null,
    nextDueKm: intervals.intervalKm ? from.km + intervals.intervalKm : null,
  };
}

/** A vehicle is as bad as its worst schedule. */
export function worstState(states: MaintenanceState[]): MaintenanceState {
  if (states.includes('overdue')) return 'overdue';
  if (states.includes('due_soon')) return 'due_soon';
  return 'on_track';
}

export const STATE_ORDER: MaintenanceState[] = ['overdue', 'due_soon', 'on_track'];
