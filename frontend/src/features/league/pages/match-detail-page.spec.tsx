import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MatchDetailPage } from './match-detail-page';
import * as leagueApi from '../api/league-api';
import * as apiModule from '@/lib/api';
import type { Match } from '../types';

vi.mock('../api/league-api', () => ({
  fetchMatches: vi.fn(),
  fetchMatchById: vi.fn(),
  createMatch: vi.fn(),
  fetchStandings: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

const mockMatchDetail: Match = {
  id: 1,
  played_at: '2026-11-05T18:30:00-03:00',
  home: { club_id: 1, club_name: 'Águias FC', formation: '2-1-1', goals: 2 },
  away: { club_id: 2, club_name: 'Delta FC', formation: '2-1-1', goals: 1 },
  result: 'MANDANTE',
  duels: [
    {
      order: 1,
      attacking_club_id: 1,
      attacker: {
        player_id: 14,
        player_name: 'Otto Rangel',
        position: 'ATA',
        condition: 'APTO',
        attribute: 'finalizacao',
        value: 75,
      },
      defender: {
        player_id: 20,
        player_name: 'Ivo Teles',
        position: 'GOL',
        condition: 'APTO',
        attribute: 'defesa',
        value: 72,
      },
      goal: true,
    },
    {
      order: 2,
      attacking_club_id: 1,
      attacker: {
        player_id: 13,
        player_name: 'Lauro Neves',
        position: 'MEI',
        condition: 'APTO',
        attribute: 'passe',
        value: 82,
      },
      defender: {
        player_id: 21,
        player_name: 'Hugo Vaz',
        position: 'ZAG',
        condition: 'APTO',
        attribute: 'defesa',
        value: 84,
      },
      goal: false,
    },
    {
      order: 3,
      attacking_club_id: 1,
      attacker: {
        player_id: 11,
        player_name: 'Davi Lins',
        position: 'LAT',
        condition: 'MAL_CONDICIONADO',
        attribute: 'drible',
        value: 63,
      },
      defender: {
        player_id: 22,
        player_name: 'Lino Matos',
        position: 'LAT',
        condition: 'APTO',
        attribute: 'defesa',
        value: 63,
      },
      goal: false,
    },
    {
      order: 4,
      attacking_club_id: 2,
      attacker: {
        player_id: 24,
        player_name: 'Ugo Falcão',
        position: 'ATA',
        condition: 'APTO',
        attribute: 'finalizacao',
        value: 81,
      },
      defender: {
        player_id: 10,
        player_name: 'Rui Prado',
        position: 'GOL',
        condition: 'APTO',
        attribute: 'defesa',
        value: 77,
      },
      goal: true,
    },
    {
      order: 5,
      attacking_club_id: 2,
      attacker: {
        player_id: 23,
        player_name: 'Nei Soares',
        position: 'MEI',
        condition: 'APTO',
        attribute: 'passe',
        value: 70,
      },
      defender: {
        player_id: 12,
        player_name: 'Téo Brandão',
        position: 'ZAG',
        condition: 'APTO',
        attribute: 'defesa',
        value: 84,
      },
      goal: false,
    },
    {
      order: 6,
      attacking_club_id: 2,
      attacker: {
        player_id: 22,
        player_name: 'Lino Matos',
        position: 'LAT',
        condition: 'APTO',
        attribute: 'drible',
        value: 79,
      },
      defender: {
        player_id: 11,
        player_name: 'Davi Lins',
        position: 'LAT',
        condition: 'MAL_CONDICIONADO',
        attribute: 'defesa',
        value: 56,
      },
      goal: true,
    },
  ],
};

function renderWithProviders(matchId = 1) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <MemoryRouter initialEntries={[`/matches/${matchId}`]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('MatchDetailPage Component (Figma L03 / 60:158515)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiModule.apiGet).mockResolvedValue([
      { id: 1, name: 'Águias FC', acronym: 'AGU' },
      { id: 2, name: 'Delta FC', acronym: 'DEL' },
    ]);
  });

  it('renders return link, scoreboard, horizontal tactical pitch and 6 tactical duels table', async () => {
    vi.mocked(leagueApi.fetchMatchById).mockResolvedValueOnce(mockMatchDetail);

    renderWithProviders(1);

    // Return button
    expect(await screen.findByText('Voltar para partidas')).toBeInTheDocument();

    // Scoreboard
    expect(screen.getByText('Águias FC')).toBeInTheDocument();
    expect(screen.getByText('Delta FC')).toBeInTheDocument();
    expect(screen.getByText('Tempo regulamentar')).toBeInTheDocument();
    expect(screen.getByText('Vitória Mandante')).toBeInTheDocument();

    // Horizontal Pitch
    expect(screen.getByText('Em campo')).toBeInTheDocument();
    expect(
      screen.getByText('Disposição tática dos 5 titulares de cada clube durante o confronto.'),
    ).toBeInTheDocument();

    // 6 Tactical Duels
    expect(screen.getByText('6 Duelos Táticos')).toBeInTheDocument();
    expect(screen.getByText(/Turno Mandante/i)).toBeInTheDocument();
    expect(screen.getByText(/Turno Visitante/i)).toBeInTheDocument();

    // Attackers & Defenders in duels
    expect(screen.getAllByText('Otto Rangel').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Ivo Teles').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Lauro Neves').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Hugo Vaz').length).toBeGreaterThanOrEqual(1);

    // Duel results
    expect(screen.getAllByText('Gol').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sem gol').length).toBeGreaterThan(0);

    // Footnote
    expect(
      screen.getByText(
        '* Toda partida grava o placar e os 6 duelos táticos e nunca é recalculada nem editada (RN20, RN21).',
      ),
    ).toBeInTheDocument();
  });
});
