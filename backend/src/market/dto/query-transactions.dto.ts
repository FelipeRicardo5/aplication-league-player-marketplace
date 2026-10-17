import { z } from 'zod';

const POSITIVE_INT_REGEX = /^[1-9]\d*$/;
const MAX_INT32 = 2147483647;

export const queryTransactionsSchema = z
  .object({
    type: z
      .string()
      .refine((val) => val.length > 0, {
        message: 'type não pode ser vazio',
      })
      .refine(
        (val) => {
          const parts = val.split(',');
          if (parts.some((p) => p.length === 0)) return false;
          const allowed = ['COMPRA', 'VENDA'];
          const validElements = parts.every((p) => allowed.includes(p));
          if (!validElements) return false;
          const uniqueElements = new Set(parts);
          return uniqueElements.size === parts.length;
        },
        {
          message:
            'type deve ser COMPRA, VENDA ou COMPRA,VENDA (sem espaços, sem repetições e com maiúsculas)',
        },
      )
      .optional(),
    player_id: z
      .string()
      .refine((val) => POSITIVE_INT_REGEX.test(val), {
        message: 'player_id deve ser um inteiro positivo sem zeros à esquerda',
      })
      .refine((val) => Number(val) <= MAX_INT32, {
        message: 'player_id excede o limite máximo permitido',
      })
      .transform((val) => Number(val))
      .optional(),
  })
  .strict();

export type QueryTransactionsDto = z.infer<typeof queryTransactionsSchema>;
