/**
 * Helper puro de validação de data e hora no padrão da RN01.
 * Formato aceito: AAAA-MM-DDTHH:MM-03:00 ou AAAA-MM-DDTHH:MM:SS-03:00.
 * Rejeita qualquer outro formato, offsets diferentes de -03:00,
 * datas inexistentes (ex.: 30 de fevereiro, 31 de abril) e horas inválidas (ex.: 24:00, 23:60).
 */

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30;
  }
  return 31;
}

export function isValidBrasiliaIsoDateTime(val: unknown): val is string {
  if (typeof val !== 'string' || val.trim().length === 0) {
    return false;
  }

  const match = val.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(-03:00)$/);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] !== undefined ? Number(match[6]) : 0;

  if (month < 1 || month > 12) {
    return false;
  }

  if (hour < 0 || hour > 23) {
    return false;
  }

  if (minute < 0 || minute > 59) {
    return false;
  }

  if (second < 0 || second > 59) {
    return false;
  }

  const maxDays = getDaysInMonth(year, month);
  if (day < 1 || day > maxDays) {
    return false;
  }

  // Verificação ida e volta com Date.UTC tratando os componentes locais
  // como UTC para garantir integridade do calendário sem falso negativo de fuso
  const utcCheck = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (
    utcCheck.getUTCFullYear() !== year ||
    utcCheck.getUTCMonth() !== month - 1 ||
    utcCheck.getUTCDate() !== day ||
    utcCheck.getUTCHours() !== hour ||
    utcCheck.getUTCMinutes() !== minute ||
    utcCheck.getUTCSeconds() !== second
  ) {
    return false;
  }

  return true;
}

export function parseBrasiliaIsoDateTime(val: unknown): Date | null {
  if (!isValidBrasiliaIsoDateTime(val)) {
    return null;
  }
  const date = new Date(val);
  return isNaN(date.getTime()) ? null : date;
}
