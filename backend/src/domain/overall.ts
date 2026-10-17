export type Position = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

const POSITION_WEIGHTS: Record<Position, PlayerAttributes> = {
  GOL: { pace: 10, shooting: 0, passing: 20, dribbling: 0, defending: 40, physical: 30 },
  ZAG: { pace: 10, shooting: 0, passing: 15, dribbling: 0, defending: 45, physical: 30 },
  LAT: { pace: 25, shooting: 0, passing: 20, dribbling: 15, defending: 25, physical: 15 },
  MEI: { pace: 10, shooting: 15, passing: 35, dribbling: 25, defending: 5, physical: 10 },
  ATA: { pace: 20, shooting: 40, passing: 10, dribbling: 20, defending: 0, physical: 10 },
};

/**
 * Calcula o overall do jogador (RN06):
 * 1. Multiplica cada atributo pelo peso dele na posição do jogador;
 * 2. Soma os seis produtos e divide por 100;
 * 3. Arredonda para o inteiro mais próximo, com meio para cima (72.5 -> 73).
 */
export function calculateOverall(position: Position, attrs: PlayerAttributes): number {
  const weights = POSITION_WEIGHTS[position];
  const sumProducts =
    attrs.pace * weights.pace +
    attrs.shooting * weights.shooting +
    attrs.passing * weights.passing +
    attrs.dribbling * weights.dribbling +
    attrs.defending * weights.defending +
    attrs.physical * weights.physical;

  // Soma / 100 arredondado para o inteiro mais próximo com meio para cima
  const score = sumProducts / 100;
  return Math.floor(score + 0.5);
}
