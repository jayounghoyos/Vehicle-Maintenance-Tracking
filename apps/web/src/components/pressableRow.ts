/** What a row looks like when pressing it does something. Five percent
 *  is the hover every other control already uses; the panels were each
 *  picking their own, low enough to look inert. Spelled out because
 *  Tailwind reads the source for class names. */
export const PRESSABLE_ROW = 'group cursor-pointer transition-colors hover:bg-white/5';

/** The chevron inside one: it brightens with the row. */
export const PRESSABLE_CHEVRON =
  'size-4 shrink-0 text-ink-muted transition-colors group-hover:text-ink';
