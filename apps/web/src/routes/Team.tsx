import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '../auth/AuthContext'
import { AppShell } from '../components/AppShell'
import { Field } from '../components/AuthLayout'
import { Panel } from '../components/Panel'
import { SidebarFooter } from '../components/SidebarFooter'
import { api, type TeamMember } from '../lib/api'
import { initials, roleLabel } from '../lib/format'

const ROLES = ['fleet_coordinator', 'mechanic', 'operations_manager'] as const

export default function Team() {
  const { principal } = useAuth()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const { data: members, isPending } = useQuery({
    queryKey: ['team'],
    queryFn: () => api.get<TeamMember[]>('/team'),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['team'] })

  const create = useMutation({
    mutationFn: (body: Record<string, string>) => api.post<TeamMember>('/team', body),
    onSuccess: () => {
      setAdding(false)
      setError(null)
      void invalidate()
    },
    onError: (err: unknown) =>
      setError(err instanceof Error ? err.message : 'Could not create the account'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/team/${id}`),
    onSuccess: invalidate,
    onError: (err: unknown) =>
      setError(err instanceof Error ? err.message : 'Could not remove the account'),
  })

  const me = principal?.kind === 'user' ? principal : null

  return (
    <AppShell
      title="Team"
      subtitle="Who can sign in to this organization"
      sidebarFooter={me ? <SidebarFooter user={me} /> : undefined}
    >
      <div className="max-w-3xl space-y-5">
        {error && (
          <p className="rounded-xl bg-overdue/15 px-4 py-3 text-body text-overdue">{error}</p>
        )}

        <Panel
          title="Members"
          subtitle="Everyone with an account in this organization"
          action={
            <button
              type="button"
              onClick={() => setAdding((v) => !v)}
              className="flex items-center gap-2 rounded-xl bg-lime px-3.5 py-2 text-body font-semibold text-page transition-opacity hover:opacity-90"
            >
              <UserPlus className="size-4" strokeWidth={2.5} />
              Add member
            </button>
          }
        >
          {adding && (
            <form
              className="grid gap-4 border-t border-white/5 bg-white/[0.02] p-5 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault()
                const form = new FormData(event.currentTarget)
                create.mutate(Object.fromEntries(form) as Record<string, string>)
              }}
            >
              <Field label="Full name" name="fullName" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Password" name="password" type="password" required minLength={8} />
              <label className="block">
                <span className="mb-1.5 block text-body text-ink-muted">Role</span>
                <select
                  name="role"
                  defaultValue="mechanic"
                  className="w-full rounded-xl border border-white/10 bg-panel px-3.5 py-2.5 text-body focus:border-lime/40 focus:outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="bg-panel">
                      {roleLabel(r)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={create.isPending}
                  className="rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-page disabled:opacity-50"
                >
                  {create.isPending ? 'Creating…' : 'Create account'}
                </button>
              </div>
            </form>
          )}

          {isPending ? (
            <p className="px-5 pb-6 text-body text-ink-muted">Loading the team…</p>
          ) : (
            <ul className="divide-y divide-white/5 border-t border-white/5">
              {members?.map((member) => (
                <li key={member.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-[12px] font-semibold">
                    {initials(member.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {member.fullName}
                      {member.id === me?.id && (
                        <span className="ml-2 text-[12px] text-ink-muted">you</span>
                      )}
                    </p>
                    <p className="truncate text-body text-ink-muted">{member.email}</p>
                  </div>
                  <span className="text-body text-ink-muted">{roleLabel(member.role)}</span>
                  {/* removing yourself would lock the organization out of itself */}
                  {member.id !== me?.id && (
                    <button
                      type="button"
                      onClick={() => remove.mutate(member.id)}
                      title={`Remove ${member.fullName}`}
                      className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-overdue/15 hover:text-overdue"
                    >
                      <Trash2 className="size-4" strokeWidth={1.75} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AppShell>
  )
}
