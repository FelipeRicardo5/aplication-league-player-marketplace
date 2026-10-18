import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/lib/api';
import type { Player, PlayersListResponse, QueryPlayersParams } from '../types';
import type {
  CreatePlayerFormInput,
  UpdateConditionFormInput,
  UpdatePlayerFormInput,
} from '../schemas/player.schema';

export async function fetchPlayers(params: QueryPlayersParams): Promise<PlayersListResponse> {
  const cleanParams: Record<string, unknown> = {};

  if (params.search && params.search.trim().length >= 2) {
    cleanParams.search = params.search.trim();
  }
  if (params.position) {
    cleanParams.position = params.position;
  }
  if (params.condition) {
    cleanParams.condition = params.condition;
  }
  if (params.free !== undefined) {
    cleanParams.free = params.free;
  }
  if (params.club_id) {
    cleanParams.club_id = params.club_id;
  }
  if (params.sort) {
    cleanParams.sort = params.sort;
  }
  if (params.page) {
    cleanParams.page = params.page;
  }
  if (params.limit) {
    cleanParams.limit = params.limit;
  }

  return apiGet<PlayersListResponse>('players', cleanParams);
}

export async function fetchPlayerById(id: number): Promise<Player> {
  return apiGet<Player>(`players/${id}`);
}

export async function createPlayer(data: CreatePlayerFormInput): Promise<Player> {
  return apiPost<Player>('players', data);
}

export async function updatePlayer(id: number, data: UpdatePlayerFormInput): Promise<Player> {
  return apiPut<Player>(`players/${id}`, data);
}

export async function updatePlayerCondition(
  id: number,
  data: UpdateConditionFormInput,
): Promise<Player> {
  return apiPatch<Player>(`players/${id}/condition`, data);
}

export async function deletePlayer(id: number): Promise<void> {
  return apiDelete(`players/${id}`);
}
