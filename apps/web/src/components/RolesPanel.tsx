import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  type Permission,
} from '../auth/permissions';
import { useRoles } from '../hooks/useRoles';
import { api, type RoleSummary } from '../lib/api';
import { useToast } from '../toast/context';
import { Panel } from './Panel';

type Draft = { id: number | null; name: string; permissions: Permission[] };

const BLANK: Draft = { id: null, name: '', permissions: [] };

export function RolesPanel({ canManage }: { canManage: boolean }) {
  const { data: roles, isPending } = useRoles();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);

  const refresh = () => {
    // the team table prints role names and the counts come from it, so
    // both are stale the moment a role changes
    void queryClient.invalidateQueries({ queryKey: ['roles'] });
    void queryClient.invalidateQueries({ queryKey: ['team'] });
  };
  const failed = (err: unknown, fallback: string) =>
    toast.show(err instanceof Error ? err.message : fallback, 'failed');

  const save = useMutation({
    mutationFn: ({ id, name, permissions }: Draft) =>
      id === null
        ? api.post<RoleSummary>('/roles', { name, permissions })
        : api.patch<RoleSummary>(`/roles/${id}`, { name, permissions }),
    onSuccess: (role, sent) => {
      setDraft(null);
      toast.show(sent.id === null ? `${role.name} is ready to assign` : 'Role saved');
      refresh();
    },
    onError: (err: unknown) => failed(err, 'Could not save the role'),
  });

  const remove = useMutation({
    mutationFn: (role: RoleSummary) => api.del(`/roles/${role.id}`),
    onSuccess: (_result, role) => {
      toast.show(`${role.name} is gone`);
      refresh();
    },
    onError: (err: unknown) => failed(err, 'Could not remove the role'),
  });

  return (
    <Panel
      title="Roles"
      subtitle={
        canManage
          ? 'What each job title in this organization is allowed to do'
          : 'What each job title here is allowed to do, as set by whoever staffs it'
      }
      action={
        canManage ? (
          <button
            type="button"
            data-tour="role-add"
            onClick={() => setDraft(draft?.id === null ? null : BLANK)}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-body text-ink-muted transition-colors hover:text-ink"
          >
            <Plus className="size-4" strokeWidth={1.75} />
            New role
          </button>
        ) : undefined
      }
    >
      {isPending ? (
        <p className="px-5 pb-6 text-body text-ink-muted">Loading the roles…</p>
      ) : (
        <ul className="divide-y divide-white/5 border-t border-white/5">
          {draft?.id === null && (
            <li className="px-5 py-4">
              <RoleForm
                draft={draft}
                busy={save.isPending}
                onChange={setDraft}
                onSubmit={() => save.mutate(draft)}
                onCancel={() => setDraft(null)}
              />
            </li>
          )}

          {(roles ?? []).map((role) => (
            <li key={role.id} className="px-5 py-4">
              {draft?.id === role.id ? (
                <RoleForm
                  draft={draft}
                  busy={save.isPending}
                  onChange={setDraft}
                  onSubmit={() => save.mutate(draft)}
                  onCancel={() => setDraft(null)}
                />
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {role.name}
                      <span className="ml-2 text-[12px] text-ink-muted">
                        {role.members === 1 ? '1 person' : `${role.members} people`}
                      </span>
                    </p>
                    <p className="mt-1 text-body text-ink-muted">
                      {role.permissions.length === 0
                        ? 'Can open the dashboard and nothing else'
                        : role.permissions
                            .map((one) => PERMISSION_LABELS[one])
                            .join(' · ')}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            id: role.id,
                            name: role.name,
                            permissions: [...role.permissions],
                          })
                        }
                        title={`Edit ${role.name}`}
                        className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
                      >
                        <Pencil className="size-4" strokeWidth={1.75} />
                      </button>
                      {/* a role somebody holds cannot be deleted, so the
                          button is not there to be explained away */}
                      {role.members === 0 && (
                        <button
                          type="button"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(role)}
                          title={`Delete ${role.name}`}
                          className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-overdue/15 hover:text-overdue disabled:opacity-40"
                        >
                          <Trash2 className="size-4" strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function RoleForm({
  draft,
  busy,
  onChange,
  onSubmit,
  onCancel,
}: {
  draft: Draft;
  busy: boolean;
  onChange: (draft: Draft) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const toggle = (permission: Permission) =>
    onChange({
      ...draft,
      permissions: draft.permissions.includes(permission)
        ? draft.permissions.filter((one) => one !== permission)
        : [...draft.permissions, permission],
    });

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-body text-ink-muted">Name</span>
        <input
          value={draft.name}
          autoFocus
          required
          maxLength={60}
          placeholder="Warehouse supervisor"
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          className="w-full max-w-sm rounded-xl border border-white/10 bg-page/60 px-3.5 py-2.5 text-body placeholder:text-ink-muted/60 focus:border-lime/40 focus:outline-none"
        />
      </label>

      {PERMISSION_GROUPS.map((group) => (
        <fieldset key={group.title}>
          <legend className="mb-2 text-nav-label font-semibold text-ink-muted uppercase">
            {group.title}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.permissions.map((permission) => (
              <label
                key={permission}
                className="flex items-center gap-2.5 text-body text-ink-muted"
              >
                <input
                  type="checkbox"
                  checked={draft.permissions.includes(permission)}
                  onChange={() => toggle(permission)}
                  className="size-4 accent-lime"
                />
                {PERMISSION_LABELS[permission]}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-page disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save role'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-body text-ink-muted transition-colors hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
