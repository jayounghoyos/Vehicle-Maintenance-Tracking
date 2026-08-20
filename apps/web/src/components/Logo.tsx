import { Wrench } from 'lucide-react'

/** Lime rounded square holding a wrench glyph, locked to the MTS wordmark
 *  on the same optical baseline. Per the manual, the two never separate. */
export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-xl bg-lime">
        <Wrench className="size-5 text-page" strokeWidth={2.5} />
      </span>
      <span className="leading-tight">
        <span className="block text-[17px] font-bold tracking-tight">MTS</span>
        <span className="block text-[11px] text-ink-muted">Fleet maintenance</span>
      </span>
    </div>
  )
}
