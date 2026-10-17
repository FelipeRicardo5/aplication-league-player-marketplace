import { Module } from '@nestjs/common';
import { DomainModule } from '../domain/domain.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ClubsController } from './clubs.controller';
import { ClubsService } from './clubs.service';

@Module({
  imports: [PrismaModule, DomainModule],
  controllers: [ClubsController],
  providers: [ClubsService],
  exports: [ClubsService],
})
export class ClubsModule {}
