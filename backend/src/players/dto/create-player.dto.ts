import { z } from 'zod';
import { countWords, sanitizeTextV4 } from '../../shared/text';

const POSITIONS = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'] as const;

export const createPlayerSchema = z
  .object({
    name: z
      .string({ error: 'O nome é obrigatório e deve ser texto' })
      .transform((val) => sanitizeTextV4(val))
      .refine((val) => val.length >= 3 && val.length <= 100, {
        message: 'O nome deve ter entre 3 e 100 caracteres',
      })
      .refine((val) => countWords(val) >= 2, {
        message: 'O nome deve ter pelo menos duas palavras',
      })
      .refine((val) => !/\d/.test(val), {
        message: 'O nome não pode conter dígitos numéricos',
      }),
    position: z.enum(POSITIONS, {
      error: 'Posição inválida. Aceito: GOL, ZAG, LAT, MEI, ATA',
    }),
    agility: z
      .number({ error: 'A agilidade é obrigatória e deve ser número' })
      .int('A agilidade deve ser um número inteiro')
      .min(1, 'A agilidade deve ser de no mínimo 1')
      .max(100, 'A agilidade deve ser de no máximo 100'),
    age: z
      .number({ error: 'A idade é obrigatória e deve ser número' })
      .int('A idade deve ser um número inteiro')
      .min(16, 'A idade deve ser de no mínimo 16')
      .max(45, 'A idade deve ser de no máximo 45'),
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
    if (data.age >= 35 && data.agility > 85) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Jogador com 35 anos ou mais deve ter agilidade no máximo 85',
        path: ['agility'],
      });
    }

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
