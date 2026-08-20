import { AppShell } from '../components/AppShell'
import { NeedsAttention } from '../components/NeedsAttention'
import { StatTiles } from '../components/StatTiles'
import { dueItems, fleetCounts } from '../domain/dashboard'
import * as data from '../lib/fixtures'

export default function Dashboard() {
  const counts = fleetCounts(data)
  // the panel is for what needs doing, so on-track schedules stay out
  const attention = dueItems(data).filter((item) => item.state !== 'on_track')

  return (
    <AppShell title="Dashboard" subtitle="Fleet maintenance at a glance">
      <div className="space-y-5">
        <StatTiles counts={counts} />
        <NeedsAttention items={attention} />
      </div>
    </AppShell>
  )
}
