export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/**
 * Formata um objeto Date para o formato ISO com offset de Brasília (-03:00):
 * AAAA-MM-DDTHH:MM:SS-03:00 (RN01).
 */
export function formatIsoBrasilia(date: Date): string {
  const brasiliaOffsetMs = -3 * 60 * 60 * 1000;
  const brasiliaTime = new Date(date.getTime() + brasiliaOffsetMs);

  const yyyy = brasiliaTime.getUTCFullYear();
  const MM = String(brasiliaTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(brasiliaTime.getUTCDate()).padStart(2, '0');
  const hh = String(brasiliaTime.getUTCHours()).padStart(2, '0');
  const mm = String(brasiliaTime.getUTCMinutes()).padStart(2, '0');
  const ss = String(brasiliaTime.getUTCSeconds()).padStart(2, '0');

  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}-03:00`;
}
