import { describe, it, expect } from 'vitest';
import { validateLineup } from '../utils/lineup-validator';
import type { Player } from '@/features/players/types';

function mockPlayer(overrides: Partial<Player>): Player {
  return {
    id: 1,
    name: 'Jogador Teste',
    position: 'ATA',
    age: 25,
    agility: 80,
    overall: 80,
    potential: 85,
    base_value: 1000000,
    market_value: 1000000,
    condition: 'APTO',
    club_id: 1,
    pace: 80,
    shooting: 80,
    passing: 80,
    dribbling: 80,
    defending: 80,
    physical: 80,
    ...overrides,
  };
}

describe('validateLineup', () => {
  it('rejects lineup with less or more than 5 players', () => {
    const fourPlayers = [
      mockPlayer({ id: 1, position: 'GOL' }),
      mockPlayer({ id: 2, position: 'ZAG' }),
      mockPlayer({ id: 3, position: 'LAT' }),
      mockPlayer({ id: 4, position: 'ATA' }),
    ];
    const res = validateLineup('3-1', fourPlayers);
    expect(res.valid).toBe(false);
    expect(res.message).toContain('Selecione exatamente 5 titulares');
  });

  it('rejects lineup if any player is DOENTE', () => {
    const playersWithSick = [
      mockPlayer({ id: 1, position: 'GOL', condition: 'DOENTE' }),
      mockPlayer({ id: 2, position: 'ZAG' }),
      mockPlayer({ id: 3, position: 'LAT' }),
      mockPlayer({ id: 4, position: 'ZAG' }),
      mockPlayer({ id: 5, position: 'ATA' }),
    ];
    const res = validateLineup('3-1', playersWithSick);
    expect(res.valid).toBe(false);
    expect(res.message).toContain('está DOENTE e não pode ser escalado');
  });

  it('rejects lineup without exactly 1 GOL', () => {
    const noGk = [
      mockPlayer({ id: 1, position: 'ZAG' }),
      mockPlayer({ id: 2, position: 'ZAG' }),
      mockPlayer({ id: 3, position: 'LAT' }),
      mockPlayer({ id: 4, position: 'LAT' }),
      mockPlayer({ id: 5, position: 'ATA' }),
    ];
    const res = validateLineup('3-1', noGk);
    expect(res.valid).toBe(false);
    expect(res.message).toContain('exatamente 1 Goleiro');
  });

  it('validates 3-1 formation (1 GOL, 3 DEF, 1 ATA)', () => {
    const valid31 = [
      mockPlayer({ id: 1, position: 'GOL' }),
      mockPlayer({ id: 2, position: 'ZAG' }),
      mockPlayer({ id: 3, position: 'LAT' }),
      mockPlayer({ id: 4, position: 'ZAG' }),
      mockPlayer({ id: 5, position: 'ATA' }),
    ];
    expect(validateLineup('3-1', valid31).valid).toBe(true);
  });

  it('validates 2-2 formation (1 GOL, 2 DEF, 2 ATA)', () => {
    const valid22 = [
      mockPlayer({ id: 1, position: 'GOL' }),
      mockPlayer({ id: 2, position: 'ZAG' }),
      mockPlayer({ id: 3, position: 'LAT' }),
      mockPlayer({ id: 4, position: 'ATA' }),
      mockPlayer({ id: 5, position: 'ATA' }),
    ];
    expect(validateLineup('2-2', valid22).valid).toBe(true);
  });

  it('validates 2-1-1 formation (1 GOL, 2 DEF, 1 MEI, 1 ATA)', () => {
    const valid211 = [
      mockPlayer({ id: 1, position: 'GOL' }),
      mockPlayer({ id: 2, position: 'ZAG' }),
      mockPlayer({ id: 3, position: 'LAT' }),
      mockPlayer({ id: 4, position: 'MEI' }),
      mockPlayer({ id: 5, position: 'ATA' }),
    ];
    expect(validateLineup('2-1-1', valid211).valid).toBe(true);
  });

  it('validates 1-2-1 formation (1 GOL, 1 DEF, 2 MEI, 1 ATA)', () => {
    const valid121 = [
      mockPlayer({ id: 1, position: 'GOL' }),
      mockPlayer({ id: 2, position: 'ZAG' }),
      mockPlayer({ id: 3, position: 'MEI' }),
      mockPlayer({ id: 4, position: 'MEI' }),
      mockPlayer({ id: 5, position: 'ATA' }),
    ];
    expect(validateLineup('1-2-1', valid121).valid).toBe(true);
  });

  it('rejects mismatch between formation and selected players', () => {
    // 2 MEI selected for a 3-1 formation
    const mismatch = [
      mockPlayer({ id: 1, position: 'GOL' }),
      mockPlayer({ id: 2, position: 'ZAG' }),
      mockPlayer({ id: 3, position: 'MEI' }),
      mockPlayer({ id: 4, position: 'MEI' }),
      mockPlayer({ id: 5, position: 'ATA' }),
    ];
    const res = validateLineup('3-1', mismatch);
    expect(res.valid).toBe(false);
    expect(res.message).toContain('A formação 3-1 exige');
  });
});
