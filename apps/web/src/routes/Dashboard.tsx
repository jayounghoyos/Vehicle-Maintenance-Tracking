import { AppShell } from '../components/AppShell'
import { FleetTable } from '../components/FleetTable'
import { NeedsAttention } from '../components/NeedsAttention'
import { RecentEvents } from '../components/RecentEvents'
import { SidebarFooter } from '../components/SidebarFooter'
import { StatTiles } from '../components/StatTiles'
import { dueItems, fleetCounts, fleetRows, recentEvents } from '../domain/dashboard'
import * as data from '../lib/fixtures'
import { greeting, longDate, roleLabel } from '../lib/format'

export default function Dashboard() {
  const user = data.currentUser
  const counts = fleetCounts(data)
  const attention = dueItems(data).filter((item) => item.state !== 'on_track')
  const events = recentEvents(data)
  const rows = fleetRows(data)
  const today = new Date()

  return (
    <AppShell
      title={`${greeting(today)}, ${user.fullName.split(' ')[0]}`}
      subtitle={`${roleLabel(user.role)} · ${longDate(today.toISOString())}`}
      sidebarFooter={<SidebarFooter user={user} overdueCount={counts.overdue} />}
    >
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
