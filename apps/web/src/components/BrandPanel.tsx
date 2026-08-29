import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ImagePlus, RotateCcw, Trash2, Wrench } from 'lucide-react';
import { useRef, useState } from 'react';

import { DEFAULT_ACCENT, isFaint, isValidAccent, readableOn } from '../lib/brand';
import { api, type OrganizationProfile } from '../lib/api';
import { useToast } from '../toast/context';
import { Panel } from './Panel';

const ACCEPTS = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 2 * 1024 * 1024;

/* Chosen against the dark surfaces and away from the three status hues,
 * so no preset can be mistaken for "overdue" at a glance. */
const PRESETS = ['#CFF255', '#7DD3FC', '#C4B5FD', '#F9A8D4', '#E2E8F0'];

export function BrandPanel({
  org,
  canEdit,
}: {
  org: OrganizationProfile;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  // what the preview shows: the pick in progress, not what is saved
  const [draft, setDraft] = useState(org.accentColor ?? DEFAULT_ACCENT);

  const settled = (updated: OrganizationProfile, message: string) => {
    queryClient.setQueryData(['organization'], updated);
    setDraft(updated.accentColor ?? DEFAULT_ACCENT);
    toast.show(message);
  };
  const failed = (err: unknown, fallback: string) =>
    toast.show(err instanceof Error ? err.message : fallback, 'failed');

  const saveAccent = useMutation({
    mutationFn: (accentColor: string | null) =>
      api.patch<OrganizationProfile>('/organization', { accentColor }),
    onSuccess: (updated, sent) =>
      settled(updated, sent === null ? 'Back to the default colour' : 'Colour saved'),
    onError: (err: unknown) => failed(err, 'Could not save the colour'),
  });

  const uploadLogo = useMutation({
    mutationFn: (file: File) =>
      api.upload<OrganizationProfile>('/organization/logo', 'logo', file),
    onSuccess: (updated) => settled(updated, 'Your logo is up'),
    onError: (err: unknown) => failed(err, 'Could not upload the logo'),
  });

  const removeLogo = useMutation({
    mutationFn: () => api.del<OrganizationProfile>('/organization/logo'),
    onSuccess: (updated) => settled(updated, 'Back to the default mark'),
    onError: (err: unknown) => failed(err, 'Could not remove the logo'),
  });

  const busy = saveAccent.isPending || uploadLogo.isPending || removeLogo.isPending;
  const dirty = draft.toLowerCase() !== (org.accentColor ?? DEFAULT_ACCENT).toLowerCase();
  const usable = isValidAccent(draft);

  const choose = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.show('That file is over 2 MB, try a smaller one', 'failed');
      return;
    }
    uploadLogo.mutate(file);
  };

  return (
    <Panel
      title="Brand"
      subtitle={
        canEdit
          ? 'Your mark and your colour, everywhere your team works'
          : 'How this workspace is dressed, set by whoever manages the organization'
      }
    >
      <div className="grid gap-6 border-t border-white/5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="space-y-6">
          <section>
            <h3 className="mb-3 text-table-label font-semibold text-ink-muted uppercase">
              Mark
            </h3>
            <div className="flex items-center gap-3">
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt=""
                  className="size-12 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-lime">
                  <Wrench className="size-6 text-on-accent" strokeWidth={2.5} />
                </span>
              )}

              {canEdit && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInput}
                    type="file"
                    accept={ACCEPTS}
                    className="hidden"
                    onChange={(event) => {
                      choose(event.target.files?.[0]);
                      // cleared so the same file can be chosen twice
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
                    {uploadLogo.isPending
                      ? 'Uploading…'
                      : org.logoUrl
                        ? 'Replace logo'
                        : 'Upload a logo'}
                  </button>
                  {org.logoUrl && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeLogo.mutate()}
                      title="Back to the default mark"
                      className="rounded-xl p-2 text-ink-muted transition-colors hover:bg-overdue/15 hover:text-overdue disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="mt-2 text-[12px] text-ink-muted">
              A square reads best. PNG, JPEG or WebP, up to 2 MB.
            </p>
          </section>

          <section>
            <h3 className="mb-3 text-table-label font-semibold text-ink-muted uppercase">
              Accent
            </h3>
            {canEdit ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDraft(preset)}
                      title={preset}
                      style={{ backgroundColor: preset }}
                      className={`size-8 rounded-lg transition-transform hover:scale-105 ${
                        draft.toLowerCase() === preset.toLowerCase()
                          ? 'ring-2 ring-ink ring-offset-2 ring-offset-panel'
                          : ''
                      }`}
                    />
                  ))}
                  {/* the picker is a swatch too, so the row reads as one
                      set of choices rather than a list plus an escape */}
                  <label
                    className="relative size-8 cursor-pointer overflow-hidden rounded-lg border border-dashed border-white/25"
                    title="Any other colour"
                  >
                    <span
                      className="block size-full"
                      style={{ backgroundColor: usable ? draft : 'transparent' }}
                    />
                    <input
                      type="color"
                      value={usable ? draft : DEFAULT_ACCENT}
                      onChange={(event) => setDraft(event.target.value.toUpperCase())}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                  <code className="ml-1 text-[12px] text-ink-muted">{draft}</code>
                </div>

                {usable && isFaint(draft) && (
                  <p className="mt-3 flex items-start gap-2 text-[12px] text-due-soon">
                    <AlertTriangle className="mt-px size-3.5 shrink-0" strokeWidth={2} />
                    This one is dark against the interface, so buttons in it are easy to
                    miss. It will still be used if you save it.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busy || !dirty || !usable}
                    onClick={() => saveAccent.mutate(draft)}
                    className="rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-on-accent disabled:opacity-50"
                  >
                    {saveAccent.isPending ? 'Saving…' : 'Save colour'}
                  </button>
                  {(org.accentColor !== null || dirty) && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setDraft(DEFAULT_ACCENT);
                        if (org.accentColor !== null) saveAccent.mutate(null);
                      }}
                      className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-body text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
                    >
                      <RotateCcw className="size-4" strokeWidth={1.75} />
                      Use the default
                    </button>
                  )}
                </div>

                <p className="mt-3 text-[12px] text-ink-muted">
                  Orange, amber and green are not on this list on purpose: they mean
                  overdue, due soon and on track, and a fleet screen has to read the same
                  way in every organization.
                </p>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span
                  className="size-8 rounded-lg"
                  style={{ backgroundColor: org.accentColor ?? DEFAULT_ACCENT }}
                />
                <code className="text-[12px] text-ink-muted">
                  {org.accentColor ?? DEFAULT_ACCENT}
                </code>
              </div>
            )}
          </section>
        </div>

        <Preview accent={usable ? draft : DEFAULT_ACCENT} org={org} />
      </div>
    </Panel>
  );
}

/**
 * The workspace in miniature, painted with the colour being considered
 * rather than the one that is saved.
 *
 * The two custom properties are set on this element, so everything
 * inside reads the draft through the same tokens the real interface
 * uses and nothing here needs to know a colour by name.
 */
function Preview({ accent, org }: { accent: string; org: OrganizationProfile }) {
  const vars: Record<string, string> = {
    '--color-lime': accent,
    '--color-on-accent': readableOn(accent),
  };

  return (
    <div>
      <h3 className="mb-3 text-table-label font-semibold text-ink-muted uppercase">
        Preview
      </h3>
      <div
        style={vars as React.CSSProperties}
        className="overflow-hidden rounded-xl border border-white/10 bg-page"
      >
        <div className="flex h-44">
          <div className="flex w-16 shrink-0 flex-col items-center gap-3 bg-sidebar py-3">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt="" className="size-7 rounded-lg object-cover" />
            ) : (
              <span className="grid size-7 place-items-center rounded-lg bg-lime">
                <Wrench className="size-3.5 text-on-accent" strokeWidth={2.5} />
              </span>
            )}
            <span className="h-2 w-8 rounded-full bg-lime/90" />
            <span className="h-2 w-8 rounded-full bg-white/10" />
            <span className="h-2 w-8 rounded-full bg-white/10" />
          </div>

          <div className="min-w-0 flex-1 space-y-3 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="h-2.5 w-20 rounded-full bg-white/25" />
              <span className="rounded-lg bg-lime px-2.5 py-1 text-[9px] font-semibold text-on-accent">
                Log service
              </span>
            </div>
            <div className="rounded-lg border border-white/5 bg-panel p-2.5">
              <p className="text-[9px] text-ink-muted">Active vehicles</p>
              <p className="text-[17px] leading-tight font-bold text-lime">24</p>
            </div>
            <div className="flex gap-1.5">
              {/* the three that never change, shown so it is clear what
                  the accent is not allowed to take over */}
              <span className="h-1.5 flex-1 rounded-full bg-overdue" />
              <span className="h-1.5 flex-1 rounded-full bg-due-soon" />
              <span className="h-1.5 flex-1 rounded-full bg-on-track" />
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-[12px] text-ink-muted">Everyone in {org.name} sees this.</p>
    </div>
  );
}
