/** Every metric answers with the same shape, which is what lets one
 *  chart component draw all of them. */
export type ReportPoint = {
  key: string;
  label: string;
  value: number;
};

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

/**
 * Which chart shapes a metric suits is not here: the API serves numbers
 * and the screen decides how to draw them, so that catalogue lives in
 * apps/web/src/reports/metrics.ts and nowhere else.
 */
export type ReportsResponse = {
  months: number;
  /** How many service events the range covers, for the CSV and the header. */
  totalEvents: number;
  metrics: Record<MetricId, ReportPoint[]>;
};
