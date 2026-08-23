import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, Check, Copy, KeyRound } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { api, type ImportResult } from '../lib/api';
import { roleLabel } from '../lib/format';
import { MAX_ROWS, parseTeamRows, type ParsedRow } from '../lib/parseTeamRows';

/* Four columns, two people. Long enough to show the shape, short enough
 * that it never competes with the box you are meant to paste in. The
 * second row leaves the password empty on purpose: that is the case
 * worth showing, not the one worth explaining. */
const HEADINGS = ['Full name', 'Email', 'Role', 'Password'];
const EXAMPLE = [
  ['Carlos Mejia', 'carlos@fleet.co', 'mechanic', 'winter2026'],
  ['Laura Gomez', 'laura@fleet.co', 'operations manager', ''],
];

const asRows = (rows: string[][]) => rows.map((cells) => cells.join('\t')).join('\n');

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) =>
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  return { copied, copy };
}

/**
 * A nine second loop of the whole procedure: rows in a spreadsheet are
 * selected, they travel, they land in the box. Somebody who has never
 * done this can watch it once and know what to do, which no paragraph
 * achieves as quickly.
 */
function PasteDemo() {
  const cell = 'h-1.5 rounded-full bg-ink-muted/35';
  return (
    <div
      aria-hidden
      className="relative flex items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-page/60 p-4"
    >
      <div className="relative w-[46%] shrink-0 rounded-lg border border-white/10 bg-panel p-2">
        <p className="mb-2 text-[9px] tracking-wide text-ink-muted uppercase">
          Your spreadsheet
        </p>
        <div className="space-y-1.5">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex gap-1.5">
              <span className={`${cell} w-1/3`} />
              <span className={`${cell} flex-1`} />
            </div>
          ))}
        </div>
        <span className="mts-demo-select absolute inset-x-2 top-6 bottom-2 rounded border border-lime/60 bg-lime/10" />
      </div>

      {/* the block that carries the rows across, offset by the gap it has
          to cross rather than a number guessed from the design */}
      <span
        className="mts-demo-travel absolute top-1/2 left-[8%] h-8 w-[38%] rounded-lg border border-lime/50 bg-lime/15"
        style={
          { '--mts-travel-x': '108%', '--mts-travel-y': '0px' } as React.CSSProperties
        }
      />

      <div className="relative min-w-0 flex-1 rounded-lg border border-dashed border-white/15 bg-panel p-2">
        <p className="mb-2 text-[9px] tracking-wide text-ink-muted uppercase">
          Paste here
        </p>
        <div className="mts-demo-land space-y-1.5">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex gap-1.5">
              <span className={`${cell} w-1/3 bg-lime/40`} />
              <span className={`${cell} flex-1 bg-lime/40`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Instructions() {
  const { copied, copy } = useCopy();

  return (
    <div className="space-y-4">
      <PasteDemo />

      <ol className="space-y-2.5">
        {[
          'Open the spreadsheet with your people in it.',
          'Select the rows and copy them, with Ctrl and C.',
          'Click the box on the right and paste, with Ctrl and V.',
        ].map((step, index) => (
          <li key={step} className="flex gap-3 text-body">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-semibold">
              {index + 1}
            </span>
            <span className="text-ink-muted">{step}</span>
          </li>
        ))}
      </ol>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-body font-medium">The columns, in this order</p>
          <button
            type="button"
            onClick={() => copy(asRows([HEADINGS, ...EXAMPLE]))}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[12px] text-ink-muted transition-colors hover:text-ink"
          >
            {copied ? (
              <Check className="size-3.5 text-lime" strokeWidth={2.5} />
            ) : (
              <Copy className="size-3.5" strokeWidth={1.75} />
            )}
            {copied ? 'Copied' : 'Copy example'}
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10 bg-page/60">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/5 text-ink-muted">
                {HEADINGS.map((heading) => (
                  <th key={heading} className="px-3 py-1.5 font-medium whitespace-nowrap">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EXAMPLE.map(([name, email, role, password]) => (
                <tr key={email}>
                  <td className="px-3 py-1.5 whitespace-nowrap">{name}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">{email}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap">{role}</td>
                  <td className="px-3 py-1.5 whitespace-nowrap text-ink-muted">
                    {password || 'leave empty'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-2.5 space-y-1 text-[12px] text-ink-muted">
          <li>Only the name and the email are required.</li>
          <li>No role means mechanic.</li>
          <li>No password means we make one for you and show it once.</li>
          <li>A first row naming the columns is fine, it gets skipped.</li>
        </ul>
      </div>
    </div>
  );
}

function Result({
  result,
  rows,
  onAgain,
}: {
  result: ImportResult;
  rows: ParsedRow[];
  onAgain: () => void;
}) {
  const { copied, copy } = useCopy();
  const withPassword = result.created.filter((member) => member.temporaryPassword);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-section font-semibold">
          {result.created.length} {result.created.length === 1 ? 'account' : 'accounts'}{' '}
          created
        </p>
        <div className="flex items-center gap-2">
          {withPassword.length > 0 && (
            <button
              type="button"
              onClick={() =>
                // tab separated, so it pastes back into the spreadsheet
                // the names came from
                copy(
                  withPassword
                    .map((m) => `${m.fullName}\t${m.email}\t${m.temporaryPassword ?? ''}`)
                    .join('\n'),
                )
              }
              className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-body text-ink-muted transition-colors hover:text-ink"
            >
              {copied ? (
                <Check className="size-4 text-lime" strokeWidth={2.5} />
              ) : (
                <Copy className="size-4" strokeWidth={1.75} />
              )}
              {copied ? 'Copied' : 'Copy passwords'}
            </button>
          )}
          <button
            type="button"
            onClick={onAgain}
            className="rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-page transition-opacity hover:opacity-90"
          >
            Import another list
          </button>
        </div>
      </div>

      {withPassword.length > 0 && (
        <div className="rounded-xl border border-lime/30 bg-lime/5 p-4">
          <p className="flex items-center gap-2 font-semibold">
            <KeyRound className="size-4 text-lime" strokeWidth={2.25} />
            Copy these passwords now
          </p>
          <p className="mt-1 text-body text-ink-muted">
            They are shown once and cannot be looked up again. Give each person theirs,
            and ask them to change it.
          </p>
          <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-white/10 bg-page/50">
            <table className="w-full text-left text-body">
              <tbody className="divide-y divide-white/5">
                {withPassword.map((member) => (
                  <tr key={member.id}>
                    <td className="px-3 py-2">{member.fullName}</td>
                    <td className="px-3 py-2 text-ink-muted">{member.email}</td>
                    <td className="px-3 py-2 font-mono text-[12px] text-lime">
                      {member.temporaryPassword}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result.created.length > withPassword.length && (
        <p className="text-body text-ink-muted">
          {result.created.length - withPassword.length} of them kept the password your
          list carried, so there is nothing to copy for those.
        </p>
      )}

      {result.skipped.length > 0 && (
        <div className="rounded-xl bg-overdue/10 p-4">
          <p className="flex items-center gap-2 font-semibold text-overdue">
            <AlertTriangle className="size-4" strokeWidth={2.5} />
            {result.skipped.length} left out
          </p>
          <ul className="mt-1.5 space-y-1 text-body text-overdue/80">
            {result.skipped.map((row) => (
              <li key={row.row}>
                Line {rows[row.row]?.line ?? row.row + 1}, {row.email}: {row.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ImportTeam({ onImported }: { onImported: () => void }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [sent, setSent] = useState<ParsedRow[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => parseTeamRows(text), [text]);
  const valid = useMemo(() => rows.filter((row) => !row.error), [rows]);
  const broken = rows.length - valid.length;
  const tooMany = valid.length > MAX_ROWS;

  const send = useMutation({
    mutationFn: () => {
      setSent(valid);
      return api.post<ImportResult>('/team/bulk', {
        members: valid.map(({ fullName, email, role, password }) => ({
          fullName,
          email,
          role,
          // an empty cell must not travel as an empty password
          ...(password ? { password } : {}),
        })),
      });
    },
    onSuccess: (answer) => {
      setResult(answer);
      onImported();
    },
  });

  if (result) {
    return (
      <div className="border-t border-white/5 bg-white/[0.02] p-5">
        <Result
          result={result}
          rows={sent}
          onAgain={() => {
            setResult(null);
            setText('');
          }}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6 border-t border-white/5 bg-white/[0.02] p-5 lg:grid-cols-2">
      <Instructions />

      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-body font-medium">Paste your rows here</p>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="text-[12px] text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            or open a CSV file
          </button>
          {/* read here rather than uploaded: the API only ever sees the
              same JSON the paste produces, so there is one code path */}
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              void file?.text().then(setText);
            }}
          />
        </div>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={7}
          placeholder={asRows(EXAMPLE)}
          className="w-full rounded-xl border border-white/10 bg-panel px-3.5 py-2.5 font-mono text-[12px] whitespace-pre placeholder:text-ink-muted/40 focus:border-lime/40 focus:outline-none"
        />

        {rows.length > 0 && (
          <div className="max-h-72 min-h-0 flex-1 overflow-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-body">
              <tbody className="divide-y divide-white/5">
                {rows.map((row) => (
                  <tr key={row.line} className={row.error ? 'bg-overdue/10' : undefined}>
                    <td className="px-3 py-2 text-[12px] text-ink-muted tabular-nums">
                      {row.line}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.fullName}</td>
                    <td className="px-3 py-2 text-ink-muted">{row.email}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {row.error ? (
                        <span className="text-overdue">{row.error}</span>
                      ) : (
                        <span className="text-ink-muted">
                          {roleLabel(row.role)}
                          {row.password ? ' · own password' : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tooMany && (
          <p className="text-body text-overdue">
            {valid.length} rows is over the {MAX_ROWS} limit. Paste them in more than one
            go.
          </p>
        )}

        {send.isError && (
          <p className="text-body text-overdue">
            {send.error instanceof Error ? send.error.message : 'The import failed'}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={valid.length === 0 || tooMany || send.isPending}
            onClick={() => send.mutate()}
            className="rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-page transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {send.isPending
              ? 'Creating…'
              : `Create ${valid.length} ${valid.length === 1 ? 'account' : 'accounts'}`}
          </button>
          {broken > 0 && (
            <span className="text-body text-ink-muted">
              {broken} {broken === 1 ? 'row' : 'rows'} will be left out
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
