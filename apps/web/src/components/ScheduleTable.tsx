import { Pencil, Trash2 } from 'lucide-react';

import { sortRows, useMultiSort, type Sort } from '../hooks/useMultiSort';
import { odometer, shortDate } from '../lib/format';
import { taskIcon } from '../lib/taskIcon';
import type { ScheduleItem } from '../lib/api';
import { StatusChip } from './StatusChip';
import { SortHeader } from './SortHeader';

type SortKey = 'vehicle' | 'task' | 'next';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'task', label: 'Task' },
  { key: 'next', label: 'Next due' },
];

/* Words read forwards; a due date reads soonest first. */
const startsAscending = () => true;

const DEFAULT_SORT: Sort<SortKey> = { key: 'next', ascending: true };

/* A plan nothing has been logged against sorts after every plan that
 * has a due date, rather than pretending it is the most urgent thing
 * in the fleet. */
const NEVER = '9999-99-99';

function compare(a: ScheduleItem, b: ScheduleItem, key: SortKey): number {
  switch (key) {
    case 'vehicle':
      return `${a.plate ?? ''} ${a.make ?? ''} ${a.model ?? ''}`.localeCompare(
        `${b.plate ?? ''} ${b.make ?? ''} ${b.model ?? ''}`,
      );
    case 'task':
      return a.task.localeCompare(b.task);
    case 'next':
      return (a.nextDueDate ?? NEVER).localeCompare(b.nextDueDate ?? NEVER);
  }
}

function intervalLabel(schedule: ScheduleItem): string {
  const parts: string[] = [];
  if (schedule.intervalDays !== null) parts.push(`${schedule.intervalDays} days`);
  if (schedule.intervalKm !== null) parts.push(`${odometer(schedule.intervalKm)} km`);
  return parts.length > 0 ? `Every ${parts.join(' / ')}` : '—';
}

export function ScheduleTable({
  schedules,
  canManage,
  busyId,
  onEdit,
  onRemove,
}: {
  schedules: ScheduleItem[];
  canManage: boolean;
  /** the row waiting on the API, so its controls stop accepting clicks */
  busyId: number | null;
  onEdit: (schedule: ScheduleItem) => void;
  onRemove: (schedule: ScheduleItem) => void;
}) {
  const sort = useMultiSort<SortKey>({ defaultSort: DEFAULT_SORT, startsAscending });
  const shown = sortRows(schedules, sort.order, compare);

  return (
    <div className="overflow-x-auto border-t border-white/5">
      <table className="w-full min-w-[760px] text-left">
        <thead>
          <tr className="border-b border-white/5">
            {COLUMNS.map(({ key, label }) => (
              <SortHeader
                key={key}
                label={label}
                sort={sort.find(key)}
                rank={sort.rankOf(key)}
                showRank={sort.showRank}
                ascendingLabel={key === 'next' ? 'soonest first' : 'A to Z'}
                descendingLabel={key === 'next' ? 'latest first' : 'Z to A'}
                onClick={() => sort.toggle(key)}
              />
            ))}
            <th className="px-5 py-3.5 text-table-label font-semibold text-ink-muted uppercase">
              Interval
            </th>
            <th />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {shown.map((schedule) => {
            const busy = busyId === schedule.id;
            const Icon = taskIcon(schedule.task);
            return (
              <tr
                key={schedule.id}
                className={`transition-colors hover:bg-white/[0.03] ${busy ? 'opacity-50' : ''}`}
              >
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className="font-semibold">{schedule.plate ?? '—'}</span>
                  <span className="block text-body text-ink-muted">
                    {schedule.make} {schedule.model}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <Icon className="size-4 shrink-0 text-ink-muted" strokeWidth={1.75} />
                    {schedule.task}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <StatusChip state={schedule.state} />
                  <span className="mt-1 block text-body text-ink-muted">
                    {schedule.nextDueDate
                      ? shortDate(schedule.nextDueDate)
                      : 'Not logged yet'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-body text-ink-muted whitespace-nowrap">
                  {intervalLabel(schedule)}
                </td>
                <td className="px-5 py-3.5">
                  {canManage && (
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onEdit(schedule)}
                        title={`Edit ${schedule.task}`}
                        className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink disabled:opacity-40"
                      >
                        <Pencil className="size-4" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onRemove(schedule)}
                        title={`Delete ${schedule.task}`}
                        className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-overdue/15 hover:text-overdue disabled:opacity-40"
                      >
                        <Trash2 className="size-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {shown.length === 0 && (
        <p className="px-5 py-8 text-center text-body text-ink-muted">
          No maintenance plans yet.
        </p>
      )}
    </div>
  );
}
