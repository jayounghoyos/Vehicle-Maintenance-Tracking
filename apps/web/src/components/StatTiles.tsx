import { AlertTriangle, Timer, Truck, Wrench } from 'lucide-react'

import type { FleetCounts } from '../domain/dashboard'

type Tile = {
  label: string
  value: number
  caption: string
  icon: typeof Truck
  /** status hue, or none — the manual forbids colour that is not reporting state */
  tone?: 'overdue' | 'due-soon'
}

export function StatTiles({ counts }: { counts: FleetCounts }) {
  const tiles: Tile[] = [
    { label: 'Vehicles', value: counts.active, caption: 'Active in fleet', icon: Truck },
    { label: 'Overdue', value: counts.overdue, caption: 'Needs service now', icon: AlertTriangle, tone: 'overdue' },
    { label: 'Due soon', value: counts.dueSoon, caption: 'Within 14 days', icon: Timer, tone: 'due-soon' },
    { label: 'In shop', value: counts.inShop, caption: 'Under repair', icon: Wrench },
  ]

  return (
    <section className="grid grid-cols-1 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/5 bg-panel sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
      {tiles.map(({ label, value, caption, icon: Icon, tone }) => {
        const hue =
          tone === 'overdue' ? 'text-overdue' : tone === 'due-soon' ? 'text-due-soon' : ''
        return (
          <div key={label} className="p-5">
            <p className="flex items-center gap-2 text-table-label font-semibold text-ink-muted uppercase">
              <Icon className={`size-4 ${hue || 'text-lime'}`} strokeWidth={2} />
              {label}
            </p>
            <p className="mt-3 flex items-baseline gap-3">
              <span className={`text-[34px] leading-none font-bold ${hue}`}>{value}</span>
              <span className="text-body text-ink-muted">{caption}</span>
            </p>
          </div>
        )
      })}
    </section>
  )
}
