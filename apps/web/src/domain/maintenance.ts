import { odometer } from '../lib/format';

/** The three states the brand manual defines. There is no fourth.
 *  Which one applies is decided by the API — see
 *  apps/api/src/maintenance/maintenance.ts. This file only labels them. */
export type MaintenanceState = 'overdue' | 'due_soon' | 'on_track';

function atMidnight(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** A due date is a calendar day: parsed as UTC midnight it would be the
 *  day before anywhere west of UTC, Colombia included. */
function calendarDay(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Whole days from today to `iso`. Negative once the date has passed. */
export function daysUntil(iso: string, today: Date = new Date()): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((atMidnight(calendarDay(iso)) - atMidnight(today)) / MS_PER_DAY);
}

/** "12 days overdue" / "Due in 3 days" / "Due today" */
export function dueLabel(iso: string, today: Date = new Date()): string {
  const days = daysUntil(iso, today);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

/** "1,200 km left" / "300 km overdue" */
export function kmLabel(kmLeft: number): string {
  if (kmLeft < 0) return `${odometer(-kmLeft)} km overdue`;
  if (kmLeft === 0) return 'Due at this reading';
  return `${odometer(kmLeft)} km left`;
}

/**
 * Both sides of a schedule, as the API measured them: "Due in 40 days ·
 * 300 km overdue". Which of the two made it overdue is the API's call,
 * already in the state; this only says both distances out loud.
 */
export function dueSummary(nextDueDate: string | null, kmLeft: number | null): string {
  const parts: string[] = [];
  if (nextDueDate) parts.push(dueLabel(nextDueDate));
  if (kmLeft !== null) parts.push(kmLabel(kmLeft));
  return parts.join(' · ');
}

export const STATE_LABEL: Record<MaintenanceState, string> = {
  overdue: 'Overdue',
  due_soon: 'Due soon',
  on_track: 'On track',
};
