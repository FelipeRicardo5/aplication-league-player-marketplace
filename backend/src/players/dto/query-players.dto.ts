import { z } from 'zod';
import { sanitizeTextV4 } from '../../shared/text';

const POSITIONS = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'] as const;
const CONDITIONS = ['APTO', 'MAL_CONDICIONADO', 'DOENTE'] as const;
const SORT_VALUES = ['name', 'value_asc', 'value_desc', 'age_asc', 'age_desc', 'position'] as const;

// Validador estrito de número inteiro positivo em query param (sem sinal, sem zeros à esquerda)
const strictPositiveIntString = z
  .string()
  .refine((val) => /^[1-9]\d*$/.test(val), {
    message: 'Deve ser um número inteiro positivo sem zeros à esquerda ou sinal',
  })
  .transform((val) => Number(val))
  .refine((val) => Number.isSafeInteger(val) && val <= 2147483647, {
    message: 'Número inteiro fora do limite permitido',
  });

// Validador estrito de decimal (ex.: 10, 10.5, 10.55; 0.5; sem sinal, sem vírgula, sem zeros à esquerda)
const strictDecimalString = z
  .string()
  .refine((val) => /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(val), {
    message: 'Formato decimal inválido. Use formato como 10, 10.5 ou 10.55',
  })
  .transform((val) => Number(val));

export const queryPlayersSchema = z
  .object({
    search: z
      .string()
      .min(1, 'Parâmetro search não pode ser vazio')
      .transform((val) => sanitizeTextV4(val))
      .refine((val) => val.length >= 2 && val.length <= 100, {
        message: 'O parâmetro search deve ter entre 2 e 100 caracteres',
      })
      .optional(),
    position: z
      .enum(POSITIONS, {
        error: 'Posição inválida. Aceito: GOL, ZAG, LAT, MEI, ATA',
      })
      .optional(),
    condition: z
      .enum(CONDITIONS, {
        error: 'Condição inválida. Aceito: APTO, MAL_CONDICIONADO, DOENTE',
      })
      .optional(),
    free: z
      .enum(['true', 'false'] as const, {
        error: 'O parâmetro free deve ser true ou false',
      })
      .transform((val) => val === 'true')
      .optional(),
    club_id: strictPositiveIntString.optional(),
    min_age: strictPositiveIntString
      .refine((val) => val >= 16 && val <= 45, {
        message: 'min_age deve estar entre 16 e 45',
      })
      .optional(),
    max_age: strictPositiveIntString
      .refine((val) => val >= 16 && val <= 45, {
        message: 'max_age deve estar entre 16 e 45',
      })
      .optional(),
    min_value: strictDecimalString
      .refine((val) => val >= 0 && val <= 550, {
        message: 'min_value deve estar entre 0 e 550',
      })
      .optional(),
    max_value: strictDecimalString
      .refine((val) => val >= 0 && val <= 550, {
        message: 'max_value deve estar entre 0 e 550',
      })
      .optional(),
    sort: z
      .string()
      .min(1, 'Parâmetro sort não pode ser vazio')
      .transform((val) => {
        const parts = val.split(',');
        if (parts.length > 2) {
          throw new Error('sort aceita no máximo dois critérios separados por vírgula');
        }
        for (const part of parts) {
          if (!SORT_VALUES.includes(part as (typeof SORT_VALUES)[number])) {
            throw new Error(`Critério de sort inválido: ${part}`);
          }
        }
        // Não pode repetir o mesmo campo (ex.: value_asc,value_desc)
        const getField = (crit: string) => {
          if (crit.startsWith('value')) return 'value';
          if (crit.startsWith('age')) return 'age';
          return crit;
        };
        const fields = parts.map(getField);
        if (new Set(fields).size !== fields.length) {
          throw new Error('Não é permitido repetir o mesmo campo no sort');
        }
        return parts as (typeof SORT_VALUES)[number][];
      })
      .default(['name']),
    page: strictPositiveIntString.default(1),
    limit: strictPositiveIntString
      .refine((val) => val >= 1 && val <= 50, {
        message: 'limit deve estar entre 1 e 50',
      })
      .default(10),
  })
  .superRefine((data, ctx) => {
    // Combinações contraditórias
    if (data.min_age !== undefined && data.max_age !== undefined && data.min_age > data.max_age) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'min_age não pode ser maior que max_age',
        path: ['min_age'],
      });
    }

    if (
      data.min_value !== undefined &&
      data.max_value !== undefined &&
      data.min_value > data.max_value
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'min_value não pode ser maior que max_value',
        path: ['min_value'],
      });
    }

    if (data.free === true && data.club_id !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Não é permitido combinar free=true com club_id',
        path: ['free'],
      });
    }
  });

export type QueryPlayersDto = z.infer<typeof queryPlayersSchema>;
