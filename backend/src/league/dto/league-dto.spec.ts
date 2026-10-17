import { setLineupSchema } from './set-lineup.dto';
import { createMatchSchema } from './create-match.dto';
import { queryMatchesSchema } from './query-matches.dto';

describe('League DTOs Validation', () => {
  describe('setLineupSchema', () => {
    it('should accept valid formation and 5 unique player IDs', () => {
      const parsed = setLineupSchema.safeParse({
        formation: '2-1-1',
        player_ids: [1, 2, 3, 4, 5],
      });
      expect(parsed.success).toBe(true);
    });

    it('should reject invalid formation', () => {
      const parsed = setLineupSchema.safeParse({
        formation: '4-3-3',
        player_ids: [1, 2, 3, 4, 5],
      });
      expect(parsed.success).toBe(false);
    });

    it('should reject if fewer or more than 5 players', () => {
      const parsed = setLineupSchema.safeParse({
        formation: '2-1-1',
        player_ids: [1, 2, 3, 4],
      });
      expect(parsed.success).toBe(false);
    });

    it('should reject duplicate player IDs', () => {
      const parsed = setLineupSchema.safeParse({
        formation: '2-1-1',
        player_ids: [1, 2, 3, 4, 4],
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('createMatchSchema', () => {
    it('should accept different home and away clubs', () => {
      const parsed = createMatchSchema.safeParse({
        home_club_id: 1,
        away_club_id: 2,
      });
      expect(parsed.success).toBe(true);
    });

    it('should reject identical home and away clubs', () => {
      const parsed = createMatchSchema.safeParse({
        home_club_id: 1,
        away_club_id: 1,
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('queryMatchesSchema', () => {
    it('should accept valid club_id string and parse to number', () => {
      const parsed = queryMatchesSchema.safeParse({
        club_id: '3',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.club_id).toBe(3);
      }
    });

    it('should reject club_id with leading zeros or non-numeric', () => {
      const parsed = queryMatchesSchema.safeParse({
        club_id: '03',
      });
      expect(parsed.success).toBe(false);
    });
  });
});
