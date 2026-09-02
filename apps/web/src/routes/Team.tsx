import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, UserPlus } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '../auth/context';
import { can } from '../auth/permissions';
import { AppShell } from '../components/AppShell';
import { Field, Select } from '../components/AuthLayout';
import { ImportTeam } from '../components/ImportTeam';
import { MemberTable } from '../components/MemberTable';
import { Panel } from '../components/Panel';
import { RolesPanel } from '../components/RolesPanel';
import { SidebarFooter } from '../components/SidebarFooter';
import { PANEL_LAYOUT } from '../components/panelLayout';
import { SidePanel } from '../components/SidePanel';
import { WorkspaceTabs } from '../components/WorkspaceTabs';
import { useToast } from '../toast/context';
import { useRoles } from '../hooks/useRoles';
import { api, type TeamMember } from '../lib/api';

export default function Team() {
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [panel, setPanel] = useState<'add' | 'import' | null>(null);
  // the account whose form is open on the right, if any
  const [editing, setEditing] = useState<TeamMember | null>(null);
  // which row is waiting on the API, so its own controls go quiet
  // instead of the whole table
  const [busyId, setBusyId] = useState<number | null>(null);
  // everyone who can open this screen sees their colleagues; who holds
  // an account is not a secret from them, it is just not theirs to change
  const canManage = can(principal, 'manage_team');

  const { data: members, isPending } = useQuery({
    queryKey: ['team'],
    queryFn: () => api.get<TeamMember[]>('/team'),
  });
  const { data: roles } = useRoles();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['team'] });
  const failed = (err: unknown, fallback: string) =>
    toast.show(err instanceof Error ? err.message : fallback, 'failed');
  const close = () => {
    setPanel(null);
    setEditing(null);
  };

  const create = useMutation({
    mutationFn: (body: Record<string, string>) =>
      // every FormData value is a string, and the API wants the id it is
      api.post<TeamMember>('/team', { ...body, roleId: Number(body.roleId) }),
    onSuccess: (member) => {
      close();
      toast.show(`${member.fullName} can now sign in`);
      void invalidate();
    },
    onError: (err: unknown) => failed(err, 'Could not create the account'),
  });

  const change = useMutation({
    mutationFn: ({
      member,
      patch,
    }: {
      member: TeamMember;
      patch: {
        fullName?: string;
        email?: string;
        password?: string;
        roleId?: number;
        active?: boolean;
      };
    }) => {
      setBusyId(member.id);
      return api.patch<TeamMember>(`/team/${member.id}`, patch);
    },
    onSuccess: (updated, { patch }) => {
      close();
      toast.show(
        patch.roleId !== undefined
          ? `${updated.fullName} is now ${updated.roleName.toLowerCase()}`
          : patch.active !== undefined
            ? patch.active
              ? `${updated.fullName} can sign in again`
              : `${updated.fullName} can no longer sign in`
            : patch.password
              ? `${updated.fullName} has a new password`
              : `${updated.fullName} was updated`,
      );
      void invalidate();
    },
    onError: (err: unknown) => failed(err, 'Could not change the account'),
    onSettled: () => setBusyId(null),
  });

  const remove = useMutation({
    mutationFn: (member: TeamMember) => {
      setBusyId(member.id);
      return api.del(`/team/${member.id}`);
    },
    onSuccess: (_result, member) => {
      toast.show(`${member.fullName} was deleted`);
      void invalidate();
    },
    onError: (err: unknown) => failed(err, 'Could not remove the account'),
    onSettled: () => setBusyId(null),
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

        <div className={panel || editing ? PANEL_LAYOUT.open : PANEL_LAYOUT.closed}>
          <Panel
            title="Members"
            subtitle={
              canManage
                ? 'Everyone with an account in this organization'
                : 'Your role does not add or remove accounts'
            }
            action={
              canManage ? (
                <div className="flex items-center gap-2">
                  {/* next to Add member rather than behind a menu: the
                      coordinator staffing a fleet reaches for this first */}
                  <button
                    type="button"
                    data-tour="member-import"
                    onClick={() => {
                      setEditing(null);
                      setPanel(panel === 'import' ? null : 'import');
                    }}
                    className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-body text-ink-muted transition-colors hover:text-ink"
                  >
                    <Upload className="size-4" strokeWidth={1.75} />
                    Import many
                  </button>
                  <button
                    type="button"
                    data-tour="member-add"
                    onClick={() => {
                      setEditing(null);
                      setPanel(panel === 'add' ? null : 'add');
                    }}
                    className="flex items-center gap-2 rounded-xl bg-lime px-3.5 py-2 text-body font-semibold text-on-accent transition-opacity hover:opacity-90"
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
              <MemberTable
                members={members ?? []}
                roles={roles ?? []}
                canManage={canManage}
                meId={me?.id ?? null}
                busyId={busyId}
                onRoleChange={(member, roleId) =>
                  change.mutate({ member, patch: { roleId } })
                }
                onSetActive={(member, active) =>
                  change.mutate({ member, patch: { active } })
                }
                onEdit={(member) => {
                  setEditing(member);
                  setPanel(null);
                }}
                onRemove={(member) => remove.mutate(member)}
              />
            )}
          </Panel>

          {editing && canManage && (
            <SidePanel
              title="Edit account"
              subtitle={`How ${editing.fullName.split(' ')[0]} signs in`}
              onClose={close}
            >
              <form
                className="grid gap-4 p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const password = String(form.get('password') ?? '');
                  change.mutate({
                    member: editing,
                    patch: {
                      fullName: String(form.get('fullName')),
                      email: String(form.get('email')),
                      // an empty box means leave it alone, not blank it
                      ...(password ? { password } : {}),
                    },
                  });
                }}
              >
                <Field
                  label="Full name"
                  name="fullName"
                  defaultValue={editing.fullName}
                  required
                />
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  defaultValue={editing.email}
                  required
                />
                <Field
                  label="New password"
                  name="password"
                  type="password"
                  minLength={8}
                  placeholder="Leave empty to keep the current one"
                  autoComplete="new-password"
                />
                <p className="-mt-1 text-[12px] text-ink-muted">
                  A password cannot be read back, only replaced. Whatever you type here is
                  what you have to pass on.
                </p>
                <div className="mt-1 flex gap-3">
                  <button
                    type="submit"
                    disabled={change.isPending}
                    className="rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-on-accent disabled:opacity-50"
                  >
                    {change.isPending ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-body text-ink-muted transition-colors hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </SidePanel>
          )}

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
                <Select
                  label="Role"
                  name="roleId"
                  options={(roles ?? []).map((role) => ({
                    value: String(role.id),
                    label: role.name,
                  }))}
                />
                {/* an account has to be something, and until the roles
                    arrive there is nothing to be */}
                <button
                  type="submit"
                  disabled={create.isPending || !roles?.length}
                  className="mt-1 rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-on-accent disabled:opacity-50"
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

        <RolesPanel canManage={canManage} />
      </div>
    </AppShell>
  );
}
