import { ConflictException, NotFoundException } from '@nestjs/common';
import { DomainCalculatorService } from '../domain/domain-calculator.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClubsService } from './clubs.service';

type MockPrisma = {
  clubes: {
    count: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('ClubsService', () => {
  let service: ClubsService;
  let prisma: MockPrisma;
  let calculator: DomainCalculatorService;

  beforeEach(() => {
    prisma = {
      clubes: {
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    calculator = new DomainCalculatorService();
    service = new ClubsService(prisma as unknown as PrismaService, calculator);
  });

  it('should create a club with 300.00 cash and net_worth', async () => {
    prisma.clubes.count.mockResolvedValue(0);
    prisma.clubes.findUnique.mockResolvedValue(null);
    prisma.clubes.findFirst.mockResolvedValue(null);
    prisma.clubes.create.mockResolvedValue({
      id: 1,
      nome: 'Águias FC',
      nome_normalizado: 'águias fc',
      sigla: 'AGU',
      caixa: 300.0,
    });

    const result = await service.create({
      name: 'Águias FC',
      acronym: 'AGU',
    });

    expect(result.id).toBe(1);
    expect(result.name).toBe('Águias FC');
    expect(result.acronym).toBe('AGU');
    expect(result.cash).toBe(300.0);
    expect(result.squad_value).toBe(0.0);
    expect(result.net_worth).toBe(300.0);
  });

  it('should enforce 20-club limit with 409 Conflict', async () => {
    prisma.clubes.count.mockResolvedValue(20);

    await expect(
      service.create({
        name: 'Vigésimo Primeiro FC',
        acronym: 'VPF',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should enforce acronym uniqueness with 409 Conflict', async () => {
    prisma.clubes.count.mockResolvedValue(5);
    prisma.clubes.findUnique.mockResolvedValue({ id: 2, sigla: 'AGU' });

    await expect(
      service.create({
        name: 'Águias FC',
        acronym: 'AGU',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should enforce normalized name uniqueness with 409 Conflict', async () => {
    prisma.clubes.count.mockResolvedValue(5);
    prisma.clubes.findUnique.mockResolvedValue(null);
    prisma.clubes.findFirst.mockResolvedValue({ id: 1, nome: 'Águias FC' });

    await expect(
      service.create({
        name: '  águias   fc ',
        acronym: 'AFC',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should return club detail with squad sorted in tactical order and active contract', async () => {
    const now = new Date('2026-11-02T10:15:00-03:00');
    const loyalty = new Date('2027-03-02T10:15:00-03:00');

    prisma.clubes.findUnique.mockResolvedValue({
      id: 1,
      nome: 'Águias FC',
      sigla: 'AGU',
      caixa: 261.15,
      jogadores: [
        {
          id: 2,
          nome: 'Meia Lua',
          posicao: 'MEI',
          agilidade: 85,
          idade: 25,
          condicao: 'MAL_CONDICIONADO',
          valor_base: 40.0,
          velocidade: 70,
          finalizacao: 68,
          passe: 82,
          drible: 79,
          defesa: 55,
          fisico: 64,
          potencial: 86,
          clube_id: 1,
          contratos: [
            {
              id: 10,
              valor_compra: 37.0,
              fidelidade_ate: loyalty,
              situacao: 'ATIVO',
            },
          ],
        },
      ],
    });

    const result = await service.findById(1, now);

    expect(result.id).toBe(1);
    expect(result.cash).toBe(261.15);
    expect(result.squad_value).toBe(37.0);
    expect(result.net_worth).toBe(298.15);
    expect(result.players).toHaveLength(1);
    expect(result.players[0].contract).toEqual({
      purchase_value: 37.0,
      loyalty_until: '2027-03-02T10:15:00-03:00',
      remaining_days: 120,
      penalty_rate: 10,
    });
  });

  it('should throw 404 when club does not exist', async () => {
    prisma.clubes.findUnique.mockResolvedValue(null);

    await expect(service.findById(999)).rejects.toThrow(NotFoundException);
  });
});
