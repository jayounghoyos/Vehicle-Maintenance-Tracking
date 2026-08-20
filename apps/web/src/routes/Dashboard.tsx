import { AppShell } from '../components/AppShell'
import { FleetTable } from '../components/FleetTable'
import { NeedsAttention } from '../components/NeedsAttention'
import { RecentEvents } from '../components/RecentEvents'
import { StatTiles } from '../components/StatTiles'
import { dueItems, fleetCounts, fleetRows, recentEvents } from '../domain/dashboard'
import * as data from '../lib/fixtures'

export default function Dashboard() {
  const counts = fleetCounts(data)
  const attention = dueItems(data).filter((item) => item.state !== 'on_track')
  const events = recentEvents(data)
  const rows = fleetRows(data)

  return (
    <AppShell title="Dashboard" subtitle="Fleet maintenance at a glance">
      <div className="space-y-5">
        <StatTiles counts={counts} />
        <div className="grid items-start gap-5 xl:grid-cols-[1.6fr_1fr]">
          <NeedsAttention items={attention} />
          <RecentEvents events={events} />
        </div>
        <FleetTable rows={rows} />
      </div>
    </AppShell>
  )
}
