export interface MatchTeam {
  club_id: number;
  club_name: string;
  formation: string;
  goals: number;
}

export interface MatchDuelPlayer {
  player_id: number;
  player_name: string;
  position: string;
  condition: string;
  attribute: string;
  value: number;
}

export interface MatchDuel {
  order: number;
  attacking_club_id: number;
  attacker: MatchDuelPlayer;
  defender: MatchDuelPlayer;
  goal: boolean;
}

export interface Match {
  id: number;
  played_at: string;
  home: MatchTeam;
  away: MatchTeam;
  result: 'MANDANTE' | 'VISITANTE' | 'EMPATE';
  duels?: MatchDuel[];
}

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
