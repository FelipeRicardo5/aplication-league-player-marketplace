import { roundCurrency } from './money';

/**
 * Calcula a comissão progressiva sobre o lucro da venda (RN16):
 * Cobrada SOMENTE se o lucro for maior que zero (sem lucro, 0.00):
 * - 10% sobre a parte do lucro até 10.00
 * - 20% sobre a parte acima de 10.00
 * Somadas e arredondadas uma única vez, no final (half-away-from-zero).
 */
export function calculateSaleCommission(profit: number): number {
  if (profit <= 0) {
    return 0.0;
  }

  const tier1Profit = Math.min(profit, 10.0);
  const tier2Profit = Math.max(0, profit - 10.0);

  const rawCommission = tier1Profit * 0.1 + tier2Profit * 0.2;
  return roundCurrency(rawCommission);
}

/**
 * Calcula os valores financeiros da venda (RN16):
 * - Lucro = valor de venda - valor de compra
 * - Comissão = calculada sobre o lucro
 * - Crédito no caixa = valor de venda - multa - comissão
 */
export function calculateSaleFinancials(
  saleValue: number,
  purchaseValue: number,
  penalty: number,
): { profit: number; fee: number; cashChange: number } {
  const profit = roundCurrency(saleValue - purchaseValue);
  const fee = calculateSaleCommission(profit);
  const cashChange = roundCurrency(saleValue - penalty - fee);

  return { profit, fee, cashChange };
}
