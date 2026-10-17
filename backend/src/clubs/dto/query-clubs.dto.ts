import { z } from 'zod';

const SORT_VALUES = ['name', 'net_worth_asc', 'net_worth_desc'] as const;

export const queryClubsSchema = z.object({
  sort: z
    .enum(SORT_VALUES, {
      error: 'Parâmetro sort inválido. Aceito: name, net_worth_asc, net_worth_desc',
    })
    .default('name'),
});

export type QueryClubsDto = z.infer<typeof queryClubsSchema>;
