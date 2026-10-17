import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    if (typeof value !== 'string') {
      throw new NotFoundException('Recurso não encontrado');
    }

    if (!/^[1-9]\d*$/.test(value)) {
      throw new NotFoundException('Recurso não encontrado');
    }

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed > 2147483647) {
      throw new NotFoundException('Recurso não encontrado');
    }

    return parsed;
  }
}
