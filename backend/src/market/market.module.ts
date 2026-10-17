import { Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { TransactionsService } from './transactions.service';
import { MarketController } from './market.controller';
import { TransactionsController } from './transactions.controller';
import { DomainModule } from '../domain/domain.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DomainModule, PrismaModule],
  controllers: [MarketController, TransactionsController],
  providers: [MarketService, TransactionsService],
  exports: [MarketService, TransactionsService],
})
export class MarketModule {}
