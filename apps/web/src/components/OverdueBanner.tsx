import { AlertTriangle } from 'lucide-react';

/**
 * The overdue count, where the fleet is rather than in the sidebar.
 *
 * It states, it does not act: Needs attention names these vehicles one
 * by one below, and those rows are what open the service form. Nothing
 * renders at zero, since an alert that is always there is not one.
 */
export function OverdueBanner({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <section className="rounded-2xl bg-overdue/15 p-5">
      <p className="flex items-center gap-2 font-semibold text-overdue">
        <AlertTriangle className="size-4" strokeWidth={2.5} />
        {count} {count === 1 ? 'vehicle' : 'vehicles'} overdue
      </p>
      <p className="mt-1.5 text-body text-overdue/70">
        Schedule service to keep the fleet compliant.
      </p>
    </section>
  );
}
