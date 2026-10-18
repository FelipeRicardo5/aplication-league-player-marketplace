import { z } from 'zod';

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateClubAcronym(acronym: string, clubName: string): boolean {
  if (acronym.length !== 3) return false;
  // 3 letras iguais não são permitidas (ex: AAA)
  if (acronym[0] === acronym[1] && acronym[1] === acronym[2]) return false;

  const normalizedName = clubName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  // A primeira letra da sigla deve ser a primeira letra do nome
  if (acronym[0] !== normalizedName[0]) return false;

  // As 3 letras devem aparecer no nome nessa ordem
  let searchIndex = 0;
  for (const letter of acronym) {
    const found = normalizedName.indexOf(letter, searchIndex);
    if (found === -1) return false;
    searchIndex = found + 1;
  }

  return true;
}

export const createClubSchema = z
  .object({
    name: z
      .string({ required_error: 'O nome do clube é obrigatório' })
      .trim()
      .min(3, 'O nome do clube deve ter entre 3 e 60 caracteres')
      .max(60, 'O nome do clube deve ter entre 3 e 60 caracteres')
      .refine(
        (val) => {
          const words = countWords(val);
          return words >= 2 && words <= 5;
        },
        {
          message: 'O nome do clube deve ter entre 2 e 5 palavras',
        },
      )
      .refine((val) => /^[\p{L}\s.-]+$/u.test(val), {
        message: 'O nome do clube deve conter apenas letras, espaços, hífen e ponto',
      }),
    acronym: z
      .string({ required_error: 'A sigla do clube é obrigatória' })
      .trim()
      .toUpperCase()
      .refine((val) => /^[A-Z]{3}$/.test(val), {
        message: 'A sigla deve conter exatamente 3 letras maiúsculas de A a Z sem acento',
      }),
  })
  .superRefine((data, ctx) => {
    if (!validateClubAcronym(data.acronym, data.name)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'A sigla deve iniciar com a primeira letra do clube, aparecer na mesma ordem no nome e não ter 3 letras iguais',
        path: ['acronym'],
      });
    }
  });

export type CreateClubFormInput = z.infer<typeof createClubSchema>;
