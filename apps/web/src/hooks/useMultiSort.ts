import { useState } from 'react';

export type Sort<K extends string> = { key: K; ascending: boolean };

type Options<K extends string> = {
  /** how the list arrives before anybody presses anything */
  defaultSort: Sort<K>;
  /** which way a column reads first: dates newest first, names forwards */
  startsAscending: (key: K) => boolean;
};

export type MultiSort<K extends string> = {
  sorts: Sort<K>[];
  /** the order to actually sort by, never empty */
  order: Sort<K>[];
  find: (key: K) => Sort<K> | undefined;
  rankOf: (key: K) => number;
  showRank: boolean;
  toggle: (key: K) => void;
};

/**
 * Sorting a table by more than one column at once.
 *
 * Pressing a second heading adds to the order rather than replacing it,
 * so Role then Person reads as everybody grouped by role and
 * alphabetical inside each group.
 *
 * Each heading cycles through three states: off, its natural direction,
 * the other one, off again. Three, so a heading pressed by mistake can
 * be undone with the same finger.
 *
 * The first heading pressed replaces the order the list arrived in
 * rather than queueing behind it. Without that, the first press appears
 * to do nothing at all, because the default still decides everything.
 */
export function useMultiSort<K extends string>({
  defaultSort,
  startsAscending,
}: Options<K>): MultiSort<K> {
  const [sorts, setSorts] = useState<Sort<K>[]>([defaultSort]);
  const [chosen, setChosen] = useState(false);

  const toggle = (key: K) => {
    if (!chosen) {
      setChosen(true);
      setSorts((current) =>
        key === defaultSort.key
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

  return {
    sorts,
    // the fallback keeps the order stable once every heading is off
    order: sorts.length > 0 ? sorts : [defaultSort],
    find: (key) => sorts.find((sort) => sort.key === key),
    rankOf: (key) => sorts.findIndex((sort) => sort.key === key) + 1,
    showRank: sorts.length > 1,
    toggle,
  };
}

/**
 * Sorts by that order, breaking ties on id.
 *
 * The tie-break is not decoration: a whole import shares one timestamp,
 * so without it the rows that tie shuffle every time the list is
 * fetched.
 */
export function sortRows<K extends string, T extends { id: number }>(
  rows: T[],
  order: Sort<K>[],
  compare: (a: T, b: T, key: K) => number,
): T[] {
  return [...rows].sort((a, b) => {
    for (const { key, ascending } of order) {
      const decided = compare(a, b, key) * (ascending ? 1 : -1);
      if (decided !== 0) return decided;
    }
    return a.id - b.id;
  });
}
