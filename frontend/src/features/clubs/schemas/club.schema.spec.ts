import { describe, it, expect } from 'vitest';
import { countWords, validateClubAcronym, createClubSchema } from './club.schema';

describe('Club Schema & Helpers', () => {
  describe('countWords', () => {
    it('returns 0 for empty string or whitespace', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
    });

    it('counts words accurately handling multiple spaces', () => {
      expect(countWords('Sport')).toBe(1);
      expect(countWords('Sport  Club   do  Recife')).toBe(4);
    });
  });

  describe('validateClubAcronym', () => {
    it('accepts valid acronym matching club letters in sequence', () => {
      expect(validateClubAcronym('SCR', 'Sport Club do Recife')).toBe(true);
      expect(validateClubAcronym('STC', 'Santa Cruz')).toBe(true);
    });

    it('normalizes diacritics when validating acronym', () => {
      expect(validateClubAcronym('SPF', 'São Paulo Futebol Clube')).toBe(true);
    });

    it('rejects acronym that does not start with the club first letter', () => {
      expect(validateClubAcronym('FCR', 'Sport Club do Recife')).toBe(false);
    });

    it('rejects acronym whose letters are not in forward sequence in name', () => {
      expect(validateClubAcronym('RCS', 'Sport Club do Recife')).toBe(false);
    });

    it('rejects acronym with 3 identical letters', () => {
      expect(validateClubAcronym('AAA', 'America Atletico Associacao')).toBe(false);
    });

    it('rejects acronym with length different than 3', () => {
      expect(validateClubAcronym('SC', 'Sport Club')).toBe(false);
      expect(validateClubAcronym('SCRF', 'Sport Club do Recife')).toBe(false);
    });
  });

  describe('createClubSchema', () => {
    it('validates a correct club input', () => {
      const result = createClubSchema.safeParse({
        name: 'Sport Club Recife',
        acronym: 'SCR',
      });
      expect(result.success).toBe(true);
    });

    it('rejects club with single word name', () => {
      const result = createClubSchema.safeParse({
        name: 'Sport',
        acronym: 'SPT',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('entre 2 e 5 palavras');
      }
    });

    it('rejects club name with numbers or disallowed characters', () => {
      const result = createClubSchema.safeParse({
        name: 'Sport Club 123',
        acronym: 'SCU',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid acronym length or characters', () => {
      const result = createClubSchema.safeParse({
        name: 'Sport Club Recife',
        acronym: 'SC1',
      });
      expect(result.success).toBe(false);
    });

    it('rejects acronym that does not follow the club name sequence', () => {
      const result = createClubSchema.safeParse({
        name: 'Sport Club Recife',
        acronym: 'RCS',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'A sigla deve iniciar com a primeira letra',
        );
      }
    });
  });
});
