import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, jogadores } from '@prisma/client';
import { DomainCalculatorService } from '../domain/domain-calculator.service';
import { Position } from '../domain/overall';
import { PrismaService } from '../prisma/prisma.service';
import { compareUnicodeNames, normalizeForSearch } from '../shared/text';
import { CreatePlayerDto } from './dto/create-player.dto';
import { QueryPlayersDto } from './dto/query-players.dto';
import { UpdateConditionDto } from './dto/update-condition.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { mapPlayerToResponse, PlayerResponse } from './player.mapper';

export { PlayerResponse };

const TACTICAL_POSITION_ORDER: Record<Position, number> = {
  GOL: 0,
  ZAG: 1,
  LAT: 2,
  MEI: 3,
  ATA: 4,
};

@Injectable()
export class PlayersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: DomainCalculatorService,
  ) {}

  private mapToPlayerResponse(player: jogadores): PlayerResponse {
    return mapPlayerToResponse(player);
  }

  async create(dto: CreatePlayerDto): Promise<PlayerResponse> {
    const overall = this.calculator.calculateOverall(dto.position, {
      pace: dto.pace,
      shooting: dto.shooting,
      passing: dto.passing,
      dribbling: dto.dribbling,
      defending: dto.defending,
      physical: dto.physical,
    });

    const baseValue = this.calculator.calculateBaseValue(overall, dto.potential, dto.age);

    const created = await this.prisma.jogadores.create({
      data: {
        nome: dto.name,
        posicao: dto.position,
        agilidade: dto.agility,
        idade: dto.age,
        valor_base: baseValue,
        condicao: 'APTO',
        clube_id: null,
        velocidade: dto.pace,
        finalizacao: dto.shooting,
        passe: dto.passing,
        drible: dto.dribbling,
        defesa: dto.defending,
        fisico: dto.physical,
        potencial: dto.potential,
      },
    });

    return this.mapToPlayerResponse(created);
  }

  async findById(id: number): Promise<PlayerResponse> {
    const player = await this.prisma.jogadores.findFirst({
      where: { id, excluido_em: null },
    });

    if (!player) {
      throw new NotFoundException('Jogador não encontrado');
    }

    return this.mapToPlayerResponse(player);
  }

  async update(id: number, dto: UpdatePlayerDto): Promise<PlayerResponse> {
    const player = await this.prisma.jogadores.findFirst({
      where: { id, excluido_em: null },
    });

    if (!player) {
      throw new NotFoundException('Jogador não encontrado');
    }

    if (dto.age < player.idade) {
      throw new ConflictException('A idade do jogador não pode diminuir');
    }

    if (player.clube_id !== null && dto.position !== player.posicao) {
      throw new ConflictException('Jogador com clube não pode mudar de posição');
    }

    const updated = await this.prisma.jogadores.update({
      where: { id },
      data: {
        nome: dto.name,
        posicao: dto.position,
        agilidade: dto.agility,
        idade: dto.age,
      },
    });

    return this.mapToPlayerResponse(updated);
  }

  async updateCondition(id: number, dto: UpdateConditionDto): Promise<PlayerResponse> {
    const player = await this.prisma.jogadores.findFirst({
      where: { id, excluido_em: null },
    });

    if (!player) {
      throw new NotFoundException('Jogador não encontrado');
    }

    if (player.condicao === 'DOENTE' && dto.condition === 'APTO') {
      throw new ConflictException('Jogador DOENTE não pode passar direto para APTO');
    }

    if (player.condicao === dto.condition) {
      return this.mapToPlayerResponse(player);
    }

    if (dto.condition === 'DOENTE') {
      // Operação atômica: atualiza condição e remove da escalação se titular
      const updated = await this.prisma.$transaction(async (tx) => {
        await tx.escalacoes.deleteMany({
          where: { jogador_id: id },
        });

        return tx.jogadores.update({
          where: { id },
          data: { condicao: dto.condition },
        });
      });

      return this.mapToPlayerResponse(updated);
    }

    const updated = await this.prisma.jogadores.update({
      where: { id },
      data: { condicao: dto.condition },
    });

    return this.mapToPlayerResponse(updated);
  }

  async findAll(query: QueryPlayersDto): Promise<{
    data: PlayerResponse[];
    meta: { page: number; limit: number; total_items: number; total_pages: number };
  }> {
    if (query.club_id !== undefined) {
      const club = await this.prisma.clubes.findUnique({
        where: { id: query.club_id },
      });
      if (!club) {
        throw new NotFoundException('Clube não encontrado');
      }
    }

    const where: Prisma.jogadoresWhereInput = {
      excluido_em: null,
    };

    if (query.position) {
      where.posicao = query.position;
    }

    if (query.condition) {
      where.condicao = query.condition;
    }

    if (query.free !== undefined) {
      where.clube_id = query.free ? null : { not: null };
    }

    if (query.club_id !== undefined) {
      where.clube_id = query.club_id;
    }

    if (query.min_age !== undefined || query.max_age !== undefined) {
      where.idade = {};
      if (query.min_age !== undefined) where.idade.gte = query.min_age;
      if (query.max_age !== undefined) where.idade.lte = query.max_age;
    }

    const dbPlayers = await this.prisma.jogadores.findMany({ where });

    let players = dbPlayers.map((p) => this.mapToPlayerResponse(p));

    // Filtro por search (insensível a maiúsculas/minúsculas e acentos)
    if (query.search) {
      const searchNormalized = normalizeForSearch(query.search);
      players = players.filter((p) => normalizeForSearch(p.name).includes(searchNormalized));
    }

    // Filtro por valor de mercado calculado
    if (query.min_value !== undefined) {
      players = players.filter((p) => p.market_value >= query.min_value!);
    }
    if (query.max_value !== undefined) {
      players = players.filter((p) => p.market_value <= query.max_value!);
    }

    // Ordenação
    const sortCriteria = Array.isArray(query.sort) ? query.sort : [query.sort ?? 'name'];

    const compareByCriterion = (
      a: PlayerResponse,
      b: PlayerResponse,
      criterion: string,
    ): number => {
      switch (criterion) {
        case 'name':
          return compareUnicodeNames(a.name, b.name);
        case 'value_asc':
          return a.market_value - b.market_value;
        case 'value_desc':
          return b.market_value - a.market_value;
        case 'age_asc':
          return a.age - b.age;
        case 'age_desc':
          return b.age - a.age;
        case 'position':
          return TACTICAL_POSITION_ORDER[a.position] - TACTICAL_POSITION_ORDER[b.position];
        default:
          return 0;
      }
    };

    players.sort((a, b) => {
      for (const crit of sortCriteria) {
        const comp = compareByCriterion(a, b, crit);
        if (comp !== 0) return comp;
      }
      // Desempate por nome alfabético Unicode
      const nameComp = compareUnicodeNames(a.name, b.name);
      if (nameComp !== 0) return nameComp;

      // Desempate por id crescente
      return a.id - b.id;
    });

    const total_items = players.length;
    const total_pages = total_items === 0 ? 0 : Math.ceil(total_items / query.limit);

    const startIndex = (query.page - 1) * query.limit;
    const pagedData = players.slice(startIndex, startIndex + query.limit);

    return {
      data: pagedData,
      meta: {
        page: query.page,
        limit: query.limit,
        total_items,
        total_pages,
      },
    };
  }

  async softDelete(id: number): Promise<void> {
    const player = await this.prisma.jogadores.findFirst({
      where: { id, excluido_em: null },
    });

    if (!player) {
      throw new NotFoundException('Jogador não encontrado');
    }

    if (player.clube_id !== null) {
      throw new ConflictException('Jogador que está em um clube não pode ser excluído');
    }

    await this.prisma.jogadores.update({
      where: { id },
      data: { excluido_em: new Date() },
    });
  }
}
