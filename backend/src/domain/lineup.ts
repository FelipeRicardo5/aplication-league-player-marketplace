import { Position } from './overall';

export type Formation = '3-1' | '2-2' | '2-1-1' | '1-2-1';

export const ALLOWED_FORMATIONS: Formation[] = ['3-1', '2-2', '2-1-1', '1-2-1'];

export interface FormationRequirement {
  defense: number; // ZAG ou LAT
  midfield: number; // MEI
  attack: number; // ATA
}

export const FORMATION_REQUIREMENTS: Record<Formation, FormationRequirement> = {
  '3-1': { defense: 3, midfield: 0, attack: 1 },
  '2-2': { defense: 2, midfield: 0, attack: 2 },
  '2-1-1': { defense: 2, midfield: 1, attack: 1 },
  '1-2-1': { defense: 1, midfield: 2, attack: 1 },
};

/**
 * Valida se uma lista de posições dos 5 titulares corresponde à formação exigida (RN19):
 * - Exatamente 1 GOL
 * - As quantidades de jogadores de linha por setor fecham a formação
 */
export function validateLineupFormation(formation: Formation, positions: Position[]): boolean {
  if (positions.length !== 5) {
    return false;
  }

  const goalkeepers = positions.filter((p) => p === 'GOL').length;
  if (goalkeepers !== 1) {
    return false;
  }

  const defense = positions.filter((p) => p === 'ZAG' || p === 'LAT').length;
  const midfield = positions.filter((p) => p === 'MEI').length;
  const attack = positions.filter((p) => p === 'ATA').length;

  const req = FORMATION_REQUIREMENTS[formation];
  return defense === req.defense && midfield === req.midfield && attack === req.attack;
}
