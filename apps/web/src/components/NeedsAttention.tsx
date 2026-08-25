import { ArrowRight, ChevronRight } from 'lucide-react';

import { dueLabel } from '../domain/maintenance';
import type { DashboardResponse } from '../lib/api';
import { taskIcon } from '../lib/taskIcon';
import { Panel } from './Panel';
import { StatusChip } from './StatusChip';

const TINT: Record<string, string> = {
  overdue: 'bg-overdue/15 text-overdue',
  due_soon: 'bg-due-soon/15 text-due-soon',
  on_track: 'bg-on-track/15 text-on-track',
};

const DUE_TEXT: Record<string, string> = {
  overdue: 'text-overdue',
  due_soon: 'text-due-soon',
  on_track: 'text-ink-muted',
};

export function NeedsAttention({ items }: { items: DashboardResponse['attention'] }) {
  return (
    <Panel
      data-tour="needs-attention"
      title="Needs attention"
      subtitle="Maintenance overdue or coming up"
      action={
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-body text-ink-muted transition-colors hover:text-ink"
        >
          View all <ArrowRight className="size-3.5" />
        </button>
      }
    >
      {items.length === 0 ? (
        <p className="px-5 pb-6 text-body text-ink-muted">
          Nothing overdue or due soon. The fleet is on track.
        </p>
      ) : (
        <ul className="divide-y divide-white/5 border-t border-white/5">
          {items.map(({ scheduleId, plate, make, model, task, nextDueDate, state }) => {
            const Icon = taskIcon(task);
            return (
              <li
                key={scheduleId}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
              >
                {/* the square is tinted by state, so it reports status;
                  the glyph comes from the task name */}
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${TINT[state]}`}
                >
                  <Icon className="size-4" strokeWidth={2} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate">
                    <span className="font-semibold">{plate}</span>{' '}
                    <span className="text-ink-muted">
                      {make} {model}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-body text-ink-muted">
                    {task}
                    {nextDueDate && (
                      <>
                        {' · '}
                        <span className={DUE_TEXT[state]}>{dueLabel(nextDueDate)}</span>
                      </>
                    )}
                  </p>
                </div>

                <StatusChip state={state} />
                <ChevronRight className="size-4 shrink-0 text-ink-muted" />
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
