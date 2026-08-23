/* Nothing here knows what is being pasted: two panes, some grey bars
   and a block that travels between them. Lifted out of the team import
   so the vehicles one shows the same thing. */
/**
 * A nine second loop of the whole procedure: rows in a spreadsheet are
 * selected, they travel, they land in the box. Somebody who has never
 * done this can watch it once and know what to do, which no paragraph
 * achieves as quickly.
 */
export function PasteDemo() {
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
