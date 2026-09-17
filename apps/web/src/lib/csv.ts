/**
 * A spreadsheet is where this list came from and where it is going back
 * to, so the export is the plainest CSV that Excel opens without asking
 * questions.
 */

/* Excel and Sheets read a cell starting with any of these as a formula
 * rather than as text, so a plate somebody typed as "=ABC" would run on
 * open. Prefixing a quote makes it text again, and is what the OWASP
 * guidance on CSV injection asks for. */
const FORMULA = /^[=+\-@\t\r]/;

function cell(value: string | number): string {
  const text = String(value);
  // a number is never a formula, and prefixing one would turn -5 into text
  const safe = typeof value === 'string' && FORMULA.test(text) ? `'${text}` : text;
  // quote anything that would otherwise break the row apart
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(headings: string[], rows: (string | number)[][]): string {
  return [headings, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
}

/**
 * A name with the day in it, so two exports in the same week do not
 * overwrite each other in the downloads folder.
 */
export function datedName(stem: string, extension = 'csv'): string {
  const today = new Date();
  const day = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  return `${stem}-${day}.${extension}`;
}

/** Hands the file to the browser. Nothing is uploaded anywhere. */
export function downloadCsv(filename: string, contents: string): void {
  // the BOM is what tells Excel the file is UTF-8, without which an
  // accented name arrives mangled
  const blob = new Blob([`﻿${contents}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
