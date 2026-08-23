import {
  VEHICLE_STATUSES,
  VEHICLE_STATUS_LABEL,
  type VehicleStatus,
} from '../domain/vehicleStatus';
import { readPastedRows, type SpreadsheetRow } from './spreadsheet';

export type ParsedVehicle = SpreadsheetRow & {
  plate: string;
  make: string;
  model: string;
  year: number | null;
  odometerKm: number | null;
  status: VehicleStatus;
};

export { MAX_ROWS } from './spreadsheet';

/** What a first line saying "these are the columns" looks like here. */
const HEADER_WORDS = ['plate', 'placa', 'make', 'marca', 'vehicle', 'vehiculo'];

const OLDEST_YEAR = 1950;
const NEWEST_YEAR = new Date().getFullYear() + 1;
const MAX_ODOMETER = 9_999_999;

/** ABC123, abc123 and "ABC 123" are the same van. */
export function normalisePlate(plate: string): string {
  return plate.replace(/\s+/g, '').toUpperCase();
}

/**
 * A number somebody typed into a spreadsheet, which is to say one that
 * may carry thousand separators. Returns undefined for an empty cell and
 * null for something that is not a number at all.
 */
function readNumber(cell: string | undefined): number | null | undefined {
  if (cell === undefined || cell.trim() === '') return undefined;
  const digits = cell.replace(/[\s.,']/g, '');
  if (!/^\d+$/.test(digits)) return null;
  return Number(digits);
}

function readStatus(cell: string | undefined): VehicleStatus | null {
  // most of a fleet is on the road, so an absent column means active
  if (!cell || !cell.trim()) return 'active';
  const normalised = cell
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if ((VEHICLE_STATUSES as readonly string[]).includes(normalised)) {
    return normalised as VehicleStatus;
  }
  // what people type when they are not reading the enum
  if (normalised === 'in_the_shop' || normalised === 'shop') return 'in_shop';
  if (normalised === 'retired' || normalised === 'inactive') return 'out_of_service';
  return null;
}

/**
 * Turns a pasted fleet into rows the import screen can show.
 *
 * Every row comes back, valid or not, for the same reason the team
 * parser does it: nothing is created before somebody has seen what
 * their paste became.
 */
export function parseVehicleRows(text: string): ParsedVehicle[] {
  const seen = new Set<string>();

  return readPastedRows<ParsedVehicle>(text, HEADER_WORDS, (cells, line) => {
    const [plateCell = '', make = '', model = '', yearCell, odometerCell, statusCell] =
      cells;
    const plate = normalisePlate(plateCell);
    const year = readNumber(yearCell);
    const odometerKm = readNumber(odometerCell);
    const status = readStatus(statusCell);

    let error: string | null = null;
    if (!plate) error = 'Missing plate';
    else if (!make) error = 'Missing make';
    else if (!model) error = 'Missing model';
    else if (year === null) error = `"${yearCell ?? ''}" is not a year`;
    else if (year !== undefined && (year < OLDEST_YEAR || year > NEWEST_YEAR))
      error = `Year must be between ${OLDEST_YEAR} and ${NEWEST_YEAR}`;
    else if (odometerKm === null) error = `"${odometerCell ?? ''}" is not a number`;
    else if (odometerKm !== undefined && odometerKm > MAX_ODOMETER)
      error = 'Odometer is too large';
    else if (status === null)
      error = `Unknown status "${statusCell ?? ''}", try ${Object.values(
        VEHICLE_STATUS_LABEL,
      )
        .join(', ')
        .toLowerCase()}`;
    else if (seen.has(plate)) error = 'Repeated in this list';

    if (!error) seen.add(plate);
    return {
      line,
      plate,
      make,
      model,
      year: year ?? null,
      odometerKm: odometerKm ?? null,
      status: status ?? 'active',
      error,
    };
  });
}
