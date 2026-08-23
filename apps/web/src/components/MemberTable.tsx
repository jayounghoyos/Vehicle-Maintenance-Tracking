import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Download,
  Pencil,
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

/* Dates read newest first, everything else reads forwards. */
const startsAscending = (key: SortKey) => key !== 'added';

/** How the list arrives: after an import, the rows worth looking at are
 *  the ones that were just created. */
const DEFAULT_SORT: Sort = { key: 'added', ascending: false };

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
  sort,
  rank,
  showRank,
  onClick,
}: {
  label: string;
  sort: Sort | undefined;
  /** where this column sits in the order, once more than one is on */
  rank: number;
  showRank: boolean;
  onClick: () => void;
}) {
  const Icon = sort ? (sort.ascending ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <th className="px-5 py-3 text-left">
      <button
        type="button"
        onClick={onClick}
        aria-sort={sort ? (sort.ascending ? 'ascending' : 'descending') : 'none'}
        title={
          sort
            ? `Sorted ${sort.ascending ? 'A to Z' : 'Z to A'}. Click to flip, once more to stop sorting by ${label.toLowerCase()}`
            : `Sort by ${label.toLowerCase()}`
        }
        className={`flex items-center gap-1.5 text-table-label font-semibold uppercase transition-colors ${
          sort ? 'text-ink' : 'text-ink-muted hover:text-ink'
        }`}
      >
        {label}
        {/* always drawn, never only on hover: an arrow that appears when
            the cursor arrives is an arrow nobody knows is there, and the
            heading reads as plain text instead of a control */}
        <Icon
          className={`size-3.5 ${sort ? 'text-lime' : 'text-ink-muted/50'}`}
          strokeWidth={2.25}
        />
        {sort && showRank && (
          <span className="text-[10px] leading-none font-bold text-lime tabular-nums">
            {rank}
          </span>
        )}
      </button>
    </th>
  );
}

export function MemberTable({
  members,
  canManage,
  meId,
  busyId,
  onEdit,
  onRoleChange,
  onSetActive,
  onRemove,
}: {
  members: TeamMember[];
  canManage: boolean;
  meId: number | null;
  /** the row waiting on the API, so its controls stop accepting clicks */
  busyId: number | null;
  onEdit: (member: TeamMember) => void;
  onRoleChange: (member: TeamMember, role: string) => void;
  onSetActive: (member: TeamMember, active: boolean) => void;
  onRemove: (member: TeamMember) => void;
}) {
  const [query, setQuery] = useState('');
  // a list, not one key: pressing a second heading adds to the order
  // rather than replacing it, so Role then Person reads as everyone
  // grouped by role and alphabetical inside each group
  const [sorts, setSorts] = useState<Sort[]>([DEFAULT_SORT]);
  // the starting order is ours, not theirs. Without this the first
  // heading anybody presses queues behind Added and appears to do
  // nothing at all
  const [chosen, setChosen] = useState(false);

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
    // the fallback keeps the order stable once every heading is off
    const order = sorts.length > 0 ? sorts : [DEFAULT_SORT];
    return [...matched].sort((a, b) => {
      for (const { key, ascending } of order) {
        const decided = compare(a, b, key) * (ascending ? 1 : -1);
        if (decided !== 0) return decided;
      }
      // a whole import shares one timestamp, so without this the rows
      // that tie shuffle every time the list is fetched
      return a.id - b.id;
    });
  }, [members, query, sorts]);

  /* Off, then the natural direction, then the other one, then off
     again. Three states, so a heading pressed by mistake can be undone
     with the same finger. */
  const toggle = (key: SortKey) => {
    if (!chosen) {
      setChosen(true);
      setSorts((current) =>
        key === DEFAULT_SORT.key
          ? [{ key, ascending: !current[0].ascending }]
          : [{ key, ascending: startsAscending(key) }],
      );
      return;
    }
    setSorts((current) => {
      const existing = current.find((sort) => sort.key === key);
      if (!existing) return [...current, { key, ascending: startsAscending(key) }];
      if (existing.ascending === startsAscending(key)) {
        return current.map((sort) =>
          sort.key === key ? { key, ascending: !sort.ascending } : sort,
        );
      }
      return current.filter((sort) => sort.key !== key);
    });
  };

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
                  sort={sorts.find((sort) => sort.key === key)}
                  rank={sorts.findIndex((sort) => sort.key === key) + 1}
                  showRank={sorts.length > 1}
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
                    {canManage && (
                      <div className="flex justify-end gap-1">
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
