import type { MaintenanceSchedule } from './types'

/** The three states the brand manual defines. There is no fourth. */
export type MaintenanceState = 'overdue' | 'due_soon' | 'on_track'

/** "Within the next 14 days", per the Due soon tile in the mockup. */
export const DUE_SOON_DAYS = 14

function atMidnight(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** Whole days from today to `iso`. Negative once the date has passed. */
export function daysUntil(iso: string, today: Date = new Date()): number {
  const MS_PER_DAY = 86_400_000
  return Math.round((atMidnight(new Date(iso)) - atMidnight(today)) / MS_PER_DAY)
}

/**
 * data_model.md: "Due date passed and nobody logged that service = overdue."
 *
 * Only next_due_date is read. Schedules can also carry next_due_km, but
 * which one wins when both are set is still an open question in
 * docs/proposals/mvp_scope.md, so km is deliberately not guessed at here.
 */
export function scheduleState(
  schedule: MaintenanceSchedule,
  today: Date = new Date(),
): MaintenanceState {
  if (schedule.nextDueDate === null) return 'on_track'

  const days = daysUntil(schedule.nextDueDate, today)
  if (days < 0) return 'overdue'
  if (days <= DUE_SOON_DAYS) return 'due_soon'
  return 'on_track'
}

/** A vehicle is as bad as its worst schedule. */
export function worstState(states: MaintenanceState[]): MaintenanceState {
  if (states.includes('overdue')) return 'overdue'
  if (states.includes('due_soon')) return 'due_soon'
  return 'on_track'
}

/** "12 days overdue" / "Due in 3 days" / "Due today" */
export function dueLabel(iso: string, today: Date = new Date()): string {
  const days = daysUntil(iso, today)
  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}

export const STATE_LABEL: Record<MaintenanceState, string> = {
  overdue: 'Overdue',
  due_soon: 'Due soon',
  on_track: 'On track',
}
