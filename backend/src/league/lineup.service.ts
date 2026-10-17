import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DomainCalculatorService } from '../domain/domain-calculator.service';
import { SetLineupDto } from './dto/set-lineup.dto';
import { Position } from '../domain/overall';
import { Formation } from '../domain/lineup';
import { Condition } from '../domain/market-value';

@Injectable()
export class LineupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: DomainCalculatorService,
  ) {}

  /**
   * Define a escalação de um clube com 5 titulares e formação (RN19).
   */
  async setLineup(clubId: number, dto: SetLineupDto) {
    const club = await this.prisma.clubes.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundException('Clube não encontrado');
    }

    const players = await this.prisma.jogadores.findMany({
      where: {
        id: { in: dto.player_ids },
        excluido_em: null,
      },
    });

    if (players.length !== 5) {
      throw new NotFoundException('Um ou mais jogadores não foram encontrados');
    }

    // Valida que todos pertencem ao clube
    for (const player of players) {
      if (player.clube_id !== club.id) {
        throw new ConflictException('Jogador não pertence ao elenco deste clube');
      }
      if (player.condicao === 'DOENTE') {
        throw new ConflictException('Jogador DOENTE não pode ser escalado');
      }
    }

    // Valida compatibilidade da formação com as posições dos jogadores
    const positions = players.map((p) => p.posicao as Position);
    const isValidFormation = this.calculator.validateLineupFormation(
      dto.formation as Formation,
      positions,
    );

    if (!isValidFormation) {
      throw new ConflictException(
        'As posições dos jogadores escalados não atendem à formação informada',
      );
    }

    // Ordenação tática do elenco (RN11: GOL, ZAG, LAT, MEI, ATA -> nome -> id)
    const sorted = this.calculator.sortSquadPlayers(
      players.map((p) => ({
        id: p.id,
        name: p.nome,
        position: p.posicao as Position,
        raw: p,
      })),
    );

    // Gravação atômica: substituição completa da escalação (RN19)
    await this.prisma.$transaction(async (tx) => {
      await tx.escalacoes.deleteMany({
        where: { clube_id: club.id },
      });

      await tx.clubes.update({
        where: { id: club.id },
        data: { formacao: dto.formation },
      });

      for (const item of sorted) {
        await tx.escalacoes.create({
          data: {
            clube_id: club.id,
            jogador_id: item.id,
          },
        });
      }
    });

    const formattedPlayers = sorted.map((item) => {
      const p = item.raw;
      const overall = this.calculator.calculateOverall(p.posicao as Position, {
        pace: p.velocidade,
        shooting: p.finalizacao,
        passing: p.passe,
        dribbling: p.drible,
        defending: p.defesa,
        physical: p.fisico,
      });

      const marketValue = this.calculator.calculateMarketValue(
        Number(p.valor_base),
        p.condicao as Condition,
        p.agilidade,
        p.idade,
      );

      return {
        id: p.id,
        name: p.nome,
        position: p.posicao,
        agility: p.agilidade,
        age: p.idade,
        condition: p.condicao,
        base_value: Number(p.valor_base),
        market_value: marketValue,
        pace: p.velocidade,
        shooting: p.finalizacao,
        passing: p.passe,
        dribbling: p.drible,
        defending: p.defesa,
        physical: p.fisico,
        potential: p.potencial,
        overall,
        club_id: p.clube_id,
      };
    });

    return {
      club_id: club.id,
      formation: dto.formation,
      complete: true,
      players: formattedPlayers,
    };
  }

  /**
   * Consulta a escalação atual do clube (RN19).
   */
  async getLineup(clubId: number) {
    const club = await this.prisma.clubes.findUnique({
      where: { id: clubId },
      include: {
        escalacoes: {
          include: {
            jogador: true,
          },
        },
      },
    });

    if (!club) {
      throw new NotFoundException('Clube não encontrado');
    }

    if (!club.formacao) {
      return {
        club_id: club.id,
        formation: null,
        complete: false,
        players: [],
      };
    }

    // Filtra jogadores não excluídos que ainda pertencem ao clube e não estão doentes
    const activeStarters = club.escalacoes
      .map((e) => e.jogador)
      .filter((j) => j.excluido_em === null && j.clube_id === club.id);

    const sorted = this.calculator.sortSquadPlayers(
      activeStarters.map((p) => ({
        id: p.id,
        name: p.nome,
        position: p.posicao as Position,
        raw: p,
      })),
    );

    const isComplete = sorted.length === 5;

    const formattedPlayers = sorted.map((item) => {
      const p = item.raw;
      const overall = this.calculator.calculateOverall(p.posicao as Position, {
        pace: p.velocidade,
        shooting: p.finalizacao,
        passing: p.passe,
        dribbling: p.drible,
        defending: p.defesa,
        physical: p.fisico,
      });

      const marketValue = this.calculator.calculateMarketValue(
        Number(p.valor_base),
        p.condicao as Condition,
        p.agilidade,
        p.idade,
      );

      return {
        id: p.id,
        name: p.nome,
        position: p.posicao,
        agility: p.agilidade,
        age: p.idade,
        condition: p.condicao,
        base_value: Number(p.valor_base),
        market_value: marketValue,
        pace: p.velocidade,
        shooting: p.finalizacao,
        passing: p.passe,
        dribbling: p.drible,
        defending: p.defesa,
        physical: p.fisico,
        potential: p.potencial,
        overall,
        club_id: p.clube_id,
      };
    });

    return {
      club_id: club.id,
      formation: club.formacao,
      complete: isComplete,
      players: formattedPlayers,
    };
  }
}
