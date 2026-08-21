import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LogOut, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import { Logo } from '../components/Logo'
import { api, type AdminOrganization } from '../lib/api'

function Flag({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
        ok ? 'bg-on-track/15 text-on-track' : 'bg-overdue/15 text-overdue'
      }`}
    >
      <span className={`size-1.5 rounded-full ${ok ? 'bg-on-track' : 'bg-overdue'}`} />
      {children}
    </span>
  )
}

export default function Admin() {
  const { principal, signOut } = useAuth()
  const queryClient = useQueryClient()

  const { data: orgs, isPending } = useQuery({
    queryKey: ['admin', 'organizations'],
    queryFn: () => api.get<AdminOrganization[]>('/admin/organizations'),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] })

  const setFlag = useMutation({
    mutationFn: ({ id, flag, value }: { id: number; flag: 'active' | 'deleted'; value: boolean }) =>
      api.patch<AdminOrganization>(`/admin/organizations/${id}/${flag}`, { value }),
    onSuccess: invalidate,
  })

  return (
    <div className="min-h-screen bg-page text-ink">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 px-8 py-5">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="flex items-center gap-2 rounded-full bg-lime/15 px-2.5 py-1 text-[12px] font-semibold text-lime">
            <ShieldCheck className="size-3.5" strokeWidth={2.5} />
            Platform admin
          </span>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-body text-ink-muted transition-colors hover:text-ink"
        >
          <LogOut className="size-4" strokeWidth={1.75} />
          Sign out {principal?.fullName}
        </button>
      </header>

      <main className="px-8 py-8">
        <h1 className="text-page-title font-bold">Organizations</h1>
        <p className="mt-1.5 text-body text-ink-muted">
          Every fleet using the service. Suspending cuts off sign-in at once; deleting keeps
          the rows so the service history stays readable.
        </p>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/5 bg-panel">
          {isPending ? (
            <p className="p-8 text-body text-ink-muted">Loading organizations…</p>
          ) : (
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-white/5">
                  {['Organization', 'Director', 'Contact', 'Members', 'State', ''].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-table-label font-semibold text-ink-muted uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orgs?.map((org) => {
                  const deleted = org.deletedAt !== null
                  return (
                    <tr key={org.id} className={deleted ? 'opacity-50' : undefined}>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{org.name}</p>
                        <p className="text-body text-ink-muted">{org.address}</p>
                      </td>
                      <td className="px-5 py-4">{org.ownerName}</td>
                      <td className="px-5 py-4">
                        <p>{org.email}</p>
                        <p className="text-body text-ink-muted">{org.phone}</p>
                      </td>
                      <td className="px-5 py-4 tabular-nums">{org.memberCount}</td>
                      <td className="px-5 py-4">
                        {deleted ? (
                          <Flag ok={false}>Deleted</Flag>
                        ) : (
                          <Flag ok={org.isActive}>{org.isActive ? 'Active' : 'Suspended'}</Flag>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {!deleted && (
                            <button
                              type="button"
                              onClick={() =>
                                setFlag.mutate({
                                  id: org.id,
                                  flag: 'active',
                                  value: !org.isActive,
                                })
                              }
                              className="rounded-lg border border-white/10 px-3 py-1.5 text-body text-ink-muted transition-colors hover:text-ink"
                            >
                              {org.isActive ? 'Suspend' : 'Reinstate'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setFlag.mutate({ id: org.id, flag: 'deleted', value: !deleted })
                            }
                            title={deleted ? 'Bring back' : 'Soft delete'}
                            className={`rounded-lg p-2 transition-colors ${
                              deleted
                                ? 'text-ink-muted hover:bg-on-track/15 hover:text-on-track'
                                : 'text-ink-muted hover:bg-overdue/15 hover:text-overdue'
                            }`}
                          >
                            {deleted ? (
                              <RotateCcw className="size-4" strokeWidth={1.75} />
                            ) : (
                              <Trash2 className="size-4" strokeWidth={1.75} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
