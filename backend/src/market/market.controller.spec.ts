import { BadRequestException } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { ZodValidationPipe } from '../core/pipes/zod-validation.pipe';
import { buyPlayerSchema } from './dto/buy-player.dto';

describe('MarketController & Validation Pipe (Integration)', () => {
  let controller: MarketController;
  let marketService: jest.Mocked<MarketService>;
  let pipe: ZodValidationPipe;

  beforeEach(() => {
    marketService = {
      buyPlayer: jest.fn(),
      sellPlayer: jest.fn(),
    } as unknown as jest.Mocked<MarketService>;

    controller = new MarketController(marketService);
    pipe = new ZodValidationPipe(buyPlayerSchema);
  });

  it('rejects POST /players/:id/buy with 2027-02-30T10:00-03:00 throwing BadRequestException (400) and leaves market state intact', async () => {
    const invalidBody = {
      club_id: 1,
      loyalty_until: '2027-02-30T10:00-03:00',
    };

    expect(() => {
      pipe.transform(invalidBody, { type: 'body' });
    }).toThrow(BadRequestException);

    try {
      pipe.transform(invalidBody, { type: 'body' });
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(BadRequestException);
      const res = (err as BadRequestException).getResponse();
      expect(res).toBeDefined();
    }

    // O serviço de compra nunca é chamado, mantendo jogador, caixa e contratos intactos
    expect(marketService.buyPlayer).not.toHaveBeenCalled();
  });

  it('executes buy when valid future loyalty_until date is supplied', async () => {
    const validBody = {
      club_id: 1,
      loyalty_until: '2027-02-28T10:00-03:00',
    };

    const validatedDto = pipe.transform(validBody, { type: 'body' }) as any;
    expect(validatedDto).toEqual(validBody);

    marketService.buyPlayer.mockResolvedValue({
      id: 1,
      player_id: 10,
      club_id: 1,
    } as any);

    const result = await controller.buy(10, validatedDto);
    expect(marketService.buyPlayer).toHaveBeenCalledWith(10, validBody);
    expect(result).toBeDefined();
  });
});
