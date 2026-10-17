import { NotFoundException } from '@nestjs/common';
import { ParsePositiveIntPipe } from './parse-positive-int.pipe';

describe('ParsePositiveIntPipe', () => {
  let pipe: ParsePositiveIntPipe;

  beforeEach(() => {
    pipe = new ParsePositiveIntPipe();
  });

  it('should accept valid positive integers without leading zeros', () => {
    expect(pipe.transform('1')).toBe(1);
    expect(pipe.transform('42')).toBe(42);
    expect(pipe.transform('2147483647')).toBe(2147483647);
  });

  it('should reject 0 with NotFoundException (404)', () => {
    expect(() => pipe.transform('0')).toThrow(NotFoundException);
  });

  it('should reject negative integers with NotFoundException (404)', () => {
    expect(() => pipe.transform('-1')).toThrow(NotFoundException);
    expect(() => pipe.transform('-42')).toThrow(NotFoundException);
  });

  it('should reject integers with leading zeros with NotFoundException (404)', () => {
    expect(() => pipe.transform('01')).toThrow(NotFoundException);
    expect(() => pipe.transform('007')).toThrow(NotFoundException);
  });

  it('should reject floating numbers with NotFoundException (404)', () => {
    expect(() => pipe.transform('1.5')).toThrow(NotFoundException);
    expect(() => pipe.transform('1,5')).toThrow(NotFoundException);
  });

  it('should reject non-numeric strings with NotFoundException (404)', () => {
    expect(() => pipe.transform('abc')).toThrow(NotFoundException);
    expect(() => pipe.transform('1a')).toThrow(NotFoundException);
    expect(() => pipe.transform('')).toThrow(NotFoundException);
  });

  it('should reject integers exceeding 2147483647 with NotFoundException (404)', () => {
    expect(() => pipe.transform('2147483648')).toThrow(NotFoundException);
  });
});
