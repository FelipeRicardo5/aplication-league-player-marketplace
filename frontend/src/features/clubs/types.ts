import type { Player } from '@/features/players/types';

export interface ClubSummary {
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

export interface ClubPlayer extends Player {
  contract?: ClubPlayerContract;
}

export interface ClubDetail extends ClubSummary {
  players: ClubPlayer[];
}

export interface CreateClubInput {
  name: string;
  acronym: string;
}

export type FormationType = '3-1' | '2-2' | '2-1-1' | '1-2-1';

export interface ClubLineupResponse {
  club_id: number;
  formation: FormationType | null;
  complete: boolean;
  players: Player[];
}
