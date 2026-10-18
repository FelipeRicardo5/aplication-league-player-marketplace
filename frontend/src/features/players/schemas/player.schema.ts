import { z } from 'zod';

export const POSITIONS = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'] as const;

export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export const basePlayerFields = {
  name: z
    .string({ required_error: 'O nome é obrigatório' })
    .trim()
    .min(3, 'O nome deve ter entre 3 e 100 caracteres')
    .max(100, 'O nome deve ter entre 3 e 100 caracteres')
    .refine((val) => countWords(val) >= 2, {
      message: 'O nome deve ter pelo menos duas palavras',
    })
    .refine((val) => !/\d/.test(val), {
      message: 'O nome não pode conter dígitos numéricos',
    }),
  position: z.enum(POSITIONS, {
    errorMap: () => ({ message: 'Posição inválida. Escolha: GOL, ZAG, LAT, MEI ou ATA' }),
  }),
  agility: z.coerce
    .number({ required_error: 'A agilidade é obrigatória' })
    .int('A agilidade deve ser um número inteiro')
    .min(1, 'A agilidade deve ser de no mínimo 1')
    .max(100, 'A agilidade deve ser de no máximo 100'),
  age: z.coerce
    .number({ required_error: 'A idade é obrigatória' })
    .int('A idade deve ser um número inteiro')
    .min(16, 'A idade deve ser de no mínimo 16')
    .max(45, 'A idade deve ser de no máximo 45'),
};

export const createPlayerSchema = z
  .object({
    ...basePlayerFields,
    pace: z.coerce
      .number({ required_error: 'Velocidade é obrigatória' })
      .int('Velocidade deve ser inteira')
      .min(1, 'Mínimo 1')
      .max(99, 'Máximo 99'),
    shooting: z.coerce
      .number({ required_error: 'Finalização é obrigatória' })
      .int('Finalização deve ser inteira')
      .min(1, 'Mínimo 1')
      .max(99, 'Máximo 99'),
    passing: z.coerce
      .number({ required_error: 'Passe é obrigatório' })
      .int('Passe deve ser inteiro')
      .min(1, 'Mínimo 1')
      .max(99, 'Máximo 99'),
    dribbling: z.coerce
      .number({ required_error: 'Drible é obrigatório' })
      .int('Drible deve ser inteiro')
      .min(1, 'Mínimo 1')
      .max(99, 'Máximo 99'),
    defending: z.coerce
      .number({ required_error: 'Defesa é obrigatória' })
      .int('Defesa deve ser inteira')
      .min(1, 'Mínimo 1')
      .max(99, 'Máximo 99'),
    physical: z.coerce
      .number({ required_error: 'Físico é obrigatório' })
      .int('Físico deve ser inteiro')
      .min(1, 'Mínimo 1')
      .max(99, 'Máximo 99'),
    potential: z.coerce
      .number({ required_error: 'Potencial é obrigatório' })
      .int('Potencial deve ser inteiro')
      .min(1, 'Mínimo 1')
      .max(99, 'Máximo 99'),
  })
  .superRefine((data, ctx) => {
    // RN01: com 35 anos ou mais, agilidade no máximo 85
    if (data.age >= 35 && data.agility > 85) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Jogador com 35 anos ou mais deve ter agilidade no máximo 85',
        path: ['agility'],
      });
    }

    // Soma dos seis atributos não pode ultrapassar 480
    const sumAttrs =
      data.pace + data.shooting + data.passing + data.dribbling + data.defending + data.physical;

    if (sumAttrs > 480) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `A soma dos atributos é ${sumAttrs} (máximo permitido: 480)`,
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

    // Potencial deve ser maior ou igual ao maior dos atributos
    if (data.potential < maxAttr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `O potencial não pode ser menor que o maior atributo (${maxAttr})`,
        path: ['potential'],
      });
    }

    // Para jogador com 33 anos ou mais, potencial deve ser igual ao maior atributo
    if (data.age >= 33 && data.potential !== maxAttr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Para jogador com 33 anos ou mais, o potencial deve ser exatamente igual ao maior atributo (${maxAttr})`,
        path: ['potential'],
      });
    }
  });

export type CreatePlayerFormInput = z.infer<typeof createPlayerSchema>;

export const updatePlayerSchema = z.object(basePlayerFields).superRefine((data, ctx) => {
  if (data.age >= 35 && data.agility > 85) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Jogador com 35 anos ou mais deve ter agilidade no máximo 85',
      path: ['agility'],
    });
  }
});

export type UpdatePlayerFormInput = z.infer<typeof updatePlayerSchema>;

export const updateConditionSchema = z.object({
  condition: z.enum(['APTO', 'MAL_CONDICIONADO', 'DOENTE'], {
    errorMap: () => ({ message: 'Selecione uma condição válida' }),
  }),
});

export type UpdateConditionFormInput = z.infer<typeof updateConditionSchema>;
