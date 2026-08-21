import type { DashboardResponse } from '../lib/api';
import { odometer, shortDate } from '../lib/format';
import { Panel } from './Panel';
import { StatusChip } from './StatusChip';

const TH = 'px-5 py-3 text-table-label font-semibold text-ink-muted uppercase';

export function FleetTable({ rows }: { rows: DashboardResponse['fleet'] }) {
  return (
    <Panel
      title="Fleet"
      action={
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-body text-ink-muted">
          {rows.length} {rows.length === 1 ? 'vehicle' : 'vehicles'}
        </span>
      }
    >
      <div className="overflow-x-auto border-t border-white/5">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-white/5">
              <th className={TH}>Plate</th>
              <th className={TH}>Vehicle</th>
              <th className={`${TH} text-right`}>Odometer (km)</th>
              <th className={TH}>Next service</th>
              <th className={TH}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map(
              ({
                vehicleId,
                plate,
                make,
                model,
                year,
                odometerKm,
                nextTask,
                nextDueDate,
                state,
              }) => (
                <tr key={vehicleId} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-4 font-semibold">{plate}</td>
                  <td className="px-5 py-4">
                    {make} {model}
                    {/* the mockup also prints a body type here — vehicle_models
                      has make and name only, so the year stands alone */}
                    {year && (
                      <span className="mt-0.5 block text-body text-ink-muted">
                        {year}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {odometer(odometerKm)}
                  </td>
                  <td className="px-5 py-4">
                    {nextTask ? (
                      <>
                        {nextTask}
                        {nextDueDate && (
                          <span className="text-ink-muted">
                            {' '}
                            · {shortDate(nextDueDate)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-ink-muted">No schedule</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusChip state={state} />
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
