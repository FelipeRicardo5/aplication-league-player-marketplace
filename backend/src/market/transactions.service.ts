import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { formatIsoBrasilia } from '../shared/clock';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { roundCurrency, formatCurrencyCsv } from '../domain/money';

export function escapeCsvField(value: string): string {
  if (value.includes(';') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Consulta transações de um clube com filtros opcionais e resumo (RN17).
   */
  async getClubTransactions(clubId: number, dto: QueryTransactionsDto) {
    const club = await this.prisma.clubes.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundException('Clube não encontrado');
    }

    if (dto.player_id !== undefined) {
      const player = await this.prisma.jogadores.findFirst({
        where: { id: dto.player_id, excluido_em: null },
      });
      if (!player) {
        throw new NotFoundException('Jogador não encontrado');
      }
    }

    const whereClause: any = {
      clube_id: clubId,
    };

    if (dto.player_id !== undefined) {
      whereClause.jogador_id = dto.player_id;
    }

    if (dto.type) {
      const types = dto.type.split(',');
      whereClause.tipo = { in: types };
    }

    const transactions = await this.prisma.transacoes.findMany({
      where: whereClause,
      orderBy: [{ criado_em: 'desc' }, { id: 'desc' }],
    });

    let totalSpent = 0;
    let totalReceived = 0;
    let totalFees = 0;
    let totalPenalties = 0;
    let totalProfit = 0;

    const data = transactions.map((tx: any) => {
      const val = Number(tx.valor);
      const fee = Number(tx.taxa);
      const penalty = Number(tx.multa);
      const profit = tx.lucro !== null ? Number(tx.lucro) : null;
      const cashChange = Number(tx.variacao_caixa);

      totalFees += fee;

      if (tx.tipo === 'COMPRA') {
        totalSpent += val + fee;
      } else if (tx.tipo === 'VENDA') {
        totalReceived += cashChange;
        totalPenalties += penalty;
        if (profit !== null) {
          totalProfit += profit;
        }
      }

      return {
        id: tx.id,
        club_id: tx.clube_id,
        player_id: tx.jogador_id,
        player_name: tx.nome_jogador,
        type: tx.tipo as 'COMPRA' | 'VENDA',
        value: roundCurrency(val),
        fee: roundCurrency(fee),
        penalty: roundCurrency(penalty),
        profit: profit !== null ? roundCurrency(profit) : null,
        cash_change: roundCurrency(cashChange),
        created_at: formatIsoBrasilia(tx.criado_em),
      };
    });

    return {
      data,
      summary: {
        total_spent: roundCurrency(totalSpent),
        total_received: roundCurrency(totalReceived),
        total_fees: roundCurrency(totalFees),
        total_penalties: roundCurrency(totalPenalties),
        total_profit: roundCurrency(totalProfit),
      },
    };
  }

  /**
   * Exporta o histórico de transações de um clube em formato CSV (RN18).
   */
  async exportClubTransactionsCsv(clubId: number, dto: QueryTransactionsDto): Promise<string> {
    const result = await this.getClubTransactions(clubId, dto);

    const header = 'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n';

    if (result.data.length === 0) {
      return header;
    }

    const rows = result.data.map((tx) => {
      const formattedProfit = tx.profit !== null ? formatCurrencyCsv(tx.profit) : '';

      return [
        tx.created_at,
        tx.type,
        escapeCsvField(tx.player_name),
        formatCurrencyCsv(tx.value),
        formatCurrencyCsv(tx.fee),
        formatCurrencyCsv(tx.penalty),
        formattedProfit,
        formatCurrencyCsv(tx.cash_change),
      ].join(';');
    });

    return header + rows.join('\n') + '\n';
  }
}
