import { STATE_LABEL, type MaintenanceState } from '../domain/maintenance';

/* Brand manual, 04: a pill built from one hue — a 6px dot at full
 * strength, the label at full strength, and the same hue at 15% opacity
 * behind them. Three states, no more. */
const HUE: Record<MaintenanceState, { text: string; dot: string; bg: string }> = {
  overdue: { text: 'text-overdue', dot: 'bg-overdue', bg: 'bg-overdue/15' },
  due_soon: { text: 'text-due-soon', dot: 'bg-due-soon', bg: 'bg-due-soon/15' },
  on_track: { text: 'text-on-track', dot: 'bg-on-track', bg: 'bg-on-track/15' },
};

export function StatusChip({ state }: { state: MaintenanceState }) {
  const hue = HUE[state];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-semibold ${hue.bg} ${hue.text}`}
    >
      <span className={`size-1.5 rounded-full ${hue.dot}`} />
      {STATE_LABEL[state]}
    </span>
  );
}
