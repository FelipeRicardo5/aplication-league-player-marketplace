import { z } from 'zod';

export const createMatchSchema = z
  .object({
    home_club_id: z
      .number({
        error: 'home_club_id é obrigatório e deve ser um inteiro positivo',
      })
      .int({
        error: 'home_club_id deve ser um inteiro',
      })
      .positive({
        error: 'home_club_id deve ser maior que zero',
      }),
    away_club_id: z
      .number({
        error: 'away_club_id é obrigatório e deve ser um inteiro positivo',
      })
      .int({
        error: 'away_club_id deve ser um inteiro',
      })
      .positive({
        error: 'away_club_id deve ser maior que zero',
      }),
  })
  .strict()
  .refine((data) => data.home_club_id !== data.away_club_id, {
    message: 'home_club_id e away_club_id devem ser clubes diferentes',
    path: ['away_club_id'],
  });

export type CreateMatchDto = z.infer<typeof createMatchSchema>;
