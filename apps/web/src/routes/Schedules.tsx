import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '../auth/context';
import { can } from '../auth/permissions';
import { AppShell, PrimaryAction } from '../components/AppShell';
import { Panel } from '../components/Panel';
import { ScheduleModal, type SchedulePatch } from '../components/ScheduleModal';
import { ScheduleTable } from '../components/ScheduleTable';
import { SidebarFooter } from '../components/SidebarFooter';
import { api, fetchSchedules, type ScheduleItem, type VehicleRow } from '../lib/api';
import { useToast } from '../toast/context';

/* One value rather than two booleans kept exclusive by hand — the same
 * choice the vehicles screen makes. */
type OpenModal = { kind: 'add' } | { kind: 'edit'; schedule: ScheduleItem } | null;

export default function Schedules() {
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  // undefined is every vehicle; the select's own "All vehicles" option
  const [vehicleId, setVehicleId] = useState<number | undefined>(undefined);
  const [modal, setModal] = useState<OpenModal>(null);
  // which row is waiting on the API, so its own controls go quiet
  // instead of the whole table
  const [busyId, setBusyId] = useState<number | null>(null);
  const canManage = can(principal, 'manage_schedules');

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get<VehicleRow[]>('/vehicles'),
  });

  const { data: schedules, isPending } = useQuery({
    queryKey: ['schedules', vehicleId],
    queryFn: () => fetchSchedules(vehicleId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['schedules'] });
    void queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const close = () => setModal(null);
  const failed = (err: unknown, fallback: string) =>
    toast.show(err instanceof Error ? err.message : fallback, 'failed');

  const create = useMutation({
    mutationFn: (patch: SchedulePatch) => api.post<ScheduleItem>('/schedules', patch),
    onSuccess: (schedule) => {
      close();
      toast.show(`${schedule.task} schedule added for ${schedule.plate}`);
      invalidate();
    },
    onError: (err: unknown) => failed(err, 'Could not add the schedule'),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: SchedulePatch }) => {
      setBusyId(id);
      return api.patch<ScheduleItem>(`/schedules/${id}`, patch);
    },
    onSuccess: (schedule) => {
      close();
      toast.show(`${schedule.task} schedule updated`);
      invalidate();
    },
    onError: (err: unknown) => failed(err, 'Could not update the schedule'),
    onSettled: () => setBusyId(null),
  });

  const remove = useMutation({
    mutationFn: (schedule: ScheduleItem) => {
      setBusyId(schedule.id);
      return api.del(`/schedules/${schedule.id}`);
    },
    onSuccess: (_result, schedule) => {
      toast.show(`${schedule.task} schedule removed`);
      invalidate();
    },
    onError: (err: unknown) => failed(err, 'Could not delete the schedule'),
    onSettled: () => setBusyId(null),
  });

  const me = principal?.kind === 'user' ? principal : null;
  const shown = schedules ?? [];

  return (
    <AppShell
      title="Maintenance schedules"
      subtitle="The rules that decide when a vehicle is due"
      sidebarFooter={me ? <SidebarFooter user={me} /> : undefined}
    >
      <div className="space-y-5">
        <Panel
          title={
            <span className="flex items-center gap-2">
              All schedules
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[12px] font-semibold text-ink-muted">
                {shown.length} {shown.length === 1 ? 'rule' : 'rules'}
              </span>
            </span>
          }
          action={
            <div className="flex items-center gap-2">
              <select
                data-tour="schedules-vehicle-filter"
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
              {canManage && (
                <PrimaryAction
                  icon={Plus}
                  size="panel"
                  data-tour="schedules-add"
                  onClick={() => setModal({ kind: 'add' })}
                >
                  Add schedule
                </PrimaryAction>
              )}
            </div>
          }
        >
          {isPending ? (
            <p className="px-5 pb-6 text-body text-ink-muted">
              Loading the maintenance schedule…
            </p>
          ) : (
            <ScheduleTable
              schedules={shown}
              canManage={canManage}
              busyId={busyId}
              onEdit={(schedule) => setModal({ kind: 'edit', schedule })}
              onRemove={(schedule) => remove.mutate(schedule)}
            />
          )}
        </Panel>
      </div>

      <ScheduleModal
        isOpen={modal?.kind === 'add' || modal?.kind === 'edit'}
        onClose={close}
        schedule={modal?.kind === 'edit' ? modal.schedule : undefined}
        initialVehicleId={vehicleId}
        pending={create.isPending || update.isPending}
        onSubmit={(patch) => {
          if (modal?.kind === 'edit') {
            update.mutate({ id: modal.schedule.id, patch });
          } else {
            create.mutate(patch);
          }
        }}
      />
    </AppShell>
  );
}
