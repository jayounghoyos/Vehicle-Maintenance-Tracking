import { Wrench } from 'lucide-react';

/**
 * The mark and the wordmark, locked together on one optical baseline as
 * the manual requires.
 *
 * A client who uploaded their own logo gets it in place of the wrench,
 * and their name in place of MTS. Everything else stays: this is their
 * workspace inside our product, not a different product.
 */
export function Logo({
  logoUrl,
  name,
}: {
  logoUrl?: string | null;
  name?: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="size-9 shrink-0 rounded-xl object-cover" />
      ) : (
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lime">
          <Wrench className="size-5 text-on-accent" strokeWidth={2.5} />
        </span>
      )}
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[17px] font-bold tracking-tight">
          {name || 'MTS'}
        </span>
        <span className="block text-[11px] text-ink-muted">Fleet maintenance</span>
      </span>
    </div>
  );
}
