/**
 * The parts of reading a pasted spreadsheet that do not depend on what
 * is being pasted. What each column means, and what makes a row wrong,
 * belongs to whoever is importing.
 */

/** A hashing limit on the server, a paste limit here. */
export const MAX_ROWS = 200;

/** Every parsed row carries where it came from and what is wrong with
 *  it, valid or not: a row that silently vanished from the preview
 *  would be the worst outcome of all. */
export type SpreadsheetRow = {
  /** 1-based, counting the lines actually pasted, so it matches what
   *  the spreadsheet shows even with blank lines in the middle */
  line: number;
  error: string | null;
};

/* Copying cells out of Excel or Sheets gives tab separated text. A file
 * saved as CSV gives commas, and a Spanish Windows Excel gives
 * semicolons. All three are the same paste to whoever is doing it. */
export function splitCells(line: string): string[] {
  const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
  return line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ''));
}

/**
 * Whether a line names the columns instead of holding a record.
 *
 * The vocabulary is the caller's, because "email" gives away a list of
 * people and "plate" a list of vans, but the mechanism is the same:
 * look at the first two cells, in either language.
 */
export function isHeaderLike(cells: string[], vocabulary: string[]): boolean {
  const words = new Set(vocabulary.map((word) => word.toLowerCase()));
  return cells.slice(0, 2).some((cell) => words.has(cell.trim().toLowerCase()));
}

/**
 * Walks the pasted text line by line, skipping blanks and at most one
 * leading header, and hands each line's cells to `read` along with the
 * line number to report it under.
 */
export function readPastedRows<T extends SpreadsheetRow>(
  text: string,
  headerVocabulary: string[],
  read: (cells: string[], line: number) => T,
): T[] {
  const rows: T[] = [];
  let skippedHeader = false;

  text.split(/\r?\n/).forEach((raw, index) => {
    if (!raw.trim()) return;
    const cells = splitCells(raw);

    if (!skippedHeader && rows.length === 0 && isHeaderLike(cells, headerVocabulary)) {
      skippedHeader = true;
      return;
    }
    rows.push(read(cells, index + 1));
  });

  return rows;
}
