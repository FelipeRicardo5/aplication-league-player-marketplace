import { StandingsService } from './standings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StandingsService', () => {
  let service: StandingsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      clubes: {
        findMany: jest.fn(),
      },
      partidas: {
        findMany: jest.fn(),
      },
    };

    service = new StandingsService(prisma as unknown as PrismaService);
  });

  it('should calculate standings matching RN21 normative 6-club example', async () => {
    const clubs = [
      { id: 1, nome: 'Águias FC' },
      { id: 2, nome: 'Delta FC' },
      { id: 3, nome: 'Gama SC' },
      { id: 4, nome: 'Épsilon EC' },
      { id: 5, nome: 'Mangue FC' },
      { id: 6, nome: 'Tubarões EC' },
    ];

    // 4 partidas da tabela normativa:
    // 1. Águias FC (1) 1 x 2 Delta FC (2)
    // 2. Gama SC (3) 2 x 1 Épsilon EC (4)
    // 3. Épsilon EC (4) 3 x 2 Águias FC (1)
    // 4. Delta FC (2) 0 x 1 Gama SC (3)
    const matches = [
      { mandante_id: 1, visitante_id: 2, gols_mandante: 1, gols_visitante: 2 },
      { mandante_id: 3, visitante_id: 4, gols_mandante: 2, gols_visitante: 1 },
      { mandante_id: 4, visitante_id: 1, gols_mandante: 3, gols_visitante: 2 },
      { mandante_id: 2, visitante_id: 3, gols_mandante: 0, gols_visitante: 1 },
    ];

    prisma.clubes.findMany.mockResolvedValue(clubs);
    prisma.partidas.findMany.mockResolvedValue(matches);

    const standings = await service.getStandings();

    expect(standings.length).toBe(6);

    // 1. Gama SC: 6 pts, +2 saldo, 3 gols pro
    expect(standings[0].club_name).toBe('Gama SC');
    expect(standings[0].points).toBe(6);
    expect(standings[0].goal_difference).toBe(2);
    expect(standings[0].goals_for).toBe(3);
    expect(standings[0].position).toBe(1);

    // 2. Épsilon EC: 3 pts, 0 saldo, 4 gols pro
    expect(standings[1].club_name).toBe('Épsilon EC');
    expect(standings[1].points).toBe(3);
    expect(standings[1].goal_difference).toBe(0);
    expect(standings[1].goals_for).toBe(4);
    expect(standings[1].position).toBe(2);

    // 3. Delta FC: 3 pts, 0 saldo, 2 gols pro
    expect(standings[2].club_name).toBe('Delta FC');
    expect(standings[2].points).toBe(3);
    expect(standings[2].goal_difference).toBe(0);
    expect(standings[2].goals_for).toBe(2);
    expect(standings[2].position).toBe(3);

    // 4. Mangue FC: 0 pts, 0 saldo, 0 gols pro (vem antes de Tubarões pelo nome)
    expect(standings[3].club_name).toBe('Mangue FC');
    expect(standings[3].points).toBe(0);
    expect(standings[3].position).toBe(4);

    // 5. Tubarões EC: 0 pts, 0 saldo, 0 gols pro
    expect(standings[4].club_name).toBe('Tubarões EC');
    expect(standings[4].points).toBe(0);
    expect(standings[4].position).toBe(5);

    // 6. Águias FC: 0 pts, -2 saldo, 3 gols pro
    expect(standings[5].club_name).toBe('Águias FC');
    expect(standings[5].points).toBe(0);
    expect(standings[5].goal_difference).toBe(-2);
    expect(standings[5].goals_for).toBe(3);
    expect(standings[5].position).toBe(6);
  });
});
