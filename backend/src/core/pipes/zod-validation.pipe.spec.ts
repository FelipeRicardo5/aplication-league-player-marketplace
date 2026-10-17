import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    name: z.string().min(3),
    age: z.number().int().min(16).max(45),
  });

  const pipe = new ZodValidationPipe(schema);

  it('should parse valid body and strip extra fields (V7)', () => {
    const input = {
      name: 'João Silva',
      age: 25,
      market_value: 100, // campo controlado deve ser ignorado
      extra_field: 'algo',
    };

    const result = pipe.transform(input, { type: 'body' });
    expect(result).toEqual({
      name: 'João Silva',
      age: 25,
    });
  });

  it('should reject non-object body (array, primitive) with 400 (V1)', () => {
    expect(() => pipe.transform([], { type: 'body' })).toThrow(BadRequestException);
    expect(() => pipe.transform('texto', { type: 'body' })).toThrow(BadRequestException);
    expect(() => pipe.transform(123, { type: 'body' })).toThrow(BadRequestException);
    expect(() => pipe.transform(null, { type: 'body' })).toThrow(BadRequestException);
  });

  it('should reject validation errors with 400', () => {
    expect(() => pipe.transform({ name: 'J', age: 25 }, { type: 'body' })).toThrow(
      BadRequestException,
    );
    expect(() => pipe.transform({ name: 'João Silva', age: 10 }, { type: 'body' })).toThrow(
      BadRequestException,
    );
  });
});
