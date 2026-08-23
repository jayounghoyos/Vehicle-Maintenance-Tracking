import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Download,
  RotateCcw,
  Search,
  Trash2,
  UserMinus,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { toCsv, downloadCsv } from '../lib/csv';
import { initials, roleLabel, shortDate } from '../lib/format';
import type { TeamMember } from '../lib/api';

const ROLES = ['fleet_coordinator', 'mechanic', 'operations_manager'] as const;

/** Rank, not alphabet: sorting by role should put the person who runs
 *  the fleet at the top, not the one whose title starts with F. */
const ROLE_RANK = new Map(ROLES.map((role, index) => [role as string, index]));

type SortKey = 'person' | 'email' | 'role' | 'added';
type Sort = { key: SortKey; ascending: boolean };

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'person', label: 'Person' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'added', label: 'Added' },
];

function compare(a: TeamMember, b: TeamMember, key: SortKey): number {
  switch (key) {
    case 'person':
      return a.fullName.localeCompare(b.fullName);
    case 'email':
      return a.email.localeCompare(b.email);
    case 'role':
      return (ROLE_RANK.get(a.role) ?? 0) - (ROLE_RANK.get(b.role) ?? 0);
    case 'added':
      return a.createdAt.localeCompare(b.createdAt);
  }
}

function SortHeader({
  label,
  active,
  ascending,
  onClick,
}: {
  label: string;
  active: boolean;
  ascending: boolean;
  onClick: () => void;
}) {
  const Icon = active ? (ascending ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <th className="px-5 py-3 text-left">
      <button
        type="button"
        onClick={onClick}
        aria-sort={active ? (ascending ? 'ascending' : 'descending') : 'none'}
        className={`group flex items-center gap-1.5 text-table-label font-semibold uppercase transition-colors ${
          active ? 'text-ink' : 'text-ink-muted hover:text-ink'
        }`}
      >
        {label}
        <Icon
          className={`size-3.5 transition-opacity ${
            active ? 'text-lime' : 'opacity-0 group-hover:opacity-60'
          }`}
          strokeWidth={2.25}
        />
      </button>
    </th>
  );
}

export function MemberTable({
  members,
  canManage,
  meId,
  busyId,
  onRoleChange,
  onSetActive,
  onRemove,
}: {
  members: TeamMember[];
  canManage: boolean;
  meId: number | null;
  /** the row waiting on the API, so its controls stop accepting clicks */
  busyId: number | null;
  onRoleChange: (member: TeamMember, role: string) => void;
  onSetActive: (member: TeamMember, active: boolean) => void;
  onRemove: (member: TeamMember) => void;
}) {
  const [query, setQuery] = useState('');
  // newest first: after an import, the people you just added are the
  // ones you want to look at
  const [sort, setSort] = useState<Sort>({ key: 'added', ascending: false });

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle
      ? members.filter((member) =>
          [member.fullName, member.email, roleLabel(member.role)]
            .join(' ')
            .toLowerCase()
            .includes(needle),
        )
      : members;
    return [...matched].sort(
      (a, b) => compare(a, b, sort.key) * (sort.ascending ? 1 : -1),
    );
  }, [members, query, sort]);

  const toggle = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, ascending: !current.ascending }
        : { key, ascending: key !== 'added' },
    );

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
          roleLabel(member.role),
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
                  active={sort.key === key}
                  ascending={sort.ascending}
                  onClick={() => toggle(key)}
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
                  <td className="px-5 py-3.5 text-body whitespace-nowrap">
                    {canManage && !isMe && member.active ? (
                      <select
                        value={member.role}
                        disabled={busy}
                        onChange={(event) => onRoleChange(member, event.target.value)}
                        className="rounded-lg border border-white/10 bg-page/60 px-2.5 py-1.5 text-body text-ink transition-colors hover:border-white/20 focus:border-lime/40 focus:outline-none disabled:opacity-50"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role} className="bg-panel">
                            {roleLabel(role)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-ink-muted">{roleLabel(member.role)}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-body whitespace-nowrap text-ink-muted">
                    {shortDate(member.createdAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    {/* nothing may be done to your own account: a
                        coordinator who retires or demotes themselves
                        could leave an organization nobody administers */}
                    {canManage && !isMe && (
                      <div className="flex justify-end gap-1">
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
                        {/* permanent, so only for an account nothing is
                            attached to yet */}
                        {member.recordedEvents === 0 && (
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
