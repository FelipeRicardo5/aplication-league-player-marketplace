import { z } from 'zod';

const CONDITIONS = ['APTO', 'MAL_CONDICIONADO', 'DOENTE'] as const;

export const updateConditionSchema = z.object({
  condition: z.enum(CONDITIONS, {
    error: 'Condição física inválida. Aceito: APTO, MAL_CONDICIONADO, DOENTE',
  }),
});

export type UpdateConditionDto = z.infer<typeof updateConditionSchema>;
