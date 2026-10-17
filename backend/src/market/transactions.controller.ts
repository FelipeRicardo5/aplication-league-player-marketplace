import { Controller, Get, Param, Query, Header, HttpCode, HttpStatus } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { ParsePositiveIntPipe } from '../core/pipes/parse-positive-int.pipe';
import { ZodValidationPipe } from '../core/pipes/zod-validation.pipe';
import { QueryTransactionsDto, queryTransactionsSchema } from './dto/query-transactions.dto';

@Controller('clubs')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get(':id/transactions')
  @HttpCode(HttpStatus.OK)
  async getTransactions(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Query(new ZodValidationPipe(queryTransactionsSchema))
    query: QueryTransactionsDto,
  ) {
    return this.transactionsService.getClubTransactions(id, query);
  }

  @Get(':id/transactions/export')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportTransactions(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Query(new ZodValidationPipe(queryTransactionsSchema))
    query: QueryTransactionsDto,
  ) {
    return this.transactionsService.exportClubTransactionsCsv(id, query);
  }
}
