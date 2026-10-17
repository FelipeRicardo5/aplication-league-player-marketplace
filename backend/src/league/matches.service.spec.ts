import { NotFoundException, ConflictException } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { PrismaService } from '../prisma/prisma.service';
import { DomainCalculatorService } from '../domain/domain-calculator.service';
import { Clock } from '../shared/clock';

describe('MatchesService', () => {
  let service: MatchesService;
  let prisma: any;
  let calculator: DomainCalculatorService;
  let mockClock: Clock;

  const fixedNow = new Date('2026-11-12T15:00:00-03:00');

  beforeEach(() => {
    mockClock = {
      now: () => fixedNow,
    };

    prisma = {
      clubes: {
        findUnique: jest.fn(),
      },
      partidas: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      duelos_partida: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    calculator = new DomainCalculatorService();
    service = new MatchesService(prisma as unknown as PrismaService, calculator, mockClock);
  });

  // Águias FC (mandante)
  const homeStarters = [
    {
      id: 30,
      nome: 'Rui Prado',
      posicao: 'GOL',
      agilidade: 70,
      idade: 28,
      condicao: 'APTO',
      defesa: 77,
      finalizacao: 40,
      passe: 65,
      drible: 50,
      velocidade: 60,
      fisico: 75,
      clube_id: 1,
      excluido_em: null,
    },
    {
      id: 32,
      nome: 'Téo Brandão',
      posicao: 'ZAG',
      agilidade: 75,
      idade: 27,
      condicao: 'APTO',
      defesa: 84,
      finalizacao: 30,
      passe: 60,
      drible: 55,
      velocidade: 65,
      fisico: 80,
      clube_id: 1,
      excluido_em: null,
    },
    {
      id: 31,
      nome: 'Davi Lins',
      posicao: 'LAT',
      agilidade: 80,
      idade: 24,
      condicao: 'MAL_CONDICIONADO',
      defesa: 66,
      finalizacao: 50,
      passe: 70,
      drible: 74,
      velocidade: 85,
      fisico: 70,
      clube_id: 1,
      excluido_em: null,
    },
    {
      id: 33,
      nome: 'Lauro Neves',
      posicao: 'MEI',
      agilidade: 85,
      idade: 26,
      condicao: 'APTO',
      defesa: 58,
      finalizacao: 65,
      passe: 82,
      drible: 78,
      velocidade: 70,
      fisico: 68,
      clube_id: 1,
      excluido_em: null,
    },
    {
      id: 34,
      nome: 'Otto Rangel',
      posicao: 'ATA',
      agilidade: 88,
      idade: 23,
      condicao: 'APTO',
      defesa: 42,
      finalizacao: 75,
      passe: 62,
      drible: 80,
      velocidade: 88,
      fisico: 72,
      clube_id: 1,
      excluido_em: null,
    },
  ];

  // Delta FC (visitante)
  const awayStarters = [
    {
      id: 40,
      nome: 'Ivo Teles',
      posicao: 'GOL',
      agilidade: 70,
      idade: 29,
      condicao: 'APTO',
      defesa: 72,
      finalizacao: 40,
      passe: 60,
      drible: 50,
      velocidade: 60,
      fisico: 70,
      clube_id: 2,
      excluido_em: null,
    },
    {
      id: 41,
      nome: 'Hugo Vaz',
      posicao: 'ZAG',
      agilidade: 76,
      idade: 28,
      condicao: 'APTO',
      defesa: 84,
      finalizacao: 30,
      passe: 60,
      drible: 55,
      velocidade: 65,
      fisico: 80,
      clube_id: 2,
      excluido_em: null,
    },
    {
      id: 42,
      nome: 'Lino Matos',
      posicao: 'LAT',
      agilidade: 82,
      idade: 25,
      condicao: 'APTO',
      defesa: 63,
      finalizacao: 55,
      passe: 72,
      drible: 79,
      velocidade: 82,
      fisico: 65,
      clube_id: 2,
      excluido_em: null,
    },
    {
      id: 43,
      nome: 'Nei Soares',
      posicao: 'MEI',
      agilidade: 80,
      idade: 27,
      condicao: 'APTO',
      defesa: 60,
      finalizacao: 60,
      passe: 70,
      drible: 75,
      velocidade: 70,
      fisico: 68,
      clube_id: 2,
      excluido_em: null,
    },
    {
      id: 44,
      nome: 'Ugo Falcão',
      posicao: 'ATA',
      agilidade: 86,
      idade: 24,
      condicao: 'APTO',
      defesa: 45,
      finalizacao: 81,
      passe: 65,
      drible: 82,
      velocidade: 85,
      fisico: 75,
      clube_id: 2,
      excluido_em: null,
    },
  ];

  const homeClub = {
    id: 1,
    nome: 'Águias FC',
    formacao: '2-1-1',
    escalacoes: homeStarters.map((j) => ({ jogador: j })),
  };

  const awayClub = {
    id: 2,
    nome: 'Delta FC',
    formacao: '2-1-1',
    escalacoes: awayStarters.map((j) => ({ jogador: j })),
  };

  describe('createMatch', () => {
    it('should throw ConflictException if home and away are identical', async () => {
      await expect(service.createMatch({ home_club_id: 1, away_club_id: 1 })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if home club not found', async () => {
      prisma.clubes.findUnique.mockResolvedValueOnce(null);
      await expect(service.createMatch({ home_club_id: 1, away_club_id: 2 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if home club has incomplete lineup', async () => {
      prisma.clubes.findUnique.mockResolvedValueOnce({
        ...homeClub,
        escalacoes: homeStarters.slice(0, 4).map((j) => ({ jogador: j })),
      });
      prisma.clubes.findUnique.mockResolvedValueOnce(awayClub);

      await expect(service.createMatch({ home_club_id: 1, away_club_id: 2 })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should simulate match and match normative RN20 score: Águias 1 x 2 Delta (VISITANTE)', async () => {
      prisma.clubes.findUnique.mockResolvedValueOnce(homeClub);
      prisma.clubes.findUnique.mockResolvedValueOnce(awayClub);

      const createdMatch = {
        id: 1,
        mandante_id: 1,
        visitante_id: 2,
        gols_mandante: 1,
        gols_visitante: 2,
        formacao_mandante: '2-1-1',
        formacao_visitante: '2-1-1',
        jogada_em: fixedNow,
      };
      prisma.partidas.create.mockResolvedValue(createdMatch);

      const res = await service.createMatch({
        home_club_id: 1,
        away_club_id: 2,
      });

      expect(res.id).toBe(1);
      expect(res.played_at).toBe('2026-11-12T15:00:00-03:00');
      expect(res.home.goals).toBe(1);
      expect(res.away.goals).toBe(2);
      expect(res.result).toBe('VISITANTE');
      expect(res.duels.length).toBe(6);

      // Duelo 1: Otto Rangel (75) vs Ivo Teles (72) -> Gol mandante
      expect(res.duels[0].order).toBe(1);
      expect(res.duels[0].goal).toBe(true);
      expect(res.duels[0].attacking_club_id).toBe(1);

      // Duelo 2: Lauro Neves (82) vs Hugo Vaz (84) -> Não
      expect(res.duels[1].order).toBe(2);
      expect(res.duels[1].goal).toBe(false);

      // Duelo 3: Davi Lins (drible 63) vs Lino Matos (defesa 63) -> Não (empate)
      expect(res.duels[2].order).toBe(3);
      expect(res.duels[2].goal).toBe(false);

      // Duelo 4: Ugo Falcão (81) vs Rui Prado (77) -> Gol visitante
      expect(res.duels[3].order).toBe(4);
      expect(res.duels[3].goal).toBe(true);
      expect(res.duels[3].attacking_club_id).toBe(2);

      // Duelo 5: Nei Soares (70) vs Téo Brandão (84) -> Não
      expect(res.duels[4].order).toBe(5);
      expect(res.duels[4].goal).toBe(false);

      // Duelo 6: Lino Matos (79) vs Davi Lins (defesa 56) -> Gol visitante
      expect(res.duels[5].order).toBe(6);
      expect(res.duels[5].goal).toBe(true);
    });
  });

  describe('findMatchById', () => {
    it('should throw NotFoundException if match not found', async () => {
      prisma.partidas.findUnique.mockResolvedValue(null);
      await expect(service.findMatchById(999)).rejects.toThrow(NotFoundException);
    });
  });
});
