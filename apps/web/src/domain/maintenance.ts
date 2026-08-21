/** The three states the brand manual defines. There is no fourth.
 *  Which one applies is decided by the API — see
 *  apps/api/src/dashboard/maintenance.ts. This file only labels them. */
export type MaintenanceState = 'overdue' | 'due_soon' | 'on_track';

function atMidnight(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Whole days from today to `iso`. Negative once the date has passed. */
export function daysUntil(iso: string, today: Date = new Date()): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((atMidnight(new Date(iso)) - atMidnight(today)) / MS_PER_DAY);
}

/** "12 days overdue" / "Due in 3 days" / "Due today" */
export function dueLabel(iso: string, today: Date = new Date()): string {
  const days = daysUntil(iso, today);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

export const STATE_LABEL: Record<MaintenanceState, string> = {
  overdue: 'Overdue',
  due_soon: 'Due soon',
  on_track: 'On track',
};
