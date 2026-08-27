import { Plus } from 'lucide-react';

import { useAuth } from '../auth/context';
import { can } from '../auth/permissions';
import { AppShell, PrimaryAction } from '../components/AppShell';
import { Panel } from '../components/Panel';
import { SidebarFooter } from '../components/SidebarFooter';

export default function ServiceLog() {
  const { principal } = useAuth();
  const me = principal?.kind === 'user' ? principal : null;

  // the operations manager reads the log and decides on it; recording
  // the work belongs to whoever did it
  const action = can(principal, 'logService') ? (
    <PrimaryAction icon={Plus}>Log service</PrimaryAction>
  ) : undefined;

  return (
    <AppShell
      title="Service log"
      subtitle="Everything the workshop has recorded"
      action={action}
      sidebarFooter={me ? <SidebarFooter user={me} /> : undefined}
    >
      <Panel title="Service history" subtitle="Newest first">
        <p className="px-5 pb-6 text-body text-ink-muted">Coming soon.</p>
      </Panel>
    </AppShell>
  );
}
