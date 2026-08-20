import { ArrowUpRight, Wrench } from 'lucide-react'

import type { DashboardResponse } from '../lib/api'
import { relativeDay } from '../lib/format'
import { Panel } from './Panel'

export function RecentEvents({ events }: { events: DashboardResponse['recentEvents'] }) {
  return (
    <Panel title="Recent service events" subtitle="Logged by the workshop">
      <ul className="flex-1 divide-y divide-white/5 border-t border-white/5">
        {events.map(({ id, task, plate, recorder, performedAt, type }) => (
          <li key={id} className="flex gap-3.5 px-5 py-3.5">
            {/* corrective work was unplanned, so it is the one thing
                worth distinguishing here — and overdue is its hue */}
            <span
              className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${
                type === 'corrective'
                  ? 'bg-overdue/15 text-overdue'
                  : 'bg-on-track/15 text-on-track'
              }`}
            >
              <Wrench className="size-4" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{task}</p>
              <p className="mt-0.5 truncate text-body text-ink-muted">
                <span className="text-lime">{plate}</span>
                {' · '}
                {recorder}
                {' · '}
                {relativeDay(performedAt)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="flex items-center justify-center gap-2 border-t border-white/5 px-5 py-3.5 text-body text-ink-muted transition-colors hover:text-ink"
      >
        Open service log <ArrowUpRight className="size-3.5" />
      </button>
    </Panel>
  )
}
