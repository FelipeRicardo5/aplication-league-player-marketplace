import { Controller, Put, Get, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { LineupService } from './lineup.service';
import { ParsePositiveIntPipe } from '../core/pipes/parse-positive-int.pipe';
import { ZodValidationPipe } from '../core/pipes/zod-validation.pipe';
import { SetLineupDto, setLineupSchema } from './dto/set-lineup.dto';

@Controller('clubs')
export class LineupController {
  constructor(private readonly lineupService: LineupService) {}

  @Put(':id/lineup')
  @HttpCode(HttpStatus.OK)
  async setLineup(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Body(new ZodValidationPipe(setLineupSchema)) dto: SetLineupDto,
  ) {
    return this.lineupService.setLineup(id, dto);
  }

  @Get(':id/lineup')
  @HttpCode(HttpStatus.OK)
  async getLineup(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.lineupService.getLineup(id);
  }
}
