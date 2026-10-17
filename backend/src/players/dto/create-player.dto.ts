import { z } from 'zod';
import { basePlayerSchema, validateAgeAgilityLimit } from './base-player.schema';

export const createPlayerSchema = basePlayerSchema
  .extend({
    pace: z
      .number({ error: 'Velocidade é obrigatória' })
      .int('Velocidade deve ser inteira')
      .min(1)
      .max(99),
    shooting: z
      .number({ error: 'Finalização é obrigatória' })
      .int('Finalização deve ser inteira')
      .min(1)
      .max(99),
    passing: z
      .number({ error: 'Passe é obrigatório' })
      .int('Passe deve ser inteiro')
      .min(1)
      .max(99),
    dribbling: z
      .number({ error: 'Drible é obrigatório' })
      .int('Drible deve ser inteiro')
      .min(1)
      .max(99),
    defending: z
      .number({ error: 'Defesa é obrigatória' })
      .int('Defesa deve ser inteira')
      .min(1)
      .max(99),
    physical: z
      .number({ error: 'Físico é obrigatório' })
      .int('Físico deve ser inteiro')
      .min(1)
      .max(99),
    potential: z
      .number({ error: 'Potencial é obrigatório' })
      .int('Potencial deve ser inteiro')
      .min(1)
      .max(99),
  })
  .superRefine((data, ctx) => {
    // Regra cruzada: com 35 anos ou mais, agilidade no máximo 85
    validateAgeAgilityLimit(data, ctx);

    // Soma dos seis atributos não pode passar de 480
    const sumAttrs =
      data.pace + data.shooting + data.passing + data.dribbling + data.defending + data.physical;

    if (sumAttrs > 480) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A soma dos seis atributos não pode ultrapassar 480',
        path: ['potential'],
      });
    }

    const maxAttr = Math.max(
      data.pace,
      data.shooting,
      data.passing,
      data.dribbling,
      data.defending,
      data.physical,
    );

    // Potencial deve ser maior ou igual ao maior dos seis atributos
    if (data.potential < maxAttr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O potencial não pode ser menor que o maior dos atributos',
        path: ['potential'],
      });
    }

    // No cadastro de jogador com 33 anos ou mais, potencial igual ao maior dos seis atributos
    if (data.age >= 33 && data.potential !== maxAttr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Para jogador com 33 anos ou mais no cadastro, o potencial deve ser igual ao maior atributo',
        path: ['potential'],
      });
    }
  });

export type CreatePlayerDto = z.infer<typeof createPlayerSchema>;
