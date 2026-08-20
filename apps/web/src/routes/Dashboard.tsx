import { AppShell } from '../components/AppShell'

export default function Dashboard() {
  return (
    <AppShell title="Dashboard" subtitle="Fleet maintenance at a glance">
      <div className="rounded-2xl border border-white/5 bg-panel p-8 text-body text-ink-muted">
        Panels land here next.
      </div>
    </AppShell>
  )
}
