import { createPlayerSchema } from './create-player.dto';
import { updatePlayerSchema } from './update-player.dto';

describe('Player Schemas (Modular Composition)', () => {
  describe('basePlayerSchema rules via updatePlayerSchema', () => {
    it('should validate and sanitize a valid update payload', () => {
      const input = {
        name: '  Neymar   Santos  Junior ',
        position: 'ATA',
        agility: 80,
        age: 32,
      };

      const parsed = updatePlayerSchema.parse(input);
      expect(parsed.name).toBe('Neymar Santos Junior');
      expect(parsed.position).toBe('ATA');
      expect(parsed.agility).toBe(80);
      expect(parsed.age).toBe(32);
    });

    it('should reject names with digits', () => {
      const input = {
        name: 'Player 99',
        position: 'ATA',
        agility: 70,
        age: 25,
      };

      expect(() => updatePlayerSchema.parse(input)).toThrow(
        'O nome não pode conter dígitos numéricos',
      );
    });

    it('should reject names with single word', () => {
      const input = {
        name: 'Pelé',
        position: 'ATA',
        agility: 99,
        age: 25,
      };

      expect(() => updatePlayerSchema.parse(input)).toThrow(
        'O nome deve ter pelo menos duas palavras',
      );
    });

    it('should reject cross rule: age >= 35 with agility > 85', () => {
      const input = {
        name: 'Cristiano Ronaldo',
        position: 'ATA',
        agility: 90,
        age: 38,
      };

      expect(() => updatePlayerSchema.parse(input)).toThrow(
        'Jogador com 35 anos ou mais deve ter agilidade no máximo 85',
      );
    });
  });

  describe('createPlayerSchema inheritance', () => {
    it('should validate a full valid create payload', () => {
      const input = {
        name: 'Carlos Alberto',
        position: 'LAT',
        agility: 80,
        age: 26,
        pace: 80,
        shooting: 70,
        passing: 75,
        dribbling: 78,
        defending: 82,
        physical: 79,
        potential: 85,
      };

      const parsed = createPlayerSchema.parse(input);
      expect(parsed.name).toBe('Carlos Alberto');
      expect(parsed.pace).toBe(80);
      expect(parsed.potential).toBe(85);
    });

    it('should reject potential lower than highest attribute', () => {
      const input = {
        name: 'Carlos Alberto',
        position: 'LAT',
        agility: 80,
        age: 26,
        pace: 85,
        shooting: 70,
        passing: 75,
        dribbling: 78,
        defending: 82,
        physical: 79,
        potential: 80, // Lower than pace (85)
      };

      expect(() => createPlayerSchema.parse(input)).toThrow(
        'O potencial não pode ser menor que o maior dos atributos',
      );
    });

    it('should enforce potential equal to highest attribute for age >= 33', () => {
      const input = {
        name: 'Veterano Craque',
        position: 'MEI',
        agility: 75,
        age: 34,
        pace: 70,
        shooting: 75,
        passing: 85,
        dribbling: 75,
        defending: 60,
        physical: 65,
        potential: 90, // Should be 85
      };

      expect(() => createPlayerSchema.parse(input)).toThrow(
        'Para jogador com 33 anos ou mais no cadastro, o potencial deve ser igual ao maior atributo',
      );
    });
  });
});
