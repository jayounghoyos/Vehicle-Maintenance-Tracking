/**
 * One width for every panel, and the same grid whether one is open or
 * not, so switching from Add member to Import many does not resize the
 * list beside them. Only the column width changes, and it is animated,
 * so the list slides instead of jumping.
 *
 * Spelled out rather than assembled: Tailwind reads the source for class
 * names, so an interpolated width would never be generated.
 */
const BASE =
  'grid items-start gap-5 transition-[grid-template-columns] duration-300 ease-out';

export const PANEL_LAYOUT = {
  open: `${BASE} xl:grid-cols-[minmax(0,1fr)_32rem]`,
  closed: `${BASE} xl:grid-cols-[minmax(0,1fr)_0rem]`,
};

/** The same, for a page whose reading column should not run the full
 *  width of a wide screen. */
export const NARROW_PANEL_LAYOUT = {
  open: `${BASE} xl:grid-cols-[minmax(0,44rem)_32rem]`,
  closed: `${BASE} xl:grid-cols-[minmax(0,44rem)_0rem]`,
};
