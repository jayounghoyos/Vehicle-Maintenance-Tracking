import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Trash2, Truck } from 'lucide-react';
import { useRef } from 'react';

import { api, type VehicleRow } from '../lib/api';
import { useToast } from '../toast/context';

/* What the API accepts. Checked here too so a wrong file is refused
 * before it travels, not after. */
const ACCEPTS = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * The picture of a vehicle, on the profile rather than in the register
 * form: choosing a file and typing a plate are different kinds of work,
 * and a photo is something you add to a van that already exists.
 */
export function VehiclePhoto({
  vehicle,
  canManage,
}: {
  vehicle: VehicleRow;
  canManage: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['vehicles'] });
  };
  const failed = (err: unknown, fallback: string) =>
    toast.show(err instanceof Error ? err.message : fallback, 'failed');

  const upload = useMutation({
    mutationFn: (file: File) =>
      api.upload<VehicleRow>(`/vehicles/${vehicle.id}/photo`, 'photo', file),
    onSuccess: () => {
      toast.show(`${vehicle.plate} has a new picture`);
      refresh();
    },
    onError: (err: unknown) => failed(err, 'Could not upload the picture'),
  });

  const remove = useMutation({
    mutationFn: () => api.del<VehicleRow>(`/vehicles/${vehicle.id}/photo`),
    onSuccess: () => {
      toast.show(`The picture of ${vehicle.plate} is gone`);
      refresh();
    },
    onError: (err: unknown) => failed(err, 'Could not remove the picture'),
  });

  const choose = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.show('That picture is over 5 MB, try a smaller one', 'failed');
      return;
    }
    upload.mutate(file);
  };

  const busy = upload.isPending || remove.isPending;

  return (
    <div className="space-y-2">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-page/60">
        {vehicle.photoUrl ? (
          <img
            src={vehicle.photoUrl}
            alt={`${vehicle.make} ${vehicle.model} with plate ${vehicle.plate}`}
            className={`size-full object-cover transition-opacity ${busy ? 'opacity-40' : ''}`}
          />
        ) : (
          <div className="grid size-full place-items-center text-ink-muted">
            <Truck className="size-8" strokeWidth={1.25} />
          </div>
        )}
      </div>

      {canManage && (
        <div className="flex items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTS}
            className="hidden"
            onChange={(event) => {
              choose(event.target.files?.[0]);
              // cleared so choosing the same file twice still fires
              event.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-[12px] text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
          >
            <ImagePlus className="size-3.5" strokeWidth={1.75} />
            {upload.isPending
              ? 'Uploading…'
              : vehicle.photoUrl
                ? 'Replace picture'
                : 'Add a picture'}
          </button>
          {vehicle.photoUrl && (
            <button
              type="button"
              disabled={busy}
              onClick={() => remove.mutate()}
              title="Remove the picture"
              className="rounded-xl p-2 text-ink-muted transition-colors hover:bg-overdue/15 hover:text-overdue disabled:opacity-50"
            >
              <Trash2 className="size-3.5" strokeWidth={1.75} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
