import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Upload } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '../auth/context';
import { can } from '../auth/permissions';
import { AppShell } from '../components/AppShell';
import { Panel } from '../components/Panel';
import { SidebarFooter } from '../components/SidebarFooter';
import { VehicleTable } from '../components/VehicleTable';
import { api, type VehicleRow } from '../lib/api';
import { useToast } from '../toast/context';

export default function Vehicles() {
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  // which row is waiting on the API, so its own controls go quiet
  // instead of the whole table
  const [busyId, setBusyId] = useState<number | null>(null);
  const canManage = can(principal, 'manageVehicles');

  const { data: vehicles, isPending } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get<VehicleRow[]>('/vehicles'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vehicles'] });
  const failed = (err: unknown, fallback: string) =>
    toast.show(err instanceof Error ? err.message : fallback, 'failed');

  const remove = useMutation({
    mutationFn: (vehicle: VehicleRow) => {
      setBusyId(vehicle.id);
      return api.del(`/vehicles/${vehicle.id}`);
    },
    onSuccess: (_result, vehicle) => {
      toast.show(`${vehicle.plate} was deleted`);
      void invalidate();
    },
    onError: (err: unknown) => failed(err, 'Could not delete the vehicle'),
    onSettled: () => setBusyId(null),
  });

  const me = principal?.kind === 'user' ? principal : null;
  const fleet = vehicles ?? [];

  return (
    <AppShell
      title="Vehicles"
      subtitle={
        isPending
          ? 'Loading the fleet…'
          : `${fleet.length} ${fleet.length === 1 ? 'vehicle' : 'vehicles'} in the fleet`
      }
      sidebarFooter={me ? <SidebarFooter user={me} /> : undefined}
    >
      <div className="space-y-5">
        <Panel
          title="Fleet"
          subtitle={
            canManage
              ? 'Every vehicle this organization runs'
              : 'Only the fleet coordinator can add or change vehicles'
          }
          action={
            canManage ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-body text-ink-muted transition-colors hover:text-ink"
                >
                  <Upload className="size-4" strokeWidth={1.75} />
                  Import many
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl bg-lime px-3.5 py-2 text-body font-semibold text-page transition-opacity hover:opacity-90"
                >
                  <Plus className="size-4" strokeWidth={2.5} />
                  Add vehicle
                </button>
              </div>
            ) : undefined
          }
        >
          {isPending ? (
            <p className="px-5 pb-6 text-body text-ink-muted">Loading the fleet…</p>
          ) : (
            <VehicleTable
              vehicles={fleet}
              canManage={canManage}
              busyId={busyId}
              onOpen={() => undefined}
              onEdit={() => undefined}
              onRemove={(vehicle) => remove.mutate(vehicle)}
            />
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
