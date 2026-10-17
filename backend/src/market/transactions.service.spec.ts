import { NotFoundException } from '@nestjs/common';
import { TransactionsService, escapeCsvField } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      clubes: {
        findUnique: jest.fn(),
      },
      jogadores: {
        findFirst: jest.fn(),
      },
      transacoes: {
        findMany: jest.fn(),
      },
    };

    service = new TransactionsService(prisma as unknown as PrismaService);
  });

  describe('escapeCsvField', () => {
    it('should return unquoted text when no semicolons or quotes exist', () => {
      expect(escapeCsvField('Meia Lua')).toBe('Meia Lua');
    });

    it('should wrap in quotes and escape internal quotes', () => {
      expect(escapeCsvField('Zé "Foguete" Lima')).toBe('"Zé ""Foguete"" Lima"');
    });

    it('should wrap in quotes when semicolons exist', () => {
      expect(escapeCsvField('Clube;Top')).toBe('"Clube;Top"');
    });
  });

  describe('getClubTransactions', () => {
    it('should throw NotFoundException if club not found', async () => {
      prisma.clubes.findUnique.mockResolvedValue(null);
      await expect(service.getClubTransactions(999, {})).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if player_id is provided but player does not exist or is deleted', async () => {
      prisma.clubes.findUnique.mockResolvedValue({ id: 1 });
      prisma.jogadores.findFirst.mockResolvedValue(null);

      await expect(service.getClubTransactions(1, { player_id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty data and zeroed summary when no transactions match', async () => {
      prisma.clubes.findUnique.mockResolvedValue({ id: 1 });
      prisma.transacoes.findMany.mockResolvedValue([]);

      const result = await service.getClubTransactions(1, {});
      expect(result.data).toEqual([]);
      expect(result.summary).toEqual({
        total_spent: 0,
        total_received: 0,
        total_fees: 0,
        total_penalties: 0,
        total_profit: 0,
      });
    });

    it('should return transactions and calculate summary correctly matching Section 2.3.3', async () => {
      prisma.clubes.findUnique.mockResolvedValue({ id: 1 });
      prisma.transacoes.findMany.mockResolvedValue([
        {
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
          criado_em: new Date('2026-11-05T16:40:00-03:00'),
        },
      ]);

      const result = await service.getClubTransactions(1, { type: 'VENDA' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe(11);
      expect(result.data[0].player_name).toBe('Meia Lua');
      expect(result.summary).toEqual({
        total_spent: 0.0,
        total_received: 35.7,
        total_fees: 0.3,
        total_penalties: 4.0,
        total_profit: 3.0,
      });
    });
  });

  describe('exportClubTransactionsCsv', () => {
    it('should export header only when no transactions exist', async () => {
      prisma.clubes.findUnique.mockResolvedValue({ id: 1 });
      prisma.transacoes.findMany.mockResolvedValue([]);

      const csv = await service.exportClubTransactionsCsv(1, {});
      expect(csv).toBe(
        'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n',
      );
    });

    it('should format CSV matching Section 2.3.4 example', async () => {
      prisma.clubes.findUnique.mockResolvedValue({ id: 1 });
      prisma.transacoes.findMany.mockResolvedValue([
        {
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
          criado_em: new Date('2026-11-05T16:40:00-03:00'),
        },
        {
          id: 10,
          clube_id: 1,
          jogador_id: 2,
          nome_jogador: 'Meia Lua',
          tipo: 'COMPRA',
          valor: 37.0,
          taxa: 1.85,
          multa: 0.0,
          lucro: null,
          variacao_caixa: -38.85,
          criado_em: new Date('2026-11-02T10:15:00-03:00'),
        },
      ]);

      const csv = await service.exportClubTransactionsCsv(1, {});
      const lines = csv.split('\n');

      expect(lines[0]).toBe(
        'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa',
      );
      expect(lines[1]).toBe('2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70');
      expect(lines[2]).toBe('2026-11-02T10:15:00-03:00;COMPRA;Meia Lua;37,00;1,85;0,00;;-38,85');
    });
  });
});
