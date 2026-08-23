import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '../auth/context';
import { can } from '../auth/permissions';
import { AppShell } from '../components/AppShell';
import { Field } from '../components/AuthLayout';
import { Panel } from '../components/Panel';
import { SidebarFooter } from '../components/SidebarFooter';
import { WorkspaceTabs } from '../components/WorkspaceTabs';
import { api, type OrganizationProfile } from '../lib/api';
import { shortDate } from '../lib/format';

const FIELDS = [
  { name: 'name', label: 'Organization name', type: 'text' },
  { name: 'ownerName', label: 'Director', type: 'text' },
  { name: 'address', label: 'Address', type: 'text' },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'email', label: 'Contact email', type: 'email' },
] as const;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-white/5 px-5 py-3.5 lg:px-0">
      <dt className="text-body text-ink-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

export default function Organization() {
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canEdit = can(principal, 'editOrganization');

  const { data: org, isPending } = useQuery({
    queryKey: ['organization'],
    queryFn: () => api.get<OrganizationProfile>('/organization'),
  });

  const save = useMutation({
    mutationFn: (body: Record<string, string>) =>
      api.patch<OrganizationProfile>('/organization', body),
    onSuccess: (updated) => {
      // written straight into the cache: the answer is the new row, so
      // asking the API for it again would only repeat what it just said
      queryClient.setQueryData(['organization'], updated);
      setEditing(false);
      setError(null);
    },
    onError: (err: unknown) =>
      setError(err instanceof Error ? err.message : 'Could not save the changes'),
  });

  const me = principal?.kind === 'user' ? principal : null;

  return (
    <AppShell
      title="Organization"
      subtitle="The details this account is registered with"
      sidebarFooter={me ? <SidebarFooter user={me} /> : undefined}
    >
      {/* the tabs sit either side of the same width, so switching
          between them does not resize the page under the cursor */}
      <div className="space-y-5">
        <WorkspaceTabs />

        {error && (
          <p className="rounded-xl bg-overdue/15 px-4 py-3 text-body text-overdue">
            {error}
          </p>
        )}

        <Panel
          title="Details"
          subtitle={
            canEdit
              ? 'Who the platform calls about this account'
              : 'Only the fleet coordinator can change these'
          }
          action={
            canEdit && !editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-body text-ink-muted transition-colors hover:text-ink"
              >
                <Pencil className="size-4" strokeWidth={1.75} />
                Edit
              </button>
            ) : undefined
          }
        >
          {isPending || !org ? (
            <p className="px-5 pb-6 text-body text-ink-muted">
              Loading the organization…
            </p>
          ) : editing ? (
            <form
              className="grid gap-4 border-t border-white/5 bg-white/[0.02] p-5 sm:grid-cols-2 xl:grid-cols-3"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                save.mutate(Object.fromEntries(form) as Record<string, string>);
              }}
            >
              {FIELDS.map(({ name, label, type }) => (
                // the wrapper carries the span: Field owns the input's
                // own class, so a className here would be swallowed
                <div
                  key={name}
                  className={
                    name === 'address' ? 'sm:col-span-2 xl:col-span-1' : undefined
                  }
                >
                  <Field
                    label={label}
                    name={name}
                    type={type}
                    defaultValue={org[name]}
                    required
                  />
                </div>
              ))}
              <div className="flex gap-3 sm:col-span-2 xl:col-span-3">
                <button
                  type="submit"
                  disabled={save.isPending}
                  className="rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-page disabled:opacity-50"
                >
                  {save.isPending ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setError(null);
                  }}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-body text-ink-muted transition-colors hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <dl className="grid border-t border-white/5 lg:grid-cols-2 lg:gap-x-8 lg:px-5">
              {FIELDS.map(({ name, label }) => (
                <Row key={name} label={label} value={org[name]} />
              ))}
              <Row label="Members" value={org.memberCount} />
              <Row label="Client since" value={shortDate(org.createdAt)} />
            </dl>
          )}
        </Panel>

        <p className="text-body text-ink-muted">
          The contact email is not a login. People sign in with their own address, which
          is why suspending the organization is the platform admin's decision and not one
          that can be made from here.
        </p>
      </div>
    </AppShell>
  );
}
