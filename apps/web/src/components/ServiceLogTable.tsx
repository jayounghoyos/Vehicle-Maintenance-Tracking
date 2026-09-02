import { Camera, X } from 'lucide-react';
import { useState } from 'react';


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
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(
    null,
  );

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
                  <div className="flex items-center gap-2.5">
                    <div>
                      <span className="font-medium">{shortDate(event.performedAt)}</span>
                      <span className="block text-body text-ink-muted">
                        {relativeDay(event.performedAt)}
                      </span>
                    </div>
                    {event.photoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPhoto({
                            url: event.photoUrl!,
                            title: `${event.plate} · ${event.task}`,
                          })
                        }
                        title="View service photo"
                        className="rounded-lg bg-white/5 p-1.5 text-lime transition-colors hover:bg-lime/20"
                      >
                        <Camera className="size-3.5" />
                      </button>
                    )}
                  </div>
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

      {/* Photo lightbox modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-h-[85vh] max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <h3 className="text-body font-semibold text-ink">{selectedPhoto.title}</h3>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="rounded-lg p-1 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </header>
            <div className="p-3">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-h-[65vh] w-full rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

