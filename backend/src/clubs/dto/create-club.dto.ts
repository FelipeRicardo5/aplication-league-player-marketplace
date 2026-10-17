import { z } from 'zod';
import { countWords, sanitizeTextV4, validateClubAcronym } from '../../shared/text';

export const createClubSchema = z
  .object({
    name: z
      .string({ error: 'O nome do clube é obrigatório e deve ser texto' })
      .transform((val) => sanitizeTextV4(val))
      .refine((val) => val.length >= 3 && val.length <= 60, {
        message: 'O nome do clube deve ter entre 3 e 60 caracteres',
      })
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
      .string({ error: 'A sigla do clube é obrigatória e deve ser texto' })
      .refine((val) => /^[A-Z]{3}$/.test(val), {
        message: 'A sigla deve conter exatamente 3 letras maiúsculas de A a Z sem acento',
      }),
  })
  .superRefine((data, ctx) => {
    if (!validateClubAcronym(data.acronym, data.name)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A sigla não corresponde ao nome do clube ou contém 3 letras iguais',
        path: ['acronym'],
      });
    }
  });

export type CreateClubDto = z.infer<typeof createClubSchema>;
