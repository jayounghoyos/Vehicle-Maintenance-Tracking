import { AppShell } from '../components/AppShell'
import { StatTiles } from '../components/StatTiles'
import { fleetCounts } from '../domain/dashboard'
import * as data from '../lib/fixtures'

export default function Dashboard() {
  const counts = fleetCounts(data)

  return (
    <AppShell title="Dashboard" subtitle="Fleet maintenance at a glance">
      <StatTiles counts={counts} />
    </AppShell>
  )
}
