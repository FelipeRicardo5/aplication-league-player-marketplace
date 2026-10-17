import { Injectable } from '@nestjs/common';
import { calculateBaseValue } from './base-value';
import {
  calculateLoyaltyPenalty,
  calculatePenaltyRate,
  calculatePurchaseFee,
  calculateRemainingDays,
  ContractStatus,
  getContractStatusAfterSale,
} from './contract';
import {
  applyConditionModifier,
  MatchPlayer,
  MatchSimulationResult,
  simulateMatch,
  sortSquadPlayers,
} from './duel';
import { Formation, validateLineupFormation } from './lineup';
import { calculateMarketValue, Condition } from './market-value';
import { fromCents, roundCurrency, toCents } from './money';
import { calculateOverall, PlayerAttributes, Position } from './overall';
import { calculateSaleCommission, calculateSaleFinancials } from './sale';

@Injectable()
export class DomainCalculatorService {
  roundCurrency(val: number): number {
    return roundCurrency(val);
  }

  toCents(val: number): number {
    return toCents(val);
  }

  fromCents(cents: number): number {
    return fromCents(cents);
  }

  calculateOverall(position: Position, attrs: PlayerAttributes): number {
    return calculateOverall(position, attrs);
  }

  calculateBaseValue(overall: number, potential: number, age: number): number {
    return calculateBaseValue(overall, potential, age);
  }

  calculateMarketValue(
    baseValue: number,
    condition: Condition,
    agility: number,
    age: number,
  ): number {
    return calculateMarketValue(baseValue, condition, agility, age);
  }

  calculatePurchaseFee(marketValue: number): number {
    return calculatePurchaseFee(marketValue);
  }

  calculateRemainingDays(loyaltyUntil: Date, now: Date): number {
    return calculateRemainingDays(loyaltyUntil, now);
  }

  calculatePenaltyRate(remainingDays: number): number {
    return calculatePenaltyRate(remainingDays);
  }

  calculateLoyaltyPenalty(marketValue: number, penaltyRate: number): number {
    return calculateLoyaltyPenalty(marketValue, penaltyRate);
  }

  getContractStatusAfterSale(penalty: number): ContractStatus {
    return getContractStatusAfterSale(penalty);
  }

  calculateSaleCommission(profit: number): number {
    return calculateSaleCommission(profit);
  }

  calculateSaleFinancials(
    saleValue: number,
    purchaseValue: number,
    penalty: number,
  ): { profit: number; fee: number; cashChange: number } {
    return calculateSaleFinancials(saleValue, purchaseValue, penalty);
  }

  validateLineupFormation(formation: Formation, positions: Position[]): boolean {
    return validateLineupFormation(formation, positions);
  }

  applyConditionModifier(attrValue: number, condition: Condition): number {
    return applyConditionModifier(attrValue, condition);
  }

  sortSquadPlayers<T extends { id: number; name: string; position: Position }>(players: T[]): T[] {
    return sortSquadPlayers(players);
  }

  simulateMatch(
    homeClubId: number,
    homeStarters: MatchPlayer[],
    awayClubId: number,
    awayStarters: MatchPlayer[],
  ): MatchSimulationResult {
    return simulateMatch(homeClubId, homeStarters, awayClubId, awayStarters);
  }
}
