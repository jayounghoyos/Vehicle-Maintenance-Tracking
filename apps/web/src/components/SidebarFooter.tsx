import { AlertTriangle, LogOut } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '../auth/context';
import { initials, roleLabel } from '../lib/format';

export function SidebarFooter({
  user,
  overdueCount,
}: {
  user: { fullName: string; role?: string };
  overdueCount?: number;
}) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      {overdueCount != null && overdueCount > 0 && (
        <div className="rounded-xl bg-overdue/15 p-4">
          <p className="flex items-center gap-2 font-semibold text-overdue">
            <AlertTriangle className="size-4" strokeWidth={2.5} />
            {overdueCount} {overdueCount === 1 ? 'vehicle' : 'vehicles'} overdue
          </p>
          <p className="mt-1.5 text-body text-overdue/70">
            Schedule service to keep the fleet compliant.
          </p>
        </div>
      )}

      <div className="border-t border-white/5 pt-4">
        {open && (
          <button
            type="button"
            onClick={signOut}
            className="mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-body text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            <LogOut className="size-4" strokeWidth={1.75} />
            Sign out
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-white/5"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-[12px] font-semibold">
            {initials(user.fullName)}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate font-medium">{user.fullName}</span>
            <span className="block truncate text-[12px] text-ink-muted">
              {user.role ? roleLabel(user.role) : 'Platform admin'}
            </span>
          </span>
          <LogOut
            className={`size-4 shrink-0 transition-colors ${open ? 'text-lime' : 'text-ink-muted'}`}
            strokeWidth={1.75}
          />
        </button>
      </div>
    </div>
  );
}
