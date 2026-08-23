import { readPastedRows, type SpreadsheetRow } from './spreadsheet';

export const ROLES = ['fleet_coordinator', 'mechanic', 'operations_manager'] as const;
export type Role = (typeof ROLES)[number];

export type ParsedRow = SpreadsheetRow & {
  fullName: string;
  email: string;
  role: Role;
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

function readRole(cell: string | undefined): Role | null {
  // the mechanic is the common case, so an absent column means mechanic
  if (!cell) return 'mechanic';
  const normalised = cell
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if ((ROLES as readonly string[]).includes(normalised)) return normalised as Role;
  // what people actually type when they are not reading the enum
  if (normalised === 'coordinator') return 'fleet_coordinator';
  if (normalised === 'manager' || normalised === 'ops_manager')
    return 'operations_manager';
  return null;
}

/**
 * Turns whatever was pasted into rows the import screen can show.
 *
 * Every row comes back, valid or not: the point of the preview is that
 * nothing is created until the person has seen what their paste became,
 * and a row that silently vanished would be the worst outcome of all.
 */
export function parseTeamRows(text: string): ParsedRow[] {
  const seen = new Set<string>();

  return readPastedRows<ParsedRow>(text, HEADER_WORDS, (cells, line) => {
    const [fullName = '', email = '', roleCell, password = ''] = cells;
    const role = readRole(roleCell);
    const key = email.toLowerCase();

    let error: string | null = null;
    if (!fullName) error = 'Missing name';
    else if (!email) error = 'Missing email';
    else if (!LOOKS_LIKE_EMAIL.test(email)) error = 'Not an email address';
    else if (role === null) error = `Unknown role "${roleCell ?? ''}"`;
    else if (password && password.length < MIN_PASSWORD)
      error = `Password needs ${MIN_PASSWORD} characters or more`;
    else if (seen.has(key)) error = 'Repeated in this list';

    if (!error) seen.add(key);
    return { line, fullName, email, role: role ?? 'mechanic', password, error };
  });
}
