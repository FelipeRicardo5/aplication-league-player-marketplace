import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DomainCalculatorService } from '../domain/domain-calculator.service';
import { Condition } from '../domain/market-value';
import { roundCurrency } from '../domain/money';
import { Position } from '../domain/overall';
import { PrismaService } from '../prisma/prisma.service';
import { formatIsoBrasilia } from '../shared/clock';
import { compareUnicodeNames, normalizeClubName } from '../shared/text';
import { mapPlayerToResponse, PlayerResponse } from '../players/player.mapper';
import { CreateClubDto } from './dto/create-club.dto';
import { QueryClubsDto } from './dto/query-clubs.dto';

export interface ClubSummaryResponse {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
}

export interface ClubPlayerContract {
  purchase_value: number;
  loyalty_until: string;
  remaining_days: number;
  penalty_rate: number;
}

export interface ClubPlayerResponse extends PlayerResponse {
  contract?: ClubPlayerContract;
}

export interface ClubDetailResponse extends ClubSummaryResponse {
  players: ClubPlayerResponse[];
}

const TACTICAL_POSITION_ORDER: Record<Position, number> = {
  GOL: 0,
  ZAG: 1,
  LAT: 2,
  MEI: 3,
  ATA: 4,
};

@Injectable()
export class ClubsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: DomainCalculatorService,
  ) {}

  async create(dto: CreateClubDto): Promise<ClubSummaryResponse> {
    const nomeNormalizado = normalizeClubName(dto.name);

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.clubes.count();
      if (count >= 20) {
        throw new ConflictException('Limite máximo de 20 clubes atingido');
      }

      const existingAcronym = await tx.clubes.findUnique({
        where: { sigla: dto.acronym },
      });
      if (existingAcronym) {
        throw new ConflictException('Sigla de clube já cadastrada');
      }

      const existingNormalizedName = await tx.clubes.findFirst({
        where: { nome_normalizado: nomeNormalizado },
      });
      if (existingNormalizedName) {
        throw new ConflictException('Nome de clube já cadastrado');
      }

      const created = await tx.clubes.create({
        data: {
          nome: dto.name,
          nome_normalizado: nomeNormalizado,
          sigla: dto.acronym,
          caixa: 300.0,
        },
      });

      return {
        id: created.id,
        name: created.nome,
        acronym: created.sigla,
        cash: 300.0,
        squad_value: 0.0,
        net_worth: 300.0,
      };
    });
  }

  async findAll(query: QueryClubsDto): Promise<ClubSummaryResponse[]> {
    const clubs = await this.prisma.clubes.findMany({
      include: {
        jogadores: {
          where: { excluido_em: null },
        },
      },
    });

    const calculatedClubs = clubs.map((club) => {
      const cash = Number(club.caixa);
      let squadValue = 0;

      for (const player of club.jogadores) {
        const mv = this.calculator.calculateMarketValue(
          Number(player.valor_base),
          player.condicao as Condition,
          player.agilidade,
          player.idade,
        );
        squadValue += mv;
      }

      const roundedSquadValue = roundCurrency(squadValue);
      const roundedNetWorth = roundCurrency(cash + roundedSquadValue);

      return {
        id: club.id,
        name: club.nome,
        acronym: club.sigla,
        cash: roundCurrency(cash),
        squad_value: roundedSquadValue,
        net_worth: roundedNetWorth,
      };
    });

    // Ordenação
    calculatedClubs.sort((a, b) => {
      if (query.sort === 'net_worth_asc') {
        const diff = a.net_worth - b.net_worth;
        if (diff !== 0) return diff;
      } else if (query.sort === 'net_worth_desc') {
        const diff = b.net_worth - a.net_worth;
        if (diff !== 0) return diff;
      }

      // Ordenação padrão ou desempate por nome alfabético Unicode
      const nameComp = compareUnicodeNames(a.name, b.name);
      if (nameComp !== 0) return nameComp;

      // Desempate por id crescente
      return a.id - b.id;
    });

    return calculatedClubs;
  }

  async findById(id: number, now: Date = new Date()): Promise<ClubDetailResponse> {
    const club = await this.prisma.clubes.findUnique({
      where: { id },
      include: {
        jogadores: {
          where: { excluido_em: null },
          include: {
            contratos: {
              where: { situacao: 'ATIVO' },
              orderBy: { id: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!club) {
      throw new NotFoundException('Clube não encontrado');
    }

    const cash = roundCurrency(Number(club.caixa));
    let squadValue = 0;

    const mappedPlayers: ClubPlayerResponse[] = club.jogadores.map((player) => {
      const baseResponse = mapPlayerToResponse(player);
      squadValue += baseResponse.market_value;

      let contract: ClubPlayerContract | undefined;
      const activeContract = player.contratos[0];
      if (activeContract) {
        const remainingDays = this.calculator.calculateRemainingDays(
          activeContract.fidelidade_ate,
          now,
        );
        const penaltyRate = this.calculator.calculatePenaltyRate(remainingDays);

        contract = {
          purchase_value: Number(activeContract.valor_compra),
          loyalty_until: formatIsoBrasilia(activeContract.fidelidade_ate),
          remaining_days: remainingDays,
          penalty_rate: penaltyRate,
        };
      }

      return {
        ...baseResponse,
        contract,
      };
    });

    // Ordenação do elenco (RN11): GOL, ZAG, LAT, MEI, ATA, depois nome Unicode, depois id
    mappedPlayers.sort((a, b) => {
      const posA = TACTICAL_POSITION_ORDER[a.position];
      const posB = TACTICAL_POSITION_ORDER[b.position];
      if (posA !== posB) return posA - posB;

      const nameComp = compareUnicodeNames(a.name, b.name);
      if (nameComp !== 0) return nameComp;

      return a.id - b.id;
    });

    const roundedSquadValue = roundCurrency(squadValue);
    const roundedNetWorth = roundCurrency(cash + roundedSquadValue);

    return {
      id: club.id,
      name: club.nome,
      acronym: club.sigla,
      cash,
      squad_value: roundedSquadValue,
      net_worth: roundedNetWorth,
      players: mappedPlayers,
    };
  }
}
