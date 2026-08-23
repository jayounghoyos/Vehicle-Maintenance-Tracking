/** The three states the brand manual defines. There is no fourth. */
export type MaintenanceState = 'overdue' | 'due_soon' | 'on_track';

/** "Within the next 14 days", per the Due soon tile. */
export const DUE_SOON_DAYS = 14;

function atMidnight(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Whole days from today to `iso`. Negative once the date has passed. */
export function daysUntil(iso: string, today: Date = new Date()): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((atMidnight(new Date(iso)) - atMidnight(today)) / MS_PER_DAY);
}

/**
 * data_model.md: "Due date passed and nobody logged that service = overdue."
 *
 * Reads next_due_date only. Schedules also carry next_due_km, but which
 * one wins when both are set is still open in mvp_scope.md, so kilometres
 * are not guessed at here.
 */
export function scheduleState(
  nextDueDate: string | null,
  today: Date = new Date(),
): MaintenanceState {
  if (nextDueDate === null) return 'on_track';
  const days = daysUntil(nextDueDate, today);
  if (days < 0) return 'overdue';
  if (days <= DUE_SOON_DAYS) return 'due_soon';
  return 'on_track';
}

/** A vehicle is as bad as its worst schedule. */
export function worstState(states: MaintenanceState[]): MaintenanceState {
  if (states.includes('overdue')) return 'overdue';
  if (states.includes('due_soon')) return 'due_soon';
  return 'on_track';
}

export const STATE_ORDER: MaintenanceState[] = ['overdue', 'due_soon', 'on_track'];
