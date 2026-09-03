import { AreaChart, BarChart3, LineChart, PieChart, type LucideIcon } from 'lucide-react';

import {
  CHART_TYPES,
  METRICS,
  METRIC_LIST,
  type ChartType,
  type MetricId,
} from './metrics';

const ICON: Record<ChartType, LucideIcon> = {
  bar: BarChart3,
  line: LineChart,
  area: AreaChart,
  donut: PieChart,
};

const LABEL: Record<ChartType, string> = {
  bar: 'Bars',
  line: 'Line',
  area: 'Area',
  donut: 'Donut',
};

type Props = {
  metric: MetricId;
  chart: ChartType;
  onMetric: (metric: MetricId) => void;
  onChart: (chart: ChartType) => void;
};

/**
 * Only the shapes the chosen metric declares are offered, so a
 * meaningless pairing is never on screen to be picked.
 */
export function ChartPicker({ metric, chart, onMetric, onChart }: Props) {
  const allowed = METRICS[metric].charts;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={metric}
        onChange={(event) => onMetric(event.target.value as MetricId)}
        aria-label="What to show"
        className="rounded-xl border border-white/10 bg-page/60 px-3.5 py-2 text-body focus:border-lime/40 focus:outline-none"
      >
        {METRIC_LIST.map((definition) => (
          <option key={definition.id} value={definition.id} className="bg-panel">
            {definition.label}
          </option>
        ))}
      </select>

      <div className="flex gap-1 rounded-xl border border-white/5 bg-page/60 p-1">
        {CHART_TYPES.filter((type) => allowed.includes(type)).map((type) => {
          const Icon = ICON[type];
          const active = type === chart;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChart(type)}
              aria-pressed={active}
              title={LABEL[type]}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-body transition-colors ${
                active ? 'bg-lime text-on-accent' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Icon className="size-4" strokeWidth={2} />
              {LABEL[type]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
