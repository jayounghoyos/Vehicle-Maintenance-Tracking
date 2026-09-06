import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Upload } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAuth } from '../auth/context';
import { can } from '../auth/permissions';
import { AppShell, PrimaryAction } from '../components/AppShell';
import { Panel } from '../components/Panel';
import { PANEL_LAYOUT } from '../components/panelLayout';
import { SidebarFooter } from '../components/SidebarFooter';
import { SidePanel } from '../components/SidePanel';
import { ImportVehicles } from '../components/ImportVehicles';
import { VehicleDetail } from '../components/VehicleDetail';
import { VehicleForm, type VehiclePatch } from '../components/VehicleForm';
import { VehicleTable } from '../components/VehicleTable';
import { api, type VehicleRow } from '../lib/api';
import { useToast } from '../toast/context';

/* One value rather than three booleans kept exclusive by hand, which is
 * what the team screen does and what leaves it one impossible state
 * away from showing two panels at once. */
type OpenPanel =
  | { kind: 'add' }
  | { kind: 'import' }
  | { kind: 'edit'; vehicle: VehicleRow }
  | { kind: 'detail'; vehicle: VehicleRow }
  | null;

export default function Vehicles() {
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [panel, setPanel] = useState<OpenPanel>(null);
  /* ?vehicle=<id> opens that one's detail: how the dashboard hands a
   * row over, and what makes a vehicle linkable. */
  const [searchParams, setSearchParams] = useSearchParams();
  const asked = Number(searchParams.get('vehicle')) || null;
  // which row is waiting on the API, so its own controls go quiet
  // instead of the whole table
  const [busyId, setBusyId] = useState<number | null>(null);
  const canManage = can(principal, 'manage_vehicles');

  const { data: vehicles, isPending } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get<VehicleRow[]>('/vehicles'),
  });

  /* Derived rather than set by an effect, so a click wins over the URL
   * and an unknown id simply opens nothing. */
  const fromUrl = asked ? vehicles?.find((vehicle) => vehicle.id === asked) : undefined;
  const open: OpenPanel =
    panel ?? (fromUrl ? { kind: 'detail', vehicle: fromUrl } : null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vehicles'] });
  const close = () => {
    setPanel(null);
    // or the URL would still be asking, and it would reopen
    if (asked) setSearchParams({}, { replace: true });
  };
  const failed = (err: unknown, fallback: string) =>
    toast.show(err instanceof Error ? err.message : fallback, 'failed');

  const create = useMutation({
    mutationFn: (patch: VehiclePatch) => api.post<VehicleRow>('/vehicles', patch),
    onSuccess: (vehicle) => {
      close();
      toast.show(`${vehicle.plate} is in the fleet`);
      void invalidate();
    },
    onError: (err: unknown) => failed(err, 'Could not add the vehicle'),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: VehiclePatch }) => {
      setBusyId(id);
      return api.patch<VehicleRow>(`/vehicles/${id}`, patch);
    },
    onSuccess: (vehicle) => {
      close();
      toast.show(`${vehicle.plate} was updated`);
      void invalidate();
    },
    onError: (err: unknown) => failed(err, 'Could not update the vehicle'),
    onSettled: () => setBusyId(null),
  });

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
      <div className={open ? PANEL_LAYOUT.open : PANEL_LAYOUT.closed}>
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
                  data-tour="vehicle-import"
                  onClick={() =>
                    setPanel(open?.kind === 'import' ? null : { kind: 'import' })
                  }
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-body text-ink-muted transition-colors hover:text-ink"
                >
                  <Upload className="size-4" strokeWidth={1.75} />
                  Import many
                </button>
                <PrimaryAction
                  icon={Plus}
                  size="panel"
                  data-tour="vehicle-add"
                  onClick={() => setPanel(open?.kind === 'add' ? null : { kind: 'add' })}
                >
                  Add vehicle
                </PrimaryAction>
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
              onOpen={(vehicle) => setPanel({ kind: 'detail', vehicle })}
              onEdit={(vehicle) => setPanel({ kind: 'edit', vehicle })}
              onRemove={(vehicle) => remove.mutate(vehicle)}
            />
          )}
        </Panel>

        {open?.kind === 'detail' && (
          <SidePanel
            title={open.vehicle.plate}
            subtitle="Profile, schedules and recent services"
            onClose={close}
          >
            <VehicleDetail id={open.vehicle.id} />
          </SidePanel>
        )}

        {open?.kind === 'import' && canManage && (
          <SidePanel
            title="Import many"
            subtitle="Straight from your spreadsheet"
            onClose={close}
          >
            <ImportVehicles onImported={invalidate} />
          </SidePanel>
        )}

        {open?.kind === 'add' && canManage && (
          <SidePanel
            title="Add vehicle"
            subtitle="One vehicle, registered now"
            onClose={close}
          >
            <VehicleForm
              pending={create.isPending}
              onSubmit={(patch) => create.mutate(patch)}
              onCancel={close}
            />
          </SidePanel>
        )}

        {open?.kind === 'edit' && canManage && (
          <SidePanel
            title="Edit vehicle"
            subtitle={`What the fleet knows about ${open.vehicle.plate}`}
            onClose={close}
          >
            <VehicleForm
              vehicle={open.vehicle}
              pending={update.isPending}
              onSubmit={(patch) => update.mutate({ id: open.vehicle.id, patch })}
              onCancel={close}
            />
          </SidePanel>
        )}
      </div>
    </AppShell>
  );
}
