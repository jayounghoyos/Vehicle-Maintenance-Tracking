import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, Check, Copy, Info } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { VEHICLE_STATUS_LABEL } from '../domain/vehicleStatus';
import { api, type VehicleImportResult } from '../lib/api';
import { odometer } from '../lib/format';
import { MAX_ROWS, parseVehicleRows, type ParsedVehicle } from '../lib/parseVehicleRows';
import { useCopy } from '../lib/useCopy';
import { PasteDemo } from './PasteDemo';

/* Six columns, two vans. The second leaves everything optional empty on
 * purpose: that is the case worth showing, not the one worth explaining. */
const HEADINGS = ['Plate', 'Make', 'Model', 'Year', 'Odometer', 'Status'];
const EXAMPLE = [
  ['ABC123', 'Chevrolet', 'NHR', '2019', '128450', 'active'],
  ['DEF456', 'Renault', 'Kangoo', '', '', ''],
];

const asRows = (rows: string[][]) => rows.map((cells) => cells.join('\t')).join('\n');

function Instructions() {
  const { copied, copy } = useCopy();

  return (
    <div className="space-y-4">
      <PasteDemo />

      <ol className="space-y-2.5">
        {[
          'In Excel or Google Sheets, write one vehicle per line: the plate in the first column, then the make and the model.',
          'Select those lines and copy them. Ctrl and C on Windows, Command and C on a Mac.',
          'Click the box below and paste. Every vehicle shows up here first, so you can check the list before any of them exists.',
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
          <p className="text-body font-medium">The order of the columns</p>
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
              {EXAMPLE.map((cells) => (
                <tr key={cells[0]}>
                  {cells.map((cell, index) => (
                    <td
                      key={HEADINGS[index]}
                      className={`px-3 py-1.5 whitespace-nowrap ${cell ? '' : 'text-ink-muted'}`}
                    >
                      {cell || 'leave empty'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-2.5 text-[12px] text-ink-muted">
          No spreadsheet? Press Copy example, paste it in the box below, and change the
          plates.
        </p>

        <ul className="mt-2.5 space-y-1.5 text-[12px] text-ink-muted">
          <li>The plate, the make and the model are the only three we need from you.</li>
          <li>Leave the year or the odometer empty and we record that we do not know.</li>
          <li>
            Leave the status empty and the vehicle is active. The others are{' '}
            {VEHICLE_STATUS_LABEL.in_shop.toLowerCase()} and{' '}
            {VEHICLE_STATUS_LABEL.out_of_service.toLowerCase()}.
          </li>
          <li>If your first line is the column titles, we notice it and skip it.</li>
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
  result: VehicleImportResult;
  rows: ParsedVehicle[];
  onAgain: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-section font-semibold">
          {result.created.length} {result.created.length === 1 ? 'vehicle' : 'vehicles'}{' '}
          added
        </p>
        <button
          type="button"
          onClick={onAgain}
          className="rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-on-accent transition-opacity hover:opacity-90"
        >
          Import another list
        </button>
      </div>

      {result.created.length > 0 && (
        <div className="max-h-64 overflow-y-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-body">
            <tbody className="divide-y divide-white/5">
              {result.created.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="px-3 py-2 font-semibold">{vehicle.plate}</td>
                  <td className="px-3 py-2 text-ink-muted">
                    {vehicle.make} {vehicle.model}
                  </td>
                  <td className="px-3 py-2 text-ink-muted tabular-nums">
                    {odometer(vehicle.odometerKm)} km
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.createdModels.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-page/50 p-4">
          <p className="flex items-center gap-2 font-semibold">
            <Info className="size-4 shrink-0 text-ink-muted" strokeWidth={2.25} />
            {result.createdModels.length}{' '}
            {result.createdModels.length === 1 ? 'model was' : 'models were'} new
          </p>
          <p className="mt-1 text-body text-ink-muted">
            Worth a look for typos: the list of makes and models is shared, so a
            misspelling here is one everybody sees.
          </p>
          <p className="mt-2 text-body">{result.createdModels.join(' · ')}</p>
        </div>
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
                Line {rows[row.row]?.line ?? row.row + 1}, {row.plate}: {row.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[12px] text-ink-muted">
        None of them has a maintenance schedule yet, so none of them will ever come due.
        That is set per vehicle on the Schedules screen.
      </p>
    </div>
  );
}

export function ImportVehicles({ onImported }: { onImported: () => void }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<VehicleImportResult | null>(null);
  const [sent, setSent] = useState<ParsedVehicle[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => parseVehicleRows(text), [text]);
  const valid = useMemo(() => rows.filter((row) => !row.error), [rows]);
  const broken = rows.length - valid.length;
  const tooMany = valid.length > MAX_ROWS;

  const send = useMutation({
    mutationFn: () => {
      setSent(valid);
      return api.post<VehicleImportResult>('/vehicles/bulk', {
        vehicles: valid.map((row) => ({
          plate: row.plate,
          make: row.make,
          model: row.model,
          // an empty cell must not travel as a zero
          ...(row.year !== null ? { year: row.year } : {}),
          ...(row.odometerKm !== null ? { odometerKm: row.odometerKm } : {}),
          status: row.status,
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
      <div className="p-5">
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
    <div className="space-y-5 p-5">
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
                    <td className="px-3 py-2 font-semibold whitespace-nowrap">
                      {row.plate}
                    </td>
                    <td className="px-3 py-2 text-ink-muted">
                      {row.make} {row.model}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {row.error ? (
                        <span className="text-overdue">{row.error}</span>
                      ) : (
                        <span className="text-ink-muted">
                          {VEHICLE_STATUS_LABEL[row.status]}
                          {row.year !== null ? ` · ${row.year}` : ''}
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
            className="rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {send.isPending
              ? 'Adding…'
              : `Add ${valid.length} ${valid.length === 1 ? 'vehicle' : 'vehicles'}`}
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
