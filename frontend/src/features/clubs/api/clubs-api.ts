import { apiGet, apiPost, apiPut } from '@/lib/api';
import type {
  ClubDetail,
  ClubLineupResponse,
  ClubSummary,
  CreateClubInput,
  FormationType,
} from '../types';

export async function fetchClubs(sort = 'name'): Promise<ClubSummary[]> {
  return apiGet<ClubSummary[]>('clubs', { sort });
}

export async function fetchClubById(id: number): Promise<ClubDetail> {
  return apiGet<ClubDetail>(`clubs/${id}`);
}

export async function createClub(data: CreateClubInput): Promise<ClubSummary> {
  return apiPost<ClubSummary>('clubs', data);
}

export async function fetchClubLineup(clubId: number): Promise<ClubLineupResponse> {
  return apiGet<ClubLineupResponse>(`clubs/${clubId}/lineup`);
}

export async function saveClubLineup(
  clubId: number,
  formation: FormationType,
  player_ids: number[],
): Promise<ClubLineupResponse> {
  return apiPut<ClubLineupResponse>(`clubs/${clubId}/lineup`, {
    formation,
    player_ids,
  });
}
