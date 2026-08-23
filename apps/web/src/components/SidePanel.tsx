import { X } from 'lucide-react';

/**
 * The column that opens on the right when something is being filled in.
 *
 * A form squeezed under the list it belongs to pushes the list out of
 * sight and still has no room; beside it, both stay readable and the
 * empty half of a laptop screen finally does something. It sticks, so
 * scrolling a long list does not scroll the form away.
 */
export function SidePanel({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <aside className="overflow-hidden rounded-2xl border border-white/5 bg-panel xl:sticky xl:top-6">
      <header className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4">
        <div>
          <h2 className="text-section font-semibold">{title}</h2>
          {subtitle && <p className="mt-1 text-body text-ink-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </header>
      {children}
    </aside>
  );
}
