import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Download, Printer } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '../auth/context';
import { AppShell } from '../components/AppShell';
import { Panel } from '../components/Panel';
import { SidebarFooter } from '../components/SidebarFooter';
import { useBrand } from '../hooks/useBrand';
import { api } from '../lib/api';
import { downloadCsv, toCsv, datedName } from '../lib/csv';
import { ChartPicker } from '../reports/ChartPicker';
import { ReportChart } from '../reports/ReportChart';
import { ReportSummary } from '../reports/ReportSummary';
import {
  METRICS,
  chartFor,
  type ChartType,
  type MetricId,
  type ReportsResponse,
} from '../reports/metrics';

const RANGES = [3, 6, 12];
/* The year of work, which is the thing a maintenance log is really
   about. The two below answer what and how much. */
const HERO: MetricId = 'servicesPerMonth';
const SUPPORTING: MetricId[] = ['fleetByState', 'servicesByTask'];
const PRINT_WIDTH = 1030;

const REMEMBERED = 'mts.report';

export default function Reports() {
  const { principal } = useAuth();
  const me = principal?.kind === 'user' ? principal : null;
  const { accent } = useBrand();

  const [months, setMonths] = useState(12);
  // which way the window moved, because the two directions need different
  // pairing and the button knows it without anything having to guess
  const [pairing, setPairing] = useState<'index' | 'key'>('index');
  const [choice, setChoice] = useState(readChoice);

  const { data, isPending, isFetching, isError } = useQuery({
    queryKey: ['reports', months],
    queryFn: () => api.get<ReportsResponse>(`/reports?months=${months}`),
    // every chart arrives in one answer, so switching one costs nothing
    staleTime: 5 * 60_000,
    // the range is the same report over a different window, so the old
    // one stays on screen and the charts move to the new numbers rather
    // than being torn down and grown again from zero
    placeholderData: keepPreviousData,
  });

  const pick = (next: Partial<typeof choice>) => {
    // a different metric is a different subject, not a narrower window
    if (next.metric) setPairing('index');
    const merged = { ...choice, ...next };
    merged.chart = chartFor(merged.metric, merged.chart);
    setChoice(merged);
    localStorage.setItem(REMEMBERED, JSON.stringify(merged));
  };

  const exportAll = () => {
    if (!data) return;
    // the range belongs in the rows, not only in the file name: two
    // exports pasted into one sheet are otherwise indistinguishable
    const range = `Last ${months} months`;
    const rows = Object.entries(data.metrics).flatMap(([id, points]) =>
      points.map((point) => [
        range,
        METRICS[id as MetricId].label,
        // the key is what the API grouped by, and for the time series it
        // is the sortable YYYY-MM behind a label like "Sep 26"
        point.key,
        point.label,
        point.value,
      ]),
    );
    downloadCsv(
      datedName(`reports-${months}m`),
      toCsv(['Range', 'Report', 'Key', 'Item', 'Value'], rows),
    );
  };

  // what A4 landscape holds at 96dpi, once the @page margins are taken
  // off: 297mm wide, 12mm each side
  const [printWidth, setPrintWidth] = useState<number | null>(null);

  // both buttons, said once
  const exportStyle =
    'flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-body text-ink-muted transition-colors hover:text-ink disabled:opacity-50';

  /* No PDF library. The browser already writes this page to PDF with the
   * fonts and the charts that are on screen, and the print sheet in
   * index.css is what makes the result worth keeping. Sending the same
   * numbers through a second renderer would mean a second definition of
   * every chart, one that drifts from the first.
   *
   * The document title is what the dialog offers as the file name. */
  const exportPdf = () => {
    // Recharts measures its container once and draws an svg that wide.
    // Printing does not make it measure again, so a chart sized for the
    // screen keeps that width on a page half as wide and loses its
    // right-hand side. Narrowing the page to what A4 landscape holds is
    // a resize it does notice, so it redraws at the printed width.
    const previous = document.title;
    setPrintWidth(PRINT_WIDTH);

    // afterprint rather than the line below window.print(), because
    // print() blocks until the dialog closes in some browsers and
    // returns straight away in others
    const restore = () => {
      document.title = previous;
      setPrintWidth(null);
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);

    // long enough for the charts to redraw at the new width, which they
    // do in well under a frame budget's worth of this
    setTimeout(() => {
      document.title = datedName(`reports-${months}m`, 'pdf');
      window.print();
    }, 150);
  };

  return (
    <AppShell
      title="Reports"
      subtitle="What the fleet has been doing"
      sidebarFooter={me ? <SidebarFooter user={me} /> : undefined}
    >
      <div className="space-y-5" style={printWidth ? { width: printWidth } : undefined}>
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div
            data-tour="report-range"
            className="flex gap-1 rounded-xl border border-white/5 bg-page/60 p-1"
          >
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => {
                  setPairing(range < months ? 'key' : 'index');
                  setMonths(range);
                }}
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportAll}
              disabled={!data}
              data-tour="report-export"
              className={exportStyle}
            >
              <Download className="size-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={exportPdf}
              disabled={!data}
              className={exportStyle}
            >
              <Printer className="size-4" />
              Export PDF
            </button>
          </div>
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
          <div
            className={`space-y-5 transition-opacity duration-200 ${isFetching ? 'opacity-60' : ''}`}
          >
            <ReportSummary data={data} />

            <Panel
              data-tour="report-hero"
              title={METRICS[HERO].label}
              subtitle="Every service the workshop recorded, month by month"
            >
              <div className="px-2 pb-4">
                <ReportChart
                  points={data.metrics[HERO]}
                  type="area"
                  metric={METRICS[HERO]}
                  accent={accent}
                  pairing={pairing}
                  height={260}
                />
              </div>
            </Panel>

            <div className="grid gap-5 xl:grid-cols-2">
              {SUPPORTING.map((id) => (
                <Panel key={id} title={METRICS[id].label}>
                  <div className="px-5 pb-5">
                    <ReportChart
                      points={data.metrics[id]}
                      type={METRICS[id].charts[0]}
                      metric={METRICS[id]}
                      accent={accent}
                      pairing={pairing}
                      height={220}
                    />
                  </div>
                </Panel>
              ))}
            </div>

            <Panel
              data-tour="report-builder"
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
                  pairing={pairing}
                  height={280}
                />
              </div>
            </Panel>
          </div>
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
