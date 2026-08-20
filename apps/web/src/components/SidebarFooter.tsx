import { AlertTriangle, ChevronRight } from 'lucide-react'

import type { User } from '../domain/types'
import { initials, roleLabel } from '../lib/format'

export function SidebarFooter({
  user,
  overdueCount,
}: {
  user: User
  overdueCount: number
}) {
  return (
    <div className="space-y-4">
      {overdueCount > 0 && (
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

      <div className="flex items-center gap-3 border-t border-white/5 pt-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-[12px] font-semibold">
          {initials(user.fullName)}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate font-medium">{user.fullName}</span>
          <span className="block truncate text-[12px] text-ink-muted">
            {roleLabel(user.role)}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-ink-muted" />
      </div>
    </div>
  )
}
