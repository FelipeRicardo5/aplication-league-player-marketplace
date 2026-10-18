import { apiGet, apiPost } from '@/lib/api';
import type { Match, StandingRow } from '../types';

export async function fetchMatches(clubId?: number): Promise<Match[]> {
  const params: Record<string, unknown> = {};
  if (clubId) params.club_id = clubId;
  return apiGet<Match[]>('matches', params);
}

export async function fetchMatchById(id: number): Promise<Match> {
  return apiGet<Match>(`matches/${id}`);
}

export async function createMatch(homeClubId: number, awayClubId: number): Promise<Match> {
  return apiPost<Match>('matches', {
    home_club_id: homeClubId,
    away_club_id: awayClubId,
  });
}

export async function fetchStandings(): Promise<StandingRow[]> {
  return apiGet<StandingRow[]>('standings');
}
