import { buyPlayerSchema } from './buy-player.dto';
import { queryTransactionsSchema } from './query-transactions.dto';

describe('Market DTOs Validation', () => {
  describe('buyPlayerSchema', () => {
    it('should accept valid purchase payload with future loyalty date within 1095 days', () => {
      const futureDate = new Date(Date.now() + 120 * 86400 * 1000);
      const isoFuture = futureDate.toISOString().slice(0, 16) + '-03:00';

      const parsed = buyPlayerSchema.safeParse({
        club_id: 1,
        loyalty_until: isoFuture,
      });

      expect(parsed.success).toBe(true);
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
