import {
  DUE_SOON_DAYS,
  STATE_ORDER,
  daysUntil,
  scheduleState,
  worstState,
} from './maintenance';

// daysUntil truncates both sides to *local* midnight, and a date-only
// string such as '2026-10-24' parses as UTC midnight. Taking "today" as
// the instant such a string parses to keeps the boundaries below the
// same in every time zone; the last block covers what happens when the
// two don't line up.
const day = (iso: string) => new Date(iso);
const today = () => day('2026-10-24');

describe('maintenance', () => {
  describe('scheduleState', () => {
    it('is on_track when the schedule has no due date', () => {
      expect(scheduleState(null, today())).toBe('on_track');
    });

    it('is overdue the day after the due date', () => {
      expect(scheduleState('2026-10-23', today())).toBe('overdue');
    });

    it('is due_soon, not overdue, on the due date itself', () => {
      expect(scheduleState('2026-10-24', today())).toBe('due_soon');
    });

    it('is due_soon tomorrow', () => {
      expect(scheduleState('2026-10-25', today())).toBe('due_soon');
    });

    it(`is due_soon exactly ${DUE_SOON_DAYS} days out`, () => {
      expect(scheduleState('2026-11-07', today())).toBe('due_soon');
    });

    it(`is on_track ${DUE_SOON_DAYS + 1} days out`, () => {
      expect(scheduleState('2026-11-08', today())).toBe('on_track');
    });

    it('is overdue when the due date is long gone', () => {
      expect(scheduleState('2024-01-15', today())).toBe('overdue');
    });

    it('ignores the time of day on today', () => {
      const lateEvening = new Date(2026, 9, 24, 23, 59, 59);
      const justAfterMidnight = new Date(2026, 9, 24, 0, 0, 1);
      expect(scheduleState('2026-10-24T00:00:00', lateEvening)).toBe('due_soon');
      expect(scheduleState('2026-10-23T00:00:00', justAfterMidnight)).toBe('overdue');
    });
  });

  describe('daysUntil', () => {
    it('is zero on the day itself', () => {
      expect(daysUntil('2026-10-24', today())).toBe(0);
    });

    it('is negative once the date has passed', () => {
      expect(daysUntil('2026-10-23', today())).toBe(-1);
      expect(daysUntil('2026-10-14', today())).toBe(-10);
    });

    it('counts across a month boundary', () => {
      expect(daysUntil('2026-11-01', today())).toBe(8);
      expect(daysUntil('2026-09-30', today())).toBe(-24);
    });

    it('counts across a year boundary', () => {
      expect(daysUntil('2027-01-01', day('2026-12-31'))).toBe(1);
      expect(daysUntil('2026-12-30', day('2027-01-01'))).toBe(-2);
    });

    it('counts 29 February in a leap year', () => {
      expect(daysUntil('2028-03-01', day('2028-02-28'))).toBe(2);
    });

    it('drops the time of day on the ISO string and compares at midnight', () => {
      // no Z: both sides are local times, so this holds in any zone
      expect(daysUntil('2026-10-24T23:30:00', new Date(2026, 9, 24, 0, 0, 1))).toBe(0);
      expect(daysUntil('2026-10-25T00:00:01', new Date(2026, 9, 24, 23, 59))).toBe(1);
      expect(daysUntil('2026-10-23T23:59:59', new Date(2026, 9, 24, 0, 0, 1))).toBe(-1);
    });
  });

  describe('worstState', () => {
    it('is overdue if any one schedule is overdue', () => {
      expect(worstState(['on_track', 'due_soon', 'overdue', 'on_track'])).toBe('overdue');
    });

    it('prefers due_soon over on_track', () => {
      expect(worstState(['on_track', 'due_soon', 'on_track'])).toBe('due_soon');
    });

    it('is on_track when every schedule is', () => {
      expect(worstState(['on_track', 'on_track'])).toBe('on_track');
    });

    it('is on_track for an empty list', () => {
      expect(worstState([])).toBe('on_track');
    });
  });

  it('orders states worst first', () => {
    expect(STATE_ORDER).toEqual(['overdue', 'due_soon', 'on_track']);
  });

  // Current behaviour, not intent. When "today" is a local date, as
  // new Date() is on a server, a date-only due date parses as UTC
  // midnight and truncates to local midnight: west of Greenwich (Bogotá,
  // UTC-5) that is the day before, so the schedule turns overdue on its
  // due date instead of the day after. It errs towards overdue and never
  // hides one, but it raises it a day early. East of UTC and in UTC
  // itself the dates line up.
  describe('a date-only due date against a local today', () => {
    const westOfUtc = new Date('2026-10-24').getTimezoneOffset() > 0;
    const localNoon = () => new Date(2026, 9, 24, 12, 0);

    it(`is ${westOfUtc ? 'read a day early here' : 'read on the right day here'}`, () => {
      expect(daysUntil('2026-10-24', localNoon())).toBe(westOfUtc ? -1 : 0);
      expect(scheduleState('2026-10-24', localNoon())).toBe(
        westOfUtc ? 'overdue' : 'due_soon',
      );
    });
  });
});
