import { z } from 'zod';

export const buyPlayerSchema = z
  .object({
    club_id: z
      .number({
        error: 'club_id é obrigatório e deve ser um número inteiro positivo',
      })
      .int({
        error: 'club_id deve ser um número inteiro',
      })
      .positive({
        error: 'club_id deve ser maior que zero',
      }),
    loyalty_until: z
      .string({
        error:
          'loyalty_until é obrigatório e deve ser uma string de data no formato ISO com offset -03:00',
      })
      .refine(
        (val) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?-03:00$/.test(val),
        {
          message:
            'loyalty_until deve estar no formato AAAA-MM-DDTHH:MM-03:00 ou AAAA-MM-DDTHH:MM:SS-03:00',
        },
      )
      .refine(
        (val) => {
          const date = new Date(val);
          if (isNaN(date.getTime())) return false;
          const now = Date.now();
          const maxFuture = now + 1095 * 24 * 60 * 60 * 1000;
          return date.getTime() > now && date.getTime() <= maxFuture;
        },
        {
          message:
            'loyalty_until deve ser uma data futura não superior a 1.095 dias',
        },
      ),
  })
  .strict();

export type BuyPlayerDto = z.infer<typeof buyPlayerSchema>;
