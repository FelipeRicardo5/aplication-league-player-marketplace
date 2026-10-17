import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { compareUnicodeNames } from '../shared/text';

export interface StandingRow {
  position: number;
  club_id: number;
  club_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

@Injectable()
export class StandingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcula a classificação dinâmica da liga com todos os clubes (RN21).
   */
  async getStandings(): Promise<StandingRow[]> {
    const clubs = await this.prisma.clubes.findMany();
    const matches = await this.prisma.partidas.findMany();

    const statsMap = new Map<
      number,
      {
        club_id: number;
        club_name: string;
        played: number;
        wins: number;
        draws: number;
        losses: number;
        goals_for: number;
        goals_against: number;
        points: number;
      }
    >();

    for (const club of clubs) {
      statsMap.set(club.id, {
        club_id: club.id,
        club_name: club.nome,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        points: 0,
      });
    }

    for (const match of matches) {
      const home = statsMap.get(match.mandante_id);
      const away = statsMap.get(match.visitante_id);

      if (home) {
        home.played += 1;
        home.goals_for += match.gols_mandante;
        home.goals_against += match.gols_visitante;

        if (match.gols_mandante > match.gols_visitante) {
          home.wins += 1;
          home.points += 3;
        } else if (match.gols_mandante === match.gols_visitante) {
          home.draws += 1;
          home.points += 1;
        } else {
          home.losses += 1;
        }
      }

      if (away) {
        away.played += 1;
        away.goals_for += match.gols_visitante;
        away.goals_against += match.gols_mandante;

        if (match.gols_visitante > match.gols_mandante) {
          away.wins += 1;
          away.points += 3;
        } else if (match.gols_visitante === match.gols_mandante) {
          away.draws += 1;
          away.points += 1;
        } else {
          away.losses += 1;
        }
      }
    }

    const standings = Array.from(statsMap.values()).map((row) => ({
      ...row,
      goal_difference: row.goals_for - row.goals_against,
    }));

    // RN21 item 4: desempate
    // 1. Mais pontos
    // 2. Maior saldo de gols
    // 3. Mais gols marcados
    // 4. Nome alfabético Unicode
    // 5. ID crescente
    standings.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      if (b.goal_difference !== a.goal_difference) {
        return b.goal_difference - a.goal_difference;
      }
      if (b.goals_for !== a.goals_for) {
        return b.goals_for - a.goals_for;
      }
      const nameComp = compareUnicodeNames(a.club_name, b.club_name);
      if (nameComp !== 0) {
        return nameComp;
      }
      return a.club_id - b.club_id;
    });

    return standings.map((row, index) => ({
      position: index + 1,
      club_id: row.club_id,
      club_name: row.club_name,
      played: row.played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      goals_for: row.goals_for,
      goals_against: row.goals_against,
      goal_difference: row.goal_difference,
      points: row.points,
    }));
  }
}
