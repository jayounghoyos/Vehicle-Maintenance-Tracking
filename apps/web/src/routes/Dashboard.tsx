import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { useAuth } from '../auth/context';
import { can } from '../auth/permissions';
import { AppShell, PrimaryAction } from '../components/AppShell';
import { FleetTable } from '../components/FleetTable';
import { NeedsAttention } from '../components/NeedsAttention';
import { RecentEvents } from '../components/RecentEvents';
import { SidebarFooter } from '../components/SidebarFooter';
import { StatTiles } from '../components/StatTiles';
import { fetchDashboard } from '../lib/api';
import { greeting, longDate } from '../lib/format';

export default function Dashboard() {
  const { principal } = useAuth();
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });
  const today = new Date();

  // the operations manager reads the fleet and decides on it; recording
  // the work belongs to whoever did it
  const action = can(principal, 'log_service') ? (
    <PrimaryAction icon={Plus}>Log service</PrimaryAction>
  ) : undefined;

  if (isPending) {
    return (
      <AppShell
        title="Dashboard"
        subtitle={longDate(today.toISOString())}
        action={action}
      >
        <div className="rounded-2xl border border-white/5 bg-panel p-8 text-body text-ink-muted">
          Loading the fleet…
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell
        title="Dashboard"
        subtitle={longDate(today.toISOString())}
        action={action}
      >
        <div className="rounded-2xl bg-overdue/15 p-8">
          <p className="font-semibold text-overdue">The fleet could not be loaded.</p>
          <p className="mt-1.5 text-body text-overdue/70">
            {error instanceof Error ? error.message : 'Unknown error'} — check that the
            API is running and the database has been seeded.
          </p>
        </div>
      </AppShell>
    );
  }

  const { user, counts, attention, recentEvents, fleet } = data;

  return (
    <AppShell
      title={`${greeting(today)}, ${user.fullName.split(' ')[0]}`}
      subtitle={`${user.roleName} · ${longDate(today.toISOString())}`}
      action={action}
      sidebarFooter={<SidebarFooter user={user} overdueCount={counts.overdue} />}
    >
      <div className="space-y-5">
        <StatTiles counts={counts} />
        <div className="grid items-start gap-5 xl:grid-cols-[1.6fr_1fr]">
          <NeedsAttention items={attention} />
          <RecentEvents events={recentEvents} />
        </div>
        <FleetTable rows={fleet} />
      </div>
    </AppShell>
  );
}
