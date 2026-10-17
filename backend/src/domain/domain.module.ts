import { Module } from '@nestjs/common';
import { DomainCalculatorService } from './domain-calculator.service';

@Module({
  providers: [DomainCalculatorService],
  exports: [DomainCalculatorService],
})
export class DomainModule {}
