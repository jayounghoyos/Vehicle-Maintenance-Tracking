import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

import type { Sort } from '../hooks/useMultiSort';

/**
 * One sortable column heading.
 *
 * The arrow is always drawn, never only on hover: one that appears when
 * the cursor arrives is one nobody knows is there, and the heading then
 * reads as plain text rather than a control.
 */
export function SortHeader<K extends string>({
  label,
  sort,
  rank,
  showRank,
  ascendingLabel = 'A to Z',
  descendingLabel = 'Z to A',
  onClick,
}: {
  label: string;
  sort: Sort<K> | undefined;
  /** where this column sits in the order, once more than one is on */
  rank: number;
  showRank: boolean;
  /** what the two directions mean here: dates are not alphabetical */
  ascendingLabel?: string;
  descendingLabel?: string;
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
            ? `Sorted ${sort.ascending ? ascendingLabel : descendingLabel}. Click to flip, once more to stop sorting by ${label.toLowerCase()}`
            : `Sort by ${label.toLowerCase()}`
        }
        className={`flex items-center gap-1.5 text-table-label font-semibold uppercase transition-colors ${
          sort ? 'text-ink' : 'text-ink-muted hover:text-ink'
        }`}
      >
        {label}
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
