import { calculateMarketValue, Condition } from '../domain/market-value';
import { calculateOverall, Position } from '../domain/overall';

export interface PlayerResponse {
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

export interface PlayerDbEntity {
  id: number;
  nome: string;
  posicao: string;
  agilidade: number;
  idade: number;
  condicao: string;
  valor_base: number | { toString(): string };
  velocidade: number;
  finalizacao: number;
  passe: number;
  drible: number;
  defesa: number;
  fisico: number;
  potencial: number;
  clube_id: number | null;
}

/**
 * Mapeia uma entidade de banco `jogadores` para a estrutura tipada de resposta `PlayerResponse`,
 * calculando de forma pura e consistente o `overall` e o `market_value` normativos.
 */
export function mapPlayerToResponse(player: PlayerDbEntity): PlayerResponse {
  const position = player.posicao as Position;
  const condition = player.condicao as Condition;
  const baseValue = Number(player.valor_base);

  const overall = calculateOverall(position, {
    pace: player.velocidade,
    shooting: player.finalizacao,
    passing: player.passe,
    dribbling: player.drible,
    defending: player.defesa,
    physical: player.fisico,
  });

  const marketValue = calculateMarketValue(baseValue, condition, player.agilidade, player.idade);

  return {
    id: player.id,
    name: player.nome,
    position,
    agility: player.agilidade,
    age: player.idade,
    condition,
    base_value: baseValue,
    market_value: marketValue,
    pace: player.velocidade,
    shooting: player.finalizacao,
    passing: player.passe,
    dribbling: player.drible,
    defending: player.defesa,
    physical: player.fisico,
    potential: player.potencial,
    overall,
    club_id: player.clube_id,
  };
}
