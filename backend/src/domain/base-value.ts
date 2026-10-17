import { roundCurrency } from './money';

/**
 * Calcula o valor base do jogador no cadastro (RN06):
 * 1. Parte progressiva do overall:
 *    - 41 a 60: 0.50 por ponto
 *    - 61 a 75: 2.00 por ponto
 *    - 76 a 99: 6.00 por ponto
 *    - overall até 40 não soma nada (0.00)
 * 2. Jovem Promessa:
 *    se idade <= 21: parte do overall * (100 + potencial - overall) / 100
 * 3. Arredondamento para 2 casas decimais (half-away-from-zero);
 * 4. Piso de 1.00.
 */
export function calculateBaseValue(overall: number, potential: number, age: number): number {
  let overallPart = 0;

  if (overall > 40) {
    const tier1Points = Math.min(overall, 60) - 40;
    overallPart += tier1Points * 0.5;
  }

  if (overall > 60) {
    const tier2Points = Math.min(overall, 75) - 60;
    overallPart += tier2Points * 2.0;
  }

  if (overall > 75) {
    const tier3Points = Math.min(overall, 99) - 75;
    overallPart += tier3Points * 6.0;
  }

  let baseValue = overallPart;

  if (age <= 21) {
    const multiplier = (100 + potential - overall) / 100;
    baseValue = baseValue * multiplier;
  }

  const rounded = roundCurrency(baseValue);
  return Math.max(1.0, rounded);
}
