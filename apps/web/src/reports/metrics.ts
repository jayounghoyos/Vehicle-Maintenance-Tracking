/**
 * Mirrors apps/api/src/reports/metrics.ts. Hand-kept, like
 * auth/permissions.ts mirrors the Permission enum: there is no shared
 * package and one table is not worth inventing one.
 *
 * A metric names the charts it suits and the picker offers nothing else,
 * so asking for an odometer reading as a time series is not a mistake to
 * catch — it is a choice the interface never presents.
 */
export const CHART_TYPES = [
  'bar',
  'row',
  'line',
  'area',
  'donut',
  'radial',
  'radar',
  'treemap',
] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export type ReportPoint = { key: string; label: string; value: number };

export type MetricId =
  | 'servicesPerMonth'
  | 'servicesByType'
  | 'servicesByTask'
  | 'servicesByVehicle'
  | 'servicesByMechanic'
  | 'fleetByState'
  | 'fleetByStatus'
  | 'fleetByMake'
  | 'odometerByVehicle';

export type MetricDefinition = {
  id: MetricId;
  label: string;
  /** First is the default. */
  charts: ChartType[];
  tone: 'neutral' | 'state';
  /** What one unit is, for the tooltip. */
  unit: string;
};

export type ReportsResponse = {
  months: number;
  totalEvents: number;
  metrics: Record<MetricId, ReportPoint[]>;
};

export const METRICS: Record<MetricId, MetricDefinition> = {
  servicesPerMonth: {
    id: 'servicesPerMonth',
    label: 'Services per month',
    charts: ['line', 'area', 'bar', 'radar'],
    tone: 'neutral',
    unit: 'services',
  },
  servicesByType: {
    id: 'servicesByType',
    label: 'Planned vs breakdown',
    charts: ['donut', 'bar', 'row', 'radial'],
    tone: 'neutral',
    unit: 'services',
  },
  servicesByTask: {
    id: 'servicesByTask',
    label: 'Services by task',
    charts: ['bar', 'row', 'donut', 'radial', 'radar', 'treemap'],
    tone: 'neutral',
    unit: 'services',
  },
  servicesByVehicle: {
    id: 'servicesByVehicle',
    label: 'Services by vehicle',
    charts: ['bar', 'row', 'radial', 'treemap'],
    tone: 'neutral',
    unit: 'services',
  },
  servicesByMechanic: {
    id: 'servicesByMechanic',
    label: 'Services by who recorded them',
    charts: ['row', 'bar', 'radial', 'treemap'],
    tone: 'neutral',
    unit: 'services',
  },
  fleetByState: {
    id: 'fleetByState',
    label: 'Fleet by maintenance state',
    charts: ['donut', 'bar', 'row', 'radial'],
    tone: 'state',
    unit: 'vehicles',
  },
  fleetByStatus: {
    id: 'fleetByStatus',
    label: 'Fleet by status',
    charts: ['donut', 'bar', 'row', 'radial'],
    tone: 'neutral',
    unit: 'vehicles',
  },
  fleetByMake: {
    id: 'fleetByMake',
    label: 'Fleet by make',
    charts: ['bar', 'row', 'donut', 'radial', 'treemap'],
    tone: 'neutral',
    unit: 'vehicles',
  },
  odometerByVehicle: {
    id: 'odometerByVehicle',
    label: 'Odometer by vehicle',
    charts: ['row', 'bar', 'treemap', 'radial'],
    tone: 'neutral',
    unit: 'km',
  },
};

export const METRIC_LIST = Object.values(METRICS);

/** Keeps a chosen chart when the new metric also offers it. */
export function chartFor(metric: MetricId, wanted: ChartType): ChartType {
  const { charts } = METRICS[metric];
  return charts.includes(wanted) ? wanted : charts[0];
}
