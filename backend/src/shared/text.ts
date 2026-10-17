import { BadRequestException } from '@nestjs/common';

/**
 * Remove acentos de uma string através de decomposição NFD.
 */
export function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Sanitiza texto conforme regra V4:
 * - Rejeita caracteres de controle (\t, \n, etc.) com 400 Bad Request
 * - Remove espaços no início e fim
 * - Colapsa múltiplos espaços U+0020 em um único espaço
 */
export function sanitizeTextV4(text: string): string {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if ((code >= 0 && code <= 31) || code === 127) {
      throw new BadRequestException('Texto contém caracteres de controle inválidos');
    }
  }
  return text.trim().replace(/ +/g, ' ');
}

/**
 * Normaliza o nome do clube para garantir unicidade case-insensitive preservando acentos (RN10).
 */
export function normalizeClubName(name: string): string {
  const sanitized = sanitizeTextV4(name);
  return sanitized.toLowerCase();
}

/**
 * Normaliza string para chave de busca/ordenação (minúsculas sem acento).
 */
export function normalizeForSearch(text: string): string {
  return stripAccents(sanitizeTextV4(text)).toLowerCase();
}

/**
 * Comparador de strings Unicode conforme as premissas da liga:
 * - Converte para minúsculas
 * - Remove acentos
 * - Compara caractere a caractere pelo código Unicode (espaço < hífen < letras)
 */
export function compareUnicodeNames(a: string, b: string): number {
  const normA = normalizeForSearch(a);
  const normB = normalizeForSearch(b);

  if (normA < normB) {
    return -1;
  }
  if (normA > normB) {
    return 1;
  }
  return 0;
}

/**
 * Conta quantas palavras válidas existem no texto.
 * Palavra: sequência sem espaços com pelo menos uma letra Unicode (\p{L}).
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const parts = text.split(' ').filter(Boolean);
  return parts.filter((part) => /\p{L}/u.test(part)).length;
}

/**
 * Valida se uma sigla de clube (3 letras A-Z) corresponde ao nome do clube:
 * - Exatamente 3 letras de A a Z maiúsculas sem acento
 * - As três letras não podem ser todas iguais
 * - A primeira letra da sigla deve ser a primeira letra do nome
 * - As 3 letras devem aparecer no nome nessa ordem (sem diferenciar maiúsculas/minúsculas/acentos)
 */
export function validateClubAcronym(acronym: string, clubName: string): boolean {
  if (!/^[A-Z]{3}$/.test(acronym)) {
    return false;
  }

  if (acronym[0] === acronym[1] && acronym[1] === acronym[2]) {
    return false;
  }

  const normalizedName = normalizeForSearch(clubName);
  const normalizedAcronym = acronym.toLowerCase();

  // A primeira letra da sigla deve ser a primeira letra do nome
  if (normalizedName.length === 0 || normalizedName[0] !== normalizedAcronym[0]) {
    return false;
  }

  // As 3 letras devem aparecer no nome nessa ordem
  let searchIdx = 0;
  for (let i = 0; i < 3; i++) {
    const char = normalizedAcronym[i];
    const foundIdx = normalizedName.indexOf(char, searchIdx);
    if (foundIdx === -1) {
      return false;
    }
    searchIdx = foundIdx + 1;
  }

  return true;
}
