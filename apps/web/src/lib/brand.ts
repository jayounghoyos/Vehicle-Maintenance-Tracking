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

/**
 * Repaints the interface by moving two custom properties.
 *
 * Everything accented reads --color-lime through Tailwind, so one
 * assignment reaches every button, the active nav item, the focus rings
 * and the guided tour. Null removes the override and the stylesheet's
 * own value takes back over.
 */
export function applyAccent(accent: string | null): void {
  const root = document.documentElement.style;
  if (!accent || !isValidAccent(accent)) {
    root.removeProperty('--color-lime');
    root.removeProperty('--color-on-accent');
    return;
  }
  root.setProperty('--color-lime', accent);
  root.setProperty('--color-on-accent', readableOn(accent));
}
