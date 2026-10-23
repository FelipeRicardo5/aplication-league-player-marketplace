import { buyPlayerSchema } from './buy-player.dto';
import { queryTransactionsSchema } from './query-transactions.dto';

describe('Market DTOs Validation', () => {
  describe('buyPlayerSchema', () => {
    const fixedNow = new Date('2026-10-23T12:00:00-03:00');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(fixedNow);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should accept valid purchase payload with future loyalty date within 1095 days', () => {
      const futureDate = new Date(Date.now() + 120 * 86400 * 1000);
      const isoFuture = futureDate.toISOString().slice(0, 16) + '-03:00';

      const parsed = buyPlayerSchema.safeParse({
        club_id: 1,
        loyalty_until: isoFuture,
      });

      expect(parsed.success).toBe(true);
    });

    it('should accept exact 1095 days boundary', () => {
      const boundaryDate = new Date(fixedNow.getTime() + 1095 * 86400 * 1000);
      // Format as YYYY-MM-DDTHH:MM:SS-03:00
      const brasiliaOffsetMs = -3 * 60 * 60 * 1000;
      const bDate = new Date(boundaryDate.getTime() + brasiliaOffsetMs);
      const iso = bDate.toISOString().slice(0, 19) + '-03:00';

      const parsed = buyPlayerSchema.safeParse({
        club_id: 1,
        loyalty_until: iso,
      });
      expect(parsed.success).toBe(true);
    });

    it('should accept leap year 2028-02-29 within limit', () => {
      const parsed = buyPlayerSchema.safeParse({
        club_id: 1,
        loyalty_until: '2028-02-29T12:00-03:00',
      });
      expect(parsed.success).toBe(true);
    });

    it('should accept valid late time 2027-02-28T23:59-03:00', () => {
      const parsed = buyPlayerSchema.safeParse({
        club_id: 1,
        loyalty_until: '2027-02-28T23:59-03:00',
      });
      expect(parsed.success).toBe(true);
    });

    const invalidTable = [
      { desc: 'non-existent Feb 30', val: '2027-02-30T10:00-03:00' },
      { desc: 'non-existent Feb 29 in non-leap year', val: '2027-02-29T10:00-03:00' },
      { desc: 'non-existent April 31', val: '2027-04-31T10:00-03:00' },
      { desc: 'non-existent June 31', val: '2027-06-31T10:00-03:00' },
      { desc: 'month 13', val: '2027-13-10T10:00-03:00' },
      { desc: 'month 00', val: '2027-00-10T10:00-03:00' },
      { desc: 'day 00', val: '2027-05-00T10:00-03:00' },
      { desc: 'hour 24:00', val: '2027-03-02T24:00-03:00' },
      { desc: 'minute 23:60', val: '2027-03-02T23:60-03:00' },
      { desc: 'hour 25:00', val: '2027-03-02T25:00-03:00' },
      { desc: 'missing offset', val: '2027-03-02T10:15' },
      { desc: 'wrong offset Z', val: '2027-03-02T10:15:00Z' },
      { desc: 'empty string', val: '' },
      { desc: 'null value', val: null },
      { desc: 'number value', val: 1729684800000 },
      { desc: 'past date', val: '2026-10-22T10:00-03:00' },
      { desc: 'exceeds 1095 days (1096 days)', val: '2029-10-24T12:00-03:00' },
    ];

    test.each(invalidTable)('rejects invalid loyalty_until: $desc', ({ val }) => {
      const parsed = buyPlayerSchema.safeParse({
        club_id: 1,
        loyalty_until: val,
      });
      expect(parsed.success).toBe(false);
    });

    it('should reject non-positive or float club_id', () => {
      const parsed = buyPlayerSchema.safeParse({
        club_id: 0,
        loyalty_until: '2027-03-02T10:15-03:00',
      });
      expect(parsed.success).toBe(false);
    });

    it('should reject past loyalty date', () => {
      const parsed = buyPlayerSchema.safeParse({
        club_id: 1,
        loyalty_until: '2020-01-01T10:00-03:00',
      });
      expect(parsed.success).toBe(false);
    });

    it('should reject loyalty date further than 1095 days', () => {
      const farFuture = new Date(Date.now() + 1100 * 86400 * 1000);
      const isoFar = farFuture.toISOString().slice(0, 16) + '-03:00';
      const parsed = buyPlayerSchema.safeParse({
        club_id: 1,
        loyalty_until: isoFar,
      });
      expect(parsed.success).toBe(false);
    });

    it('should reject wrong timezone format', () => {
      const parsed = buyPlayerSchema.safeParse({
        club_id: 1,
        loyalty_until: '2027-03-02T10:15:00Z',
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('queryTransactionsSchema', () => {
    it('should accept valid type and player_id', () => {
      const parsed = queryTransactionsSchema.safeParse({
        type: 'COMPRA,VENDA',
        player_id: '5',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.player_id).toBe(5);
      }
    });

    it('should accept single type', () => {
      const parsed = queryTransactionsSchema.safeParse({
        type: 'VENDA',
      });
      expect(parsed.success).toBe(true);
    });

    it('should reject lowercase or invalid type', () => {
      const parsed = queryTransactionsSchema.safeParse({
        type: 'venda',
      });
      expect(parsed.success).toBe(false);
    });

    it('should reject duplicated types in comma separated string', () => {
      const parsed = queryTransactionsSchema.safeParse({
        type: 'COMPRA,COMPRA',
      });
      expect(parsed.success).toBe(false);
    });

    it('should reject empty type', () => {
      const parsed = queryTransactionsSchema.safeParse({
        type: '',
      });
      expect(parsed.success).toBe(false);
    });

    it('should reject invalid player_id format', () => {
      const parsed = queryTransactionsSchema.safeParse({
        player_id: '01',
      });
      expect(parsed.success).toBe(false);
    });
  });
});
