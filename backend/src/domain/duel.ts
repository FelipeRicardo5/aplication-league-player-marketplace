import { compareUnicodeNames } from '../shared/text';
import { Condition } from './market-value';
import { Position } from './overall';

export interface MatchPlayer {
  id: number;
  name: string;
  position: Position;
  condition: Condition;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface DuelParticipant {
  player_id: number;
  player_name: string;
  position: Position;
  condition: Condition;
  attribute: 'shooting' | 'passing' | 'dribbling' | 'defending';
  value: number;
}

export interface MatchDuel {
  order: number;
  attacking_club_id: number;
  attacker: DuelParticipant;
  defender: DuelParticipant;
  goal: boolean;
}

export interface MatchSimulationResult {
  homeGoals: number;
  awayGoals: number;
  result: 'MANDANTE' | 'VISITANTE' | 'EMPATE';
  duels: MatchDuel[];
}

const POSITION_ORDER: Record<Position, number> = {
  GOL: 0,
  ZAG: 1,
  LAT: 2,
  MEI: 3,
  ATA: 4,
};

/**
 * Ordena os jogadores conforme a regra RN11 / RN20:
 * - Posição na ordem tática: GOL, ZAG, LAT, MEI, ATA
 * - Desempate por nome alfabético Unicode
 * - Desempate por id crescente
 */
export function sortSquadPlayers<T extends { id: number; name: string; position: Position }>(
  players: T[],
): T[] {
  return [...players].sort((a, b) => {
    const posA = POSITION_ORDER[a.position];
    const posB = POSITION_ORDER[b.position];
    if (posA !== posB) {
      return posA - posB;
    }

    const nameComp = compareUnicodeNames(a.name, b.name);
    if (nameComp !== 0) {
      return nameComp;
    }

    return a.id - b.id;
  });
}

/**
 * Aplica modificador de condição física em um atributo na partida (RN20):
 * - APTO: valor original
 * - MAL_CONDICIONADO: 15% a menos, arredondado para inteiro mais próximo (meio para cima)
 *   Exemplos: 74 * 0.85 = 62.9 -> 63; 50 * 0.85 = 42.5 -> 43; 66 * 0.85 = 56.1 -> 56.
 */
export function applyConditionModifier(attrValue: number, condition: Condition): number {
  if (condition === 'MAL_CONDICIONADO') {
    return Math.floor((attrValue * 85 + 50) / 100);
  }
  return attrValue;
}

/**
 * Obtém o atributo e valor ofensivo do atacante conforme a posição (RN20):
 * - ATA -> shooting (finalização)
 * - MEI -> passing (passe)
 * - ZAG/LAT -> dribbling (drible)
 */
export function getAttackerAttribute(player: MatchPlayer): {
  attribute: 'shooting' | 'passing' | 'dribbling';
  value: number;
} {
  let rawValue: number;
  let attr: 'shooting' | 'passing' | 'dribbling';

  if (player.position === 'ATA') {
    attr = 'shooting';
    rawValue = player.shooting;
  } else if (player.position === 'MEI') {
    attr = 'passing';
    rawValue = player.passing;
  } else {
    attr = 'dribbling';
    rawValue = player.dribbling;
  }

  const value = applyConditionModifier(rawValue, player.condition);
  return { attribute: attr, value };
}

/**
 * Obtém o atributo e valor defensivo do defensor (RN20):
 * - Sempre defending (defesa)
 */
export function getDefenderAttribute(player: MatchPlayer): {
  attribute: 'defending';
  value: number;
} {
  const value = applyConditionModifier(player.defending, player.condition);
  return { attribute: 'defending', value };
}

/**
 * Simula os 6 duelos de uma partida entre mandante e visitante (RN20):
 * - 5 titulares de cada lado já validados
 * - Duelos 1 a 3: Mandante ataca, Visitante defende
 * - Duelos 4 a 6: Visitante ataca, Mandante defende
 * - Gol somente quando valor_ataque > valor_defesa (empate não é gol)
 */
export function simulateMatch(
  homeClubId: number,
  homeStarters: MatchPlayer[],
  awayClubId: number,
  awayStarters: MatchPlayer[],
): MatchSimulationResult {
  const sortedHome = sortSquadPlayers(homeStarters);
  const sortedAway = sortSquadPlayers(awayStarters);

  // Goleiro e jogadores de linha (1º ao 4º)
  const homeGk = sortedHome[0];
  const homeOutfield = sortedHome.slice(1); // 1º ao 4º

  const awayGk = sortedAway[0];
  const awayOutfield = sortedAway.slice(1); // 1º ao 4º

  const duels: MatchDuel[] = [];

  const createDuel = (
    order: number,
    attackingClubId: number,
    attackerPlayer: MatchPlayer,
    defenderPlayer: MatchPlayer,
  ): MatchDuel => {
    const atk = getAttackerAttribute(attackerPlayer);
    const def = getDefenderAttribute(defenderPlayer);
    const isGoal = atk.value > def.value;

    return {
      order,
      attacking_club_id: attackingClubId,
      attacker: {
        player_id: attackerPlayer.id,
        player_name: attackerPlayer.name,
        position: attackerPlayer.position,
        condition: attackerPlayer.condition,
        attribute: atk.attribute,
        value: atk.value,
      },
      defender: {
        player_id: defenderPlayer.id,
        player_name: defenderPlayer.name,
        position: defenderPlayer.position,
        condition: defenderPlayer.condition,
        attribute: def.attribute,
        value: def.value,
      },
      goal: isGoal,
    };
  };

  // Duelos 1 a 3: Ataques do mandante
  // Duelo 1: 4º de linha mandante vs Goleiro visitante
  duels.push(createDuel(1, homeClubId, homeOutfield[3], awayGk));
  // Duelo 2: 3º de linha mandante vs 1º de linha visitante
  duels.push(createDuel(2, homeClubId, homeOutfield[2], awayOutfield[0]));
  // Duelo 3: 2º de linha mandante vs 2º de linha visitante
  duels.push(createDuel(3, homeClubId, homeOutfield[1], awayOutfield[1]));

  // Duelos 4 a 6: Ataques do visitante
  // Duelo 4: 4º de linha visitante vs Goleiro mandante
  duels.push(createDuel(4, awayClubId, awayOutfield[3], homeGk));
  // Duelo 5: 3º de linha visitante vs 1º de linha mandante
  duels.push(createDuel(5, awayClubId, awayOutfield[2], homeOutfield[0]));
  // Duelo 6: 2º de linha visitante vs 2º de linha mandante
  duels.push(createDuel(6, awayClubId, awayOutfield[1], homeOutfield[1]));

  let homeGoals = 0;
  let awayGoals = 0;

  for (let i = 0; i < 3; i++) {
    if (duels[i].goal) homeGoals++;
  }
  for (let i = 3; i < 6; i++) {
    if (duels[i].goal) awayGoals++;
  }

  let result: 'MANDANTE' | 'VISITANTE' | 'EMPATE' = 'EMPATE';
  if (homeGoals > awayGoals) {
    result = 'MANDANTE';
  } else if (awayGoals > homeGoals) {
    result = 'VISITANTE';
  }

  return {
    homeGoals,
    awayGoals,
    result,
    duels,
  };
}
