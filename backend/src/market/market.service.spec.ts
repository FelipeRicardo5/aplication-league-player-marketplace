import { NotFoundException, ConflictException } from '@nestjs/common';
import { MarketService } from './market.service';
import { PrismaService } from '../prisma/prisma.service';
import { DomainCalculatorService } from '../domain/domain-calculator.service';
import { Clock } from '../shared/clock';

describe('MarketService', () => {
  let service: MarketService;
  let prisma: any;
  let mockClock: Clock;

  const fixedNow = new Date('2026-11-05T16:40:00-03:00');

  beforeEach(() => {
    mockClock = {
      now: () => fixedNow,
    };

    prisma = {
      jogadores: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      clubes: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      contratos: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      transacoes: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      escalacoes: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        return cb(prisma);
      }),
    };

    service = new MarketService(
      prisma as unknown as PrismaService,
      new DomainCalculatorService(),
      mockClock,
    );
  });

  describe('buyPlayer', () => {
    const buyDto = {
      club_id: 1,
      loyalty_until: '2027-03-02T10:15-03:00',
    };

    const mockFreePlayer = {
      id: 2,
      nome: 'Meia Lua',
      posicao: 'MEI',
      agilidade: 85,
      idade: 25,
      valor_base: 40.0,
      condicao: 'MAL_CONDICIONADO',
      clube_id: null,
      excluido_em: null,
    };

    const mockClub = {
      id: 1,
      nome: 'Águias FC',
      caixa: 300.0,
      jogadores: [],
    };

    it('should throw NotFoundException if player not found', async () => {
      prisma.jogadores.findFirst.mockResolvedValue(null);
      await expect(service.buyPlayer(999, buyDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if player already has a club', async () => {
      prisma.jogadores.findFirst.mockResolvedValue({
        ...mockFreePlayer,
        clube_id: 2,
      });
      await expect(service.buyPlayer(2, buyDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if buyer club not found', async () => {
      prisma.jogadores.findFirst.mockResolvedValue(mockFreePlayer);
      prisma.clubes.findUnique.mockResolvedValue(null);
      await expect(service.buyPlayer(2, buyDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if club already has 12 players (RN14)', async () => {
      prisma.jogadores.findFirst.mockResolvedValue(mockFreePlayer);
      prisma.clubes.findUnique.mockResolvedValue({
        ...mockClub,
        jogadores: new Array(12).fill({ id: 1 }),
      });
      await expect(service.buyPlayer(2, buyDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if club previously sold this player (RN12 repurchase)', async () => {
      prisma.jogadores.findFirst.mockResolvedValue(mockFreePlayer);
      prisma.clubes.findUnique.mockResolvedValue(mockClub);
      prisma.transacoes.findFirst.mockResolvedValue({ id: 100, tipo: 'VENDA' });

      await expect(service.buyPlayer(2, buyDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if total cost exceeds 50% of club cash (RN13)', async () => {
      prisma.jogadores.findFirst.mockResolvedValue(mockFreePlayer);
      prisma.clubes.findUnique.mockResolvedValue({
        ...mockClub,
        caixa: 70.0, // 50% = 35.00, but cost for Meia Lua is 37.00 + 1.85 = 38.85
      });
      prisma.transacoes.findFirst.mockResolvedValue(null);

      await expect(service.buyPlayer(2, buyDto)).rejects.toThrow(ConflictException);
    });

    it('should execute valid purchase atomically and match Section 2.3.1 normative values', async () => {
      prisma.jogadores.findFirst.mockResolvedValue(mockFreePlayer);
      prisma.clubes.findUnique.mockResolvedValue(mockClub);
      prisma.transacoes.findFirst.mockResolvedValue(null);

      const createdTx = {
        id: 10,
        clube_id: 1,
        jogador_id: 2,
        nome_jogador: 'Meia Lua',
        tipo: 'COMPRA',
        valor: 37.0,
        taxa: 1.85,
        multa: 0,
        lucro: null,
        variacao_caixa: -38.85,
        criado_em: new Date('2026-11-02T10:15:00-03:00'),
      };
      prisma.transacoes.create.mockResolvedValue(createdTx);
      prisma.contratos.create.mockResolvedValue({ id: 1 });

      const res = await service.buyPlayer(2, buyDto);

      expect(res.id).toBe(10);
      expect(res.club_id).toBe(1);
      expect(res.player_id).toBe(2);
      expect(res.player_name).toBe('Meia Lua');
      expect(res.type).toBe('COMPRA');
      expect(res.value).toBe(37.0);
      expect(res.fee).toBe(1.85);
      expect(res.penalty).toBe(0.0);
      expect(res.profit).toBeNull();
      expect(res.cash_change).toBe(-38.85);
      expect(res.club_cash).toBe(261.15);
      expect(res.contract.status).toBe('ATIVO');
      expect(res.contract.purchase_value).toBe(37.0);

      expect(prisma.clubes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { caixa: 261.15 },
      });
      expect(prisma.jogadores.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { clube_id: 1 },
      });
    });
  });

  describe('sellPlayer', () => {
    const mockOwnedPlayer = {
      id: 2,
      nome: 'Meia Lua',
      posicao: 'MEI',
      agilidade: 85,
      idade: 25,
      valor_base: 40.0,
      condicao: 'APTO',
      clube_id: 1,
      excluido_em: null,
    };

    const mockClub = {
      id: 1,
      nome: 'Águias FC',
      caixa: 261.15,
    };

    const mockActiveContract = {
      id: 1,
      clube_id: 1,
      jogador_id: 2,
      valor_compra: 37.0,
      fidelidade_ate: new Date('2027-03-02T10:15:00-03:00'),
      situacao: 'ATIVO',
    };

    it('should throw NotFoundException if player not found', async () => {
      prisma.jogadores.findFirst.mockResolvedValue(null);
      await expect(service.sellPlayer(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if player is free (no club)', async () => {
      prisma.jogadores.findFirst.mockResolvedValue({
        ...mockOwnedPlayer,
        clube_id: null,
      });
      await expect(service.sellPlayer(2)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if no active contract exists', async () => {
      prisma.jogadores.findFirst.mockResolvedValue(mockOwnedPlayer);
      prisma.clubes.findUnique.mockResolvedValue(mockClub);
      prisma.contratos.findFirst.mockResolvedValue(null);

      await expect(service.sellPlayer(2)).rejects.toThrow(ConflictException);
    });

    it('should execute valid sale and match Section 2.3.2 normative values', async () => {
      prisma.jogadores.findFirst.mockResolvedValue(mockOwnedPlayer);
      prisma.clubes.findUnique.mockResolvedValue(mockClub);
      prisma.contratos.findFirst.mockResolvedValue(mockActiveContract);

      const createdTx = {
        id: 11,
        clube_id: 1,
        jogador_id: 2,
        nome_jogador: 'Meia Lua',
        tipo: 'VENDA',
        valor: 40.0,
        taxa: 0.3,
        multa: 4.0,
        lucro: 3.0,
        variacao_caixa: 35.7,
        criado_em: fixedNow,
      };
      prisma.transacoes.create.mockResolvedValue(createdTx);

      const res = await service.sellPlayer(2);

      expect(res.id).toBe(11);
      expect(res.club_id).toBe(1);
      expect(res.player_id).toBe(2);
      expect(res.player_name).toBe('Meia Lua');
      expect(res.type).toBe('VENDA');
      expect(res.value).toBe(40.0);
      expect(res.fee).toBe(0.3);
      expect(res.penalty).toBe(4.0);
      expect(res.profit).toBe(3.0);
      expect(res.cash_change).toBe(35.7);
      expect(res.purchase_value).toBe(37.0);
      expect(res.remaining_days).toBe(117);
      expect(res.penalty_rate).toBe(10);
      expect(res.contract_status).toBe('RESCINDIDO');
      expect(res.club_cash).toBe(296.85);

      expect(prisma.clubes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { caixa: 296.85 },
      });
      expect(prisma.jogadores.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { clube_id: null },
      });
      expect(prisma.escalacoes.deleteMany).toHaveBeenCalledWith({
        where: { clube_id: 1, jogador_id: 2 },
      });
      expect(prisma.contratos.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { situacao: 'RESCINDIDO', encerrado_em: fixedNow },
      });
    });
  });
});
