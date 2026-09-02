import { Download, Pencil, RotateCcw, Search, Trash2, UserMinus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { sortRows, useMultiSort, type Sort } from '../hooks/useMultiSort';
import { toCsv, downloadCsv } from '../lib/csv';
import { initials, shortDate } from '../lib/format';
import type { RoleSummary, TeamMember } from '../lib/api';
import { SortHeader } from './SortHeader';

type SortKey = 'person' | 'email' | 'role' | 'added';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'person', label: 'Person' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'added', label: 'Added' },
];

/* Dates read newest first, everything else reads forwards. */
const startsAscending = (key: SortKey) => key !== 'added';

/** How the list arrives: after an import, the rows worth looking at are
 *  the ones that were just created. */
const DEFAULT_SORT: Sort<SortKey> = { key: 'added', ascending: false };

/** Rank, not alphabet: sorting by role should follow the order the
 *  organization made them in, which puts whoever runs the fleet at the
 *  top rather than whoever's title starts with A. */
function compare(
  a: TeamMember,
  b: TeamMember,
  key: SortKey,
  rank: Map<number, number>,
): number {
  switch (key) {
    case 'person':
      return a.fullName.localeCompare(b.fullName);
    case 'email':
      return a.email.localeCompare(b.email);
    case 'role':
      return (rank.get(a.roleId) ?? 0) - (rank.get(b.roleId) ?? 0);
    case 'added':
      return a.createdAt.localeCompare(b.createdAt);
  }
}

export function MemberTable({
  members,
  roles,
  canManage,
  meId,
  busyId,
  onEdit,
  onRoleChange,
  onSetActive,
  onRemove,
}: {
  members: TeamMember[];
  /** the organization's own, in the order it made them */
  roles: RoleSummary[];
  canManage: boolean;
  meId: number | null;
  /** the row waiting on the API, so its controls stop accepting clicks */
  busyId: number | null;
  onEdit: (member: TeamMember) => void;
  onRoleChange: (member: TeamMember, roleId: number) => void;
  onSetActive: (member: TeamMember, active: boolean) => void;
  onRemove: (member: TeamMember) => void;
}) {
  const [query, setQuery] = useState('');
  const sort = useMultiSort<SortKey>({ defaultSort: DEFAULT_SORT, startsAscending });

  const rank = useMemo(
    () => new Map(roles.map((role, index) => [role.id, index])),
    [roles],
  );

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle
      ? members.filter((member) =>
          [member.fullName, member.email, member.roleName]
            .join(' ')
            .toLowerCase()
            .includes(needle),
        )
      : members;
    return sortRows(matched, sort.order, (a, b, key) => compare(a, b, key, rank));
  }, [members, query, rank, sort.order]);

  const exportAll = () =>
    downloadCsv(
      'team.csv',
      // everybody, not the filtered view, and never a password: those
      // exist in readable form once and are not kept anywhere
      toCsv(
        ['Full name', 'Email', 'Role', 'Status', 'Added'],
        members.map((member) => [
          member.fullName,
          member.email,
          member.roleName,
          member.active ? 'Active' : 'Retired',
          shortDate(member.createdAt),
        ]),
      ),
    );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-5 py-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or role"
            className="w-full rounded-xl border border-white/10 bg-page/60 py-2 pr-4 pl-10 text-body placeholder:text-ink-muted focus:border-lime/40 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={exportAll}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-body text-ink-muted transition-colors hover:text-ink"
        >
          <Download className="size-4" strokeWidth={1.75} />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto border-t border-white/5">
        <table className="w-full min-w-[620px] text-left">
          <thead>
            <tr className="border-b border-white/5">
              {COLUMNS.map(({ key, label }) => (
                <SortHeader
                  key={key}
                  label={label}
                  sort={sort.find(key)}
                  rank={sort.rankOf(key)}
                  showRank={sort.showRank}
                  ascendingLabel={key === 'added' ? 'oldest first' : 'A to Z'}
                  descendingLabel={key === 'added' ? 'newest first' : 'Z to A'}
                  onClick={() => sort.toggle(key)}
                />
              ))}
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {shown.map((member) => {
              const isMe = member.id === meId;
              const busy = busyId === member.id;
              return (
                <tr
                  key={member.id}
                  className={`transition-opacity ${member.active ? '' : 'opacity-45'} ${
                    busy ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-[12px] font-semibold">
                        {initials(member.fullName)}
                      </span>
                      <span className="font-medium whitespace-nowrap">
                        {member.fullName}
                        {isMe && (
                          <span className="ml-2 text-[12px] text-ink-muted">you</span>
                        )}
                        {!member.active && (
                          // neutral: the manual keeps orange, amber and
                          // green for maintenance state and nothing else
                          <span className="ml-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                            Retired
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-body text-ink-muted">{member.email}</td>
                  <td
                    data-tour={member.id === shown[0]?.id ? 'member-role' : undefined}
                    className="px-5 py-3.5 text-body whitespace-nowrap"
                  >
                    {canManage && !isMe && member.active ? (
                      <select
                        value={member.roleId}
                        disabled={busy}
                        onChange={(event) =>
                          onRoleChange(member, Number(event.target.value))
                        }
                        className="rounded-lg border border-white/10 bg-page/60 px-2.5 py-1.5 text-body text-ink transition-colors hover:border-white/20 focus:border-lime/40 focus:outline-none disabled:opacity-50"
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id} className="bg-panel">
                            {role.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-ink-muted">{member.roleName}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-body whitespace-nowrap text-ink-muted">
                    {shortDate(member.createdAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    {canManage && (
                      <div
                        data-tour={
                          member.id === shown[0]?.id ? 'member-actions' : undefined
                        }
                        className="flex justify-end gap-1"
                      >
                        {/* your own name, email and password are yours to
                            change; your role and whether you still work
                            here are not */}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onEdit(member)}
                          title={`Edit ${member.fullName}`}
                          className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink disabled:opacity-40"
                        >
                          <Pencil className="size-4" strokeWidth={1.75} />
                        </button>
                        {!isMe && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onSetActive(member, !member.active)}
                            title={
                              member.active
                                ? `Retire ${member.fullName}`
                                : `Bring ${member.fullName} back`
                            }
                            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-white/5 hover:text-ink disabled:opacity-40"
                          >
                            {member.active ? (
                              <UserMinus className="size-4" strokeWidth={1.75} />
                            ) : (
                              <RotateCcw className="size-4" strokeWidth={1.75} />
                            )}
                          </button>
                        )}
                        {/* permanent, so only for an account nothing is
                            attached to yet */}
                        {!isMe && member.recordedEvents === 0 && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => onRemove(member)}
                            title={`Delete ${member.fullName}`}
                            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-overdue/15 hover:text-overdue disabled:opacity-40"
                          >
                            <Trash2 className="size-4" strokeWidth={1.75} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {shown.length === 0 && (
          <p className="px-5 py-8 text-center text-body text-ink-muted">
            Nobody matches {`"${query}"`}.
          </p>
        )}
      </div>
    </>
  );
}
