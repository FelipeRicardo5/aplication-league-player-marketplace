import { Controller, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MarketService } from './market.service';
import { ParsePositiveIntPipe } from '../core/pipes/parse-positive-int.pipe';
import { ZodValidationPipe } from '../core/pipes/zod-validation.pipe';
import { BuyPlayerDto, buyPlayerSchema } from './dto/buy-player.dto';

@Controller('players')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post(':id/buy')
  @HttpCode(HttpStatus.OK)
  async buy(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Body(new ZodValidationPipe(buyPlayerSchema)) dto: BuyPlayerDto,
  ) {
    return this.marketService.buyPlayer(id, dto);
  }

  @Post(':id/sell')
  @HttpCode(HttpStatus.OK)
  async sell(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.marketService.sellPlayer(id);
  }
}
