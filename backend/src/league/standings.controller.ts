import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { StandingsService } from './standings.service';

@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getStandings() {
    return this.standingsService.getStandings();
  }
}
