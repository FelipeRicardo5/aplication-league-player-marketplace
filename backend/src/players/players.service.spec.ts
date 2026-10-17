import { ConflictException, NotFoundException } from '@nestjs/common';
import { DomainCalculatorService } from '../domain/domain-calculator.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlayersService } from './players.service';

type MockPrisma = {
  jogadores: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
  clubes: {
    findUnique: jest.Mock;
  };
  escalacoes: {
    deleteMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('PlayersService', () => {
  let service: PlayersService;
  let prisma: MockPrisma;
  let calculator: DomainCalculatorService;

  beforeEach(() => {
    prisma = {
      jogadores: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      clubes: {
        findUnique: jest.fn(),
      },
      escalacoes: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    calculator = new DomainCalculatorService();
    service = new PlayersService(prisma as unknown as PrismaService, calculator);
  });

  it('should create a player with calculated base_value, initial APTO and null club_id', async () => {
    const mockCreated = {
      id: 2,
      nome: 'Meia Lua',
      posicao: 'MEI',
      agilidade: 85,
      idade: 25,
      valor_base: 40.0,
      condicao: 'APTO',
      clube_id: null,
      velocidade: 70,
      finalizacao: 68,
      passe: 82,
      drible: 79,
      defesa: 55,
      fisico: 64,
      potencial: 86,
    };

    prisma.jogadores.create.mockResolvedValue(mockCreated);

    const result = await service.create({
      name: 'Meia Lua',
      position: 'MEI',
      agility: 85,
      age: 25,
      pace: 70,
      shooting: 68,
      passing: 82,
      dribbling: 79,
      defending: 55,
      physical: 64,
      potential: 86,
    });

    expect(result.id).toBe(2);
    expect(result.name).toBe('Meia Lua');
    expect(result.overall).toBe(75);
    expect(result.base_value).toBe(40.0);
    expect(result.market_value).toBe(40.0);
    expect(result.condition).toBe('APTO');
    expect(result.club_id).toBeNull();
  });

  it('should throw 404 when player is not found or soft deleted', async () => {
    prisma.jogadores.findFirst.mockResolvedValue(null);

    await expect(service.findById(999)).rejects.toThrow(NotFoundException);
  });

  it('should reject age decrease in PUT with 409 Conflict', async () => {
    prisma.jogadores.findFirst.mockResolvedValue({
      id: 4,
      nome: 'Davi Melo',
      posicao: 'MEI',
      agilidade: 70,
      idade: 25,
      clube_id: null,
    });

    await expect(
      service.update(4, {
        name: 'Davi Melo',
        position: 'MEI',
        agility: 70,
        age: 24, // menor que 25
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should reject position change for player with club in PUT with 409 Conflict', async () => {
    prisma.jogadores.findFirst.mockResolvedValue({
      id: 4,
      nome: 'Davi Melo',
      posicao: 'MEI',
      agilidade: 70,
      idade: 25,
      clube_id: 1, // tem clube
    });

    await expect(
      service.update(4, {
        name: 'Davi Melo',
        position: 'ATA', // mudando de posição
        agility: 70,
        age: 25,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should reject transition from DOENTE directly to APTO with 409 Conflict', async () => {
    prisma.jogadores.findFirst.mockResolvedValue({
      id: 2,
      nome: 'Meia Lua',
      posicao: 'MEI',
      agilidade: 85,
      idade: 25,
      condicao: 'DOENTE',
    });

    await expect(
      service.updateCondition(2, {
        condition: 'APTO',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should atomically remove from lineup when condition becomes DOENTE', async () => {
    const mockPlayer = {
      id: 2,
      nome: 'Meia Lua',
      posicao: 'MEI',
      agilidade: 85,
      idade: 25,
      valor_base: 40.0,
      condicao: 'MAL_CONDICIONADO',
      clube_id: 1,
      velocidade: 70,
      finalizacao: 68,
      passe: 82,
      drible: 79,
      defesa: 55,
      fisico: 64,
      potencial: 86,
    };

    prisma.jogadores.findFirst.mockResolvedValue(mockPlayer);
    prisma.jogadores.update.mockResolvedValue({ ...mockPlayer, condicao: 'DOENTE' });

    await service.updateCondition(2, { condition: 'DOENTE' });

    expect(prisma.escalacoes.deleteMany).toHaveBeenCalledWith({
      where: { jogador_id: 2 },
    });
  });

  it('should reject deletion of player with club with 409 Conflict', async () => {
    prisma.jogadores.findFirst.mockResolvedValue({
      id: 2,
      clube_id: 1, // tem clube
      excluido_em: null,
    });

    await expect(service.softDelete(2)).rejects.toThrow(ConflictException);
  });

  it('should soft delete free player and set excluido_em', async () => {
    prisma.jogadores.findFirst.mockResolvedValue({
      id: 2,
      clube_id: null,
      excluido_em: null,
    });

    await service.softDelete(2);
    expect(prisma.jogadores.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2 },
        data: expect.objectContaining({ excluido_em: expect.any(Date) }),
      }),
    );
  });
});
