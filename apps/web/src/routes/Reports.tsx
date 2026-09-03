import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '../auth/context';
import { AppShell } from '../components/AppShell';
import { Panel } from '../components/Panel';
import { SidebarFooter } from '../components/SidebarFooter';
import { useBrand } from '../hooks/useBrand';
import { api } from '../lib/api';
import { downloadCsv, toCsv } from '../lib/csv';
import { ChartPicker } from '../reports/ChartPicker';
import { ReportChart } from '../reports/ReportChart';
import {
  METRICS,
  chartFor,
  type ChartType,
  type MetricId,
  type ReportsResponse,
} from '../reports/metrics';

const RANGES = [3, 6, 12];
/* The four the fleet is judged by. The fifth is the reader's to choose. */
const HEADLINE: MetricId[] = [
  'fleetByState',
  'servicesPerMonth',
  'servicesByType',
  'servicesByTask',
];
const REMEMBERED = 'mts.report';

export default function Reports() {
  const { principal } = useAuth();
  const me = principal?.kind === 'user' ? principal : null;
  const { accent } = useBrand();

  const [months, setMonths] = useState(12);
  const [choice, setChoice] = useState(readChoice);

  const { data, isPending, isError } = useQuery({
    queryKey: ['reports', months],
    queryFn: () => api.get<ReportsResponse>(`/reports?months=${months}`),
    // every chart arrives in one answer, so switching one costs nothing
    staleTime: 5 * 60_000,
  });

  const pick = (next: Partial<typeof choice>) => {
    const merged = { ...choice, ...next };
    merged.chart = chartFor(merged.metric, merged.chart);
    setChoice(merged);
    localStorage.setItem(REMEMBERED, JSON.stringify(merged));
  };

  const exportAll = () => {
    if (!data) return;
    const rows = Object.entries(data.metrics).flatMap(([id, points]) =>
      points.map((point) => [METRICS[id as MetricId].label, point.label, point.value]),
    );
    downloadCsv(`reports-${months}m.csv`, toCsv(['Report', 'Item', 'Value'], rows));
  };

  return (
    <AppShell
      title="Reports"
      subtitle="What the fleet has been doing"
      sidebarFooter={me ? <SidebarFooter user={me} /> : undefined}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex gap-1 rounded-xl border border-white/5 bg-page/60 p-1">
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setMonths(range)}
                aria-pressed={range === months}
                className={`rounded-lg px-3 py-1.5 text-body transition-colors ${
                  range === months
                    ? 'bg-lime text-on-accent'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {range} months
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={exportAll}
            disabled={!data}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-body text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            <Download className="size-4" />
            Export CSV
          </button>
        </div>

        {isError && (
          <div className="rounded-2xl bg-overdue/15 p-8">
            <p className="font-semibold text-overdue">The reports did not load</p>
          </div>
        )}

        {isPending && (
          <p className="rounded-2xl border border-white/5 bg-panel p-8 text-body text-ink-muted">
            Reading the fleet…
          </p>
        )}

        {data && (
          <>
            <div className="grid gap-5 xl:grid-cols-2">
              {HEADLINE.map((id) => (
                <Panel key={id} title={METRICS[id].label}>
                  <div className="px-2 pb-4">
                    <ReportChart
                      points={data.metrics[id]}
                      type={METRICS[id].charts[0]}
                      metric={METRICS[id]}
                      accent={accent}
                    />
                  </div>
                </Panel>
              ))}
            </div>

            <Panel
              title="Build your own"
              subtitle="Pick what to show and how to draw it"
              action={
                <div className="print:hidden">
                  <ChartPicker
                    metric={choice.metric}
                    chart={choice.chart}
                    onMetric={(metric) => pick({ metric })}
                    onChart={(chart) => pick({ chart })}
                  />
                </div>
              }
            >
              <div className="px-2 pb-4">
                <ReportChart
                  points={data.metrics[choice.metric]}
                  type={choice.chart}
                  metric={METRICS[choice.metric]}
                  accent={accent}
                  height={320}
                />
              </div>
            </Panel>
          </>
        )}
      </div>
    </AppShell>
  );
}

/** Comes back the way it was left, and falls back if the metric is gone. */
function readChoice(): { metric: MetricId; chart: ChartType } {
  const fallback = { metric: 'servicesByVehicle' as MetricId, chart: 'bar' as ChartType };
  try {
    const saved = localStorage.getItem(REMEMBERED);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved) as { metric: MetricId; chart: ChartType };
    if (!METRICS[parsed.metric]) return fallback;
    return { metric: parsed.metric, chart: chartFor(parsed.metric, parsed.chart) };
  } catch {
    return fallback;
  }
}
