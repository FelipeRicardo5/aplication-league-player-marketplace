export type Position = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';

export type Condition = 'APTO' | 'MAL_CONDICIONADO' | 'LESIONADO' | 'DOENTE';

export interface Player {
  id: number;
  name: string;
  position: Position;
  agility: number;
  age: number;
  condition: Condition;
  base_value: number;
  market_value: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
  overall: number;
  club_id: number | null;
}

export interface PlayersListMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface PlayersListResponse {
  data: Player[];
  meta: PlayersListMeta;
}

export interface QueryPlayersParams {
  search?: string;
  position?: Position | '';
  condition?: Condition | '';
  free?: boolean;
  club_id?: number;
  min_age?: number;
  max_age?: number;
  min_value?: number;
  max_value?: number;
  sort?: string;
  page?: number;
  limit?: number;
}
