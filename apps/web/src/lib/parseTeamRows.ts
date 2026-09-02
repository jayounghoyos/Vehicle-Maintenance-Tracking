import { readPastedRows, type SpreadsheetRow } from './spreadsheet';

export type ParsedRow = SpreadsheetRow & {
  fullName: string;
  email: string;
  roleId: number;
  roleName: string;
  /** empty means the account gets a generated one to hand over */
  password: string;
};

export const MIN_PASSWORD = 8;

export { MAX_ROWS } from './spreadsheet';

/* Deliberately loose. The API validates properly; this only has to catch
 * the cell that clearly is not an address before it wastes a request. */
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What a first line saying "these are the columns" looks like here. */
const HEADER_WORDS = ['name', 'full name', 'nombre', 'email', 'correo'];

/** Spreadsheets are typed by hand, so "Fleet Coordinator", "fleet
 *  coordinator" and "fleet_coordinator" all have to find the same row. */
const normalise = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ');

/**
 * Turns whatever was pasted into rows the import screen can show.
 *
 * Every row comes back, valid or not: the point of the preview is that
 * nothing is created until the person has seen what their paste became,
 * and a row that silently vanished would be the worst outcome of all.
 */
export function parseTeamRows(
  text: string,
  roles: { id: number; name: string }[],
  /** what an empty role cell means, chosen on the import screen */
  defaultRoleId: number | null,
): ParsedRow[] {
  const seen = new Set<string>();
  const byName = new Map(roles.map((role) => [normalise(role.name), role]));
  const fallback = roles.find((role) => role.id === defaultRoleId) ?? null;

  return readPastedRows<ParsedRow>(text, HEADER_WORDS, (cells, line) => {
    const [fullName = '', email = '', roleCell, password = ''] = cells;
    const role = roleCell ? (byName.get(normalise(roleCell)) ?? null) : fallback;
    const key = email.toLowerCase();

    let error: string | null = null;
    if (!fullName) error = 'Missing name';
    else if (!email) error = 'Missing email';
    else if (!LOOKS_LIKE_EMAIL.test(email)) error = 'Not an email address';
    else if (role === null)
      error = roleCell ? `Unknown role "${roleCell}"` : 'No role for this row';
    else if (password && password.length < MIN_PASSWORD)
      error = `Password needs ${MIN_PASSWORD} characters or more`;
    else if (seen.has(key)) error = 'Repeated in this list';

    if (!error) seen.add(key);
    return {
      line,
      fullName,
      email,
      roleId: role?.id ?? 0,
      roleName: role?.name ?? '',
      password,
      error,
    };
  });
}
