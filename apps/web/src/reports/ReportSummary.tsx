import { CalendarRange, ClipboardCheck, TriangleAlert, Wrench } from 'lucide-react';

import type { ReportPoint, ReportsResponse } from './metrics';

/**
 * The numbers before the shapes. Same strip the dashboard opens with,
 * so the two screens read as one product.
 */
export function ReportSummary({ data }: { data: ReportsResponse }) {
  const byType = new Map(data.metrics.servicesByType.map((p) => [p.key, p.value]));
  // reduce from the left keeps the later month on a tie, which is the
  // one somebody asking "busiest" means
  const busiest = data.metrics.servicesPerMonth.reduce(
    (best, month) => (best === null || month.value >= best.value ? month : best),
    null as ReportPoint | null,
  );

  const tiles = [
    {
      label: 'Services',
      value: String(data.totalEvents),
      caption: `Over ${data.months} months`,
      icon: Wrench,
    },
    {
      label: 'Planned',
      value: String(byType.get('preventive') ?? 0),
      caption: 'Scheduled work',
      icon: ClipboardCheck,
    },
    {
      label: 'Breakdowns',
      value: String(byType.get('corrective') ?? 0),
      caption: 'Nobody planned these',
      icon: TriangleAlert,
    },
    {
      label: 'Busiest month',
      value: busiest?.value ? busiest.label : '—',
      caption: busiest?.value ? `${busiest.value} services` : 'Nothing logged yet',
      icon: CalendarRange,
    },
  ];

  return (
    <section
      data-tour="report-summary"
      className="grid grid-cols-1 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/5 bg-panel sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x"
    >
      {tiles.map(({ label, value, caption, icon: Icon }) => (
        <div key={label} className="flex flex-col gap-3 p-5">
          <span className="flex items-center gap-2 text-nav-label text-ink-muted uppercase">
            <Icon className="size-4" strokeWidth={1.75} />
            {label}
          </span>
          <span className="flex items-baseline gap-2">
            <span className="text-[30px] leading-none font-bold tracking-tight tabular-nums">
              {value}
            </span>
            <span className="text-body text-ink-muted">{caption}</span>
          </span>
        </div>
      ))}
    </section>
  );
}
