import { Module } from '@nestjs/common';
import { LineupService } from './lineup.service';
import { MatchesService } from './matches.service';
import { StandingsService } from './standings.service';
import { LineupController } from './lineup.controller';
import { MatchesController } from './matches.controller';
import { StandingsController } from './standings.controller';
import { DomainModule } from '../domain/domain.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DomainModule, PrismaModule],
  controllers: [LineupController, MatchesController, StandingsController],
  providers: [LineupService, MatchesService, StandingsService],
  exports: [LineupService, MatchesService, StandingsService],
})
export class LeagueModule {}
