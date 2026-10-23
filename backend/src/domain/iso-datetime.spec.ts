import {
  isLeapYear,
  getDaysInMonth,
  isValidBrasiliaIsoDateTime,
  parseBrasiliaIsoDateTime,
} from './iso-datetime';

describe('ISO DateTime Helper (RN01 / V6)', () => {
  describe('isLeapYear', () => {
    it('correctly identifies leap years and non-leap years', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2028)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2027)).toBe(false);
      expect(isLeapYear(2026)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2100)).toBe(false);
    });
  });

  describe('getDaysInMonth', () => {
    it('returns 29 for February in leap year and 28 in regular year', () => {
      expect(getDaysInMonth(2028, 2)).toBe(29);
      expect(getDaysInMonth(2027, 2)).toBe(28);
    });

    it('returns 30 for 30-day months', () => {
      expect(getDaysInMonth(2027, 4)).toBe(30);
      expect(getDaysInMonth(2027, 6)).toBe(30);
      expect(getDaysInMonth(2027, 9)).toBe(30);
      expect(getDaysInMonth(2027, 11)).toBe(30);
    });

    it('returns 31 for 31-day months', () => {
      expect(getDaysInMonth(2027, 1)).toBe(31);
      expect(getDaysInMonth(2027, 3)).toBe(31);
      expect(getDaysInMonth(2027, 5)).toBe(31);
      expect(getDaysInMonth(2027, 7)).toBe(31);
      expect(getDaysInMonth(2027, 8)).toBe(31);
      expect(getDaysInMonth(2027, 10)).toBe(31);
      expect(getDaysInMonth(2027, 12)).toBe(31);
    });

    it('returns 0 for invalid month numbers', () => {
      expect(getDaysInMonth(2027, 0)).toBe(0);
      expect(getDaysInMonth(2027, 13)).toBe(0);
    });
  });

  describe('isValidBrasiliaIsoDateTime table-driven validation', () => {
    const invalidCases: Array<{ desc: string; val: unknown }> = [
      { desc: 'non-existent Feb 30', val: '2027-02-30T10:00-03:00' },
      { desc: 'non-existent Feb 29 in non-leap year', val: '2027-02-29T10:00-03:00' },
      { desc: 'non-existent April 31', val: '2027-04-31T10:00-03:00' },
      { desc: 'non-existent June 31', val: '2027-06-31T10:00-03:00' },
      { desc: 'month 13', val: '2027-13-10T10:00-03:00' },
      { desc: 'month 00', val: '2027-00-10T10:00-03:00' },
      { desc: 'day 00', val: '2027-05-00T10:00-03:00' },
      { desc: 'day 32', val: '2027-01-32T10:00-03:00' },
      { desc: 'hour 24:00', val: '2027-03-02T24:00-03:00' },
      { desc: 'hour 25:00', val: '2027-03-02T25:00-03:00' },
      { desc: 'minute 23:60', val: '2027-03-02T23:60-03:00' },
      { desc: 'second 23:59:60', val: '2027-03-02T23:59:60-03:00' },
      { desc: 'missing offset', val: '2027-03-02T10:15' },
      { desc: 'UTC Z offset instead of -03:00', val: '2027-03-02T10:15:00Z' },
      { desc: 'different timezone offset +00:00', val: '2027-03-02T10:15+00:00' },
      { desc: 'different timezone offset -04:00', val: '2027-03-02T10:15-04:00' },
      { desc: 'empty string', val: '' },
      { desc: 'whitespace string', val: '   ' },
      { desc: 'null value', val: null },
      { desc: 'undefined value', val: undefined },
      { desc: 'number value', val: 123456789 },
      { desc: 'boolean value', val: true },
      { desc: 'object value', val: { date: '2027-03-02' } },
    ];

    test.each(invalidCases)('rejects invalid value: $desc', ({ val }) => {
      expect(isValidBrasiliaIsoDateTime(val)).toBe(false);
      expect(parseBrasiliaIsoDateTime(val)).toBeNull();
    });

    const validCases: Array<{ desc: string; val: string }> = [
      { desc: 'valid leap year Feb 29', val: '2028-02-29T10:00-03:00' },
      { desc: 'valid late night time 23:59', val: '2027-02-28T23:59-03:00' },
      { desc: 'valid with seconds', val: '2027-03-02T10:15:00-03:00' },
      { desc: 'valid morning 00:00', val: '2027-01-01T00:00-03:00' },
      { desc: 'valid end of December 31', val: '2026-12-31T23:59:59-03:00' },
    ];

    test.each(validCases)('accepts valid value: $desc', ({ val }) => {
      expect(isValidBrasiliaIsoDateTime(val)).toBe(true);
      const parsed = parseBrasiliaIsoDateTime(val);
      expect(parsed).toBeInstanceOf(Date);
      expect(isNaN(parsed!.getTime())).toBe(false);
    });
  });
});
