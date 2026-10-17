import { mapPlayerToResponse, PlayerDbEntity } from './player.mapper';

describe('PlayerMapper', () => {
  it('should map a raw database player entity to PlayerResponse with calculated overall and market_value', () => {
    const rawPlayer: PlayerDbEntity = {
      id: 10,
      nome: 'Arthur Antunes',
      posicao: 'MEI',
      agilidade: 85,
      idade: 25,
      condicao: 'APTO',
      valor_base: 40.0,
      velocidade: 70,
      finalizacao: 68,
      passe: 82,
      drible: 79,
      defesa: 55,
      fisico: 64,
      potencial: 86,
      clube_id: null,
    };

    const response = mapPlayerToResponse(rawPlayer);

    expect(response).toEqual({
      id: 10,
      name: 'Arthur Antunes',
      position: 'MEI',
      agility: 85,
      age: 25,
      condition: 'APTO',
      base_value: 40.0,
      market_value: 40.0,
      pace: 70,
      shooting: 68,
      passing: 82,
      dribbling: 79,
      defending: 55,
      physical: 64,
      potential: 86,
      overall: 75,
      club_id: null,
    });
  });

  it('should handle decimal object for valor_base', () => {
    const rawPlayer: PlayerDbEntity = {
      id: 12,
      nome: 'Carlos Goleiro',
      posicao: 'GOL',
      agilidade: 90,
      idade: 20,
      condicao: 'APTO',
      valor_base: { toString: () => '50.00' },
      velocidade: 50,
      finalizacao: 20,
      passe: 60,
      drible: 40,
      defesa: 80,
      fisico: 75,
      potencial: 88,
      clube_id: 1,
    };

    const response = mapPlayerToResponse(rawPlayer);

    expect(response.id).toBe(12);
    expect(response.base_value).toBe(50.0);
    // Age 20 (<= 21) adds +10% adjustment: 50 * 1.10 = 55.0
    expect(response.market_value).toBe(55.0);
    expect(response.club_id).toBe(1);
  });
});
