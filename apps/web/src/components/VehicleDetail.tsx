import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Truck } from 'lucide-react';

import { useAuth } from '../auth/context';
import { can } from '../auth/permissions';
import { STATE_LABEL, dueLabel } from '../domain/maintenance';
import { VEHICLE_STATUS_LABEL, type VehicleStatus } from '../domain/vehicleStatus';
import { api, type VehicleDetail as Detail } from '../lib/api';
import { odometer, shortDate } from '../lib/format';
import { taskIcon } from '../lib/taskIcon';
import { VehiclePhoto } from './VehiclePhoto';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-body text-ink-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

const HUE: Record<string, string> = {
  overdue: 'text-overdue',
  due_soon: 'text-due-soon',
  on_track: 'text-ink-muted',
};

/** Every interval the model can hold. A schedule repeats every so many
 *  days, or so many kilometres, or both. */
function interval(days: number | null, km: number | null): string {
  const parts: string[] = [];
  if (days !== null) parts.push(`every ${days} days`);
  if (km !== null) parts.push(`every ${odometer(km)} km`);
  return parts.length > 0 ? parts.join(' · ') : 'no interval set';
}

/**
 * The profile panel. Everything here comes from the data model: what the
 * mockup also shows and the model cannot store, the body type, is left
 * out rather than invented.
 */
export function VehicleDetail({ id }: { id: number }) {
  const { principal } = useAuth();
  const { data: vehicle, isPending } = useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => api.get<Detail>(`/vehicles/${id}`),
  });

  if (isPending || !vehicle) {
    return <p className="p-5 text-body text-ink-muted">Loading the vehicle…</p>;
  }

  return (
    <div className="space-y-5 p-5">
      <VehiclePhoto vehicle={vehicle} canManage={can(principal, 'manage_vehicles')} />

      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-lime/15">
          <Truck className="size-5 text-lime" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-section font-semibold">{vehicle.plate}</p>
          <p className="text-body text-ink-muted">
            {vehicle.make} {vehicle.model}
          </p>
        </div>
      </div>

      {vehicle.nextDueDate && vehicle.state !== 'on_track' && (
        <p className={`text-body font-medium ${HUE[vehicle.state]}`}>
          {vehicle.nextTask} {dueLabel(vehicle.nextDueDate).toLowerCase()}
        </p>
      )}

      <section>
        <h3 className="mb-1 text-table-label font-semibold text-ink-muted uppercase">
          Profile
        </h3>
        <dl className="divide-y divide-white/5">
          <Row label="Make" value={vehicle.make} />
          <Row label="Model" value={vehicle.model} />
          <Row label="Year" value={vehicle.year ?? 'Not recorded'} />
          <Row label="Odometer" value={`${odometer(vehicle.odometerKm)} km`} />
          <Row
            label="Status"
            value={VEHICLE_STATUS_LABEL[vehicle.status as VehicleStatus]}
          />
          <Row
            label="Maintenance"
            value={
              <span className={HUE[vehicle.state]}>{STATE_LABEL[vehicle.state]}</span>
            }
          />
          <Row label="Added" value={shortDate(vehicle.createdAt)} />
        </dl>
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h3 className="text-table-label font-semibold text-ink-muted uppercase">
            Maintenance schedules
          </h3>
          <span className="text-[12px] text-ink-muted">{vehicle.schedules.length}</span>
        </div>
        {vehicle.schedules.length === 0 ? (
          <p className="text-body text-ink-muted">
            Nothing is scheduled, so nothing will ever come due.
          </p>
        ) : (
          <ul className="space-y-2">
            {vehicle.schedules.map((schedule) => {
              const Icon = taskIcon(schedule.task);
              return (
                <li
                  key={schedule.id}
                  className="flex items-start gap-3 rounded-xl border border-white/5 bg-page/50 px-3.5 py-3"
                >
                  <Icon
                    className={`mt-0.5 size-4 shrink-0 ${HUE[schedule.state]}`}
                    strokeWidth={1.75}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {schedule.task}
                      <span className="ml-2 text-[12px] font-normal text-ink-muted">
                        {interval(schedule.intervalDays, schedule.intervalKm)}
                      </span>
                    </p>
                    {schedule.nextDueDate && (
                      <p className={`text-body ${HUE[schedule.state]}`}>
                        {shortDate(schedule.nextDueDate)} ·{' '}
                        {dueLabel(schedule.nextDueDate)}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-table-label font-semibold text-ink-muted uppercase">
          Last service events
        </h3>
        {vehicle.recentEvents.length === 0 ? (
          <p className="text-body text-ink-muted">Nothing has been recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {vehicle.recentEvents.map((event) => {
              const Icon = taskIcon(event.task);
              return (
                <li key={event.id} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-white/5">
                    <Icon className="size-3.5 text-ink-muted" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {event.task}
                      {event.type === 'corrective' && (
                        <span className="ml-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                          Unplanned
                        </span>
                      )}
                    </p>
                    <p className="text-body text-ink-muted">
                      {event.recorder} · {shortDate(event.performedAt)}
                      {event.odometerKm !== null && ` · ${odometer(event.odometerKm)} km`}
                    </p>
                    {event.notes && (
                      <p className="mt-0.5 text-body text-ink-muted italic">
                        {event.notes}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="flex items-start gap-2 text-[12px] text-ink-muted">
        <CalendarClock className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
        Schedules are set on the Schedules screen, which is not built yet.
      </p>
    </div>
  );
}
