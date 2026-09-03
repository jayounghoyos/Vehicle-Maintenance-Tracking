import { Injectable } from '@nestjs/common';

import { MaintenanceSchedule, ServiceEvent, Vehicle, VehicleStatus } from '../entities';
import { maintenanceByVehicle, stateSchedules } from '../maintenance/fleet-state';
import { STATE_ORDER, type MaintenanceState } from '../maintenance/maintenance';
import { TenantRepositories } from '../tenant/tenant-repository';
import type { MetricId, ReportPoint, ReportsResponse } from './reports.types';

/** Enough categories to read at a glance; the tail is grouped as Other. */
const TOP_N = 8;

const STATE_LABEL: Record<MaintenanceState, string> = {
  overdue: 'Overdue',
  due_soon: 'Due soon',
  on_track: 'On track',
};

const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  [VehicleStatus.ACTIVE]: 'Active',
  [VehicleStatus.IN_SHOP]: 'In shop',
  [VehicleStatus.OUT_OF_SERVICE]: 'Out of service',
};

type Bucket = { bucket: string | null; count: string };

@Injectable()
export class ReportsService {
  constructor(private readonly tenants: TenantRepositories) {}

  async build(
    organizationId: number,
    months: number,
    today = new Date(),
  ): Promise<ReportsResponse> {
    const from = monthStart(today, months - 1);
    const events = this.tenants.for(ServiceEvent, organizationId);

    // grouped in the database rather than in memory: the dashboard reads
    // every row to count them, and a report asks more questions than it
    const [perMonth, byType, byTask, byVehicle, byMechanic] = await Promise.all([
      this.group(organizationId, "to_char(event.performed_at, 'YYYY-MM')", from),
      this.group(organizationId, 'event.type', from),
      this.group(organizationId, 'task.name', from, 'task'),
      this.group(organizationId, 'vehicle.plate', from, 'vehicle'),
      this.group(organizationId, 'recorder.full_name', from, 'recorder'),
    ]);

    const vehicles = await this.tenants
      .for(Vehicle, organizationId)
      .find({ relations: { model: true }, order: { plate: 'ASC' } });

    const schedules = await this.tenants
      .for(MaintenanceSchedule, organizationId)
      .find({ relations: { task: true } });

    const totalEvents = await events.count();

    const metrics: Record<MetricId, ReportPoint[]> = {
      servicesPerMonth: fillMonths(perMonth, today, months),
      servicesByType: named(byType, {
        preventive: 'Planned',
        corrective: 'Breakdown',
      }),
      servicesByTask: top(named(byTask)),
      servicesByVehicle: top(named(byVehicle)),
      servicesByMechanic: top(named(byMechanic)),
      fleetByState: this.fleetByState(vehicles, schedules, today),
      fleetByStatus: countBy(vehicles, (v) => [v.status, VEHICLE_STATUS_LABEL[v.status]]),
      fleetByMake: top(countBy(vehicles, (v) => [v.model.make, v.model.make])),
      odometerByVehicle: vehicles.map((v) => ({
        key: String(v.id),
        label: v.plate,
        value: v.odometerKm,
      })),
    };

    return { months, totalEvents, metrics };
  }

  /** One grouped query per question, all scoped to the organization. */
  private group(
    organizationId: number,
    expression: string,
    from: string,
    join?: 'task' | 'vehicle' | 'recorder',
  ): Promise<Bucket[]> {
    const builder = this.tenants
      .for(ServiceEvent, organizationId)
      .builder('event')
      // andWhere: builder() already carries the organization condition
      .andWhere('event.performed_at >= :from', { from })
      .select(expression, 'bucket')
      .addSelect('count(*)', 'count')
      .groupBy('bucket')
      .orderBy('count', 'DESC');

    if (join) builder.leftJoin(`event.${join}`, join);
    return builder.getRawMany<Bucket>();
  }

  private fleetByState(
    vehicles: Vehicle[],
    schedules: MaintenanceSchedule[],
    today: Date,
  ): ReportPoint[] {
    // the one metric SQL cannot answer: a state is derived by comparing
    // a due date to today, not stored in a column
    const byVehicle = maintenanceByVehicle(stateSchedules(schedules, today));
    const counts = new Map<MaintenanceState, number>();
    for (const vehicle of vehicles) {
      const state = byVehicle.get(vehicle.id)?.state ?? 'on_track';
      counts.set(state, (counts.get(state) ?? 0) + 1);
    }
    return STATE_ORDER.map((state) => ({
      key: state,
      label: STATE_LABEL[state],
      value: counts.get(state) ?? 0,
    }));
  }
}

/** The first day of the month `back` months before the one holding `date`. */
function monthStart(date: Date, back: number): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - back, 1));
  return d.toISOString().slice(0, 10);
}

/**
 * A month nobody logged anything in returns no row at all, and a line
 * that skipped it would draw a trend that did not happen. The months
 * are laid out here and the query fills them in.
 */
function fillMonths(rows: Bucket[], today: Date, months: number): ReportPoint[] {
  const found = new Map(rows.map((row) => [row.bucket, Number(row.count)]));
  return Array.from({ length: months }, (_, i) => {
    const key = monthStart(today, months - 1 - i).slice(0, 7);
    return { key, label: monthLabel(key), value: found.get(key) ?? 0 };
  });
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  const name = new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleString(
    'en',
    { month: 'short', timeZone: 'UTC' },
  );
  return `${name} ${year.slice(2)}`;
}

function named(rows: Bucket[], labels: Record<string, string> = {}): ReportPoint[] {
  return rows.map((row) => {
    const key = row.bucket ?? 'unknown';
    return { key, label: labels[key] ?? key, value: Number(row.count) };
  });
}

function countBy<T>(items: T[], keyOf: (item: T) => [string, string]): ReportPoint[] {
  const counts = new Map<string, { label: string; value: number }>();
  for (const item of items) {
    const [key, label] = keyOf(item);
    const found = counts.get(key);
    if (found) found.value += 1;
    else counts.set(key, { label, value: 1 });
  }
  return [...counts]
    .map(([key, rest]) => ({ key, ...rest }))
    .sort((a, b) => b.value - a.value);
}

function top(points: ReportPoint[]): ReportPoint[] {
  if (points.length <= TOP_N) return points;
  const rest = points.slice(TOP_N).reduce((sum, point) => sum + point.value, 0);
  return [...points.slice(0, TOP_N), { key: 'other', label: 'Other', value: rest }];
}
