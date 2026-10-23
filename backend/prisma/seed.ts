import { PrismaClient } from '@prisma/client';
import type { clubes, jogadores } from '@prisma/client';

const prisma = new PrismaClient();

export type Position = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';
export type Condition = 'APTO' | 'ESTAFADO' | 'CONTUNDIDO' | 'DOENTE' | 'EM_TRANSICAO';
export type Formation = '3-1' | '2-2' | '2-1-1' | '1-2-1';

interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

interface PlayerSeedInput {
  name: string;
  position: Position;
  age: number;
  agility: number;
  attributes: PlayerAttributes;
  potential: number;
  condition?: Condition;
  clubAcronym?: string;
  isStarter?: boolean;
}

interface SeedPlayerRecord extends jogadores {
  isStarter: boolean;
  attributes: PlayerAttributes;
}

const POSITION_WEIGHTS: Record<Position, PlayerAttributes> = {
  GOL: { pace: 10, shooting: 0, passing: 20, dribbling: 0, defending: 40, physical: 30 },
  ZAG: { pace: 10, shooting: 0, passing: 15, dribbling: 0, defending: 45, physical: 30 },
  LAT: { pace: 25, shooting: 0, passing: 20, dribbling: 15, defending: 25, physical: 15 },
  MEI: { pace: 10, shooting: 15, passing: 35, dribbling: 25, defending: 5, physical: 10 },
  ATA: { pace: 20, shooting: 40, passing: 10, dribbling: 20, defending: 0, physical: 10 },
};

function calculateOverall(position: Position, attrs: PlayerAttributes): number {
  const weights = POSITION_WEIGHTS[position];
  const sumProducts =
    attrs.pace * weights.pace +
    attrs.shooting * weights.shooting +
    attrs.passing * weights.passing +
    attrs.dribbling * weights.dribbling +
    attrs.defending * weights.defending +
    attrs.physical * weights.physical;

  const score = sumProducts / 100;
  return Math.floor(score + 0.5);
}

function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

function calculateBaseValue(overall: number, potential: number, age: number): number {
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

  const rounded = roundCurrency(baseValue);
  return Math.max(1.0, rounded);
}

function sanitizeTextV4(text: string): string {
  return text.trim().replace(/ +/g, ' ');
}

function normalizeClubName(name: string): string {
  return sanitizeTextV4(name).toLowerCase();
}

const TACTICAL_POSITION_ORDER: Record<Position, number> = {
  GOL: 0,
  ZAG: 1,
  LAT: 2,
  MEI: 3,
  ATA: 4,
};

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeForSearch(text: string): string {
  return stripAccents(sanitizeTextV4(text)).toLowerCase();
}

function compareUnicodeNames(a: string, b: string): number {
  const normA = normalizeForSearch(a);
  const normB = normalizeForSearch(b);
  if (normA < normB) return -1;
  if (normA > normB) return 1;
  return 0;
}

interface MatchSimPlayer {
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

function sortSquadPlayers(players: MatchSimPlayer[]): MatchSimPlayer[] {
  return [...players].sort((a, b) => {
    const posA = TACTICAL_POSITION_ORDER[a.position];
    const posB = TACTICAL_POSITION_ORDER[b.position];
    if (posA !== posB) return posA - posB;
    const nameComp = compareUnicodeNames(a.name, b.name);
    if (nameComp !== 0) return nameComp;
    return a.id - b.id;
  });
}

function applyConditionModifier(attrValue: number, condition: Condition): number {
  if (condition === 'ESTAFADO' || condition === 'CONTUNDIDO' || condition === 'EM_TRANSICAO') {
    // Na simulação RN20 apenas MAL_CONDICIONADO sofre redutor de 15%
    return attrValue;
  }
  return attrValue;
}

function getAttackerAttribute(player: MatchSimPlayer): {
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

function getDefenderAttribute(player: MatchSimPlayer): {
  attribute: 'defending';
  value: number;
} {
  const value = applyConditionModifier(player.defending, player.condition);
  return { attribute: 'defending', value };
}

interface DuelDetail {
  order: number;
  attacking_club_id: number;
  attacker: MatchSimPlayer;
  defender: MatchSimPlayer;
  attacker_attr: 'shooting' | 'passing' | 'dribbling';
  defender_attr: 'defending';
  attacker_val: number;
  defender_val: number;
  goal: boolean;
}

function simulateMatch(
  homeClubId: number,
  homeStarters: MatchSimPlayer[],
  awayClubId: number,
  awayStarters: MatchSimPlayer[],
) {
  const sortedHome = sortSquadPlayers(homeStarters);
  const sortedAway = sortSquadPlayers(awayStarters);

  const homeGk = sortedHome[0];
  const homeOutfield = sortedHome.slice(1);

  const awayGk = sortedAway[0];
  const awayOutfield = sortedAway.slice(1);

  const duels: DuelDetail[] = [];

  const createDuel = (
    order: number,
    attackingClubId: number,
    atkPlayer: MatchSimPlayer,
    defPlayer: MatchSimPlayer,
  ): DuelDetail => {
    const atk = getAttackerAttribute(atkPlayer);
    const def = getDefenderAttribute(defPlayer);
    const isGoal = atk.value > def.value;

    return {
      order,
      attacking_club_id: attackingClubId,
      attacker: atkPlayer,
      defender: defPlayer,
      attacker_attr: atk.attribute,
      defender_attr: def.attribute,
      attacker_val: atk.value,
      defender_val: def.value,
      goal: isGoal,
    };
  };

  duels.push(createDuel(1, homeClubId, homeOutfield[3], awayGk));
  duels.push(createDuel(2, homeClubId, homeOutfield[2], awayOutfield[0]));
  duels.push(createDuel(3, homeClubId, homeOutfield[1], awayOutfield[1]));

  duels.push(createDuel(4, awayClubId, awayOutfield[3], homeGk));
  duels.push(createDuel(5, awayClubId, awayOutfield[2], homeOutfield[0]));
  duels.push(createDuel(6, awayClubId, awayOutfield[1], homeOutfield[1]));

  let homeGoals = 0;
  let awayGoals = 0;

  for (let i = 0; i < 3; i++) {
    if (duels[i].goal) homeGoals++;
  }
  for (let i = 3; i < 6; i++) {
    if (duels[i].goal) awayGoals++;
  }

  return { homeGoals, awayGoals, duels };
}

const CLUBS_DATA = [
  {
    nome: 'Sport Club do Recife',
    sigla: 'SCR',
    formacao: '2-2',
    caixaInicial: 300.0,
  },
  {
    nome: 'Santa Cruz Futebol Clube',
    sigla: 'SCF',
    formacao: '3-1',
    caixaInicial: 300.0,
  },
  {
    nome: 'Clube Náutico Capibaribe',
    sigla: 'CNC',
    formacao: '2-1-1',
    caixaInicial: 300.0,
  },
  {
    nome: 'Retrô Futebol Brasil',
    sigla: 'RFB',
    formacao: '1-2-1',
    caixaInicial: 300.0,
  },
  {
    nome: 'Central Sport Club',
    sigla: 'CSC',
    formacao: '2-2',
    caixaInicial: 300.0,
  },
  {
    nome: 'Porto Sport Caruaru',
    sigla: 'PSC',
    formacao: '3-1',
    caixaInicial: 300.0,
  },
  {
    nome: 'Petrolina Social Futebol',
    sigla: 'PSF',
    formacao: '2-1-1',
    caixaInicial: 300.0,
  },
  {
    nome: 'Afogados da Ingazeira',
    sigla: 'ADI',
    formacao: '1-2-1',
    caixaInicial: 300.0,
  },
];

const PLAYERS_DATA: PlayerSeedInput[] = [
  // ==========================================
  // CLUB 1: Sport Club do Recife (SCR) - Formação 2-2
  // Titulares: 1 GOL, 2 Defesa (1 ZAG, 1 LAT), 2 Ataque (2 ATA)
  // Reservas: 1 MEI, 1 ZAG
  // ==========================================
  {
    name: 'Carlos Eduardo',
    position: 'GOL',
    age: 28,
    agility: 82,
    attributes: { pace: 74, shooting: 15, passing: 68, dribbling: 25, defending: 83, physical: 79 },
    potential: 85,
    clubAcronym: 'SCR',
    isStarter: true,
  },
  {
    name: 'Rafael Thyere',
    position: 'ZAG',
    age: 31,
    agility: 72,
    attributes: { pace: 70, shooting: 30, passing: 65, dribbling: 45, defending: 84, physical: 82 },
    potential: 84,
    clubAcronym: 'SCR',
    isStarter: true,
  },
  {
    name: 'Sander Henrique',
    position: 'LAT',
    age: 32,
    agility: 80,
    attributes: { pace: 78, shooting: 55, passing: 72, dribbling: 70, defending: 76, physical: 75 },
    potential: 78,
    clubAcronym: 'SCR',
    isStarter: true,
  },
  {
    name: 'Vágner Love',
    position: 'ATA',
    age: 39,
    agility: 76, // <= 85 pois age >= 35
    attributes: { pace: 68, shooting: 82, passing: 70, dribbling: 76, defending: 35, physical: 75 },
    potential: 82, // Exatamente igual ao maior atributo (82) pois age >= 33
    clubAcronym: 'SCR',
    isStarter: true,
  },
  {
    name: 'Gustavo Coutinho',
    position: 'ATA',
    age: 25,
    agility: 84,
    attributes: { pace: 82, shooting: 80, passing: 66, dribbling: 78, defending: 32, physical: 74 },
    potential: 83,
    clubAcronym: 'SCR',
    isStarter: true,
  },
  {
    name: 'Lucas Lima',
    position: 'MEI',
    age: 34,
    agility: 78,
    attributes: { pace: 65, shooting: 72, passing: 84, dribbling: 80, defending: 40, physical: 64 },
    potential: 84, // == maxAttr pois age >= 33
    clubAcronym: 'SCR',
    isStarter: false,
  },
  {
    name: 'Alisson Cassiano',
    position: 'ZAG',
    age: 29,
    agility: 70,
    attributes: { pace: 68, shooting: 25, passing: 60, dribbling: 40, defending: 79, physical: 80 },
    potential: 80,
    clubAcronym: 'SCR',
    isStarter: false,
  },

  // ==========================================
  // CLUB 2: Santa Cruz Futebol Clube (SCF) - Formação 3-1
  // Titulares: 1 GOL, 3 Defesa (2 ZAG, 1 LAT), 1 Ataque (1 ATA)
  // Reservas: 1 MEI, 1 LAT
  // ==========================================
  {
    name: 'Michael Fracaro',
    position: 'GOL',
    age: 29,
    agility: 80,
    attributes: { pace: 70, shooting: 12, passing: 64, dribbling: 20, defending: 81, physical: 77 },
    potential: 82,
    clubAcronym: 'SCF',
    isStarter: true,
  },
  {
    name: 'Ítalo Melo',
    position: 'ZAG',
    age: 24,
    agility: 75,
    attributes: { pace: 74, shooting: 28, passing: 62, dribbling: 48, defending: 80, physical: 78 },
    potential: 83,
    clubAcronym: 'SCF',
    isStarter: true,
  },
  {
    name: 'Guedes Gabriel',
    position: 'ZAG',
    age: 27,
    agility: 73,
    attributes: { pace: 71, shooting: 25, passing: 63, dribbling: 42, defending: 81, physical: 79 },
    potential: 82,
    clubAcronym: 'SCF',
    isStarter: true,
  },
  {
    name: 'Marcus Vinicius',
    position: 'LAT',
    age: 26,
    agility: 82,
    attributes: { pace: 80, shooting: 52, passing: 71, dribbling: 72, defending: 75, physical: 72 },
    potential: 81,
    clubAcronym: 'SCF',
    isStarter: true,
  },
  {
    name: 'Pipico Silva',
    position: 'ATA',
    age: 38,
    agility: 75, // <= 85 pois age >= 35
    attributes: { pace: 70, shooting: 83, passing: 68, dribbling: 74, defending: 30, physical: 72 },
    potential: 83, // == maxAttr pois age >= 33
    clubAcronym: 'SCF',
    isStarter: true,
  },
  {
    name: 'Anderson Ceará',
    position: 'MEI',
    age: 25,
    agility: 81,
    attributes: { pace: 73, shooting: 70, passing: 78, dribbling: 79, defending: 44, physical: 66 },
    potential: 82,
    clubAcronym: 'SCF',
    isStarter: false,
  },
  {
    name: 'Matheus Alessandro',
    position: 'LAT',
    age: 27,
    agility: 83,
    attributes: { pace: 82, shooting: 58, passing: 69, dribbling: 75, defending: 68, physical: 70 },
    potential: 82,
    clubAcronym: 'SCF',
    isStarter: false,
  },

  // ==========================================
  // CLUB 3: Clube Náutico Capibaribe (CNC) - Formação 2-1-1
  // Titulares: 1 GOL, 2 Defesa (1 ZAG, 1 LAT), 1 MEI, 1 ATA
  // Reservas: 1 MEI, 1 ZAG
  // ==========================================
  {
    name: 'Vágner Antonio',
    position: 'GOL',
    age: 37,
    agility: 78, // <= 85 pois age >= 35
    attributes: { pace: 68, shooting: 15, passing: 65, dribbling: 22, defending: 84, physical: 78 },
    potential: 84, // == maxAttr pois age >= 33
    clubAcronym: 'CNC',
    isStarter: true,
  },
  {
    name: 'Denilson Santos',
    position: 'ZAG',
    age: 28,
    agility: 74,
    attributes: { pace: 72, shooting: 25, passing: 64, dribbling: 44, defending: 82, physical: 80 },
    potential: 83,
    clubAcronym: 'CNC',
    isStarter: true,
  },
  {
    name: 'Diego Matos',
    position: 'LAT',
    age: 26,
    agility: 81,
    attributes: { pace: 79, shooting: 50, passing: 72, dribbling: 71, defending: 76, physical: 73 },
    potential: 81,
    clubAcronym: 'CNC',
    isStarter: true,
  },
  {
    name: 'Souza Silva',
    position: 'MEI',
    age: 36,
    agility: 75, // <= 85
    attributes: { pace: 66, shooting: 78, passing: 83, dribbling: 75, defending: 55, physical: 73 },
    potential: 83, // == maxAttr pois age >= 33
    clubAcronym: 'CNC',
    isStarter: true,
  },
  {
    name: 'Paulo Sérgio',
    position: 'ATA',
    age: 35,
    agility: 77, // <= 85
    attributes: { pace: 72, shooting: 82, passing: 67, dribbling: 75, defending: 35, physical: 75 },
    potential: 82, // == maxAttr pois age >= 33
    clubAcronym: 'CNC',
    isStarter: true,
  },
  {
    name: 'Marco Antônio',
    position: 'MEI',
    age: 24,
    agility: 82,
    attributes: { pace: 75, shooting: 68, passing: 77, dribbling: 78, defending: 48, physical: 68 },
    potential: 83,
    clubAcronym: 'CNC',
    isStarter: false,
  },
  {
    name: 'Joécio Almeida',
    position: 'ZAG',
    age: 38,
    agility: 70, // <= 85
    attributes: { pace: 62, shooting: 22, passing: 58, dribbling: 38, defending: 79, physical: 81 },
    potential: 81, // == maxAttr
    clubAcronym: 'CNC',
    isStarter: false,
  },

  // ==========================================
  // CLUB 4: Retrô Futebol Brasil (RFB) - Formação 1-2-1
  // Titulares: 1 GOL, 1 Defesa (1 ZAG), 2 MEI, 1 ATA
  // Reservas: 1 LAT, 1 MEI
  // ==========================================
  {
    name: 'Jean Paulo',
    position: 'GOL',
    age: 30,
    agility: 81,
    attributes: { pace: 72, shooting: 14, passing: 67, dribbling: 25, defending: 83, physical: 78 },
    potential: 83,
    clubAcronym: 'RFB',
    isStarter: true,
  },
  {
    name: 'Guilherme Paraíba',
    position: 'ZAG',
    age: 30,
    agility: 74,
    attributes: { pace: 73, shooting: 28, passing: 65, dribbling: 45, defending: 83, physical: 81 },
    potential: 84,
    clubAcronym: 'RFB',
    isStarter: true,
  },
  {
    name: 'Radsley Ribeiro',
    position: 'MEI',
    age: 28,
    agility: 83,
    attributes: { pace: 76, shooting: 74, passing: 81, dribbling: 80, defending: 45, physical: 70 },
    potential: 83,
    clubAcronym: 'RFB',
    isStarter: true,
  },
  {
    name: 'Renato Henrique',
    position: 'MEI',
    age: 31,
    agility: 80,
    attributes: { pace: 74, shooting: 77, passing: 79, dribbling: 77, defending: 46, physical: 72 },
    potential: 80,
    clubAcronym: 'RFB',
    isStarter: true,
  },
  {
    name: 'Fernandinho Oliveira',
    position: 'ATA',
    age: 38,
    agility: 79, // <= 85
    attributes: { pace: 75, shooting: 83, passing: 69, dribbling: 77, defending: 32, physical: 70 },
    potential: 83, // == maxAttr pois age >= 33
    clubAcronym: 'RFB',
    isStarter: true,
  },
  {
    name: 'Edson Lucas',
    position: 'LAT',
    age: 24,
    agility: 84,
    attributes: { pace: 83, shooting: 52, passing: 70, dribbling: 74, defending: 73, physical: 71 },
    potential: 84,
    clubAcronym: 'RFB',
    isStarter: false,
  },
  {
    name: 'Jonas Gabriel',
    position: 'MEI',
    age: 22,
    agility: 82,
    attributes: { pace: 74, shooting: 68, passing: 76, dribbling: 76, defending: 48, physical: 68 },
    potential: 82,
    clubAcronym: 'RFB',
    isStarter: false,
  },

  // ==========================================
  // CLUB 5: Central Sport Club (CSC) - Formação 2-2
  // Titulares: 1 GOL, 2 Defesa (1 ZAG, 1 LAT), 2 Ataque (2 ATA)
  // Reservas: 1 MEI, 1 ZAG
  // ==========================================
  {
    name: 'Murilo Prates',
    position: 'GOL',
    age: 27,
    agility: 79,
    attributes: { pace: 68, shooting: 12, passing: 63, dribbling: 22, defending: 80, physical: 76 },
    potential: 82,
    clubAcronym: 'CSC',
    isStarter: true,
  },
  {
    name: 'Lucão Ferreira',
    position: 'ZAG',
    age: 26,
    agility: 73,
    attributes: { pace: 70, shooting: 25, passing: 61, dribbling: 42, defending: 80, physical: 81 },
    potential: 82,
    clubAcronym: 'CSC',
    isStarter: true,
  },
  {
    name: 'Edy Carlos',
    position: 'LAT',
    age: 25,
    agility: 81,
    attributes: { pace: 78, shooting: 50, passing: 69, dribbling: 71, defending: 73, physical: 70 },
    potential: 80,
    clubAcronym: 'CSC',
    isStarter: true,
  },
  {
    name: 'Zé Artur',
    position: 'ATA',
    age: 27,
    agility: 82,
    attributes: { pace: 79, shooting: 80, passing: 65, dribbling: 76, defending: 32, physical: 73 },
    potential: 82,
    clubAcronym: 'CSC',
    isStarter: true,
  },
  {
    name: 'Pirambu Júnior',
    position: 'ATA',
    age: 29,
    agility: 80,
    attributes: { pace: 76, shooting: 79, passing: 64, dribbling: 74, defending: 35, physical: 76 },
    potential: 80,
    clubAcronym: 'CSC',
    isStarter: true,
  },
  {
    name: 'Moacir Costa',
    position: 'MEI',
    age: 37,
    agility: 73, // <= 85
    attributes: { pace: 64, shooting: 70, passing: 81, dribbling: 74, defending: 50, physical: 71 },
    potential: 81, // == maxAttr
    clubAcronym: 'CSC',
    isStarter: false,
  },
  {
    name: 'Renan Diniz',
    position: 'ZAG',
    age: 31,
    agility: 71,
    attributes: { pace: 68, shooting: 24, passing: 59, dribbling: 40, defending: 78, physical: 80 },
    potential: 80,
    clubAcronym: 'CSC',
    isStarter: false,
  },

  // ==========================================
  // CLUB 6: Porto Sport Caruaru (PSC) - Formação 3-1
  // Titulares: 1 GOL, 3 Defesa (2 ZAG, 1 LAT), 1 Ataque (1 ATA)
  // Reservas: 1 MEI, 1 ZAG
  // ==========================================
  {
    name: 'Adelson Silva',
    position: 'GOL',
    age: 23,
    agility: 81,
    attributes: { pace: 72, shooting: 15, passing: 66, dribbling: 24, defending: 79, physical: 76 },
    potential: 84,
    clubAcronym: 'PSC',
    isStarter: true,
  },
  {
    name: 'Cleberson Souza',
    position: 'ZAG',
    age: 22,
    agility: 76,
    attributes: { pace: 74, shooting: 25, passing: 62, dribbling: 45, defending: 79, physical: 80 },
    potential: 84,
    clubAcronym: 'PSC',
    isStarter: true,
  },
  {
    name: 'Danilo Mendes',
    position: 'ZAG',
    age: 25,
    agility: 74,
    attributes: { pace: 71, shooting: 26, passing: 61, dribbling: 43, defending: 78, physical: 78 },
    potential: 81,
    clubAcronym: 'PSC',
    isStarter: true,
  },
  {
    name: 'Bruninho Leite',
    position: 'LAT',
    age: 21, // Jovem Promessa (age <= 21)
    agility: 85,
    attributes: { pace: 82, shooting: 54, passing: 71, dribbling: 76, defending: 74, physical: 70 },
    potential: 87,
    clubAcronym: 'PSC',
    isStarter: true,
  },
  {
    name: 'Luan Silva',
    position: 'ATA',
    age: 22,
    agility: 83,
    attributes: { pace: 81, shooting: 78, passing: 65, dribbling: 77, defending: 33, physical: 72 },
    potential: 84,
    clubAcronym: 'PSC',
    isStarter: true,
  },
  {
    name: 'Geovane Santos',
    position: 'MEI',
    age: 20, // Jovem Promessa
    agility: 83,
    attributes: { pace: 76, shooting: 70, passing: 78, dribbling: 79, defending: 46, physical: 67 },
    potential: 86,
    clubAcronym: 'PSC',
    isStarter: false,
  },
  {
    name: 'Ruan Vitor',
    position: 'ZAG',
    age: 19, // Jovem Promessa
    agility: 75,
    attributes: { pace: 72, shooting: 22, passing: 58, dribbling: 40, defending: 76, physical: 78 },
    potential: 83,
    clubAcronym: 'PSC',
    isStarter: false,
  },

  // ==========================================
  // CLUB 7: Petrolina Social Futebol (PSF) - Formação 2-1-1
  // Titulares: 1 GOL, 2 Defesa (1 ZAG, 1 LAT), 1 MEI, 1 ATA
  // Reservas: 1 LAT, 1 ATA
  // ==========================================
  {
    name: 'Alan Rocha',
    position: 'GOL',
    age: 32,
    agility: 78,
    attributes: { pace: 68, shooting: 12, passing: 62, dribbling: 20, defending: 81, physical: 77 },
    potential: 82,
    clubAcronym: 'PSF',
    isStarter: true,
  },
  {
    name: 'Raykar Oliveira',
    position: 'ZAG',
    age: 26,
    agility: 73,
    attributes: { pace: 70, shooting: 25, passing: 60, dribbling: 41, defending: 80, physical: 80 },
    potential: 81,
    clubAcronym: 'PSF',
    isStarter: true,
  },
  {
    name: 'Caio Cézar',
    position: 'LAT',
    age: 25,
    agility: 82,
    attributes: { pace: 80, shooting: 52, passing: 70, dribbling: 72, defending: 74, physical: 71 },
    potential: 81,
    clubAcronym: 'PSF',
    isStarter: true,
  },
  {
    name: 'Fabiano Pereira',
    position: 'MEI',
    age: 28,
    agility: 81,
    attributes: { pace: 74, shooting: 73, passing: 80, dribbling: 78, defending: 47, physical: 69 },
    potential: 81,
    clubAcronym: 'PSF',
    isStarter: true,
  },
  {
    name: 'Emerson Galego',
    position: 'ATA',
    age: 24,
    agility: 84,
    attributes: { pace: 83, shooting: 81, passing: 66, dribbling: 78, defending: 30, physical: 73 },
    potential: 85,
    clubAcronym: 'PSF',
    isStarter: true,
  },
  {
    name: 'Eduardo Barbosa',
    position: 'LAT',
    age: 22,
    agility: 82,
    attributes: { pace: 81, shooting: 50, passing: 68, dribbling: 71, defending: 72, physical: 70 },
    potential: 80,
    clubAcronym: 'PSF',
    isStarter: false,
  },
  {
    name: 'Natan Oliveira',
    position: 'ATA',
    age: 23,
    agility: 82,
    attributes: { pace: 80, shooting: 77, passing: 63, dribbling: 75, defending: 32, physical: 71 },
    potential: 82,
    clubAcronym: 'PSF',
    isStarter: false,
  },

  // ==========================================
  // CLUB 8: Afogados da Ingazeira (ADI) - Formação 1-2-1
  // Titulares: 1 GOL, 1 Defesa (1 LAT), 2 MEI, 1 ATA
  // Reservas: 1 ZAG, 1 MEI
  // ==========================================
  {
    name: 'Danilo Gol',
    position: 'GOL',
    age: 33,
    agility: 77,
    attributes: { pace: 67, shooting: 14, passing: 65, dribbling: 22, defending: 81, physical: 77 },
    potential: 81, // == maxAttr pois age >= 33
    clubAcronym: 'ADI',
    isStarter: true,
  },
  {
    name: 'Arthur Santos',
    position: 'LAT',
    age: 24,
    agility: 83,
    attributes: { pace: 81, shooting: 53, passing: 71, dribbling: 74, defending: 75, physical: 72 },
    potential: 82,
    clubAcronym: 'ADI',
    isStarter: true,
  },
  {
    name: 'Roberto Baggio',
    position: 'MEI',
    age: 30,
    agility: 82,
    attributes: { pace: 75, shooting: 76, passing: 81, dribbling: 80, defending: 45, physical: 70 },
    potential: 83,
    clubAcronym: 'ADI',
    isStarter: true,
  },
  {
    name: 'Elias Carioca',
    position: 'MEI',
    age: 24,
    agility: 83,
    attributes: { pace: 77, shooting: 72, passing: 78, dribbling: 79, defending: 44, physical: 68 },
    potential: 83,
    clubAcronym: 'ADI',
    isStarter: true,
  },
  {
    name: 'Rodrigo Dantas',
    position: 'ATA',
    age: 27,
    agility: 83,
    attributes: { pace: 80, shooting: 81, passing: 67, dribbling: 77, defending: 32, physical: 74 },
    potential: 83,
    clubAcronym: 'ADI',
    isStarter: true,
  },
  {
    name: 'Heverton Luiz',
    position: 'ZAG',
    age: 36,
    agility: 70, // <= 85
    attributes: { pace: 64, shooting: 22, passing: 58, dribbling: 38, defending: 78, physical: 80 },
    potential: 80, // == maxAttr
    clubAcronym: 'ADI',
    isStarter: false,
  },
  {
    name: 'Valdeir Silva',
    position: 'MEI',
    age: 31,
    agility: 78,
    attributes: { pace: 70, shooting: 69, passing: 77, dribbling: 75, defending: 46, physical: 68 },
    potential: 78,
    clubAcronym: 'ADI',
    isStarter: false,
  },

  // ==========================================
  // JOGADORES LIVRES NO MERCADO (24 jogadores)
  // clubAcronym = undefined, clube_id = null
  // Diversidade de posições, idades e condições
  // ==========================================
  // Goleiros Livres
  {
    name: 'Gabriel Brazao',
    position: 'GOL',
    age: 23,
    agility: 83,
    attributes: { pace: 73, shooting: 15, passing: 68, dribbling: 25, defending: 82, physical: 78 },
    potential: 86,
    condition: 'APTO',
  },
  {
    name: 'Marcos Felipe',
    position: 'GOL',
    age: 28,
    agility: 80,
    attributes: { pace: 70, shooting: 14, passing: 65, dribbling: 20, defending: 82, physical: 77 },
    potential: 83,
    condition: 'APTO',
  },
  {
    name: 'Thiago Rodrigues',
    position: 'GOL',
    age: 35,
    agility: 76, // <= 85
    attributes: { pace: 65, shooting: 12, passing: 62, dribbling: 20, defending: 80, physical: 76 },
    potential: 80, // == maxAttr
    condition: 'ESTAFADO',
  },
  {
    name: 'Otávio Passos',
    position: 'GOL',
    age: 18, // Jovem Promessa sub-20
    agility: 82,
    attributes: { pace: 71, shooting: 12, passing: 64, dribbling: 22, defending: 77, physical: 74 },
    potential: 88,
    condition: 'APTO',
  },

  // Zagueiros Livres
  {
    name: 'Wallace Reis',
    position: 'ZAG',
    age: 36,
    agility: 72, // <= 85
    attributes: { pace: 65, shooting: 24, passing: 61, dribbling: 40, defending: 82, physical: 82 },
    potential: 82, // == maxAttr
    condition: 'APTO',
  },
  {
    name: 'Victor Cuesta',
    position: 'ZAG',
    age: 35,
    agility: 73, // <= 85
    attributes: { pace: 66, shooting: 28, passing: 65, dribbling: 44, defending: 83, physical: 80 },
    potential: 83, // == maxAttr
    condition: 'CONTUNDIDO',
  },
  {
    name: 'Luan Garcia',
    position: 'ZAG',
    age: 31,
    agility: 76,
    attributes: { pace: 72, shooting: 26, passing: 66, dribbling: 46, defending: 82, physical: 79 },
    potential: 83,
    condition: 'APTO',
  },
  {
    name: 'Lucas Verissimo',
    position: 'ZAG',
    age: 29,
    agility: 75,
    attributes: { pace: 71, shooting: 25, passing: 63, dribbling: 45, defending: 83, physical: 81 },
    potential: 84,
    condition: 'EM_TRANSICAO',
  },
  {
    name: 'Kaiky Fernandes',
    position: 'ZAG',
    age: 20, // Jovem Promessa
    agility: 78,
    attributes: { pace: 75, shooting: 25, passing: 64, dribbling: 48, defending: 80, physical: 79 },
    potential: 87,
    condition: 'APTO',
  },

  // Laterais Livres
  {
    name: 'Dodo Pires',
    position: 'LAT',
    age: 25,
    agility: 84,
    attributes: { pace: 83, shooting: 54, passing: 72, dribbling: 75, defending: 76, physical: 72 },
    potential: 84,
    condition: 'APTO',
  },
  {
    name: 'Renê Rodrigues',
    position: 'LAT',
    age: 32,
    agility: 79,
    attributes: { pace: 76, shooting: 55, passing: 74, dribbling: 72, defending: 77, physical: 74 },
    potential: 79,
    condition: 'APTO',
  },
  {
    name: 'Natanael Pim',
    position: 'LAT',
    age: 22,
    agility: 85,
    attributes: { pace: 84, shooting: 52, passing: 71, dribbling: 76, defending: 75, physical: 71 },
    potential: 85,
    condition: 'APTO',
  },
  {
    name: 'Reinaldo Silva',
    position: 'LAT',
    age: 34,
    agility: 78,
    attributes: { pace: 74, shooting: 68, passing: 76, dribbling: 74, defending: 75, physical: 75 },
    potential: 76, // == maxAttr (76 em passing)
    condition: 'ESTAFADO',
  },
  {
    name: 'Cuiabano Rocha',
    position: 'LAT',
    age: 21, // Jovem Promessa
    agility: 86,
    attributes: { pace: 85, shooting: 58, passing: 72, dribbling: 77, defending: 73, physical: 73 },
    potential: 88,
    condition: 'APTO',
  },

  // Meias Livres
  {
    name: 'Ganso Lima',
    position: 'MEI',
    age: 34,
    agility: 73,
    attributes: { pace: 58, shooting: 74, passing: 87, dribbling: 82, defending: 42, physical: 65 },
    potential: 87, // == maxAttr (87 em passing)
    condition: 'APTO',
  },
  {
    name: 'Giuliano Victor',
    position: 'MEI',
    age: 34,
    agility: 76,
    attributes: { pace: 68, shooting: 75, passing: 82, dribbling: 79, defending: 50, physical: 68 },
    potential: 82, // == maxAttr
    condition: 'APTO',
  },
  {
    name: 'Nonato Santana',
    position: 'MEI',
    age: 26,
    agility: 82,
    attributes: { pace: 75, shooting: 71, passing: 79, dribbling: 78, defending: 58, physical: 72 },
    potential: 82,
    condition: 'APTO',
  },
  {
    name: 'Gabriel Moscardo',
    position: 'MEI',
    age: 19, // Jovem Promessa sub-20
    agility: 82,
    attributes: { pace: 76, shooting: 68, passing: 78, dribbling: 77, defending: 62, physical: 74 },
    potential: 88,
    condition: 'APTO',
  },
  {
    name: 'Matheus Pereira',
    position: 'MEI',
    age: 28,
    agility: 85,
    attributes: { pace: 78, shooting: 79, passing: 84, dribbling: 83, defending: 45, physical: 70 },
    potential: 85,
    condition: 'DOENTE', // Testando jogador doente no mercado
  },
  {
    name: 'Jean Pyerre',
    position: 'MEI',
    age: 26,
    agility: 80,
    attributes: { pace: 70, shooting: 76, passing: 82, dribbling: 80, defending: 42, physical: 67 },
    potential: 83,
    condition: 'CONTUNDIDO',
  },

  // Atacantes Livres
  {
    name: 'Endrick Felipe',
    position: 'ATA',
    age: 18, // Jovem Promessa superestrela
    agility: 89,
    attributes: { pace: 88, shooting: 85, passing: 72, dribbling: 84, defending: 35, physical: 78 },
    potential: 94,
    condition: 'APTO',
  },
  {
    name: 'Gabriel Barbosa',
    position: 'ATA',
    age: 28,
    agility: 84,
    attributes: { pace: 82, shooting: 85, passing: 73, dribbling: 81, defending: 35, physical: 76 },
    potential: 86,
    condition: 'APTO',
  },
  {
    name: 'Hulk Souza',
    position: 'ATA',
    age: 38,
    agility: 78, // <= 85
    attributes: { pace: 76, shooting: 87, passing: 75, dribbling: 80, defending: 40, physical: 86 },
    potential: 87, // == maxAttr
    condition: 'APTO',
  },
  {
    name: 'Diego Costa',
    position: 'ATA',
    age: 35,
    agility: 75, // <= 85
    attributes: { pace: 72, shooting: 84, passing: 68, dribbling: 76, defending: 42, physical: 84 },
    potential: 84, // == maxAttr
    condition: 'EM_TRANSICAO',
  },
];

async function main() {
  console.log('🌱 Iniciando carga de dados no banco de dados...');

  // 1. Limpeza ordenada das tabelas existentes respeitando restrições de integridade referencial
  console.log('🧹 Limpando dados anteriores...');
  await prisma.duelos_partida.deleteMany();
  await prisma.partidas.deleteMany();
  await prisma.escalacoes.deleteMany();
  await prisma.transacoes.deleteMany();
  await prisma.contratos.deleteMany();
  await prisma.jogadores.deleteMany();
  await prisma.clubes.deleteMany();

  // 2. Criação dos Clubes
  console.log('🏟️ Cadastrando clubes...');
  const clubByAcronym = new Map<string, clubes>();

  for (const c of CLUBS_DATA) {
    const createdClub = await prisma.clubes.create({
      data: {
        nome: c.nome,
        nome_normalizado: normalizeClubName(c.nome),
        sigla: c.sigla,
        caixa: c.caixaInicial,
        formacao: c.formacao,
      },
    });
    clubByAcronym.set(c.sigla, createdClub);
    console.log(`  ✓ Clube criado: ${c.nome} (${c.sigla}) - Formação: ${c.formacao}`);
  }

  // 3. Criação dos Jogadores
  console.log('⚽ Cadastrando jogadores...');
  const playerRecords: SeedPlayerRecord[] = [];
  const clubExpenditures = new Map<number, number>();

  for (const p of PLAYERS_DATA) {
    const overall = calculateOverall(p.position, p.attributes);
    const baseValue = calculateBaseValue(overall, p.potential, p.age);
    const club = p.clubAcronym ? clubByAcronym.get(p.clubAcronym) : null;

    const createdPlayer = await prisma.jogadores.create({
      data: {
        nome: p.name,
        posicao: p.position,
        agilidade: p.agility,
        idade: p.age,
        valor_base: baseValue,
        condicao: p.condition ?? 'APTO',
        clube_id: club ? club.id : null,
        velocidade: p.attributes.pace,
        finalizacao: p.attributes.shooting,
        passe: p.attributes.passing,
        drible: p.attributes.dribbling,
        defesa: p.attributes.defending,
        fisico: p.attributes.physical,
        potencial: p.potential,
      },
    });

    playerRecords.push({
      ...createdPlayer,
      isStarter: p.isStarter ?? false,
      attributes: p.attributes,
    });

    // Se o jogador pertence a um clube, cria Contrato e Transação de compra
    if (club) {
      const now = new Date();
      // Fidelidade de 90 dias a partir da compra
      const fidelityDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      const startedAt = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

      // Taxa de 5% sobre valor_base se maior que 30,00
      const taxa = baseValue > 30.0 ? roundCurrency(baseValue * 0.05) : 0.0;
      const variacaoCaixa = -roundCurrency(baseValue + taxa);

      // Registra contrato ATIVO
      await prisma.contratos.create({
        data: {
          jogador_id: createdPlayer.id,
          clube_id: club.id,
          valor_compra: baseValue,
          fidelidade_ate: fidelityDate,
          situacao: 'ATIVO',
          iniciado_em: startedAt,
        },
      });

      // Registra transação COMPRA no histórico
      await prisma.transacoes.create({
        data: {
          clube_id: club.id,
          jogador_id: createdPlayer.id,
          nome_jogador: createdPlayer.nome,
          tipo: 'COMPRA',
          valor: baseValue,
          taxa: taxa,
          multa: 0.0,
          lucro: null,
          variacao_caixa: variacaoCaixa,
          criado_em: startedAt,
        },
      });

      // Acumula débito no caixa do clube
      const prevSpent = clubExpenditures.get(club.id) ?? 0;
      clubExpenditures.set(club.id, roundCurrency(prevSpent + baseValue + taxa));
    }
  }

  console.log(`  ✓ Total de ${playerRecords.length} jogadores cadastrados com sucesso!`);

  // 4. Atualizar caixa dos clubes de acordo com as transações de compra realizadas
  console.log('💰 Atualizando caixa dos clubes conforme compras...');
  for (const [clubId, totalSpent] of clubExpenditures.entries()) {
    const finalCash = roundCurrency(300.0 - totalSpent);
    await prisma.clubes.update({
      where: { id: clubId },
      data: { caixa: finalCash },
    });
  }

  // 5. Escalações dos 5 Titulares para cada um dos 8 clubes
  console.log('📋 Definindo escalações titulares...');
  for (const c of CLUBS_DATA) {
    const club = clubByAcronym.get(c.sigla);
    const starters = playerRecords.filter((p) => p.clube_id === club.id && p.isStarter === true);

    if (starters.length !== 5) {
      console.warn(`  ⚠️ Alerta: Clube ${c.nome} possui ${starters.length} titulares (esperado 5)`);
    }

    for (const starter of starters) {
      await prisma.escalacoes.create({
        data: {
          clube_id: club.id,
          jogador_id: starter.id,
        },
      });
    }
    console.log(`  ✓ Escalação titular definida para: ${c.nome} (5 jogadores)`);
  }

  // 6. Simular e Persistir 4 Partidas Iniciais com 6 Duelos Cada (RN20)
  console.log('🏆 Simulando e gravando rodada inicial de partidas da liga...');
  const matchFixtures = [
    { homeAcronym: 'SCR', awayAcronym: 'SCF' },
    { homeAcronym: 'CNC', awayAcronym: 'RFB' },
    { homeAcronym: 'CSC', awayAcronym: 'PSC' },
    { homeAcronym: 'PSF', awayAcronym: 'ADI' },
  ];

  for (const fixture of matchFixtures) {
    const homeClub = clubByAcronym.get(fixture.homeAcronym);
    const awayClub = clubByAcronym.get(fixture.awayAcronym);

    const homeStarters: MatchSimPlayer[] = playerRecords
      .filter((p) => p.clube_id === homeClub.id && p.isStarter)
      .map((p) => ({
        id: p.id,
        name: p.nome,
        position: p.posicao as Position,
        condition: p.condicao as Condition,
        pace: p.velocidade,
        shooting: p.finalizacao,
        passing: p.passe,
        dribbling: p.drible,
        defending: p.defesa,
        physical: p.fisico,
      }));

    const awayStarters: MatchSimPlayer[] = playerRecords
      .filter((p) => p.clube_id === awayClub.id && p.isStarter)
      .map((p) => ({
        id: p.id,
        name: p.nome,
        position: p.posicao as Position,
        condition: p.condicao as Condition,
        pace: p.velocidade,
        shooting: p.finalizacao,
        passing: p.passe,
        dribbling: p.drible,
        defending: p.defesa,
        physical: p.fisico,
      }));

    const sim = simulateMatch(homeClub.id, homeStarters, awayClub.id, awayStarters);

    const createdMatch = await prisma.partidas.create({
      data: {
        mandante_id: homeClub.id,
        visitante_id: awayClub.id,
        gols_mandante: sim.homeGoals,
        gols_visitante: sim.awayGoals,
        formacao_mandante: homeClub.formacao,
        formacao_visitante: awayClub.formacao,
        jogada_em: new Date(),
      },
    });

    for (const d of sim.duels) {
      await prisma.duelos_partida.create({
        data: {
          partida_id: createdMatch.id,
          ordem: d.order,
          clube_atacante_id: d.attacking_club_id,
          atacante_id: d.attacker.id,
          defensor_id: d.defender.id,
          nome_atacante: d.attacker.name,
          nome_defensor: d.defender.name,
          posicao_atacante: d.attacker.position,
          posicao_defensor: d.defender.position,
          condicao_atacante: d.attacker.condition,
          condicao_defensor: d.defender.condition,
          atributo_ataque: d.attacker_attr,
          atributo_defesa: d.defender_attr,
          valor_ataque: d.attacker_val,
          valor_defesa: d.defender_val,
          gol: d.goal,
        },
      });
    }

    console.log(
      `  ✓ Partida realizada: ${homeClub.nome} ${sim.homeGoals} x ${sim.awayGoals} ${awayClub.nome} (${sim.duels.length} duelos registrados)`,
    );
  }

  console.log('\n🎉 Carga inicial concluída com sucesso!');
  console.log('   - 8 clubes criados');
  console.log('   - 80 jogadores criados (56 em clubes com contrato e 24 livres no mercado)');
  console.log('   - 8 escalações táticas completas');
  console.log('   - 4 partidas disputadas com 24 duelos calculados');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed do banco de dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
