import { Download, Pencil, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { dueLabel } from '../domain/maintenance';
import {
  VEHICLE_STATUSES,
  VEHICLE_STATUS_LABEL,
  VEHICLE_STATUS_RANK,
  type VehicleStatus,
} from '../domain/vehicleStatus';
import { sortRows, useMultiSort, type Sort } from '../hooks/useMultiSort';
import { toCsv, downloadCsv } from '../lib/csv';
import { odometer, shortDate } from '../lib/format';
import { taskIcon } from '../lib/taskIcon';
import type { VehicleRow } from '../lib/api';
import { SortHeader } from './SortHeader';

type SortKey = 'plate' | 'vehicle' | 'odometer' | 'next' | 'status';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'plate', label: 'Plate' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'odometer', label: 'Odometer (km)' },
  { key: 'next', label: 'Next service' },
  { key: 'status', label: 'Status' },
];

/* Numbers read biggest first and dates soonest first; words read
 * forwards. */
const startsAscending = (key: SortKey) => key !== 'odometer';

/** How the list arrives: by plate, the way somebody reads a fleet. */
const DEFAULT_SORT: Sort<SortKey> = { key: 'plate', ascending: true };

/* A vehicle with nothing scheduled sorts after every vehicle that has
 * something, rather than pretending its due date is the beginning of
 * time. */
const NEVER = '9999-99-99';

function compare(a: VehicleRow, b: VehicleRow, key: SortKey): number {
  switch (key) {
    case 'plate':
      return a.plate.localeCompare(b.plate);
    case 'vehicle':
      return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`);
    case 'odometer':
      return a.odometerKm - b.odometerKm;
    case 'next':
      return (a.nextDueDate ?? NEVER).localeCompare(b.nextDueDate ?? NEVER);
    case 'status':
      return (
        (VEHICLE_STATUS_RANK.get(a.status) ?? 0) -
        (VEHICLE_STATUS_RANK.get(b.status) ?? 0)
      );
  }
}

/* Neutral on purpose. The brand manual keeps orange, amber and green for
 * maintenance state and nothing else, and where a vehicle is parked is
 * not maintenance state. */
function StatusBadge({ status }: { status: VehicleStatus }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap text-ink-muted">
      <span className="size-1.5 rounded-full bg-ink-muted" />
      {VEHICLE_STATUS_LABEL[status]}
    </span>
  );
}

/** The urgency lives here rather than in a second chip: the task, and
 *  the date in the hue of the state it is in.
 *
 *  A function rather than a component, which is what it is: it holds no
 *  state and the icon it picks is a lookup, not a definition. */
function nextService(vehicle: VehicleRow) {
  if (!vehicle.nextTask || !vehicle.nextDueDate) {
    return <span className="text-ink-muted">No schedule</span>;
  }
  const Icon = taskIcon(vehicle.nextTask);
  const hue =
    vehicle.state === 'overdue'
      ? 'text-overdue'
      : vehicle.state === 'due_soon'
        ? 'text-due-soon'
        : 'text-ink-muted';
  return (
    <span className="flex items-center gap-2 whitespace-nowrap">
      <Icon className={`size-4 shrink-0 ${hue}`} strokeWidth={1.75} />
      {vehicle.nextTask}
      <span className={hue} title={dueLabel(vehicle.nextDueDate)}>
        · {shortDate(vehicle.nextDueDate)}
      </span>
    </span>
  );
}

export function VehicleTable({
  vehicles,
  canManage,
  busyId,
  onOpen,
  onEdit,
  onRemove,
}: {
  vehicles: VehicleRow[];
  canManage: boolean;
  /** the row waiting on the API, so its controls stop accepting clicks */
  busyId: number | null;
  onOpen: (vehicle: VehicleRow) => void;
  onEdit: (vehicle: VehicleRow) => void;
  onRemove: (vehicle: VehicleRow) => void;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<VehicleStatus | 'all'>('all');
  const sort = useMultiSort<SortKey>({ defaultSort: DEFAULT_SORT, startsAscending });

  const counts = useMemo(() => {
    const tally = new Map<string, number>();
    for (const vehicle of vehicles) {
      tally.set(vehicle.status, (tally.get(vehicle.status) ?? 0) + 1);
    }
    return tally;
  }, [vehicles]);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = vehicles.filter((vehicle) => {
      if (status !== 'all' && vehicle.status !== status) return false;
      if (!needle) return true;
      return [vehicle.plate, vehicle.make, vehicle.model, vehicle.nextTask ?? '']
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
    return sortRows(matched, sort.order, compare);
  }, [vehicles, query, status, sort.order]);

  const exportAll = () =>
    downloadCsv(
      'fleet.csv',
      // the whole fleet, not the filtered view
      toCsv(
        [
          'Plate',
          'Make',
          'Model',
          'Year',
          'Odometer (km)',
          'Status',
          'Next service',
          'Due',
        ],
        vehicles.map((vehicle) => [
          vehicle.plate,
          vehicle.make,
          vehicle.model,
          vehicle.year ?? '',
          vehicle.odometerKm,
          VEHICLE_STATUS_LABEL[vehicle.status],
          vehicle.nextTask ?? '',
          vehicle.nextDueDate ? shortDate(vehicle.nextDueDate) : '',
        ]),
      ),
    );

  const filters: { value: VehicleStatus | 'all'; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: vehicles.length },
    ...VEHICLE_STATUSES.map((one) => ({
      value: one,
      label: VEHICLE_STATUS_LABEL[one],
      count: counts.get(one) ?? 0,
    })),
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-5 py-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <div data-tour="vehicle-search" className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search plate, make or model"
              className="w-full rounded-xl border border-white/10 bg-page/60 py-2 pr-4 pl-10 text-body placeholder:text-ink-muted focus:border-lime/40 focus:outline-none"
            />
          </div>

          <div
            data-tour="vehicle-filter"
            className="flex flex-wrap gap-1 rounded-xl border border-white/5 bg-page/60 p-1"
          >
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatus(filter.value)}
                className={`rounded-lg px-3 py-1.5 text-body whitespace-nowrap transition-colors ${
                  status === filter.value
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

        <button
          type="button"
          data-tour="vehicle-export"
          onClick={exportAll}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-body text-ink-muted transition-colors hover:text-ink"
        >
          <Download className="size-4" strokeWidth={1.75} />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto border-t border-white/5">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr data-tour="vehicle-headings" className="border-b border-white/5">
              {COLUMNS.map(({ key, label }) => (
                <SortHeader
                  key={key}
                  label={label}
                  sort={sort.find(key)}
                  rank={sort.rankOf(key)}
                  showRank={sort.showRank}
                  ascendingLabel={
                    key === 'odometer'
                      ? 'lowest first'
                      : key === 'next'
                        ? 'soonest first'
                        : 'A to Z'
                  }
                  descendingLabel={
                    key === 'odometer'
                      ? 'highest first'
                      : key === 'next'
                        ? 'latest first'
                        : 'Z to A'
                  }
                  onClick={() => sort.toggle(key)}
                />
              ))}
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {shown.map((vehicle) => {
              const busy = busyId === vehicle.id;
              return (
                <tr
                  key={vehicle.id}
                  data-tour={vehicle.id === shown[0]?.id ? 'vehicle-row' : undefined}
                  onClick={() => onOpen(vehicle)}
                  className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${
                    busy ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-5 py-3.5 font-semibold whitespace-nowrap">
                    {vehicle.plate}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="whitespace-nowrap">
                      {vehicle.make} {vehicle.model}
                    </span>
                    {vehicle.year !== null && (
                      <span className="block text-body text-ink-muted">
                        {vehicle.year}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-body tabular-nums">
                    {odometer(vehicle.odometerKm)}
                  </td>
                  <td className="px-5 py-3.5 text-body">{nextService(vehicle)}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={vehicle.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    {canManage && (
                      // the row opens the profile, so these must not
                      <div
                        className="flex justify-end gap-1"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onEdit(vehicle)}
                          title={`Edit ${vehicle.plate}`}
                          className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink disabled:opacity-40"
                        >
                          <Pencil className="size-4" strokeWidth={1.75} />
                        </button>
                        {/* permanent, so only for a vehicle nothing is
                            attached to yet */}
                        {vehicle.scheduleCount === 0 &&
                          vehicle.serviceEventCount === 0 && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => onRemove(vehicle)}
                              title={`Delete ${vehicle.plate}`}
                              className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-overdue/15 hover:text-overdue disabled:opacity-40"
                            >
                              <Trash2 className="size-4" strokeWidth={1.75} />
                            </button>
                          )}
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
            {vehicles.length === 0
              ? 'No vehicles yet. Add one, or import a whole fleet.'
              : `Nothing matches${query ? ` "${query}"` : ''}${
                  status === 'all'
                    ? ''
                    : ` in ${VEHICLE_STATUS_LABEL[status].toLowerCase()}`
                }.`}
          </p>
        )}
      </div>
    </>
  );
}
