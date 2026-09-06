import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/context';
import { can } from '../auth/permissions';
import { AppShell, PrimaryAction } from '../components/AppShell';
import { FleetTable } from '../components/FleetTable';
import { LogServiceModal } from '../components/LogServiceModal';
import { NeedsAttention } from '../components/NeedsAttention';
import { OverdueBanner } from '../components/OverdueBanner';
import { RecentEvents } from '../components/RecentEvents';
import { SidebarFooter } from '../components/SidebarFooter';
import { StatTiles } from '../components/StatTiles';
import { fetchDashboard } from '../lib/api';
import { greeting, longDate } from '../lib/format';

export default function Dashboard() {
  const { principal } = useAuth();
  const navigate = useNavigate();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  // which vehicle the form opens on, when the click named one
  const [logVehicleId, setLogVehicleId] = useState<number | undefined>(undefined);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });
  const today = new Date();

  // the operations manager reads the fleet and decides on it; recording
  // the work belongs to whoever did it
  const canLog = can(principal, 'log_service');
  // the fleet table hands a row to the screen that owns vehicles, which
  // is closed to a role without the permission to open it
  const openVehicle = can(principal, 'view_vehicles')
    ? (vehicleId: number) => navigate(`/vehicles?vehicle=${vehicleId}`)
    : undefined;
  // and the same for the log, which has a permission of its own
  const openLogbook = can(principal, 'view_service_log')
    ? (vehicleId: number) => navigate(`/service-log?vehicle=${vehicleId}`)
    : undefined;

  // one way in, two ways to reach it: the header button starts blank, a
  // row starts on the vehicle it names
  const openLog = (vehicleId?: number) => {
    setLogVehicleId(vehicleId);
    setIsLogModalOpen(true);
  };

  const action = canLog ? (
    <PrimaryAction icon={Plus} onClick={() => openLog()}>
      Log service
    </PrimaryAction>
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
      sidebarFooter={<SidebarFooter user={user} />}
    >
      <div className="space-y-5">
        <StatTiles counts={counts} />
        <OverdueBanner count={counts.overdue} />
        <div className="grid items-start gap-5 xl:grid-cols-[1.6fr_1fr]">
          <NeedsAttention items={attention} onSelect={canLog ? openLog : undefined} />
          <RecentEvents events={recentEvents} onOpen={openLogbook} />
        </div>
        <FleetTable rows={fleet} onOpen={openVehicle} />
      </div>

      <LogServiceModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        initialVehicleId={logVehicleId}
      />
    </AppShell>
  );
}
