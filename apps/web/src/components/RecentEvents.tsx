import { ArrowUpRight } from 'lucide-react'

import type { DashboardResponse } from '../lib/api'
import { relativeDay } from '../lib/format'
import { taskIcon } from '../lib/taskIcon'
import { Panel } from './Panel'

export function RecentEvents({ events }: { events: DashboardResponse['recentEvents'] }) {
  return (
    <Panel title="Recent service events" subtitle="Logged by the workshop">
      {events.length === 0 ? (
        <p className="flex-1 border-t border-white/5 px-5 py-6 text-body text-ink-muted">
          Nothing logged yet.
        </p>
      ) : (
        <ul className="flex-1 border-t border-white/5 px-5 py-5">
          {events.map(({ id, task, plate, recorder, performedAt, type }, index) => {
            const Icon = taskIcon(task)
            const last = index === events.length - 1
            // corrective work was unplanned, and that is the one thing
            // worth telling apart here
            const tone =
              type === 'corrective'
                ? 'bg-overdue/15 text-overdue'
                : 'bg-on-track/15 text-on-track'

            return (
              <li key={id} className="flex gap-3.5">
                {/* the icon column doubles as the timeline: the rule
                    stretches to fill whatever height the row needs, so
                    the dots stay connected however long the text runs */}
                <div className="flex flex-col items-center">
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-full ${tone}`}
                  >
                    <Icon className="size-4" strokeWidth={2} />
                  </span>
                  {!last && <span aria-hidden className="w-px flex-1 bg-white/10" />}
                </div>

                <div className={`min-w-0 pt-1 ${last ? '' : 'pb-6'}`}>
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
            )
          })}
        </ul>
      )}

      <button
        type="button"
        className="flex items-center justify-center gap-2 border-t border-white/5 px-5 py-3.5 text-body text-ink-muted transition-colors hover:text-ink"
      >
        Open service log <ArrowUpRight className="size-3.5" />
      </button>
    </Panel>
  )
}
