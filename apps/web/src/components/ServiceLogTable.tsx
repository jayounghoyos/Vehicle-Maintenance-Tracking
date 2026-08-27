import { sortRows, useMultiSort, type Sort } from '../hooks/useMultiSort';
import { odometer, relativeDay, shortDate } from '../lib/format';
import { taskIcon } from '../lib/taskIcon';
import type { ServiceLogItem } from '../lib/api';
import { SortHeader } from './SortHeader';

type SortKey = 'date' | 'vehicle' | 'task' | 'type' | 'odometer' | 'recorder';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'task', label: 'Task' },
  { key: 'type', label: 'Type' },
  { key: 'odometer', label: 'Odometer (km)' },
  { key: 'recorder', label: 'Recorded by' },
];

/* Dates and odometer readings read biggest first, the way a log is
 * meant to be read; words read forwards. */
const startsAscending = (key: SortKey) => key !== 'date' && key !== 'odometer';

/** How the log arrives: most recently performed first. */
const DEFAULT_SORT: Sort<SortKey> = { key: 'date', ascending: false };

function compare(a: ServiceLogItem, b: ServiceLogItem, key: SortKey): number {
  switch (key) {
    case 'date':
      return a.performedAt.localeCompare(b.performedAt);
    case 'vehicle':
      return a.plate.localeCompare(b.plate);
    case 'task':
      return a.task.localeCompare(b.task);
    case 'type':
      return a.type.localeCompare(b.type);
    case 'odometer':
      return (a.odometerKm ?? 0) - (b.odometerKm ?? 0);
    case 'recorder':
      return a.recorder.localeCompare(b.recorder);
  }
}

/* Same tone RecentEvents uses on the dashboard: corrective work was
 * unplanned, and that is the one thing worth telling apart here. */
function TypeBadge({ type }: { type: ServiceLogItem['type'] }) {
  const tone =
    type === 'corrective' ? 'bg-overdue/15 text-overdue' : 'bg-on-track/15 text-on-track';
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap ${tone}`}
    >
      <span
        className={`size-1.5 rounded-full ${type === 'corrective' ? 'bg-overdue' : 'bg-on-track'}`}
      />
      {type === 'corrective' ? 'Corrective' : 'Preventive'}
    </span>
  );
}

export function ServiceLogTable({ events }: { events: ServiceLogItem[] }) {
  const sort = useMultiSort<SortKey>({ defaultSort: DEFAULT_SORT, startsAscending });
  const shown = sortRows(events, sort.order, compare);

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
                ascendingLabel={
                  key === 'date'
                    ? 'oldest first'
                    : key === 'odometer'
                      ? 'lowest first'
                      : 'A to Z'
                }
                descendingLabel={
                  key === 'date'
                    ? 'newest first'
                    : key === 'odometer'
                      ? 'highest first'
                      : 'Z to A'
                }
                onClick={() => sort.toggle(key)}
              />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {shown.map((event) => {
            const Icon = taskIcon(event.task);
            return (
              <tr key={event.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="px-5 py-3.5 whitespace-nowrap">
                  {shortDate(event.performedAt)}
                  <span className="block text-body text-ink-muted">
                    {relativeDay(event.performedAt)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="font-semibold whitespace-nowrap">{event.plate}</span>
                  <span className="block text-body text-ink-muted">
                    {event.make} {event.model}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <Icon className="size-4 shrink-0 text-ink-muted" strokeWidth={1.75} />
                    {event.task}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <TypeBadge type={event.type} />
                </td>
                <td className="px-5 py-3.5 text-body tabular-nums">
                  {event.odometerKm !== null ? odometer(event.odometerKm) : '—'}
                </td>
                <td className="px-5 py-3.5 text-body whitespace-nowrap">
                  {event.recorder}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {shown.length === 0 && (
        <p className="px-5 py-8 text-center text-body text-ink-muted">
          Nothing logged yet.
        </p>
      )}
    </div>
  );
}
