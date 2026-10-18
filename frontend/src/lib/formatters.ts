/**
 * Formatação consistente de valores monetários, percentuais e datas (America/Recife / Brasília).
 * O frontend NÃO recalcula regras de negócio; apenas formata os valores retornados pela API.
 */

const CURRENCY_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formata um número em formato monetário padrão brasileiro (ex.: "14,78" ou "R$ 14,78").
 */
export function formatCurrency(value: number | null | undefined, includeSymbol = false): string {
  if (value === null || value === undefined || isNaN(value)) {
    return includeSymbol ? 'R$ 0,00' : '0,00';
  }
  const formatted = CURRENCY_FORMATTER.format(value);
  return includeSymbol ? `R$ ${formatted}` : formatted;
}

/**
 * Formata variação de caixa com sinal explícito (ex.: "+14,78" ou "-14,78").
 */
export function formatSignedCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0,00';
  }
  const formatted = CURRENCY_FORMATTER.format(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

/**
 * Formata percentual (ex.: "10%").
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${value}%`;
}

/**
 * Formata data e hora conforme o fuso horário de Brasília (America/Recife / UTC-3).
 * Exemplo de saída: "18/10/2026 14:30" ou "18/10/2026 às 14:30".
 */
export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Recife',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formata apenas a data civil (ex.: "18/10/2026").
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Recife',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formata um objeto Date para o formato ISO exigido pela API backend:
 * "AAAA-MM-DDTHH:MM-03:00"
 */
export function formatIsoForBackend(date: Date): string {
  // Ajusta para o horário de Brasília (UTC-3)
  const d = new Date(date);
  // Obtém partes no fuso America/Recife
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Recife',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const year = partMap['year'];
  const month = partMap['month'];
  const day = partMap['day'];
  const hour = partMap['hour'];
  const minute = partMap['minute'];

  return `${year}-${month}-${day}T${hour}:${minute}-03:00`;
}
