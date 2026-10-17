import { calculateBaseValue } from './base-value';
import {
  calculateLoyaltyPenalty,
  calculatePenaltyRate,
  calculatePurchaseFee,
  calculateRemainingDays,
  getContractStatusAfterSale,
} from './contract';
import { applyConditionModifier, MatchPlayer, simulateMatch, sortSquadPlayers } from './duel';
import { validateLineupFormation } from './lineup';
import { calculateMarketValue } from './market-value';
import { formatCurrencyCsv, fromCents, roundCurrency, toCents } from './money';
import { calculateOverall } from './overall';
import { calculateSaleCommission, calculateSaleFinancials } from './sale';

describe('Domain Calculator Engine (RN02 to RN20 Normative Tests)', () => {
  describe('Money & Rounding', () => {
    it('should round half-away-from-zero', () => {
      expect(roundCurrency(14.775)).toBe(14.78);
      expect(roundCurrency(0.385)).toBe(0.39);
      expect(roundCurrency(3.625)).toBe(3.63);
      expect(roundCurrency(8.7875)).toBe(8.79);
      expect(roundCurrency(1.5005)).toBe(1.5);
      expect(roundCurrency(-14.775)).toBe(-14.78);
    });

    it('should convert to and from cents safely', () => {
      expect(toCents(14.78)).toBe(1478);
      expect(fromCents(1478)).toBe(14.78);
      expect(toCents(0.39)).toBe(39);
      expect(fromCents(39)).toBe(0.39);
    });

    it('should format currency with comma for CSV', () => {
      expect(formatCurrencyCsv(40)).toBe('40,00');
      expect(formatCurrencyCsv(0.3)).toBe('0,30');
      expect(formatCurrencyCsv(-38.85)).toBe('-38.85'.replace('.', ','));
    });
  });

  describe('Overall Calculation (RN06)', () => {
    it('should calculate MEI overall (72.65 -> 73)', () => {
      const overall = calculateOverall('MEI', {
        pace: 68,
        shooting: 65,
        passing: 80,
        dribbling: 78,
        defending: 52,
        physical: 60,
      });
      expect(overall).toBe(73);
    });

    it('should calculate ATA overall (76.10 -> 76)', () => {
      const overall = calculateOverall('ATA', {
        pace: 78,
        shooting: 75,
        passing: 73,
        dribbling: 82,
        defending: 48,
        physical: 68,
      });
      expect(overall).toBe(76);
    });

    it('should calculate LAT overall (72.40 -> 72)', () => {
      const overall = calculateOverall('LAT', {
        pace: 72,
        shooting: 70,
        passing: 78,
        dribbling: 76,
        defending: 70,
        physical: 66,
      });
      expect(overall).toBe(72);
    });

    it('should calculate ZAG overall with half-up rounding (72.50 -> 73)', () => {
      const overall = calculateOverall('ZAG', {
        pace: 50,
        shooting: 90,
        passing: 60,
        dribbling: 40,
        defending: 80,
        physical: 75,
      });
      expect(overall).toBe(73);
    });

    it('should calculate GOL overall (67.70 -> 68)', () => {
      const overall = calculateOverall('GOL', {
        pace: 55,
        shooting: 30,
        passing: 65,
        dribbling: 40,
        defending: 72,
        physical: 68,
      });
      expect(overall).toBe(68);
    });
  });

  describe('Base Value Calculation (RN06)', () => {
    it('should compute progressive overall tiers and young promise correctly', () => {
      // 75, pot 86, age 25 -> 40.00
      expect(calculateBaseValue(75, 86, 25)).toBe(40.0);
      // 60, pot 70, age 30 -> 10.00
      expect(calculateBaseValue(60, 70, 30)).toBe(10.0);
      // 61, pot 70, age 30 -> 12.00
      expect(calculateBaseValue(61, 70, 30)).toBe(12.0);
      // 76, pot 80, age 22 -> 46.00
      expect(calculateBaseValue(76, 80, 22)).toBe(46.0);
      // 85, pot 92, age 27 -> 100.00
      expect(calculateBaseValue(85, 92, 27)).toBe(100.0);
      // 70, pot 84, age 21 -> 34.20
      expect(calculateBaseValue(70, 84, 21)).toBe(34.2);
      // 70, pot 84, age 22 -> 30.00
      expect(calculateBaseValue(70, 84, 22)).toBe(30.0);
      // 45, pot 90, age 18 -> 3.63
      expect(calculateBaseValue(45, 90, 18)).toBe(3.63);
      // 40, pot 66, age 36 -> 1.00 (floor)
      expect(calculateBaseValue(40, 66, 36)).toBe(1.0);
    });
  });

  describe('Market Value Calculation (RN02 to RN05)', () => {
    it('should compute all normative examples from README table', () => {
      expect(calculateMarketValue(82.0, 'APTO', 20, 25)).toBe(82.0);
      expect(calculateMarketValue(82.0, 'APTO', 50, 19)).toBe(90.2);
      expect(calculateMarketValue(82.0, 'MAL_CONDICIONADO', 50, 25)).toBe(69.7);
      expect(calculateMarketValue(82.0, 'MAL_CONDICIONADO', 80, 21)).toBe(84.05);
      expect(calculateMarketValue(82.0, 'MAL_CONDICIONADO', 30, 33)).toBe(53.3);
      expect(calculateMarketValue(82.0, 'DOENTE', 90, 25)).toBe(69.7);
      expect(calculateMarketValue(82.0, 'DOENTE', 30, 25)).toBe(49.2);
      expect(calculateMarketValue(82.0, 'DOENTE', 10, 40)).toBe(49.2); // -50% capped at -40%
      expect(calculateMarketValue(9.5, 'MAL_CONDICIONADO', 85, 25)).toBe(8.79);
      expect(calculateMarketValue(1.0, 'MAL_CONDICIONADO', 50, 35)).toBe(1.0); // floor
    });
  });

  describe('Purchase Fee & Cash Limit (RN13)', () => {
    it('should compute 5% fee only when market value is strictly greater than 30.00', () => {
      expect(calculatePurchaseFee(28.0)).toBe(0.0);
      expect(calculatePurchaseFee(30.0)).toBe(0.0);
      expect(calculatePurchaseFee(30.01)).toBe(1.5);
      expect(calculatePurchaseFee(47.62)).toBe(2.38);
      expect(calculatePurchaseFee(48.0)).toBe(2.4);
    });
  });

  describe('Contract Loyalty Penalty & Remaining Days (RN15)', () => {
    it('should calculate remaining days with Math.ceil', () => {
      const now = new Date('2026-11-05T16:40:00-03:00');
      // 116 dias, 17 horas e 35 minutos -> 117
      const loyalty = new Date(now.getTime() + (116 * 86400000 + 17 * 3600000 + 35 * 60000));
      expect(calculateRemainingDays(loyalty, now)).toBe(117);

      // Exatamente 30 dias -> 30
      const exact30 = new Date(now.getTime() + 30 * 86400000);
      expect(calculateRemainingDays(exact30, now)).toBe(30);

      // 30 dias e 1 minuto -> 31
      const plus1Min = new Date(now.getTime() + (30 * 86400000 + 60000));
      expect(calculateRemainingDays(plus1Min, now)).toBe(31);

      // Já passou -> 0
      const past = new Date(now.getTime() - 1000);
      expect(calculateRemainingDays(past, now)).toBe(0);
    });

    it('should determine penalty rates by remaining days tiers', () => {
      expect(calculatePenaltyRate(0)).toBe(0);
      expect(calculatePenaltyRate(11)).toBe(5);
      expect(calculatePenaltyRate(30)).toBe(5);
      expect(calculatePenaltyRate(31)).toBe(10);
      expect(calculatePenaltyRate(180)).toBe(10);
      expect(calculatePenaltyRate(181)).toBe(20);
      expect(calculatePenaltyRate(200)).toBe(20);
    });

    it('should calculate penalty with 10.00 cap and determine contract status', () => {
      expect(calculateLoyaltyPenalty(40.0, 10)).toBe(4.0);
      expect(calculateLoyaltyPenalty(42.5, 20)).toBe(8.5);
      expect(calculateLoyaltyPenalty(30.0, 5)).toBe(1.5);
      expect(calculateLoyaltyPenalty(25.0, 0)).toBe(0.0);
      // 75.00 * 20% = 15.00 -> capped at 10.00
      expect(calculateLoyaltyPenalty(75.0, 20)).toBe(10.0);

      expect(getContractStatusAfterSale(4.0)).toBe('RESCINDIDO');
      expect(getContractStatusAfterSale(0.0)).toBe('ENCERRADO');
    });
  });

  describe('Sale Commission & Financials (RN16)', () => {
    it('should compute progressive commission on profit', () => {
      expect(calculateSaleCommission(3.0)).toBe(0.3);
      expect(calculateSaleCommission(3.85)).toBe(0.39);
      expect(calculateSaleCommission(10.0)).toBe(1.0);
      expect(calculateSaleCommission(10.01)).toBe(1.0);
      expect(calculateSaleCommission(15.0)).toBe(2.0);
      expect(calculateSaleCommission(-7.5)).toBe(0.0);
      expect(calculateSaleCommission(0.0)).toBe(0.0);
    });

    it('should compute complete sale financials matching README benchmark', () => {
      // 37.00 buy, 40.00 sell, penalty 4.00
      const s1 = calculateSaleFinancials(40.0, 37.0, 4.0);
      expect(s1.profit).toBe(3.0);
      expect(s1.fee).toBe(0.3);
      expect(s1.cashChange).toBe(35.7);

      // 50.00 buy, 42.50 sell, penalty 8.50
      const s2 = calculateSaleFinancials(42.5, 50.0, 8.5);
      expect(s2.profit).toBe(-7.5);
      expect(s2.fee).toBe(0.0);
      expect(s2.cashChange).toBe(34.0);

      // 26.15 buy, 30.00 sell, penalty 1.50
      const s3 = calculateSaleFinancials(30.0, 26.15, 1.5);
      expect(s3.profit).toBe(3.85);
      expect(s3.fee).toBe(0.39);
      expect(s3.cashChange).toBe(28.11);

      // 25.00 buy, 25.00 sell, penalty 0.00
      const s4 = calculateSaleFinancials(25.0, 25.0, 0.0);
      expect(s4.profit).toBe(0.0);
      expect(s4.fee).toBe(0.0);
      expect(s4.cashChange).toBe(25.0);

      // 60.00 buy, 75.00 sell, penalty 10.00
      const s5 = calculateSaleFinancials(75.0, 60.0, 10.0);
      expect(s5.profit).toBe(15.0);
      expect(s5.fee).toBe(2.0);
      expect(s5.cashChange).toBe(63.0);
    });
  });

  describe('Lineup Formation Validation (RN19)', () => {
    it('should validate 3-1, 2-2, 2-1-1 and 1-2-1 formations', () => {
      expect(validateLineupFormation('3-1', ['GOL', 'ZAG', 'LAT', 'LAT', 'ATA'])).toBe(true);
      expect(validateLineupFormation('2-2', ['GOL', 'ZAG', 'LAT', 'ATA', 'ATA'])).toBe(true);
      expect(validateLineupFormation('2-1-1', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'])).toBe(true);
      expect(validateLineupFormation('1-2-1', ['GOL', 'ZAG', 'MEI', 'MEI', 'ATA'])).toBe(true);
    });

    it('should reject formations with incorrect player positions or counts', () => {
      // Sem goleiro
      expect(validateLineupFormation('2-1-1', ['ZAG', 'ZAG', 'LAT', 'MEI', 'ATA'])).toBe(false);
      // Dois goleiros
      expect(validateLineupFormation('2-1-1', ['GOL', 'GOL', 'LAT', 'MEI', 'ATA'])).toBe(false);
      // Distribuição divergente da formação (3 defensores no 2-1-1)
      expect(validateLineupFormation('2-1-1', ['GOL', 'ZAG', 'ZAG', 'LAT', 'ATA'])).toBe(false);
      // Menos de 5 jogadores
      expect(validateLineupFormation('2-1-1', ['GOL', 'ZAG', 'LAT', 'MEI'])).toBe(false);
    });
  });

  describe('Match Simulation & Tactical Duels (RN20)', () => {
    it('should simulate the exact Águias FC vs Delta FC match from RN20', () => {
      const homeStarters: MatchPlayer[] = [
        {
          id: 30,
          name: 'Rui Prado',
          position: 'GOL',
          condition: 'APTO',
          pace: 60,
          shooting: 20,
          passing: 60,
          dribbling: 40,
          defending: 77,
          physical: 70,
        },
        {
          id: 32,
          name: 'Téo Brandão',
          position: 'ZAG',
          condition: 'APTO',
          pace: 65,
          shooting: 30,
          passing: 55,
          dribbling: 50,
          defending: 84,
          physical: 75,
        },
        {
          id: 31,
          name: 'Davi Lins',
          position: 'LAT',
          condition: 'MAL_CONDICIONADO',
          pace: 75,
          shooting: 40,
          passing: 65,
          dribbling: 74,
          defending: 66,
          physical: 65,
        },
        {
          id: 33,
          name: 'Lauro Neves',
          position: 'MEI',
          condition: 'APTO',
          pace: 70,
          shooting: 60,
          passing: 82,
          dribbling: 75,
          defending: 50,
          physical: 60,
        },
        {
          id: 34,
          name: 'Otto Rangel',
          position: 'ATA',
          condition: 'APTO',
          pace: 80,
          shooting: 75,
          passing: 60,
          dribbling: 70,
          defending: 30,
          physical: 65,
        },
      ];

      const awayStarters: MatchPlayer[] = [
        {
          id: 40,
          name: 'Ivo Teles',
          position: 'GOL',
          condition: 'APTO',
          pace: 60,
          shooting: 20,
          passing: 60,
          dribbling: 40,
          defending: 72,
          physical: 70,
        },
        {
          id: 41,
          name: 'Hugo Vaz',
          position: 'ZAG',
          condition: 'APTO',
          pace: 65,
          shooting: 30,
          passing: 55,
          dribbling: 50,
          defending: 84,
          physical: 75,
        },
        {
          id: 42,
          name: 'Lino Matos',
          position: 'LAT',
          condition: 'APTO',
          pace: 75,
          shooting: 40,
          passing: 65,
          dribbling: 79,
          defending: 63,
          physical: 65,
        },
        {
          id: 43,
          name: 'Nei Soares',
          position: 'MEI',
          condition: 'APTO',
          pace: 70,
          shooting: 60,
          passing: 70,
          dribbling: 75,
          defending: 50,
          physical: 60,
        },
        {
          id: 44,
          name: 'Ugo Falcão',
          position: 'ATA',
          condition: 'APTO',
          pace: 80,
          shooting: 81,
          passing: 60,
          dribbling: 70,
          defending: 30,
          physical: 65,
        },
      ];

      // Verificação do redutor de condição para Davi Lins (MAL_CONDICIONADO)
      expect(applyConditionModifier(74, 'MAL_CONDICIONADO')).toBe(63); // 74 * 0.85 = 62.9 -> 63
      expect(applyConditionModifier(66, 'MAL_CONDICIONADO')).toBe(56); // 66 * 0.85 = 56.1 -> 56

      const sim = simulateMatch(1, homeStarters, 2, awayStarters);

      // 6 duelos
      expect(sim.duels).toHaveLength(6);

      // Duelo 1: Otto Rangel (ATA, finalização 75) x Ivo Teles (GOL, defesa 72) -> Gol
      expect(sim.duels[0]).toMatchObject({
        order: 1,
        attacking_club_id: 1,
        attacker: { player_name: 'Otto Rangel', attribute: 'shooting', value: 75 },
        defender: { player_name: 'Ivo Teles', attribute: 'defending', value: 72 },
        goal: true,
      });

      // Duelo 2: Lauro Neves (MEI, passe 82) x Hugo Vaz (ZAG, defesa 84) -> Não
      expect(sim.duels[1]).toMatchObject({
        order: 2,
        attacking_club_id: 1,
        attacker: { player_name: 'Lauro Neves', attribute: 'passing', value: 82 },
        defender: { player_name: 'Hugo Vaz', attribute: 'defending', value: 84 },
        goal: false,
      });

      // Duelo 3: Davi Lins (LAT, drible 63) x Lino Matos (LAT, defesa 63) -> Empate, não
      expect(sim.duels[2]).toMatchObject({
        order: 3,
        attacking_club_id: 1,
        attacker: { player_name: 'Davi Lins', attribute: 'dribbling', value: 63 },
        defender: { player_name: 'Lino Matos', attribute: 'defending', value: 63 },
        goal: false,
      });

      // Duelo 4: Ugo Falcão (ATA, finalização 81) x Rui Prado (GOL, defesa 77) -> Gol
      expect(sim.duels[3]).toMatchObject({
        order: 4,
        attacking_club_id: 2,
        attacker: { player_name: 'Ugo Falcão', attribute: 'shooting', value: 81 },
        defender: { player_name: 'Rui Prado', attribute: 'defending', value: 77 },
        goal: true,
      });

      // Duelo 5: Nei Soares (MEI, passe 70) x Téo Brandão (ZAG, defesa 84) -> Não
      expect(sim.duels[4]).toMatchObject({
        order: 5,
        attacking_club_id: 2,
        attacker: { player_name: 'Nei Soares', attribute: 'passing', value: 70 },
        defender: { player_name: 'Téo Brandão', attribute: 'defending', value: 84 },
        goal: false,
      });

      // Duelo 6: Lino Matos (LAT, drible 79) x Davi Lins (LAT, defesa 56) -> Gol
      expect(sim.duels[5]).toMatchObject({
        order: 6,
        attacking_club_id: 2,
        attacker: { player_name: 'Lino Matos', attribute: 'dribbling', value: 79 },
        defender: { player_name: 'Davi Lins', attribute: 'defending', value: 56 },
        goal: true,
      });

      // Placar: 1 x 2, VISITANTE
      expect(sim.homeGoals).toBe(1);
      expect(sim.awayGoals).toBe(2);
      expect(sim.result).toBe('VISITANTE');
    });

    it('should sort squad players by tactical position, unicode name and id', () => {
      const players: {
        id: number;
        name: string;
        position: 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';
      }[] = [
        { id: 10, name: 'Beto', position: 'ATA' },
        { id: 2, name: 'Álvaro', position: 'ZAG' },
        { id: 5, name: 'Alvaro', position: 'ZAG' },
        { id: 1, name: 'Carlos', position: 'GOL' },
        { id: 8, name: 'Davi', position: 'MEI' },
      ];

      const sorted = sortSquadPlayers(players);
      expect(sorted.map((p) => p.name)).toEqual(['Carlos', 'Álvaro', 'Alvaro', 'Davi', 'Beto']);
    });
  });
});
