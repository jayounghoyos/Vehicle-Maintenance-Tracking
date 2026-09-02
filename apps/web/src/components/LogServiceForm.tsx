import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Trash2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';


import { useAuth } from '../auth/context';
import {
  api,
  fetchMaintenanceTasks,
  type MaintenanceTaskItem,
  type TeamMember,
  type VehicleRow,
} from '../lib/api';
import { useToast } from '../toast/context';
import { FormError } from './AuthLayout';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

export function LogServiceForm({
  initialVehicleId,
  onSuccess,
  onCancel,
}: {
  initialVehicleId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayIso = new Date().toISOString().slice(0, 10);
  const [performedAt, setPerformedAt] = useState(todayIso);
  const [vehicleId, setVehicleId] = useState<number | ''>(initialVehicleId ?? '');
  const [taskId, setTaskId] = useState<number | ''>('');
  const [type, setType] = useState<'preventive' | 'corrective'>('preventive');
  const [odometerKm, setOdometerKm] = useState<string>('');
  const [recordedBy, setRecordedBy] = useState<number | ''>(
    principal?.kind === 'user' ? principal.id : '',
  );
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form input unique IDs for accessibility
  const dateId = useId();
  const vehicleInputId = useId();
  const taskInputId = useId();
  const odometerInputId = useId();
  const recordedByInputId = useId();
  const notesInputId = useId();

  // Queries for dynamic dropdowns
  const { data: vehicles = [], isPending: isVehiclesPending } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get<VehicleRow[]>('/vehicles'),
  });

  const { data: tasks = [], isPending: isTasksPending } = useQuery({
    queryKey: ['maintenance-tasks'],
    queryFn: fetchMaintenanceTasks,
  });

  const { data: team = [] } = useQuery({
    queryKey: ['team'],
    queryFn: () => api.get<TeamMember[]>('/team'),
    enabled: principal?.kind === 'user',
  });

  // Automatically set default task if only one or first load
  const selectedVehicle = vehicles.find((v) => v.id === Number(vehicleId));

  const handleVehicleChange = (newVehicleId: number | '') => {
    setVehicleId(newVehicleId);
    if (newVehicleId !== '') {
      const v = vehicles.find((item) => item.id === newVehicleId);
      if (v && !odometerKm) {
        setOdometerKm(String(v.odometerKm));
      }
    }
  };

  const handlePhotoSelect = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.show('The selected photo is over 5 MB. Please choose a smaller one.', 'failed');
      return;
    }
    setPhoto(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  const handleRemovePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!vehicleId) throw new Error('Please choose a vehicle');
      if (!taskId) throw new Error('Please select a maintenance task');
      if (!performedAt) throw new Error('Please select the service date');

      const formData = new FormData();
      formData.append('performedAt', performedAt);
      formData.append('vehicleId', String(vehicleId));
      formData.append('taskId', String(taskId));
      formData.append('type', type);

      if (odometerKm.trim() !== '') {
        formData.append('odometerKm', odometerKm.trim());
      }
      if (notes.trim() !== '') {
        formData.append('notes', notes.trim());
      }
      if (recordedBy !== '') {
        formData.append('recordedBy', String(recordedBy));
      }
      if (photo) {
        formData.append('photo', photo);
      }

      return api.postForm('/service-events', formData);
    },
    onSuccess: () => {
      toast.show('Service event successfully logged');
      void queryClient.invalidateQueries({ queryKey: ['service-events'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onSuccess();
    },
    onError: (err: unknown) => {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not save the service event',
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    submitMutation.mutate();
  };

  return (
    <form className="space-y-4 p-5" onSubmit={handleSubmit}>
      <FormError message={errorMessage} />

      {/* Date */}
      <div>
        <label htmlFor={dateId} className="mb-1.5 block text-body font-medium text-ink-muted">
          Date <span className="text-overdue">*</span>
        </label>
        <input
          id={dateId}
          type="date"
          required
          value={performedAt}
          max={todayIso}
          onChange={(e) => setPerformedAt(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-panel px-3.5 py-2.5 text-body text-ink focus:border-lime/40 focus:outline-none"
        />
      </div>

      {/* Vehicle */}
      <div>
        <label htmlFor={vehicleInputId} className="mb-1.5 block text-body font-medium text-ink-muted">
          Vehicle <span className="text-overdue">*</span>
        </label>
        <select
          id={vehicleInputId}
          required
          value={vehicleId}
          onChange={(e) =>
            handleVehicleChange(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="w-full rounded-xl border border-white/10 bg-panel px-3.5 py-2.5 text-body text-ink focus:border-lime/40 focus:outline-none"
        >
          <option value="" disabled className="bg-panel">
            {isVehiclesPending ? 'Loading fleet…' : 'Select a vehicle'}
          </option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id} className="bg-panel">
              {v.plate} — {v.make} {v.model} ({v.odometerKm.toLocaleString()} km)
            </option>
          ))}
        </select>
        {selectedVehicle && (
          <p className="mt-1 text-[12px] text-ink-muted">
            Current fleet odometer: {selectedVehicle.odometerKm.toLocaleString()} km
          </p>
        )}
      </div>

      {/* Task */}
      <div>
        <label htmlFor={taskInputId} className="mb-1.5 block text-body font-medium text-ink-muted">
          Task <span className="text-overdue">*</span>
        </label>
        <select
          id={taskInputId}
          required
          value={taskId}
          onChange={(e) =>
            setTaskId(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="w-full rounded-xl border border-white/10 bg-panel px-3.5 py-2.5 text-body text-ink focus:border-lime/40 focus:outline-none"
        >
          <option value="" disabled className="bg-panel">
            {isTasksPending ? 'Loading maintenance tasks…' : 'Select a maintenance task'}
          </option>
          {tasks.map((t: MaintenanceTaskItem) => (
            <option key={t.id} value={t.id} className="bg-panel">
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Type (Preventive vs Corrective) */}
      <div>
        <span className="mb-1.5 block text-body font-medium text-ink-muted">
          Type <span className="text-overdue">*</span>
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('preventive')}
            className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-body font-medium transition-colors ${
              type === 'preventive'
                ? 'border-on-track/40 bg-on-track/15 text-on-track'
                : 'border-white/10 bg-panel text-ink-muted hover:text-ink'
            }`}
          >
            <span className={`size-2 rounded-full ${type === 'preventive' ? 'bg-on-track' : 'bg-ink-muted/40'}`} />
            Preventive
          </button>
          <button
            type="button"
            onClick={() => setType('corrective')}
            className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-body font-medium transition-colors ${
              type === 'corrective'
                ? 'border-overdue/40 bg-overdue/15 text-overdue'
                : 'border-white/10 bg-panel text-ink-muted hover:text-ink'
            }`}
          >
            <span className={`size-2 rounded-full ${type === 'corrective' ? 'bg-overdue' : 'bg-ink-muted/40'}`} />
            Corrective
          </button>
        </div>
      </div>

      {/* Odometer (km) */}
      <div>
        <label htmlFor={odometerInputId} className="mb-1.5 block text-body font-medium text-ink-muted">
          Odometer (km)
        </label>
        <input
          id={odometerInputId}
          type="number"
          min={0}
          placeholder="e.g. 45200"
          value={odometerKm}
          onChange={(e) => setOdometerKm(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-panel px-3.5 py-2.5 text-body text-ink placeholder:text-ink-muted/50 focus:border-lime/40 focus:outline-none"
        />
      </div>

      {/* Recorded by */}
      <div>
        <label htmlFor={recordedByInputId} className="mb-1.5 block text-body font-medium text-ink-muted">
          Recorded by
        </label>
        <select
          id={recordedByInputId}
          value={recordedBy}
          onChange={(e) =>
            setRecordedBy(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="w-full rounded-xl border border-white/10 bg-panel px-3.5 py-2.5 text-body text-ink focus:border-lime/40 focus:outline-none"
        >
          {team.length > 0 ? (
            team.map((member) => (
              <option key={member.id} value={member.id} className="bg-panel">
                {member.fullName} ({member.roleName})
              </option>
            ))
          ) : principal?.kind === 'user' ? (
            <option value={principal.id} className="bg-panel">
              {principal.fullName} ({principal.roleName})
            </option>
          ) : (
            <option value="" className="bg-panel">
              Platform Admin
            </option>
          )}
        </select>
      </div>

      {/* Image (upload image) */}
      <div>
        <span className="mb-1.5 block text-body font-medium text-ink-muted">
          Image (service receipt / photo)
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          className="hidden"
          onChange={(e) => {
            handlePhotoSelect(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        {photoPreview ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-white/10 bg-page/60">
            <img
              src={photoPreview}
              alt="Service attachment preview"
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemovePhoto}
              title="Remove photo"
              className="absolute top-2.5 right-2.5 rounded-lg bg-black/70 p-1.5 text-white transition-colors hover:bg-overdue/80"
            >
              <Trash2 className="size-4" />
            </button>
            <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">
              {photo?.name}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-panel/50 p-5 text-center transition-colors hover:border-lime/40 hover:bg-white/[0.02]"
          >
            <div className="grid size-10 place-items-center rounded-xl bg-white/5 text-ink-muted transition-colors group-hover:text-lime">
              <Camera className="size-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-body font-medium text-ink transition-colors group-hover:text-lime">
                Upload service photo or receipt
              </p>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                JPG, PNG or WEBP up to 5 MB
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor={notesInputId} className="mb-1.5 block text-body font-medium text-ink-muted">
          Workshop notes (optional)
        </label>
        <textarea
          id={notesInputId}
          rows={2}
          placeholder="Details on parts replaced, observations, or next inspection advice…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full resize-none rounded-xl border border-white/10 bg-panel px-3.5 py-2.5 text-body text-ink placeholder:text-ink-muted/50 focus:border-lime/40 focus:outline-none"
        />
      </div>

      {/* Form Action Buttons */}
      <div className="pt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="flex-1 rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitMutation.isPending ? 'Saving event…' : 'Record service'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitMutation.isPending}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-body text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
