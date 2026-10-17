/**
 * Arredonda um valor monetário para 2 casas decimais usando "half-away-from-zero"
 * (meio para longe do zero), com proteção contra imprecisões de ponto flutuante.
 * Exemplos normativos: 14.775 -> 14.78; 0.385 -> 0.39; 3.625 -> 3.63.
 */
export function roundCurrency(val: number): number {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  // Adiciona 1e-9 para neutralizar imprecisões como 14.774999999999998
  const roundedCents = Math.round(abs * 100 + 1e-9);
  return (sign * roundedCents) / 100;
}

/**
 * Converte valor em moedas para centavos inteiros.
 */
export function toCents(val: number): number {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  return sign * Math.round(abs * 100 + 1e-9);
}

/**
 * Converte centavos inteiros para valor em moedas.
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Formata número para exibição em CSV (com 2 casas e vírgula decimal, sinal negativo se < 0).
 */
export function formatCurrencyCsv(val: number): string {
  const rounded = roundCurrency(val);
  return rounded.toFixed(2).replace('.', ',');
}
