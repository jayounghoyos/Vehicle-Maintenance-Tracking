import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import { useRef } from 'react';

import { api, type PhotoItem } from '../lib/api';
import { useToast } from '../toast/context';

/* Mirrors the API, so a wrong file is refused before it travels. */
const ACCEPTS = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 12;

type Props = {
  vehicleId: number;
  plate: string;
  photos: PhotoItem[];
  canManage: boolean;
  onOpen: (index: number) => void;
};

/**
 * The rest of the van. The main picture stays above this, and any of
 * these can take its place.
 */
export function VehicleGallery({ vehicleId, plate, photos, canManage, onOpen }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['vehicles'] });
  };
  const failed = (err: unknown, fallback: string) =>
    toast.show(err instanceof Error ? err.message : fallback, 'failed');

  const add = useMutation({
    mutationFn: (files: File[]) =>
      api.uploadMany(`/vehicles/${vehicleId}/photos`, 'photos', files),
    onSuccess: (_, files) => {
      toast.show(
        `${files.length} ${files.length === 1 ? 'picture' : 'pictures'} added to ${plate}`,
      );
      refresh();
    },
    onError: (err: unknown) => failed(err, 'Could not add the pictures'),
  });

  const promote = useMutation({
    mutationFn: (photoId: number) =>
      api.post(`/vehicles/${vehicleId}/photos/${photoId}/promote`, {}),
    onSuccess: () => {
      toast.show(`${plate} has a new main picture`);
      refresh();
    },
    onError: (err: unknown) => failed(err, 'Could not change the main picture'),
  });

  const remove = useMutation({
    mutationFn: (photoId: number) => api.del(`/vehicles/${vehicleId}/photos/${photoId}`),
    onSuccess: () => {
      toast.show('The picture is gone');
      refresh();
    },
    onError: (err: unknown) => failed(err, 'Could not remove the picture'),
  });

  const choose = (chosen: FileList | null) => {
    const files = [...(chosen ?? [])];
    if (files.length === 0) return;
    if (files.some((file) => file.size > MAX_BYTES)) {
      toast.show('Every picture has to be under 5 MB', 'failed');
      return;
    }
    // said here because past this many the upload is refused by the
    // parser, whose complaint names a form field nobody chose
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) {
      toast.show(
        room === 0
          ? `${plate} already holds ${MAX_PHOTOS} pictures`
          : `Room for ${room} more ${room === 1 ? 'picture' : 'pictures'} on ${plate}`,
        'failed',
      );
      return;
    }
    add.mutate(files);
  };

  const busy = add.isPending || promote.isPending || remove.isPending;
  const full = photos.length >= MAX_PHOTOS;

  if (photos.length === 0 && !canManage) return null;

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-table-label font-semibold text-ink-muted uppercase">
          More pictures
        </h3>
        {canManage && (
          <>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPTS}
              multiple
              className="hidden"
              onChange={(event) => {
                choose(event.target.files);
                event.target.value = '';
              }}
            />
            <button
              type="button"
              disabled={busy || full}
              onClick={() => fileInput.current?.click()}
              title={full ? `A vehicle holds ${MAX_PHOTOS} pictures` : undefined}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-[12px] text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              <ImagePlus className="size-3.5" strokeWidth={1.75} />
              {add.isPending ? 'Uploading…' : 'Add pictures'}
            </button>
          </>
        )}
      </div>

      {photos.length === 0 ? (
        <p className="mt-2 text-body text-ink-muted">
          Only the main picture so far. Add the sides, the inside, the plate.
        </p>
      ) : (
        <ul className="mt-2 grid grid-cols-4 gap-1.5">
          {photos.map((photo, index) => (
            <li key={photo.id} className="group relative">
              <button
                type="button"
                onClick={() => onOpen(index)}
                className="block aspect-square w-full overflow-hidden rounded-lg border border-white/10"
              >
                <img
                  src={photo.url}
                  alt={`${plate}, picture ${index + 1}`}
                  className={`size-full object-cover transition-opacity ${busy ? 'opacity-40' : ''}`}
                />
              </button>
              {canManage && (
                <div className="absolute inset-x-0 bottom-0 flex justify-end gap-0.5 bg-page/80 p-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => promote.mutate(photo.id)}
                    title="Make this the main picture"
                    className="rounded p-1 text-ink-muted transition-colors hover:text-lime disabled:opacity-50"
                  >
                    <Star className="size-3.5" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove.mutate(photo.id)}
                    title="Remove this picture"
                    className="rounded p-1 text-ink-muted transition-colors hover:text-overdue disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
