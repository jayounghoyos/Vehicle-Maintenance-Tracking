import {
  DUE_SOON_DAYS,
  DUE_SOON_KM,
  STATE_ORDER,
  daysUntil,
  kmUntil,
  scheduleState,
  worstState,
} from './maintenance';

// a local date, the way new Date() is on a server, so these hold in any
// time zone: due dates are calendar days, read the same everywhere
const day = (iso: string) => {
  const [year, month, date] = iso.split('-').map(Number);
  return new Date(year, month - 1, date, 12, 0);
};
const today = () => day('2026-10-24');

const ODOMETER = 50_000;
const byDate = (nextDueDate: string | null) => ({ nextDueDate, nextDueKm: null });
const byKm = (nextDueKm: number | null) => ({ nextDueDate: null, nextDueKm });

describe('maintenance', () => {
  describe('scheduleState by date', () => {
    it('is on_track when the schedule has no due date or km', () => {
      expect(scheduleState(byDate(null), ODOMETER, today())).toBe('on_track');
    });

    it('is overdue the day after the due date', () => {
      expect(scheduleState(byDate('2026-10-23'), ODOMETER, today())).toBe('overdue');
    });

    it('is due_soon, not overdue, on the due date itself', () => {
      expect(scheduleState(byDate('2026-10-24'), ODOMETER, today())).toBe('due_soon');
    });

    it(`is due_soon exactly ${DUE_SOON_DAYS} days out`, () => {
      expect(scheduleState(byDate('2026-11-07'), ODOMETER, today())).toBe('due_soon');
    });

    it(`is on_track ${DUE_SOON_DAYS + 1} days out`, () => {
      expect(scheduleState(byDate('2026-11-08'), ODOMETER, today())).toBe('on_track');
    });

    it('ignores the time of day on today', () => {
      const lateEvening = new Date(2026, 9, 24, 23, 59, 59);
      const justAfterMidnight = new Date(2026, 9, 24, 0, 0, 1);
      expect(scheduleState(byDate('2026-10-24'), ODOMETER, lateEvening)).toBe('due_soon');
      expect(scheduleState(byDate('2026-10-23'), ODOMETER, justAfterMidnight)).toBe(
        'overdue',
      );
    });
  });

  describe('scheduleState by kilometres', () => {
    it('is overdue once the odometer reaches the due reading', () => {
      expect(scheduleState(byKm(ODOMETER), ODOMETER, today())).toBe('overdue');
      expect(scheduleState(byKm(ODOMETER - 1), ODOMETER, today())).toBe('overdue');
    });

    it(`is due_soon within ${DUE_SOON_KM} km`, () => {
      expect(scheduleState(byKm(ODOMETER + 1), ODOMETER, today())).toBe('due_soon');
      expect(scheduleState(byKm(ODOMETER + DUE_SOON_KM), ODOMETER, today())).toBe(
        'due_soon',
      );
    });

    it(`is on_track beyond ${DUE_SOON_KM} km`, () => {
      expect(scheduleState(byKm(ODOMETER + DUE_SOON_KM + 1), ODOMETER, today())).toBe(
        'on_track',
      );
    });
  });

  describe('scheduleState with both intervals: whichever comes first', () => {
    it('is overdue by kilometres even when the date is far off', () => {
      const due = { nextDueDate: '2027-04-01', nextDueKm: ODOMETER - 200 };
      expect(scheduleState(due, ODOMETER, today())).toBe('overdue');
    });

    it('is overdue by date even when the kilometres are far off', () => {
      const due = { nextDueDate: '2026-10-01', nextDueKm: ODOMETER + 9_000 };
      expect(scheduleState(due, ODOMETER, today())).toBe('overdue');
    });

    it('is due_soon when only one of the two is close', () => {
      const kmClose = { nextDueDate: '2027-04-01', nextDueKm: ODOMETER + 500 };
      const dateClose = { nextDueDate: '2026-10-30', nextDueKm: ODOMETER + 9_000 };
      expect(scheduleState(kmClose, ODOMETER, today())).toBe('due_soon');
      expect(scheduleState(dateClose, ODOMETER, today())).toBe('due_soon');
    });

    it('is on_track only when both are far off', () => {
      const due = { nextDueDate: '2027-04-01', nextDueKm: ODOMETER + 9_000 };
      expect(scheduleState(due, ODOMETER, today())).toBe('on_track');
    });
  });

  describe('daysUntil', () => {
    it('is zero on the day itself and negative once it has passed', () => {
      expect(daysUntil('2026-10-24', today())).toBe(0);
      expect(daysUntil('2026-10-23', today())).toBe(-1);
    });

    it('counts across a month and a year boundary', () => {
      expect(daysUntil('2026-11-01', today())).toBe(8);
      expect(daysUntil('2027-01-01', day('2026-12-31'))).toBe(1);
    });

    it('counts 29 February in a leap year', () => {
      expect(daysUntil('2028-03-01', day('2028-02-28'))).toBe(2);
    });

    it('reads a date-only due date as that calendar day, west of UTC too', () => {
      // the bug this replaced: parsed as UTC midnight, '2026-10-24' was
      // the 23rd in Bogotá, and a schedule turned overdue a day early
      expect(daysUntil('2026-10-24', new Date(2026, 9, 24, 0, 0, 1))).toBe(0);
      expect(daysUntil('2026-10-24', new Date(2026, 9, 24, 23, 59))).toBe(0);
    });
  });

  describe('kmUntil', () => {
    it('is null with no due reading, and the distance otherwise', () => {
      expect(kmUntil(null, ODOMETER)).toBeNull();
      expect(kmUntil(ODOMETER + 300, ODOMETER)).toBe(300);
      expect(kmUntil(ODOMETER - 300, ODOMETER)).toBe(-300);
    });
  });

  describe('worstState', () => {
    it('is overdue if any one schedule is overdue', () => {
      expect(worstState(['on_track', 'due_soon', 'overdue'])).toBe('overdue');
    });

    it('prefers due_soon over on_track', () => {
      expect(worstState(['on_track', 'due_soon'])).toBe('due_soon');
    });

    it('is on_track for an empty list', () => {
      expect(worstState([])).toBe('on_track');
    });
  });

  it('orders states worst first', () => {
    expect(STATE_ORDER).toEqual(['overdue', 'due_soon', 'on_track']);
  });
});
