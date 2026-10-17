import { z } from 'zod';

export const setLineupSchema = z
  .object({
    formation: z.enum(['3-1', '2-2', '2-1-1', '1-2-1'], {
      error: 'formation deve ser uma das formações aceitas: 3-1, 2-2, 2-1-1 ou 1-2-1',
    }),
    player_ids: z
      .array(
        z
          .number({
            error: 'Cada player_id deve ser um número inteiro positivo',
          })
          .int({
            error: 'Cada player_id deve ser um inteiro',
          })
          .positive({
            error: 'Cada player_id deve ser maior que zero',
          }),
        {
          error: 'player_ids é obrigatório e deve ser uma lista de 5 ids',
        },
      )
      .refine((ids) => ids.length === 5, {
        message: 'A escalação deve conter exatamente 5 titulares',
      })
      .refine((ids) => new Set(ids).size === 5, {
        message: 'player_ids não pode conter identificadores repetidos',
      }),
  })
  .strict();

export type SetLineupDto = z.infer<typeof setLineupSchema>;
