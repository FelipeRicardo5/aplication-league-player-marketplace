import { z } from 'zod';

const POSITIVE_INT_REGEX = /^[1-9]\d*$/;
const MAX_INT32 = 2147483647;

export const queryMatchesSchema = z
  .object({
    club_id: z
      .string()
      .refine((val) => POSITIVE_INT_REGEX.test(val), {
        message: 'club_id deve ser um inteiro positivo sem zeros à esquerda',
      })
      .refine((val) => Number(val) <= MAX_INT32, {
        message: 'club_id excede o limite máximo permitido',
      })
      .transform((val) => Number(val))
      .optional(),
  })
  .strict();

export type QueryMatchesDto = z.infer<typeof queryMatchesSchema>;
