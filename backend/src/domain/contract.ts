import { roundCurrency } from './money';

export type ContractStatus = 'ATIVO' | 'ENCERRADO' | 'RESCINDIDO';

/**
 * Calcula a taxa de compra (RN13):
 * 5% do valor de mercado, arredondada, cobrada SOMENTE quando o valor de mercado é MAIOR que 30,00.
 */
export function calculatePurchaseFee(marketValue: number): number {
  if (marketValue > 30.0) {
    return roundCurrency(marketValue * 0.05);
  }
  return 0.0;
}

/**
 * Calcula dias restantes até o fim da fidelidade do contrato (RN15):
 * (fim da fidelidade - momento atual) em dias com fração, arredondado para cima (Math.ceil).
 * Se o fim já passou (ou é o próprio momento), retorna 0.
 */
export function calculateRemainingDays(loyaltyUntil: Date, now: Date): number {
  const diffMs = loyaltyUntil.getTime() - now.getTime();
  if (diffMs <= 0) {
    return 0;
  }
  return Math.ceil(diffMs / 86_400_000);
}

/**
 * Determina a taxa percentual da multa por fidelidade (RN15):
 * - 0 dias: 0%
 * - 1 a 30 dias: 5%
 * - 31 a 180 dias: 10%
 * - 181 ou mais dias: 20%
 */
export function calculatePenaltyRate(remainingDays: number): number {
  if (remainingDays <= 0) {
    return 0;
  }
  if (remainingDays <= 30) {
    return 5;
  }
  if (remainingDays <= 180) {
    return 10;
  }
  return 20;
}

/**
 * Calcula a multa por fidelidade (RN15):
 * valor de mercado no momento * percentual da multa, arredondada e limitada a 10.00.
 */
export function calculateLoyaltyPenalty(marketValue: number, penaltyRate: number): number {
  if (penaltyRate <= 0) {
    return 0.0;
  }
  const rawPenalty = roundCurrency((marketValue * penaltyRate) / 100);
  return Math.min(10.0, rawPenalty);
}

/**
 * Determina o status do contrato após a venda (RN15):
 * Com multa (> 0): RESCINDIDO
 * Sem multa: ENCERRADO
 */
export function getContractStatusAfterSale(penalty: number): ContractStatus {
  return penalty > 0 ? 'RESCINDIDO' : 'ENCERRADO';
}
