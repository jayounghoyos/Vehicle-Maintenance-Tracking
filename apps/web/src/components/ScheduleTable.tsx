import {
  Clock,
  Gauge,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { STATE_LABEL, type MaintenanceState } from '../domain/maintenance';
import { sortRows, useMultiSort, type Sort } from '../hooks/useMultiSort';
import { odometer, shortDate } from '../lib/format';
import { taskIcon } from '../lib/taskIcon';
import type { ScheduleItem } from '../lib/api';
import { SortHeader } from './SortHeader';
import { StatusChip } from './StatusChip';

type SortKey = 'vehicle' | 'task' | 'next';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'task', label: 'Task' },
  { key: 'next', label: 'Next due' },
];

/* Words read forwards; a due date reads soonest first. */
const startsAscending = () => true;

const DEFAULT_SORT: Sort<SortKey> = { key: 'next', ascending: true };

/* A schedule nothing has been logged against sorts after every one that
 * has a due date, rather than pretending it is the most urgent thing in
 * the fleet. */
const NEVER = '9999-99-99';

const STATES: MaintenanceState[] = ['overdue', 'due_soon', 'on_track'];

/* Overdue and due-soon carry their hue into the date itself; on track
 * reads as ordinary text — the chip beside it already says it is fine.
 * Same mapping VehicleTable and NeedsAttention use for "next due". */
const DUE_TEXT: Record<MaintenanceState, string> = {
  overdue: 'text-overdue',
  due_soon: 'text-due-soon',
  on_track: 'text-ink-muted',
};

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

/**
 * Which interval reads first when both are set is not decided here —
 * that is issue #11, still open. This only picks which unit to show
 * for a schedule that has only one; a schedule with both shows both.
 */
function intervalLabel(schedule: ScheduleItem): { icon: LucideIcon; text: string } {
  const parts: string[] = [];
  if (schedule.intervalDays !== null) parts.push(`${schedule.intervalDays} days`);
  if (schedule.intervalKm !== null) parts.push(`${odometer(schedule.intervalKm)} km`);
  return {
    icon: schedule.intervalDays !== null ? Clock : Gauge,
    text: parts.length > 0 ? `Every ${parts.join(' / ')}` : '—',
  };
}

/** Same display-only choice as the interval icon: a day-based schedule
 *  reads as a date, a km-only one reads as the odometer figure it was
 *  last done at. */
function lastDoneLabel(schedule: ScheduleItem): string {
  if (schedule.intervalDays !== null) {
    return schedule.lastServiceDate ? shortDate(schedule.lastServiceDate) : 'Never';
  }
  return schedule.lastServiceOdometerKm != null
    ? `${odometer(schedule.lastServiceOdometerKm)} km`
    : 'Never';
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
  const [query, setQuery] = useState('');
  const [state, setState] = useState<MaintenanceState | 'all'>('all');
  const sort = useMultiSort<SortKey>({ defaultSort: DEFAULT_SORT, startsAscending });

  const counts = useMemo(() => {
    const tally = new Map<MaintenanceState, number>();
    for (const schedule of schedules) {
      tally.set(schedule.state, (tally.get(schedule.state) ?? 0) + 1);
    }
    return tally;
  }, [schedules]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return schedules.filter((schedule) => {
      if (state !== 'all' && schedule.state !== state) return false;
      if (!needle) return true;
      return [
        schedule.plate ?? '',
        schedule.make ?? '',
        schedule.model ?? '',
        schedule.task,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [schedules, query, state]);

  const shown = sortRows(filtered, sort.order, compare);
  const vehicleCount = new Set(shown.map((schedule) => schedule.vehicleId)).size;

  const filters: { value: MaintenanceState | 'all'; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: schedules.length },
    ...STATES.map((one) => ({
      value: one,
      label: STATE_LABEL[one],
      count: counts.get(one) ?? 0,
    })),
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-5 py-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search plate, vehicle or task"
              className="w-full rounded-xl border border-white/10 bg-page/60 py-2 pr-4 pl-10 text-body placeholder:text-ink-muted focus:border-lime/40 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1 rounded-xl border border-white/5 bg-page/60 p-1">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setState(filter.value)}
                className={`rounded-lg px-3 py-1.5 text-body whitespace-nowrap transition-colors ${
                  state === filter.value
                    ? 'bg-white/10 font-medium text-ink'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {filter.label}
                <span className="ml-1.5 text-[12px] text-ink-muted tabular-nums">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-white/5">
        <table className="w-full min-w-[920px] text-left">
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
              <th className="px-5 py-3.5 text-table-label font-semibold text-ink-muted uppercase">
                Last done
              </th>
              <th className="px-5 py-3.5 text-table-label font-semibold text-ink-muted uppercase">
                Status
              </th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {shown.map((schedule) => {
              const busy = busyId === schedule.id;
              const TaskIcon = taskIcon(schedule.task);
              const interval = intervalLabel(schedule);
              const IntervalIcon = interval.icon;
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
                      <TaskIcon
                        className="size-4 shrink-0 text-ink-muted"
                        strokeWidth={1.75}
                      />
                      {schedule.task}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-body text-ink-muted whitespace-nowrap">
                    <span className="flex items-center gap-2">
                      <IntervalIcon
                        className="size-4 shrink-0 text-ink-muted"
                        strokeWidth={1.75}
                      />
                      {interval.text}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-body text-ink-muted whitespace-nowrap">
                    {lastDoneLabel(schedule)}
                  </td>
                  <td
                    className={`px-5 py-3.5 font-medium whitespace-nowrap ${DUE_TEXT[schedule.state]}`}
                  >
                    {schedule.nextDueDate
                      ? shortDate(schedule.nextDueDate)
                      : 'Not logged yet'}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusChip state={schedule.state} />
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
            {schedules.length === 0
              ? 'No maintenance schedules yet.'
              : `Nothing matches${query ? ` "${query}"` : ''}${
                  state === 'all' ? '' : ` in ${STATE_LABEL[state].toLowerCase()}`
                }.`}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 px-5 py-3 text-body text-ink-muted">
        <span>
          Showing {shown.length} of {schedules.length}{' '}
          {schedules.length === 1 ? 'schedule' : 'schedules'} across {vehicleCount}{' '}
          {vehicleCount === 1 ? 'vehicle' : 'vehicles'}
        </span>
        <span className="flex items-center gap-1.5">
          <RefreshCw className="size-3.5" strokeWidth={1.75} />
          Next due recalculates when a service is logged
        </span>
      </div>
    </>
  );
}
