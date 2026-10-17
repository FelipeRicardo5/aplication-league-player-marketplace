import { NotFoundException, ConflictException } from '@nestjs/common';
import { LineupService } from './lineup.service';
import { PrismaService } from '../prisma/prisma.service';
import { DomainCalculatorService } from '../domain/domain-calculator.service';

describe('LineupService', () => {
  let service: LineupService;
  let prisma: any;
  let calculator: DomainCalculatorService;

  beforeEach(() => {
    prisma = {
      clubes: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      jogadores: {
        findMany: jest.fn(),
      },
      escalacoes: {
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    calculator = new DomainCalculatorService();
    service = new LineupService(prisma as unknown as PrismaService, calculator);
  });

  const mockClub = {
    id: 1,
    nome: 'Águias FC',
    formacao: '2-1-1',
  };

  const mockStarters = [
    {
      id: 30,
      nome: 'Rui Prado',
      posicao: 'GOL',
      agilidade: 70,
      idade: 28,
      condicao: 'APTO',
      valor_base: 30.0,
      clube_id: 1,
      excluido_em: null,
      velocidade: 60,
      finalizacao: 40,
      passe: 65,
      drible: 50,
      defesa: 77,
      fisico: 75,
      potencial: 78,
    },
    {
      id: 32,
      nome: 'Téo Brandão',
      posicao: 'ZAG',
      agilidade: 75,
      idade: 27,
      condicao: 'APTO',
      valor_base: 35.0,
      clube_id: 1,
      excluido_em: null,
      velocidade: 65,
      finalizacao: 30,
      passe: 60,
      drible: 55,
      defesa: 84,
      fisico: 80,
      potencial: 82,
    },
    {
      id: 31,
      nome: 'Davi Lins',
      posicao: 'LAT',
      agilidade: 80,
      idade: 24,
      condicao: 'MAL_CONDICIONADO',
      valor_base: 32.0,
      clube_id: 1,
      excluido_em: null,
      velocidade: 85,
      finalizacao: 50,
      passe: 70,
      drible: 74,
      defesa: 66,
      fisico: 70,
      potencial: 80,
    },
    {
      id: 33,
      nome: 'Lauro Neves',
      posicao: 'MEI',
      agilidade: 85,
      idade: 26,
      condicao: 'APTO',
      valor_base: 40.0,
      clube_id: 1,
      excluido_em: null,
      velocidade: 70,
      finalizacao: 65,
      passe: 82,
      drible: 78,
      defesa: 58,
      fisico: 68,
      potencial: 85,
    },
    {
      id: 34,
      nome: 'Otto Rangel',
      posicao: 'ATA',
      agilidade: 88,
      idade: 23,
      condicao: 'APTO',
      valor_base: 45.0,
      clube_id: 1,
      excluido_em: null,
      velocidade: 88,
      finalizacao: 75,
      passe: 62,
      drible: 80,
      defesa: 42,
      fisico: 72,
      potencial: 88,
    },
  ];

  describe('setLineup', () => {
    it('should throw NotFoundException if club not found', async () => {
      prisma.clubes.findUnique.mockResolvedValue(null);
      await expect(
        service.setLineup(999, {
          formation: '2-1-1',
          player_ids: [30, 31, 32, 33, 34],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if any player not found', async () => {
      prisma.clubes.findUnique.mockResolvedValue(mockClub);
      prisma.jogadores.findMany.mockResolvedValue(mockStarters.slice(0, 4));

      await expect(
        service.setLineup(1, {
          formation: '2-1-1',
          player_ids: [30, 31, 32, 33, 34],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if player belongs to another club', async () => {
      prisma.clubes.findUnique.mockResolvedValue(mockClub);
      const invalidPlayers = [...mockStarters];
      invalidPlayers[0] = { ...invalidPlayers[0], clube_id: 2 };
      prisma.jogadores.findMany.mockResolvedValue(invalidPlayers);

      await expect(
        service.setLineup(1, {
          formation: '2-1-1',
          player_ids: [30, 31, 32, 33, 34],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if player is DOENTE', async () => {
      prisma.clubes.findUnique.mockResolvedValue(mockClub);
      const invalidPlayers = [...mockStarters];
      invalidPlayers[0] = { ...invalidPlayers[0], condicao: 'DOENTE' };
      prisma.jogadores.findMany.mockResolvedValue(invalidPlayers);

      await expect(
        service.setLineup(1, {
          formation: '2-1-1',
          player_ids: [30, 31, 32, 33, 34],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if positions do not match formation', async () => {
      prisma.clubes.findUnique.mockResolvedValue(mockClub);
      // Formation 3-1 requires 3 defense (ZAG/LAT), 0 MEI, 1 ATA
      // But mockStarters has 1 GOL, 1 ZAG, 1 LAT, 1 MEI, 1 ATA (which is 2-1-1)
      prisma.jogadores.findMany.mockResolvedValue(mockStarters);

      await expect(
        service.setLineup(1, {
          formation: '3-1',
          player_ids: [30, 31, 32, 33, 34],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should set lineup and return players in tactical order matching Section 2.4.1', async () => {
      prisma.clubes.findUnique.mockResolvedValue(mockClub);
      prisma.jogadores.findMany.mockResolvedValue(mockStarters);

      const res = await service.setLineup(1, {
        formation: '2-1-1',
        player_ids: [34, 31, 30, 33, 32],
      });

      expect(res.club_id).toBe(1);
      expect(res.formation).toBe('2-1-1');
      expect(res.complete).toBe(true);
      expect(res.players.length).toBe(5);

      // Verify tactical order (GOL -> ZAG -> LAT -> MEI -> ATA)
      expect(res.players[0].position).toBe('GOL');
      expect(res.players[0].id).toBe(30);

      expect(res.players[1].position).toBe('ZAG');
      expect(res.players[1].id).toBe(32);

      expect(res.players[2].position).toBe('LAT');
      expect(res.players[2].id).toBe(31);

      expect(res.players[3].position).toBe('MEI');
      expect(res.players[3].id).toBe(33);

      expect(res.players[4].position).toBe('ATA');
      expect(res.players[4].id).toBe(34);
    });
  });

  describe('getLineup', () => {
    it('should return empty lineup when formation is null', async () => {
      prisma.clubes.findUnique.mockResolvedValue({
        id: 1,
        formacao: null,
        escalacoes: [],
      });

      const res = await service.getLineup(1);
      expect(res).toEqual({
        club_id: 1,
        formation: null,
        complete: false,
        players: [],
      });
    });

    it('should return complete: false when starters are fewer than 5', async () => {
      prisma.clubes.findUnique.mockResolvedValue({
        id: 1,
        formacao: '2-1-1',
        escalacoes: mockStarters.slice(0, 4).map((j) => ({ jogador: j })),
      });

      const res = await service.getLineup(1);
      expect(res.complete).toBe(false);
      expect(res.formation).toBe('2-1-1');
      expect(res.players.length).toBe(4);
    });
  });
});
