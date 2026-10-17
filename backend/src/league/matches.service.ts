import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DomainCalculatorService } from '../domain/domain-calculator.service';
import { Clock, SystemClock, formatIsoBrasilia } from '../shared/clock';
import { CreateMatchDto } from './dto/create-match.dto';
import { QueryMatchesDto } from './dto/query-matches.dto';
import { Position } from '../domain/overall';
import { Condition } from '../domain/market-value';
import { MatchPlayer } from '../domain/duel';

@Injectable()
export class MatchesService {
  private readonly clock: Clock;

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: DomainCalculatorService,
    clock?: Clock,
  ) {
    this.clock = clock ?? new SystemClock();
  }

  /**
   * Joga uma partida entre dois clubes e persiste o resultado e os 6 duelos (RN20).
   */
  async createMatch(dto: CreateMatchDto) {
    if (dto.home_club_id === dto.away_club_id) {
      throw new ConflictException('Mandante e visitante devem ser diferentes');
    }

    const homeClub = await this.prisma.clubes.findUnique({
      where: { id: dto.home_club_id },
      include: {
        escalacoes: {
          include: { jogador: true },
        },
      },
    });

    if (!homeClub) {
      throw new NotFoundException('Clube mandante não encontrado');
    }

    const awayClub = await this.prisma.clubes.findUnique({
      where: { id: dto.away_club_id },
      include: {
        escalacoes: {
          include: { jogador: true },
        },
      },
    });

    if (!awayClub) {
      throw new NotFoundException('Clube visitante não encontrado');
    }

    // Valida escalação completa no mandante
    const homeStarters = homeClub.escalacoes
      .map((e) => e.jogador)
      .filter((j) => j.excluido_em === null && j.clube_id === homeClub.id);

    if (
      !homeClub.formacao ||
      homeStarters.length !== 5 ||
      homeStarters.some((j) => j.condicao === 'DOENTE')
    ) {
      throw new ConflictException('Clube mandante não possui escalação completa');
    }

    // Valida escalação completa no visitante
    const awayStarters = awayClub.escalacoes
      .map((e) => e.jogador)
      .filter((j) => j.excluido_em === null && j.clube_id === awayClub.id);

    if (
      !awayClub.formacao ||
      awayStarters.length !== 5 ||
      awayStarters.some((j) => j.condicao === 'DOENTE')
    ) {
      throw new ConflictException('Clube visitante não possui escalação completa');
    }

    const mapToMatchPlayer = (p: any): MatchPlayer => ({
      id: p.id,
      name: p.nome,
      position: p.posicao as Position,
      condition: p.condicao as Condition,
      pace: p.velocidade,
      shooting: p.finalizacao,
      passing: p.passe,
      dribbling: p.drible,
      defending: p.defesa,
      physical: p.fisico,
    });

    const simulation = this.calculator.simulateMatch(
      homeClub.id,
      homeStarters.map(mapToMatchPlayer),
      awayClub.id,
      awayStarters.map(mapToMatchPlayer),
    );

    const now = this.clock.now();

    // Persistência atômica da partida e dos 6 duelos (RN20, B2)
    const match = await this.prisma.$transaction(async (tx) => {
      const createdMatch = await tx.partidas.create({
        data: {
          mandante_id: homeClub.id,
          visitante_id: awayClub.id,
          gols_mandante: simulation.homeGoals,
          gols_visitante: simulation.awayGoals,
          formacao_mandante: homeClub.formacao!,
          formacao_visitante: awayClub.formacao!,
          jogada_em: now,
        },
      });

      for (const d of simulation.duels) {
        await tx.duelos_partida.create({
          data: {
            partida_id: createdMatch.id,
            ordem: d.order,
            clube_atacante_id: d.attacking_club_id,
            atacante_id: d.attacker.player_id,
            defensor_id: d.defender.player_id,
            nome_atacante: d.attacker.player_name,
            nome_defensor: d.defender.player_name,
            posicao_atacante: d.attacker.position,
            posicao_defensor: d.defender.position,
            condicao_atacante: d.attacker.condition,
            condicao_defensor: d.defender.condition,
            atributo_ataque: d.attacker.attribute,
            atributo_defesa: d.defender.attribute,
            valor_ataque: d.attacker.value,
            valor_defesa: d.defender.value,
            gol: d.goal,
          },
        });
      }

      return createdMatch;
    });

    return {
      id: match.id,
      played_at: formatIsoBrasilia(match.jogada_em),
      home: {
        club_id: homeClub.id,
        club_name: homeClub.nome,
        formation: match.formacao_mandante,
        goals: match.gols_mandante,
      },
      away: {
        club_id: awayClub.id,
        club_name: awayClub.nome,
        formation: match.formacao_visitante,
        goals: match.gols_visitante,
      },
      result: simulation.result,
      duels: simulation.duels,
    };
  }

  /**
   * Lista partidas disputadas (RN21).
   */
  async findAllMatches(query: QueryMatchesDto) {
    if (query.club_id !== undefined) {
      const club = await this.prisma.clubes.findUnique({
        where: { id: query.club_id },
      });
      if (!club) {
        throw new NotFoundException('Clube não encontrado');
      }
    }

    const whereClause: any = {};
    if (query.club_id !== undefined) {
      whereClause.OR = [{ mandante_id: query.club_id }, { visitante_id: query.club_id }];
    }

    const matches = await this.prisma.partidas.findMany({
      where: whereClause,
      include: {
        mandante: true,
        visitante: true,
      },
      orderBy: [{ jogada_em: 'desc' }, { id: 'desc' }],
    });

    return matches.map((m) => {
      const result =
        m.gols_mandante > m.gols_visitante
          ? 'MANDANTE'
          : m.gols_mandante < m.gols_visitante
            ? 'VISITANTE'
            : 'EMPATE';

      return {
        id: m.id,
        played_at: formatIsoBrasilia(m.jogada_em),
        home: {
          club_id: m.mandante_id,
          club_name: m.mandante.nome,
          formation: m.formacao_mandante,
          goals: m.gols_mandante,
        },
        away: {
          club_id: m.visitante_id,
          club_name: m.visitante.nome,
          formation: m.formacao_visitante,
          goals: m.gols_visitante,
        },
        result,
      };
    });
  }

  /**
   * Consulta uma partida com seus 6 duelos (RN21).
   */
  async findMatchById(id: number) {
    const match = await this.prisma.partidas.findUnique({
      where: { id },
      include: {
        mandante: true,
        visitante: true,
        duelos: {
          orderBy: { ordem: 'asc' },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Partida não encontrada');
    }

    const result =
      match.gols_mandante > match.gols_visitante
        ? 'MANDANTE'
        : match.gols_mandante < match.gols_visitante
          ? 'VISITANTE'
          : 'EMPATE';

    const duels = match.duelos.map((d) => ({
      order: d.ordem,
      attacking_club_id: d.clube_atacante_id,
      attacker: {
        player_id: d.atacante_id,
        player_name: d.nome_atacante,
        position: d.posicao_atacante,
        condition: d.condicao_atacante,
        attribute: d.atributo_ataque,
        value: d.valor_ataque,
      },
      defender: {
        player_id: d.defensor_id,
        player_name: d.nome_defensor,
        position: d.posicao_defensor,
        condition: d.condicao_defensor,
        attribute: d.atributo_defesa,
        value: d.valor_defesa,
      },
      goal: d.gol,
    }));

    return {
      id: match.id,
      played_at: formatIsoBrasilia(match.jogada_em),
      home: {
        club_id: match.mandante_id,
        club_name: match.mandante.nome,
        formation: match.formacao_mandante,
        goals: match.gols_mandante,
      },
      away: {
        club_id: match.visitante_id,
        club_name: match.visitante.nome,
        formation: match.formacao_visitante,
        goals: match.gols_visitante,
      },
      result,
      duels,
    };
  }
}
