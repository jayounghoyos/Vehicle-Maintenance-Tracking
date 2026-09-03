/** The accent in docs/design/mockups/brand_manual.png, which is what an
 *  organization that has not chosen one gets. */
export const DEFAULT_ACCENT = '#CFF255';

/** The two colours anything can sit on: the page, and plain white. */
const INK_ON_LIGHT = '#0A0B0C';
const INK_ON_DARK = '#FFFFFF';

/** Below this an accent stops reading as a button against the dark page
 *  and starts reading as a hole in it. WCAG's floor for large text. */
export const MIN_ACCENT_CONTRAST = 3;

function channels(hex: string): [number, number, number] | null {
  const match = /^#?([\da-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** WCAG relative luminance: the eye weights green far above blue, which
 *  is why a bright yellow needs dark text and a mid blue does not. */
function luminance(hex: string): number {
  const rgb = channels(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((raw) => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** What to write on top of the accent. Derived rather than chosen, so no
 *  client can pick a colour that makes their own buttons unreadable. */
export function readableOn(accent: string): string {
  return contrast(accent, INK_ON_LIGHT) >= contrast(accent, INK_ON_DARK)
    ? INK_ON_LIGHT
    : INK_ON_DARK;
}

export function isValidAccent(hex: string): boolean {
  return channels(hex) !== null;
}

/** True when the accent all but disappears against the page. Worth
 *  saying out loud, not worth refusing: it is their brand. */
export function isFaint(accent: string): boolean {
  return contrast(accent, INK_ON_LIGHT) < MIN_ACCENT_CONTRAST;
}

/** The square and wrench in public/favicon.svg, redrawn so the tab can
 *  take the client's colour. One drawing in two places: change both. */
const mark = (accent: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${accent}"/><g transform="translate(5 5) scale(.9166667)" fill="none" stroke="${readableOn(accent)}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/></g></svg>`;

/**
 * Repaints the interface by moving two custom properties, and the tab
 * with them.
 *
 * Everything accented reads --color-lime through Tailwind, so one
 * assignment reaches every button, the active nav item, the focus rings
 * and the guided tour. Null falls back to the brand manual.
 */
export function applyAccent(accent: string | null): void {
  const chosen = accent && isValidAccent(accent) ? accent : DEFAULT_ACCENT;
  const root = document.documentElement.style;
  root.setProperty('--color-lime', chosen);
  root.setProperty('--color-on-accent', readableOn(chosen));

  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (icon) icon.href = `data:image/svg+xml,${encodeURIComponent(mark(chosen))}`;
}
