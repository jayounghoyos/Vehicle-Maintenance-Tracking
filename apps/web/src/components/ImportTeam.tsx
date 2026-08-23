import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { api, type ImportResult } from '../lib/api';
import { roleLabel } from '../lib/format';
import { MAX_ROWS, parseTeamRows, type ParsedRow } from '../lib/parseTeamRows';

/* Two rows, three columns. Long enough to show the shape and short
 * enough that it never competes with the box you are meant to paste in. */
const EXAMPLE = [
  ['Full name', 'Email', 'Role'],
  ['Carlos Mejia', 'carlos@fleet.co', 'mechanic'],
  ['Laura Gomez', 'laura@fleet.co', 'operations manager'],
];

function Example() {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-page/60">
      <table className="w-full text-left text-[12px]">
        <tbody>
          {EXAMPLE.map(([name, email, role], index) => (
            <tr key={email} className={index === 0 ? 'text-ink-muted' : ''}>
              <td className="border-r border-white/5 px-3 py-1.5 whitespace-nowrap">
                {name}
              </td>
              <td className="border-r border-white/5 px-3 py-1.5 whitespace-nowrap">
                {email}
              </td>
              <td className="px-3 py-1.5 whitespace-nowrap">{role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Result({ result, rows }: { result: ImportResult; rows: ParsedRow[] }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    // tab separated, so it pastes back into the spreadsheet it came from
    const text = result.created
      .map((m) => `${m.fullName}\t${m.email}\t${m.temporaryPassword}`)
      .join('\n');
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4 border-t border-white/5 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">
          {result.created.length} {result.created.length === 1 ? 'account' : 'accounts'}{' '}
          created
        </p>
        {result.created.length > 0 && (
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2 text-body text-ink-muted transition-colors hover:text-ink"
          >
            {copied ? (
              <Check className="size-4 text-lime" strokeWidth={2.5} />
            ) : (
              <Copy className="size-4" strokeWidth={1.75} />
            )}
            {copied ? 'Copied' : 'Copy all'}
          </button>
        )}
      </div>

      {result.created.length > 0 && (
        <>
          <p className="text-body text-ink-muted">
            These passwords are shown once. Copy them now and give each person theirs.
          </p>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-body">
              <tbody className="divide-y divide-white/5">
                {result.created.map((member) => (
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
        </>
      )}

      {result.skipped.length > 0 && (
        <div className="rounded-xl bg-overdue/10 px-4 py-3">
          <p className="flex items-center gap-2 font-semibold text-overdue">
            <AlertTriangle className="size-4" strokeWidth={2.5} />
            {result.skipped.length} skipped
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
  const fileInput = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => parseTeamRows(text), [text]);
  const valid = useMemo(() => rows.filter((row) => !row.error), [rows]);
  const broken = rows.length - valid.length;
  const tooMany = valid.length > MAX_ROWS;

  const send = useMutation({
    mutationFn: () =>
      api.post<ImportResult>('/team/bulk', {
        members: valid.map(({ fullName, email, role }) => ({ fullName, email, role })),
      }),
    onSuccess: (answer) => {
      setResult(answer);
      onImported();
    },
  });

  // the list that was sent is what the answer's row numbers index into
  if (result) return <Result result={result} rows={valid} />;

  return (
    <div className="space-y-4 border-t border-white/5 bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="text-body text-ink-muted">
          Copy the rows straight out of your spreadsheet and paste them below. Role is
          optional and defaults to mechanic.
        </p>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="text-body text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
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

      <Example />

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={6}
        placeholder="Carlos Mejia	carlos@fleet.co	mechanic"
        className="w-full rounded-xl border border-white/10 bg-panel px-3.5 py-2.5 font-mono text-[12px] placeholder:text-ink-muted/50 focus:border-lime/40 focus:outline-none"
      />

      {rows.length > 0 && (
        <div className="max-h-64 overflow-y-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-body">
            <tbody className="divide-y divide-white/5">
              {rows.map((row) => (
                <tr key={row.line} className={row.error ? 'bg-overdue/10' : undefined}>
                  <td className="px-3 py-2 text-[12px] text-ink-muted">{row.line}</td>
                  <td className="px-3 py-2">{row.fullName || ''}</td>
                  <td className="px-3 py-2 text-ink-muted">{row.email || ''}</td>
                  <td className="px-3 py-2 text-ink-muted">
                    {row.error ? (
                      <span className="text-overdue">{row.error}</span>
                    ) : (
                      roleLabel(row.role)
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
  );
}
