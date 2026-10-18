import type { Position } from '@/features/players/types';

export interface PlayerAttributesInput {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

const POSITION_WEIGHTS: Record<Position, PlayerAttributesInput> = {
  GOL: { pace: 10, shooting: 0, passing: 20, dribbling: 0, defending: 40, physical: 30 },
  ZAG: { pace: 10, shooting: 0, passing: 15, dribbling: 0, defending: 45, physical: 30 },
  LAT: { pace: 25, shooting: 0, passing: 20, dribbling: 15, defending: 25, physical: 15 },
  MEI: { pace: 10, shooting: 15, passing: 35, dribbling: 25, defending: 5, physical: 10 },
  ATA: { pace: 20, shooting: 40, passing: 10, dribbling: 20, defending: 0, physical: 10 },
};

/**
 * Prévia do cálculo de Overall no cliente (RN06) para feedback em tempo real no modal.
 */
export function calculatePreviewOverall(position: Position, attrs: PlayerAttributesInput): number {
  const weights = POSITION_WEIGHTS[position] || POSITION_WEIGHTS.MEI;
  const sumProducts =
    (attrs.pace || 0) * weights.pace +
    (attrs.shooting || 0) * weights.shooting +
    (attrs.passing || 0) * weights.passing +
    (attrs.dribbling || 0) * weights.dribbling +
    (attrs.defending || 0) * weights.defending +
    (attrs.physical || 0) * weights.physical;

  const score = sumProducts / 100;
  return Math.floor(score + 0.5);
}

/**
 * Prévia do cálculo de Valor Base no cliente (RN06) para feedback em tempo real no modal.
 */
export function calculatePreviewBaseValue(overall: number, potential: number, age: number): number {
  let overallPart = 0;

  if (overall > 40) {
    const tier1Points = Math.min(overall, 60) - 40;
    overallPart += tier1Points * 0.5;
  }

  if (overall > 60) {
    const tier2Points = Math.min(overall, 75) - 60;
    overallPart += tier2Points * 2.0;
  }

  if (overall > 75) {
    const tier3Points = Math.min(overall, 99) - 75;
    overallPart += tier3Points * 6.0;
  }

  let baseValue = overallPart;

  if (age <= 21) {
    const multiplier = (100 + potential - overall) / 100;
    baseValue = baseValue * multiplier;
  }

  const sign = baseValue >= 0 ? 1 : -1;
  const rounded = (sign * Math.round(Math.abs(baseValue) * 100)) / 100;
  return Math.max(1.0, rounded);
}
