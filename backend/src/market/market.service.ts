import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DomainCalculatorService } from '../domain/domain-calculator.service';
import { Clock, SystemClock, formatIsoBrasilia } from '../shared/clock';
import { BuyPlayerDto } from './dto/buy-player.dto';
import { roundCurrency } from '../domain/money';
import { Condition } from '../domain/market-value';

@Injectable()
export class MarketService {
  private readonly clock: Clock;

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: DomainCalculatorService,
    clock?: Clock,
  ) {
    this.clock = clock ?? new SystemClock();
  }

  /**
   * Compra um jogador livre para um clube (RN12, RN13, RN14).
   */
  async buyPlayer(playerId: number, dto: BuyPlayerDto) {
    const player = await this.prisma.jogadores.findFirst({
      where: { id: playerId, excluido_em: null },
    });

    if (!player) {
      throw new NotFoundException('Jogador não encontrado');
    }

    if (player.clube_id !== null) {
      throw new ConflictException('Jogador já possui clube');
    }

    const club = await this.prisma.clubes.findUnique({
      where: { id: dto.club_id },
      include: {
        jogadores: {
          where: { excluido_em: null },
        },
      },
    });

    if (!club) {
      throw new NotFoundException('Clube não encontrado');
    }

    // RN14 - Limite de 12 jogadores no elenco
    if (club.jogadores.length >= 12) {
      throw new ConflictException('Limite de 12 jogadores por clube atingido');
    }

    // RN12 - Clube não pode recomprar jogador que já vendeu
    const previousSale = await this.prisma.transacoes.findFirst({
      where: {
        clube_id: club.id,
        jogador_id: player.id,
        tipo: 'VENDA',
      },
    });

    if (previousSale) {
      throw new ConflictException('Clube não pode recomprar jogador que já vendeu');
    }

    // RN05 - Valor de mercado atual
    const marketValue = this.calculator.calculateMarketValue(
      Number(player.valor_base),
      player.condicao as Condition,
      player.agilidade,
      player.idade,
    );

    // RN13 - Taxa de compra (5% se > 30.00)
    const fee = this.calculator.calculatePurchaseFee(marketValue);
    const totalCost = roundCurrency(marketValue + fee);

    // RN13 - Limite de 50% do caixa antes da compra (sem arredondamento)
    const clubCash = Number(club.caixa);
    const maxAllowedCost = clubCash / 2;
    if (totalCost > maxAllowedCost) {
      throw new ConflictException('Custo total da compra excede 50% do caixa do clube');
    }

    const now = this.clock.now();
    const loyaltyUntil = new Date(dto.loyalty_until);
    const newCash = roundCurrency(clubCash - totalCost);

    // Execução atômica no banco (RN12, B2)
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.clubes.update({
        where: { id: club.id },
        data: { caixa: newCash },
      });

      await tx.jogadores.update({
        where: { id: player.id },
        data: { clube_id: club.id },
      });

      const contract = await tx.contratos.create({
        data: {
          clube_id: club.id,
          jogador_id: player.id,
          valor_compra: marketValue,
          fidelidade_ate: loyaltyUntil,
          situacao: 'ATIVO',
          iniciado_em: now,
        },
      });

      const transaction = await tx.transacoes.create({
        data: {
          clube_id: club.id,
          jogador_id: player.id,
          nome_jogador: player.nome,
          tipo: 'COMPRA',
          valor: marketValue,
          taxa: fee,
          multa: 0,
          lucro: null,
          variacao_caixa: -totalCost,
          criado_em: now,
        },
      });

      return { transaction, contract };
    });

    return {
      id: result.transaction.id,
      club_id: club.id,
      player_id: player.id,
      player_name: player.nome,
      type: 'COMPRA' as const,
      value: marketValue,
      fee: fee,
      penalty: 0.0,
      profit: null,
      cash_change: -totalCost,
      created_at: formatIsoBrasilia(result.transaction.criado_em),
      contract: {
        purchase_value: marketValue,
        loyalty_until: formatIsoBrasilia(loyaltyUntil),
        status: 'ATIVO' as const,
      },
      club_cash: newCash,
    };
  }

  /**
   * Vende um jogador do elenco de um clube (RN15, RN16).
   */
  async sellPlayer(playerId: number) {
    const player = await this.prisma.jogadores.findFirst({
      where: { id: playerId, excluido_em: null },
    });

    if (!player) {
      throw new NotFoundException('Jogador não encontrado');
    }

    if (player.clube_id === null) {
      throw new ConflictException('Jogador não pertence a nenhum clube');
    }

    const club = await this.prisma.clubes.findUnique({
      where: { id: player.clube_id },
    });

    if (!club) {
      throw new NotFoundException('Clube não encontrado');
    }

    const activeContract = await this.prisma.contratos.findFirst({
      where: {
        clube_id: club.id,
        jogador_id: player.id,
        situacao: 'ATIVO',
      },
    });

    if (!activeContract) {
      throw new ConflictException('Jogador não possui contrato ativo no clube informado');
    }

    const now = this.clock.now();

    // RN05 - Valor de mercado no momento da venda
    const saleValue = this.calculator.calculateMarketValue(
      Number(player.valor_base),
      player.condicao as Condition,
      player.agilidade,
      player.idade,
    );

    const purchaseValue = Number(activeContract.valor_compra);

    // RN15 - Dias restantes, percentual e multa de fidelidade
    const remainingDays = this.calculator.calculateRemainingDays(
      activeContract.fidelidade_ate,
      now,
    );
    const penaltyRate = this.calculator.calculatePenaltyRate(remainingDays);
    const penalty = this.calculator.calculateLoyaltyPenalty(saleValue, penaltyRate);

    // RN16 - Lucro e comissão progressiva de venda
    const profit = roundCurrency(saleValue - purchaseValue);
    const fee = this.calculator.calculateSaleCommission(profit);

    // Crédito no caixa
    const cashChange = roundCurrency(saleValue - penalty - fee);
    const clubCash = Number(club.caixa);
    const newCash = roundCurrency(clubCash + cashChange);

    const contractStatus = penalty > 0 ? 'RESCINDIDO' : 'ENCERRADO';

    // Execução atômica no banco (RN16, RN19 item 5, B2)
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.clubes.update({
        where: { id: club.id },
        data: { caixa: newCash },
      });

      await tx.jogadores.update({
        where: { id: player.id },
        data: { clube_id: null },
      });

      // Se o jogador estiver na escalação titular, remove-o
      await tx.escalacoes.deleteMany({
        where: {
          clube_id: club.id,
          jogador_id: player.id,
        },
      });

      await tx.contratos.update({
        where: { id: activeContract.id },
        data: {
          situacao: contractStatus,
          encerrado_em: now,
        },
      });

      const transaction = await tx.transacoes.create({
        data: {
          clube_id: club.id,
          jogador_id: player.id,
          nome_jogador: player.nome,
          tipo: 'VENDA',
          valor: saleValue,
          taxa: fee,
          multa: penalty,
          lucro: profit,
          variacao_caixa: cashChange,
          criado_em: now,
        },
      });

      return transaction;
    });

    return {
      id: result.id,
      club_id: club.id,
      player_id: player.id,
      player_name: player.nome,
      type: 'VENDA' as const,
      value: saleValue,
      fee: fee,
      penalty: penalty,
      profit: profit,
      cash_change: cashChange,
      created_at: formatIsoBrasilia(result.criado_em),
      purchase_value: purchaseValue,
      remaining_days: remainingDays,
      penalty_rate: penaltyRate,
      contract_status: contractStatus,
      club_cash: newCash,
    };
  }
}
