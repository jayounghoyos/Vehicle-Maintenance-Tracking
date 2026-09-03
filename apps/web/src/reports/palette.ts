import type { MetricDefinition, ReportPoint } from './metrics';

/**
 * Brand manual, 05: status colour always carries meaning, never
 * decoration. So the three hues appear only on the chart that reports
 * maintenance state.
 *
 * Everything else is drawn in the client's own accent, one hue, with
 * opacity carrying emphasis rather than a second colour. A ramp of
 * greys would imply a ranking the data does not have, and would look
 * like a chart nobody finished.
 */
const STATE_HUE: Record<string, string> = {
  overdue: '#ff7a59',
  due_soon: '#f2c14e',
  on_track: '#7ad39b',
};

export const AXIS = '#8a928e';
export const GRID = 'rgba(255,255,255,.05)';

/** At rest, and once the cursor has picked something else out. */
export const RESTING = 0.85;
export const DIMMED = 0.3;

/**
 * A donut has to separate its slices, and bars do not: they are already
 * apart on the axis. So a neutral ring steps one hue down in strength
 * rather than reaching for a second colour.
 */
export function sliceOpacity(index: number, count: number): number {
  if (count < 2) return RESTING;
  const step = (RESTING - 0.35) / (count - 1);
  return RESTING - index * step;
}

/** For charts that colour from the data and take no opacity of their own. */
export function withAlpha(hue: string, alpha: number): string {
  const hex = hue.replace('#', '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function hueAt(
  metric: MetricDefinition,
  point: ReportPoint,
  accent: string,
): string {
  return metric.tone === 'state' ? (STATE_HUE[point.key] ?? accent) : accent;
}
