/**
 * What a row looks like when pressing it does something.
 *
 * The three dashboard panels each open something now, and each was
 * answering the pointer differently: two percent here, three there, and
 * nothing at all in the third. At those values the highlight does not
 * read on the panel's own background, which is how a row ends up
 * pressable and still looking inert.
 *
 * Five percent is what every other control in the app already uses on
 * hover, so a row answers the pointer the way a button does. No colour
 * is involved: the manual keeps the three hues for maintenance state.
 *
 * Spelled out rather than assembled: Tailwind reads the source for class
 * names, so an interpolated one would never be generated.
 */
export const PRESSABLE_ROW = 'group cursor-pointer transition-colors hover:bg-white/5';

/** The chevron inside one. On the rows that have it, it is where the eye
 *  already is, so it brightens with the row rather than staying muted. */
export const PRESSABLE_CHEVRON =
  'size-4 shrink-0 text-ink-muted transition-colors group-hover:text-ink';
