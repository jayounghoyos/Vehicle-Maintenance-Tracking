import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Gauge,
  Loader2,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '../auth/context';
import {
  api,
  fetchTasks,
  recordServiceEvent,
  type RecordServicePayload,
  type VehicleDetail,
  type VehicleRow,
} from '../lib/api';
import { odometer, shortDate } from '../lib/format';
import { useToast } from '../toast/context';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialVehicleId?: number;
};

export function LogServiceModal({ isOpen, onClose, initialVehicleId }: Props) {
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [vehicleId, setVehicleId] = useState<number | undefined>(initialVehicleId);
  const [scheduleId, setScheduleId] = useState<number | undefined>(undefined);
  const [taskName, setTaskName] = useState<string>('');
  const [customTask, setCustomTask] = useState<boolean>(false);
  const [type, setType] = useState<'preventive' | 'corrective'>('preventive');
  const [performedAt, setPerformedAt] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [odometerKm, setOdometerKm] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [photos, setPhotos] = useState<{ id: string; preview: string; dataUrl: string }[]>(
    [],
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load vehicles
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get<VehicleRow[]>('/vehicles'),
    enabled: isOpen,
  });

  // Load organization tasks
  const { data: taskOptions } = useQuery({
    queryKey: ['maintenance-tasks'],
    queryFn: fetchTasks,
    enabled: isOpen,
  });

  // Load selected vehicle details to see active schedules & odometer
  const { data: selectedVehicle } = useQuery({
    queryKey: ['vehicles', vehicleId],
    queryFn: () => api.get<VehicleDetail>(`/vehicles/${vehicleId}`),
    enabled: isOpen && vehicleId !== undefined,
  });

  // Sync initialVehicleId if changed
  useEffect(() => {
    if (initialVehicleId !== undefined) {
      setVehicleId(initialVehicleId);
    }
  }, [initialVehicleId]);

  // When selected vehicle loads, auto-suggest odometer if empty
  useEffect(() => {
    if (selectedVehicle && odometerKm === '') {
      setOdometerKm(String(selectedVehicle.odometerKm || ''));
    }
  }, [selectedVehicle]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // When schedule is chosen, automatically set task name and preventive type
  const handleScheduleChange = (val: string) => {
    if (val === '' || val === 'none') {
      setScheduleId(undefined);
      return;
    }
    const schedId = Number(val);
    setScheduleId(schedId);
    const sched = selectedVehicle?.schedules.find((s) => s.id === schedId);
    if (sched) {
      setTaskName(sched.task);
      setCustomTask(false);
      setType('preventive');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPhotos((prev) => [
          ...prev,
          {
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            preview: dataUrl,
            dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const mutation = useMutation({
    mutationFn: (payload: RecordServicePayload) => recordServiceEvent(payload),
    onSuccess: (saved) => {
      toast.show(`Service recorded for ${saved.plate} (${saved.task})`, 'done');
      void queryClient.invalidateQueries({ queryKey: ['service-events'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      if (vehicleId) {
        void queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId] });
      }
      onClose();
      // Reset form
      setPhotos([]);
      setNotes('');
      setErrorMsg(null);
    },
    onError: (err: unknown) => {
      setErrorMsg(
        err instanceof Error ? err.message : 'Could not record service event',
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!vehicleId) {
      setErrorMsg('Please select a vehicle');
      return;
    }

    const finalTask = taskName.trim();
    if (!finalTask) {
      setErrorMsg('Please enter or select a task name');
      return;
    }

    const odo = odometerKm.trim() === '' ? null : Number(odometerKm);
    if (odo !== null && isNaN(odo)) {
      setErrorMsg('Odometer must be a valid number');
      return;
    }

    mutation.mutate({
      vehicleId,
      scheduleId: scheduleId ?? null,
      taskName: finalTask,
      type,
      performedAt,
      odometerKm: odo,
      notes: notes.trim() === '' ? null : notes.trim(),
      photos: photos.map((p) => p.dataUrl),
    });
  };

  if (!isOpen) return null;

  const currentKm = selectedVehicle?.odometerKm ?? 0;
  const newKm = odometerKm.trim() !== '' ? Number(odometerKm) : null;
  const willUpdateOdo = newKm !== null && newKm > currentKm;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-panel text-ink shadow-2xl">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-start justify-between border-b border-white/5 bg-panel/95 px-6 py-4.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-lime/15 text-lime">
              <Wrench className="size-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-section font-semibold">Record service or breakdown</h2>
              <p className="text-body text-ink-muted">
                Capture service details, link schedules, and attach photos
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {errorMsg && (
            <div className="flex items-start gap-3 rounded-xl border border-overdue/20 bg-overdue/10 p-4 text-overdue">
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
              <div className="text-body font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Vehicle Selector */}
          <div>
            <label className="block text-body font-medium text-ink">
              Vehicle <span className="text-overdue">*</span>
            </label>
            <div className="relative mt-1.5">
              <select
                value={vehicleId ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : Number(e.target.value);
                  setVehicleId(val);
                  setScheduleId(undefined);
                }}
                required
                className="w-full rounded-xl border border-white/10 bg-page px-4 py-2.5 text-body text-ink focus:border-lime/40 focus:outline-none"
              >
                <option value="" disabled className="bg-panel text-ink-muted">
                  Select vehicle…
                </option>
                {(vehicles ?? []).map((v) => (
                  <option key={v.id} value={v.id} className="bg-panel">
                    {v.plate} — {v.make} {v.model} ({odometer(v.odometerKm)} km)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Link to Schedule Item (if vehicle has schedules) */}
          {selectedVehicle && selectedVehicle.schedules.length > 0 && (
            <div className="rounded-xl border border-white/5 bg-page/40 p-4">
              <div className="flex items-center justify-between">
                <label className="text-body font-medium text-ink">
                  Fulfills scheduled item
                </label>
                <span className="text-[12px] text-ink-muted">Optional</span>
              </div>
              <p className="mt-0.5 text-body text-ink-muted">
                Logging against a schedule will automatically recalculate its next due
                date/km.
              </p>
              <select
                value={scheduleId ?? ''}
                onChange={(e) => handleScheduleChange(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-page px-3.5 py-2 text-body text-ink focus:border-lime/40 focus:outline-none"
              >
                <option value="" className="bg-panel">
                  None / Unplanned breakdown
                </option>
                {selectedVehicle.schedules.map((s) => (
                  <option key={s.id} value={s.id} className="bg-panel">
                    {s.task}
                    {s.nextDueDate ? ` (due ${shortDate(s.nextDueDate)})` : ''}
                    {s.intervalDays ? ` — every ${s.intervalDays} days` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Task Name & Type */}
          <div className="grid gap-4 sm:grid-cols-2">
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
                  {customTask ? 'Select from catalog' : '+ Custom task'}
                </button>
              </div>

              {customTask ? (
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="e.g. Brake pad replacement"
                  required
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-page px-4 py-2.5 text-body text-ink focus:border-lime/40 focus:outline-none"
                />
              ) : (
                <select
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-page px-4 py-2.5 text-body text-ink focus:border-lime/40 focus:outline-none"
                >
                  <option value="" disabled className="bg-panel text-ink-muted">
                    Choose task…
                  </option>
                  {(taskOptions ?? []).map((t) => (
                    <option key={t.id} value={t.name} className="bg-panel">
                      {t.name}
                    </option>
                  ))}
                  {taskName &&
                    !(taskOptions ?? []).some((t) => t.name === taskName) && (
                      <option value={taskName} className="bg-panel">
                        {taskName}
                      </option>
                    )}
                </select>
              )}
            </div>

            {/* Type Toggle */}
            <div>
              <label className="block text-body font-medium text-ink">
                Maintenance type
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('preventive')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-body font-medium transition-colors ${
                    type === 'preventive'
                      ? 'border-on-track/50 bg-on-track/15 text-on-track'
                      : 'border-white/10 bg-page text-ink-muted hover:text-ink'
                  }`}
                >
                  <CheckCircle2 className="size-4" />
                  Preventive
                </button>
                <button
                  type="button"
                  onClick={() => setType('corrective')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-body font-medium transition-colors ${
                    type === 'corrective'
                      ? 'border-overdue/50 bg-overdue/15 text-overdue'
                      : 'border-white/10 bg-page text-ink-muted hover:text-ink'
                  }`}
                >
                  <AlertCircle className="size-4" />
                  Corrective (Breakdown)
                </button>
              </div>
            </div>
          </div>

          {/* Date & Odometer */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-body font-medium text-ink">
                Date performed <span className="text-overdue">*</span>
              </label>
              <input
                type="date"
                value={performedAt}
                onChange={(e) => setPerformedAt(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-page px-4 py-2.5 text-body text-ink focus:border-lime/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-body font-medium text-ink">
                Odometer (km)
              </label>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  min="0"
                  placeholder={String(currentKm || 0)}
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-page px-4 py-2.5 text-body text-ink focus:border-lime/40 focus:outline-none"
                />
                <Gauge className="absolute top-3 right-3 size-4 text-ink-muted" />
              </div>
              {selectedVehicle && (
                <p className="mt-1 text-[12px] text-ink-muted">
                  Current: {odometer(currentKm)} km
                  {willUpdateOdo && (
                    <span className="ml-1 text-on-track font-medium">
                      (will update vehicle odometer)
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Photo Upload Section */}
          <div>
            <div className="flex items-baseline justify-between">
              <label className="block text-body font-medium text-ink">
                Photographs
              </label>
              <span className="text-[12px] text-ink-muted">
                {photos.length} {photos.length === 1 ? 'photo' : 'photos'} attached
              </span>
            </div>
            <p className="mt-0.5 text-body text-ink-muted">
              Add photographs of work done, replacement parts, or breakdown evidence.
            </p>

            {/* Dropzone & Preview Grid */}
            <div className="mt-2 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload-input"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-page/50 p-5 text-center transition-colors hover:border-lime/50 hover:bg-page/80"
              >
                <div className="grid size-10 place-items-center rounded-xl bg-white/5 text-ink-muted group-hover:bg-lime/15 group-hover:text-lime">
                  <Camera className="size-5" />
                </div>
                <p className="mt-2 text-body font-medium text-ink">
                  Click or drag photos here to upload
                </p>
                <p className="text-[12px] text-ink-muted">
                  PNG, JPG, WebP supported (multiple files allowed)
                </p>
              </div>

              {/* Photo Thumbnails */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-page"
                    >
                      <img
                        src={photo.preview}
                        alt={`Upload ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(photo.id);
                        }}
                        className="absolute top-1.5 right-1.5 rounded-lg bg-black/75 p-1.5 text-white/80 opacity-90 transition-all hover:bg-overdue hover:text-white"
                        title="Remove photo"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-body font-medium text-ink">
              Notes & observations
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details about parts replaced, diagnostic findings, technician comments…"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-page px-4 py-2.5 text-body text-ink focus:border-lime/40 focus:outline-none"
            />
          </div>

          {/* Performer Info */}
          {principal && principal.kind === 'user' && (
            <p className="text-[12px] text-ink-muted">
              Recording as <strong className="text-ink">{principal.fullName}</strong>
            </p>
          )}

          {/* Actions */}
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
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-lime px-5 py-2.5 text-body font-semibold text-page transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {mutation.isPending ? 'Saving record…' : 'Record service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
