import { BadRequestException } from '@nestjs/common';
import {
  compareUnicodeNames,
  countWords,
  normalizeClubName,
  sanitizeTextV4,
  validateClubAcronym,
} from './text';

describe('Shared Text Utilities', () => {
  describe('sanitizeTextV4', () => {
    it('should trim and collapse multiple spaces', () => {
      expect(sanitizeTextV4('  Meia   Zeta ')).toBe('Meia Zeta');
      expect(sanitizeTextV4('Águias   FC')).toBe('Águias FC');
    });

    it('should reject control characters with 400', () => {
      expect(() => sanitizeTextV4('Meia\tZeta')).toThrow(BadRequestException);
      expect(() => sanitizeTextV4('Meia\nZeta')).toThrow(BadRequestException);
      expect(() => sanitizeTextV4('Meia\rZeta')).toThrow(BadRequestException);
    });
  });

  describe('normalizeClubName', () => {
    it('should lowercase and preserve accents according to RN10', () => {
      expect(normalizeClubName('  Águias   FC ')).toBe('águias fc');
      expect(normalizeClubName('Aguias FC')).toBe('aguias fc');
      expect(normalizeClubName('Águias FC')).not.toBe(normalizeClubName('Aguias FC'));
    });
  });

  describe('compareUnicodeNames', () => {
    it('should order space before hyphen and hyphen before letters', () => {
      expect(compareUnicodeNames('Ana Lima', 'Ana-Maria')).toBeLessThan(0);
      expect(compareUnicodeNames('Ana-Maria', 'Ana Lima')).toBeGreaterThan(0);
    });

    it('should order Épsilon between Delta and Gama', () => {
      expect(compareUnicodeNames('Delta', 'Épsilon')).toBeLessThan(0);
      expect(compareUnicodeNames('Épsilon', 'Gama')).toBeLessThan(0);
    });

    it('should consider Águias FC and Aguias FC equal in Unicode comparison', () => {
      expect(compareUnicodeNames('Águias FC', 'Aguias FC')).toBe(0);
    });
  });

  describe('countWords', () => {
    it('should count words with at least one letter', () => {
      expect(countWords('Meia Lua')).toBe(2);
      expect(countWords('Águias FC')).toBe(2);
      expect(countWords('A-1 B-2')).toBe(2);
      expect(countWords('123 456')).toBe(0);
      expect(countWords('')).toBe(0);
    });
  });

  describe('validateClubAcronym', () => {
    it('should validate valid acronyms derived from club name', () => {
      expect(validateClubAcronym('AGU', 'Águias FC')).toBe(true);
      expect(validateClubAcronym('AFC', 'Águias FC')).toBe(true);
      expect(validateClubAcronym('DEL', 'Delta FC')).toBe(true);
      expect(validateClubAcronym('GAM', 'Gama SC')).toBe(true);
    });

    it('should reject acronyms with 3 identical letters', () => {
      expect(validateClubAcronym('AAA', 'Águias Atlético Alagoano')).toBe(false);
    });

    it('should reject acronyms where first letter is not the first letter of club name', () => {
      expect(validateClubAcronym('GUA', 'Águias FC')).toBe(false);
    });

    it('should reject letters out of order', () => {
      expect(validateClubAcronym('AUG', 'Águias FC')).toBe(false);
    });
  });
});
