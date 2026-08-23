export const ROLES = ['fleet_coordinator', 'mechanic', 'operations_manager'] as const;
export type Role = (typeof ROLES)[number];

export type ParsedRow = {
  /** 1-based, counting the lines that were actually pasted, so the
   *  preview can say "line 12" and mean what the spreadsheet shows */
  line: number;
  fullName: string;
  email: string;
  role: Role;
  error: string | null;
};

export const MAX_ROWS = 200;

/* Copying cells out of Excel or Sheets gives tab separated text. A file
 * saved as CSV gives commas, and a Spanish Windows Excel gives
 * semicolons. All three are the same paste to whoever is doing it. */
function splitCells(line: string): string[] {
  const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
  return line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ''));
}

/* Deliberately loose. The API validates properly; this only has to catch
 * the cell that clearly is not an address before it wastes a request. */
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

/** A first line naming the columns instead of holding a person. */
function isHeader(cells: string[]): boolean {
  const [first, second] = cells.map((cell) => cell.toLowerCase());
  return (
    second === 'email' ||
    second === 'correo' ||
    first === 'name' ||
    first === 'full name' ||
    first === 'nombre'
  );
}

/**
 * Turns whatever was pasted into rows the import screen can show.
 *
 * Every row comes back, valid or not: the point of the preview is that
 * nothing is created until the person has seen what their paste became,
 * and a row that silently vanished would be the worst outcome of all.
 */
export function parseTeamRows(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/);
  const rows: ParsedRow[] = [];
  const seen = new Set<string>();
  let skippedHeader = false;

  lines.forEach((raw, index) => {
    if (!raw.trim()) return;
    const cells = splitCells(raw);

    if (!skippedHeader && rows.length === 0 && isHeader(cells)) {
      skippedHeader = true;
      return;
    }

    const [fullName = '', email = '', roleCell] = cells;
    const role = readRole(roleCell);
    const key = email.toLowerCase();

    let error: string | null = null;
    if (!fullName) error = 'Missing name';
    else if (!email) error = 'Missing email';
    else if (!LOOKS_LIKE_EMAIL.test(email)) error = 'Not an email address';
    else if (role === null) error = `Unknown role "${roleCell ?? ''}"`;
    else if (seen.has(key)) error = 'Repeated in this list';

    if (!error) seen.add(key);
    rows.push({
      line: index + 1,
      fullName,
      email,
      role: role ?? 'mechanic',
      error,
    });
  });

  return rows;
}
