import type { MetricDefinition, ReportPoint } from './metrics';

/**
 * Brand manual, 05: status colour always carries meaning, never
 * decoration. So the three hues appear only on the metric that reports
 * maintenance state, and every other chart is drawn in white at falling
 * opacity. The accent marks what the cursor is on — focus, never
 * category.
 *
 * Every chart colour in the app comes from here.
 */
const STATE_HUE: Record<string, string> = {
  overdue: '#ff7a59',
  due_soon: '#f2c14e',
  on_track: '#7ad39b',
};

const NEUTRAL = ['#ffffff', 'rgba(255,255,255,.72)', 'rgba(255,255,255,.5)'];

export const AXIS = '#8a928e';
export const GRID = 'rgba(255,255,255,.06)';

/** The resting colour of one datum, before the cursor reaches it. */
export function colourAt(
  metric: MetricDefinition,
  point: ReportPoint,
  index: number,
): string {
  if (metric.tone === 'state') return STATE_HUE[point.key] ?? NEUTRAL[0];
  return NEUTRAL[Math.min(index, NEUTRAL.length - 1)];
}
