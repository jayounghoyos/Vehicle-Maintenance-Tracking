import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Upload, UserPlus } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '../auth/context';
import { can } from '../auth/permissions';
import { AppShell } from '../components/AppShell';
import { Field } from '../components/AuthLayout';
import { ImportTeam } from '../components/ImportTeam';
import { Panel } from '../components/Panel';
import { SidebarFooter } from '../components/SidebarFooter';
import { SidePanel } from '../components/SidePanel';
import { WorkspaceTabs } from '../components/WorkspaceTabs';
import { api, type TeamMember } from '../lib/api';
import { initials, roleLabel, shortDate } from '../lib/format';

const ROLES = ['fleet_coordinator', 'mechanic', 'operations_manager'] as const;

/* Written out rather than assembled from a variable: Tailwind reads the
 * source for class names, so an interpolated width would never be
 * generated. The import takes the wider one, for its example table. */
const LAYOUT = {
  none: '',
  add: 'grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]',
  import: 'grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_34rem]',
};

export default function Team() {
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<'add' | 'import' | null>(null);
  // the mechanic and the operations manager see their colleagues; who
  // holds an account is not a secret from them, it is just not theirs
  // to change
  const canManage = can(principal, 'manageTeam');

  const { data: members, isPending } = useQuery({
    queryKey: ['team'],
    queryFn: () => api.get<TeamMember[]>('/team'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['team'] });
  const close = () => {
    setPanel(null);
    setError(null);
  };

  const create = useMutation({
    mutationFn: (body: Record<string, string>) => api.post<TeamMember>('/team', body),
    onSuccess: () => {
      close();
      void invalidate();
    },
    onError: (err: unknown) =>
      setError(err instanceof Error ? err.message : 'Could not create the account'),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/team/${id}`),
    onSuccess: invalidate,
    onError: (err: unknown) =>
      setError(err instanceof Error ? err.message : 'Could not remove the account'),
  });

  const me = principal?.kind === 'user' ? principal : null;

  return (
    <AppShell
      title="Team"
      subtitle="Who can sign in to this organization"
      sidebarFooter={me ? <SidebarFooter user={me} /> : undefined}
    >
      <div className="space-y-5">
        <WorkspaceTabs />

        {error && (
          <p className="rounded-xl bg-overdue/15 px-4 py-3 text-body text-overdue">
            {error}
          </p>
        )}

        <div className={LAYOUT[panel ?? 'none']}>
          <Panel
            title="Members"
            subtitle={
              canManage
                ? 'Everyone with an account in this organization'
                : 'Only the fleet coordinator can add or remove accounts'
            }
            action={
              canManage ? (
                <div className="flex items-center gap-2">
                  {/* next to Add member rather than behind a menu: the
                      coordinator staffing a fleet reaches for this first */}
                  <button
                    type="button"
                    onClick={() => setPanel(panel === 'import' ? null : 'import')}
                    className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-body text-ink-muted transition-colors hover:text-ink"
                  >
                    <Upload className="size-4" strokeWidth={1.75} />
                    Import many
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanel(panel === 'add' ? null : 'add')}
                    className="flex items-center gap-2 rounded-xl bg-lime px-3.5 py-2 text-body font-semibold text-page transition-opacity hover:opacity-90"
                  >
                    <UserPlus className="size-4" strokeWidth={2.5} />
                    Add member
                  </button>
                </div>
              ) : undefined
            }
          >
            {isPending ? (
              <p className="px-5 pb-6 text-body text-ink-muted">Loading the team…</p>
            ) : (
              <div className="overflow-x-auto border-t border-white/5">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Person', 'Email', 'Role', 'Added', ''].map((heading) => (
                        <th
                          key={heading}
                          className="px-5 py-3 text-table-label font-semibold text-ink-muted uppercase"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {members?.map((member) => (
                      <tr key={member.id}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-[12px] font-semibold">
                              {initials(member.fullName)}
                            </span>
                            <span className="font-medium whitespace-nowrap">
                              {member.fullName}
                              {member.id === me?.id && (
                                <span className="ml-2 text-[12px] text-ink-muted">
                                  you
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-body text-ink-muted">
                          {member.email}
                        </td>
                        <td className="px-5 py-3.5 text-body whitespace-nowrap text-ink-muted">
                          {roleLabel(member.role)}
                        </td>
                        <td className="px-5 py-3.5 text-body whitespace-nowrap text-ink-muted">
                          {shortDate(member.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          {/* removing yourself would lock the organization
                              out of itself */}
                          {canManage && member.id !== me?.id && (
                            <button
                              type="button"
                              onClick={() => remove.mutate(member.id)}
                              title={`Remove ${member.fullName}`}
                              className="ml-auto flex rounded-lg p-2 text-ink-muted transition-colors hover:bg-overdue/15 hover:text-overdue"
                            >
                              <Trash2 className="size-4" strokeWidth={1.75} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {panel === 'add' && canManage && (
            <SidePanel
              title="Add member"
              subtitle="One account, made now"
              onClose={close}
            >
              <form
                className="grid gap-4 p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  create.mutate(Object.fromEntries(form) as Record<string, string>);
                }}
              >
                <Field label="Full name" name="fullName" required />
                <Field label="Email" name="email" type="email" required />
                <Field
                  label="Password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                />
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
                <button
                  type="submit"
                  disabled={create.isPending}
                  className="mt-1 rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-page disabled:opacity-50"
                >
                  {create.isPending ? 'Creating…' : 'Create account'}
                </button>
              </form>
            </SidePanel>
          )}

          {panel === 'import' && canManage && (
            <SidePanel
              title="Import many"
              subtitle="Straight from your spreadsheet"
              onClose={close}
            >
              <ImportTeam onImported={invalidate} />
            </SidePanel>
          )}
        </div>
      </div>
    </AppShell>
  );
}
