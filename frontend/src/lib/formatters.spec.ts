import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatSignedCurrency,
  formatPercent,
  formatDate,
  formatDateTime,
  formatIsoForBackend,
} from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats numbers with two decimal places using comma', () => {
      expect(formatCurrency(14.78)).toBe('14,78');
      expect(formatCurrency(1000)).toBe('1.000,00');
    });

    it('formats with R$ symbol when requested', () => {
      expect(formatCurrency(14.78, true)).toContain('14,78');
      expect(formatCurrency(14.78, true)).toContain('R$');
    });

    it('handles null/undefined gracefully', () => {
      expect(formatCurrency(null)).toBe('0,00');
      expect(formatCurrency(undefined)).toBe('0,00');
      expect(formatCurrency(null, true)).toContain('0,00');
    });
  });

  describe('formatSignedCurrency', () => {
    it('prepends + for positive values', () => {
      expect(formatSignedCurrency(14.78)).toBe('+14,78');
    });

    it('prepends - for negative values', () => {
      expect(formatSignedCurrency(-14.78)).toBe('-14,78');
    });

    it('returns 0,00 for zero', () => {
      expect(formatSignedCurrency(0)).toBe('0,00');
    });
  });

  describe('formatPercent', () => {
    it('appends %', () => {
      expect(formatPercent(10)).toBe('10%');
      expect(formatPercent(0)).toBe('0%');
      expect(formatPercent(null)).toBe('0%');
    });
  });

  describe('formatDate and formatDateTime', () => {
    it('formats date to DD/MM/YYYY', () => {
      const iso = '2026-10-18T14:30:00-03:00';
      expect(formatDate(iso)).toBe('18/10/2026');
    });

    it('formats date and time in America/Recife timezone', () => {
      const iso = '2026-10-18T14:30:00-03:00';
      const formatted = formatDateTime(iso);
      expect(formatted).toContain('18/10/2026');
      expect(formatted).toContain('14:30');
    });

    it('handles null/invalid input', () => {
      expect(formatDate(null)).toBe('-');
      expect(formatDate('invalid')).toBe('-');
    });
  });

  describe('formatIsoForBackend', () => {
    it('produces AAAA-MM-DDTHH:MM-03:00 format', () => {
      const date = new Date('2026-10-25T15:30:00-03:00');
      const iso = formatIsoForBackend(date);
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}-03:00$/);
      expect(iso).toBe('2026-10-25T15:30-03:00');
    });
  });
});
