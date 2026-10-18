import { describe, it, expect } from 'vitest';
import { createPlayerSchema, updatePlayerSchema } from './player.schema';

describe('player schemas', () => {
  describe('createPlayerSchema', () => {
    const validData = {
      name: 'Gabriel Silva',
      position: 'MEI' as const,
      age: 24,
      agility: 80,
      pace: 75,
      shooting: 70,
      passing: 80,
      dribbling: 75,
      defending: 60,
      physical: 70,
      potential: 85,
    };

    it('validates a valid player payload', () => {
      const result = createPlayerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects names with less than 2 words', () => {
      const result = createPlayerSchema.safeParse({ ...validData, name: 'Gabriel' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('pelo menos duas palavras');
      }
    });

    it('rejects names with numbers', () => {
      const result = createPlayerSchema.safeParse({ ...validData, name: 'Gabriel 123' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('não pode conter dígitos numéricos');
      }
    });

    it('rejects agility > 85 for player with age >= 35 (RN01)', () => {
      const result = createPlayerSchema.safeParse({
        ...validData,
        age: 36,
        agility: 88,
        potential: 80,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('agilidade no máximo 85');
      }
    });

    it('rejects attribute sum > 480', () => {
      const result = createPlayerSchema.safeParse({
        ...validData,
        pace: 90,
        shooting: 90,
        passing: 90,
        dribbling: 90,
        defending: 90,
        physical: 90, // sum 540
        potential: 95,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('máximo permitido: 480');
      }
    });

    it('rejects potential < highest attribute', () => {
      const result = createPlayerSchema.safeParse({
        ...validData,
        passing: 85,
        potential: 80, // passing is 85 > potential 80
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('não pode ser menor que o maior atributo');
      }
    });

    it('requires potential to equal highest attribute for age >= 33', () => {
      const result = createPlayerSchema.safeParse({
        ...validData,
        age: 34,
        agility: 75,
        passing: 80, // max attr is 80
        potential: 85, // should be exactly 80
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'potencial deve ser exatamente igual ao maior atributo',
        );
      }
    });
  });

  describe('updatePlayerSchema', () => {
    it('validates update data', () => {
      const result = updatePlayerSchema.safeParse({
        name: 'Roberto Carlos',
        position: 'LAT',
        age: 30,
        agility: 85,
      });
      expect(result.success).toBe(true);
    });

    it('rejects agility > 85 for age >= 35 on update', () => {
      const result = updatePlayerSchema.safeParse({
        name: 'Roberto Carlos',
        position: 'LAT',
        age: 38,
        agility: 90,
      });
      expect(result.success).toBe(false);
    });
  });
});
