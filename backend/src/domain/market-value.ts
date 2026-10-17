import { roundCurrency } from './money';

export type Condition = 'APTO' | 'MAL_CONDICIONADO' | 'DOENTE';

/**
 * Calcula o valor de mercado a cada consulta (RN02 a RN05):
 * 1. Desconto por condição física:
 *    - APTO: 0%
 *    - MAL_CONDICIONADO: 15%
 *    - DOENTE: 30%
 * 2. Efeito da agilidade (somente quando NÃO APTO):
 *    - agilidade >= 80: desconto cai pela metade
 *    - agilidade <= 30: desconto aumenta 10 pontos percentuais
 *    - agilidade 31 a 79: sem efeito
 * 3. Ajuste por idade:
 *    - idade <= 21: +10%
 *    - idade 22 a 31: 0%
 *    - idade >= 32: -10%
 * 4. Percentual total = ajuste por idade - desconto por condição
 * 5. Teto do desconto: se percentual total < -40%, limita a -40%
 * 6. Valor de mercado = base_value * (100 + percentual total) / 100, arredondado
 * 7. Piso de 1.00
 */
export function calculateMarketValue(
  baseValue: number,
  condition: Condition,
  agility: number,
  age: number,
): number {
  let conditionDiscount = 0;

  if (condition === 'MAL_CONDICIONADO') {
    conditionDiscount = 15;
  } else if (condition === 'DOENTE') {
    conditionDiscount = 30;
  }

  if (condition !== 'APTO') {
    if (agility >= 80) {
      conditionDiscount = conditionDiscount / 2;
    } else if (agility <= 30) {
      conditionDiscount = conditionDiscount + 10;
    }
  }

  let ageAdjustment = 0;
  if (age <= 21) {
    ageAdjustment = 10;
  } else if (age >= 32) {
    ageAdjustment = -10;
  }

  let totalPercent = ageAdjustment - conditionDiscount;

  // Teto do desconto (-40%)
  if (totalPercent < -40) {
    totalPercent = -40;
  }

  const rawMarketValue = (baseValue * (100 + totalPercent)) / 100;
  const rounded = roundCurrency(rawMarketValue);
  return Math.max(1.0, rounded);
}
