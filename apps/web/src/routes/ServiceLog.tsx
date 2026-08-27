import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { useAuth } from '../auth/context';
import { can } from '../auth/permissions';
import { AppShell, PrimaryAction } from '../components/AppShell';
import { Panel } from '../components/Panel';
import { ServiceLogTable } from '../components/ServiceLogTable';
import { SidebarFooter } from '../components/SidebarFooter';
import { fetchServiceLog } from '../lib/api';

export default function ServiceLog() {
  const { principal } = useAuth();
  const me = principal?.kind === 'user' ? principal : null;

  const { data: events, isPending } = useQuery({
    queryKey: ['service-events'],
    queryFn: () => fetchServiceLog(),
  });

  // the operations manager reads the log and decides on it; recording
  // the work belongs to whoever did it
  const action = can(principal, 'logService') ? (
    <PrimaryAction icon={Plus}>Log service</PrimaryAction>
  ) : undefined;

  const shown = events ?? [];

  return (
    <AppShell
      title="Service log"
      subtitle="Everything the workshop has recorded"
      action={action}
      sidebarFooter={me ? <SidebarFooter user={me} /> : undefined}
    >
      <Panel
        title="Service history"
        subtitle={
          isPending
            ? 'Loading…'
            : `${shown.length} ${shown.length === 1 ? 'event' : 'events'} logged, newest first`
        }
      >
        {isPending ? (
          <p className="px-5 pb-6 text-body text-ink-muted">Loading the service log…</p>
        ) : (
          <ServiceLogTable events={shown} />
        )}
      </Panel>
    </AppShell>
  );
}
