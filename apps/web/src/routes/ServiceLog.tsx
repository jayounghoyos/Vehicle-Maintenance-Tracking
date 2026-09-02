import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '../auth/context';
import { can } from '../auth/permissions';
import { AppShell, PrimaryAction } from '../components/AppShell';
import { LogServiceModal } from '../components/LogServiceModal';
import { Panel } from '../components/Panel';
import { ServiceLogTable } from '../components/ServiceLogTable';
import { SidebarFooter } from '../components/SidebarFooter';
import { api, fetchServiceLog, type VehicleRow } from '../lib/api';

export default function ServiceLog() {
  const { principal } = useAuth();
  const me = principal?.kind === 'user' ? principal : null;
  // undefined is every vehicle; the select's own "All vehicles" option
  const [vehicleId, setVehicleId] = useState<number | undefined>(undefined);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get<VehicleRow[]>('/vehicles'),
  });

  const { data: events, isPending } = useQuery({
    queryKey: ['service-events', vehicleId],
    queryFn: () => fetchServiceLog(vehicleId),
  });

  // the operations manager reads the log and decides on it; recording
  // the work belongs to whoever did it
  const action = can(principal, 'log_service') ? (
    <PrimaryAction icon={Plus} onClick={() => setIsLogModalOpen(true)}>
      Log service
    </PrimaryAction>
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
        action={
          <select
            value={vehicleId ?? ''}
            onChange={(event) =>
              setVehicleId(
                event.target.value === '' ? undefined : Number(event.target.value),
              )
            }
            className="rounded-xl border border-white/10 bg-page/60 px-3.5 py-2 text-body focus:border-lime/40 focus:outline-none"
          >
            <option value="" className="bg-panel">
              All vehicles
            </option>
            {(vehicles ?? []).map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id} className="bg-panel">
                {vehicle.plate}
              </option>
            ))}
          </select>
        }
      >
        {isPending ? (
          <p className="px-5 pb-6 text-body text-ink-muted">Loading the service log…</p>
        ) : (
          <ServiceLogTable events={shown} />
        )}
      </Panel>

      <LogServiceModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        initialVehicleId={vehicleId}
      />
    </AppShell>
  );
}
