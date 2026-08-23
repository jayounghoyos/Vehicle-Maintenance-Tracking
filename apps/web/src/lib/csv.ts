/**
 * A spreadsheet is where this list came from and where it is going back
 * to, so the export is the plainest CSV that Excel opens without asking
 * questions.
 */
function cell(value: string | number): string {
  const text = String(value);
  // quote anything that would otherwise break the row apart
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headings: string[], rows: (string | number)[][]): string {
  return [headings, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
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
