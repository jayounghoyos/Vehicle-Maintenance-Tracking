import { VEHICLE_STATUSES, VEHICLE_STATUS_LABEL } from '../domain/vehicleStatus';
import type { VehicleRow } from '../lib/api';
import { Field, Select } from './AuthLayout';

export type VehiclePatch = {
  plate: string;
  make: string;
  model: string;
  year?: number;
  odometerKm?: number;
  status: string;
};

/**
 * One form for registering a vehicle and for correcting one. The team
 * screen kept two and they drifted; there is nothing different to say
 * about a vehicle depending on whether it exists yet.
 */
export function VehicleForm({
  vehicle,
  pending,
  onSubmit,
  onCancel,
}: {
  /** absent when registering a new one */
  vehicle?: VehicleRow;
  pending: boolean;
  onSubmit: (patch: VehiclePatch) => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="grid gap-4 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const number = (name: string) => {
          const raw = String(form.get(name) ?? '').trim();
          // an empty box means "not recorded", not zero
          return raw === '' ? undefined : Number(raw);
        };
        onSubmit({
          plate: String(form.get('plate') ?? ''),
          make: String(form.get('make') ?? ''),
          model: String(form.get('model') ?? ''),
          year: number('year'),
          odometerKm: number('odometerKm'),
          status: String(form.get('status') ?? 'active'),
        });
      }}
    >
      <Field
        label="Plate"
        name="plate"
        defaultValue={vehicle?.plate}
        placeholder="ABC123"
        required
        autoComplete="off"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Make"
          name="make"
          defaultValue={vehicle?.make}
          placeholder="Chevrolet"
          required
          autoComplete="off"
        />
        <Field
          label="Model"
          name="model"
          defaultValue={vehicle?.model}
          placeholder="NHR"
          required
          autoComplete="off"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Year"
          name="year"
          type="number"
          defaultValue={vehicle?.year ?? ''}
          placeholder="2019"
          min={1950}
          max={new Date().getFullYear() + 1}
        />
        <Field
          label="Odometer (km)"
          name="odometerKm"
          type="number"
          defaultValue={vehicle?.odometerKm ?? ''}
          placeholder="0"
          min={0}
        />
      </div>
      <Select
        label="Status"
        name="status"
        defaultValue={vehicle?.status ?? 'active'}
        options={VEHICLE_STATUSES.map((status) => ({
          value: status,
          label: VEHICLE_STATUS_LABEL[status],
        }))}
      />
      <p className="-mt-1 text-[12px] text-ink-muted">
        Whether maintenance is overdue is worked out from the schedules, not set here.
      </p>

      <div className="mt-1 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-lime px-4 py-2.5 text-body font-semibold text-page disabled:opacity-50"
        >
          {pending ? 'Saving…' : vehicle ? 'Save changes' : 'Add vehicle'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-body text-ink-muted transition-colors hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
