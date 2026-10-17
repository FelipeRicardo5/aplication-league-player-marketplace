import { z } from 'zod';
import { countWords, sanitizeTextV4 } from '../../shared/text';

export const POSITIONS = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'] as const;

export const basePlayerFields = {
  name: z
    .string({ error: 'O nome é obrigatório e deve ser texto' })
    .transform((val) => sanitizeTextV4(val))
    .refine((val) => val.length >= 3 && val.length <= 100, {
      message: 'O nome deve ter entre 3 e 100 caracteres',
    })
    .refine((val) => countWords(val) >= 2, {
      message: 'O nome deve ter pelo menos duas palavras',
    })
    .refine((val) => !/\d/.test(val), {
      message: 'O nome não pode conter dígitos numéricos',
    }),
  position: z.enum(POSITIONS, {
    error: 'Posição inválida. Aceito: GOL, ZAG, LAT, MEI, ATA',
  }),
  agility: z
    .number({ error: 'A agilidade é obrigatória e deve ser número' })
    .int('A agilidade deve ser um número inteiro')
    .min(1, 'A agilidade deve ser de no mínimo 1')
    .max(100, 'A agilidade deve ser de no máximo 100'),
  age: z
    .number({ error: 'A idade é obrigatória e deve ser número' })
    .int('A idade deve ser um número inteiro')
    .min(16, 'A idade deve ser de no mínimo 16')
    .max(45, 'A idade deve ser de no máximo 45'),
};

/**
 * Validação cruzada (RN01 / V3):
 * Jogador com 35 anos ou mais deve ter agilidade no máximo 85.
 */
export function validateAgeAgilityLimit(
  data: { age: number; agility: number },
  ctx: z.RefinementCtx,
): void {
  if (data.age >= 35 && data.agility > 85) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Jogador com 35 anos ou mais deve ter agilidade no máximo 85',
      path: ['agility'],
    });
  }
}

export const basePlayerSchema = z.object(basePlayerFields);
export type BasePlayerDto = z.infer<typeof basePlayerSchema>;
