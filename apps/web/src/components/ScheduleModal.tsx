import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CalendarClock, Loader2, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  api,
  createScheduleTask,
  fetchScheduleTasks,
  type ScheduleItem,
  type VehicleRow,
} from '../lib/api';

export type SchedulePatch = {
  vehicleId: number;
  taskId: number;
  intervalDays: number | null;
  intervalKm: number | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** absent when adding a new plan item */
  schedule?: ScheduleItem;
  pending: boolean;
  onSubmit: (patch: SchedulePatch) => void;
  /** preselects the vehicle when opened from a filtered table; ignored
   *  once a schedule to edit is passed */
  initialVehicleId?: number;
};

export function ScheduleModal(props: Props) {
  if (!props.isOpen) return null;
  return <ScheduleDialog {...props} />;
}

function ScheduleDialog({
  onClose,
  schedule,
  pending,
  onSubmit,
  initialVehicleId,
}: Omit<Props, 'isOpen'>) {
  const queryClient = useQueryClient();

  const [vehicleId, setVehicleId] = useState<number | undefined>(
    schedule?.vehicleId ?? initialVehicleId,
  );
  const [taskId, setTaskId] = useState<number | undefined>(schedule?.taskId);
  const [customTask, setCustomTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [intervalDays, setIntervalDays] = useState(
    schedule?.intervalDays != null ? String(schedule.intervalDays) : '',
  );
  const [intervalKm, setIntervalKm] = useState(
    schedule?.intervalKm != null ? String(schedule.intervalKm) : '',
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get<VehicleRow[]>('/vehicles'),
  });

  const { data: tasks } = useQuery({
    queryKey: ['schedule-tasks'],
    queryFn: fetchScheduleTasks,
  });

  const addTask = useMutation({
    mutationFn: (name: string) => createScheduleTask(name),
    onSuccess: (task) => {
      void queryClient.invalidateQueries({ queryKey: ['schedule-tasks'] });
      setTaskId(task.id);
      setCustomTask(false);
      setNewTaskName('');
    },
    onError: (err: unknown) => {
      setErrorMsg(err instanceof Error ? err.message : 'Could not add the task');
    },
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!vehicleId) {
      setErrorMsg('Please select a vehicle');
      return;
    }
    if (!taskId) {
      setErrorMsg('Please choose or add a task');
      return;
    }

    const days = intervalDays.trim() === '' ? null : Number(intervalDays);
    const km = intervalKm.trim() === '' ? null : Number(intervalKm);
    if (days !== null && (!Number.isInteger(days) || days < 1)) {
      setErrorMsg('Interval in days must be a whole number of at least 1');
      return;
    }
    if (km !== null && (!Number.isInteger(km) || km < 1)) {
      setErrorMsg('Interval in kilometres must be a whole number of at least 1');
      return;
    }
    // the entity's own rule: at least one of the two
    if (days === null && km === null) {
      setErrorMsg('Set an interval in days, in kilometres, or both');
      return;
    }

    onSubmit({ vehicleId, taskId, intervalDays: days, intervalKm: km });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-panel text-ink shadow-2xl">
        <header className="sticky top-0 z-20 flex items-start justify-between border-b border-white/5 bg-panel/95 px-6 py-4.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-lime/15 text-lime">
              <CalendarClock className="size-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-section font-semibold">
                {schedule ? 'Edit maintenance plan' : 'Add maintenance plan'}
              </h2>
              <p className="text-body text-ink-muted">
                A task that repeats, every N days, every N kilometres, or both
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {errorMsg && (
            <div className="flex items-start gap-3 rounded-xl border border-overdue/20 bg-overdue/10 p-4 text-overdue">
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
              <div className="text-body font-medium">{errorMsg}</div>
            </div>
          )}

          <div>
            <label className="block text-body font-medium text-ink">
              Vehicle <span className="text-overdue">*</span>
            </label>
            <select
              value={vehicleId ?? ''}
              onChange={(e) =>
                setVehicleId(e.target.value === '' ? undefined : Number(e.target.value))
              }
              disabled={!!schedule}
              required
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-page px-4 py-2.5 text-body text-ink focus:border-lime/40 focus:outline-none disabled:opacity-50"
            >
              <option value="" disabled className="bg-panel text-ink-muted">
                Select vehicle…
              </option>
              {(vehicles ?? []).map((v) => (
                <option key={v.id} value={v.id} className="bg-panel">
                  {v.plate} — {v.make} {v.model}
                </option>
              ))}
            </select>
            {schedule && (
              <p className="mt-1 text-[12px] text-ink-muted">
                Delete and re-add the plan to move it to a different vehicle.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-body font-medium text-ink">
                Task <span className="text-overdue">*</span>
              </label>
              <button
                type="button"
                onClick={() => setCustomTask(!customTask)}
                className="text-[12px] text-lime hover:underline"
              >
                {customTask ? 'Select from catalog' : '+ New task'}
              </button>
            </div>

            {customTask ? (
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="e.g. Brake pad replacement"
                  className="w-full rounded-xl border border-white/10 bg-page px-4 py-2.5 text-body text-ink focus:border-lime/40 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!newTaskName.trim() || addTask.isPending}
                  onClick={() => addTask.mutate(newTaskName.trim())}
                  className="flex items-center gap-1.5 rounded-xl bg-lime px-3.5 py-2 text-body font-semibold text-on-accent disabled:opacity-50"
                >
                  {addTask.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Add
                </button>
              </div>
            ) : (
              <select
                value={taskId ?? ''}
                onChange={(e) =>
                  setTaskId(e.target.value === '' ? undefined : Number(e.target.value))
                }
                required
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-page px-4 py-2.5 text-body text-ink focus:border-lime/40 focus:outline-none"
              >
                <option value="" disabled className="bg-panel text-ink-muted">
                  Choose task…
                </option>
                {(tasks ?? []).map((t) => (
                  <option key={t.id} value={t.id} className="bg-panel">
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-body font-medium text-ink">Every (days)</label>
              <input
                type="number"
                min="1"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                placeholder="180"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-page px-4 py-2.5 text-body text-ink focus:border-lime/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-body font-medium text-ink">Every (km)</label>
              <input
                type="number"
                min="1"
                value={intervalKm}
                onChange={(e) => setIntervalKm(e.target.value)}
                placeholder="10000"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-page px-4 py-2.5 text-body text-ink focus:border-lime/40 focus:outline-none"
              />
            </div>
          </div>
          <p className="-mt-1 text-[12px] text-ink-muted">
            At least one interval is required.
          </p>

          <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-body font-medium text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 rounded-xl bg-lime px-5 py-2.5 text-body font-semibold text-page transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? 'Saving…' : schedule ? 'Save changes' : 'Add plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
