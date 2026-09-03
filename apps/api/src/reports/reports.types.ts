/** Every metric answers with the same shape, which is what lets one
 *  chart component draw all of them. */
export type ReportPoint = {
  key: string;
  label: string;
  value: number;
};

/**
 * A metric declares the charts it suits, and the picker offers nothing
 * else, so an odometer reading can never be asked for as a time series.
 * The combinations are unrepresentable rather than validated.
 */
export type ChartType = 'bar' | 'line' | 'area' | 'donut';

export const METRIC_IDS = [
  'servicesPerMonth',
  'servicesByType',
  'servicesByTask',
  'servicesByVehicle',
  'servicesByMechanic',
  'fleetByState',
  'fleetByStatus',
  'fleetByMake',
  'odometerByVehicle',
] as const;

export type MetricId = (typeof METRIC_IDS)[number];

export type MetricDefinition = {
  id: MetricId;
  label: string;
  /** First is the default. */
  charts: ChartType[];
  /** Status hues, and only for the metric that reports maintenance state. */
  tone: 'neutral' | 'state';
};

export type ReportsResponse = {
  months: number;
  /** How many service events the range covers, for the CSV and the header. */
  totalEvents: number;
  metrics: Record<MetricId, ReportPoint[]>;
};
