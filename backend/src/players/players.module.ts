import { Module } from '@nestjs/common';
import { DomainModule } from '../domain/domain.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

@Module({
  imports: [PrismaModule, DomainModule],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
