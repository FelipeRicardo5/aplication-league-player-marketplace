import { z } from 'zod';
import { basePlayerSchema, validateAgeAgilityLimit } from './base-player.schema';

export const updatePlayerSchema = basePlayerSchema.superRefine((data, ctx) => {
  validateAgeAgilityLimit(data, ctx);
});

export type UpdatePlayerDto = z.infer<typeof updatePlayerSchema>;
