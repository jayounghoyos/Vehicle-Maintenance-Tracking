import { AlertTriangle } from 'lucide-react';

/**
 * The overdue count, where the fleet is rather than tucked under the
 * account block in the sidebar.
 *
 * It states, it does not act. The vehicles it counts are named one by
 * one in Needs attention directly below, and each of those rows opens
 * the service form on the vehicle it names, so a button here could only
 * offer a blank form the header already offers.
 *
 * Nothing renders when the count is zero: an alert that is always there
 * stops being an alert.
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
