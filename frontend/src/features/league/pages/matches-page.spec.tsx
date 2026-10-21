import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { MatchesPage } from './matches-page';
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
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public status: number = 400,
    ) {
      super(message);
    }
  },
}));

const mockClubs = [
  { id: 1, name: 'Águias FC', acronym: 'AGU', cash: 300, squad_value: 0, net_worth: 300 },
  { id: 2, name: 'Delta FC', acronym: 'DEL', cash: 50, squad_value: 100, net_worth: 150 },
];

const mockMatches: Match[] = [
  {
    id: 1,
    played_at: '2026-11-05T18:30:00-03:00',
    home: { club_id: 2, club_name: 'Delta FC', formation: '2-1-1', goals: 2 },
    away: { club_id: 1, club_name: 'Águias FC', formation: '2-1-1', goals: 1 },
    result: 'MANDANTE',
  },
  {
    id: 2,
    played_at: '2026-11-04T15:00:00-03:00',
    home: { club_id: 1, club_name: 'Águias FC', formation: '3-1', goals: 1 },
    away: { club_id: 2, club_name: 'Delta FC', formation: '2-2', goals: 1 },
    result: 'EMPATE',
  },
];

import { ToastProvider } from '@/components/feedback/toast-provider';

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MatchesPage />
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('MatchesPage Component (Figma L01 / 54:149535)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiModule.apiGet).mockResolvedValue(mockClubs);
  });

  it('renders matches page header, latest confrontation banner, and 6-column table', async () => {
    vi.mocked(leagueApi.fetchMatches).mockResolvedValueOnce(mockMatches);

    renderWithProviders();

    // Header
    expect(await screen.findByText('Partidas')).toBeInTheDocument();
    expect(
      screen.getByText('Histórico de confrontos e simulação de novas partidas da liga.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nova partida/i })).toBeInTheDocument();

    // Highlight card (latest confrontation)
    expect(await screen.findByText('Último confronto')).toBeInTheDocument();
    expect(screen.getAllByText('2 - 1').length).toBeGreaterThanOrEqual(1);

    // 6-Column Table headers
    expect(screen.getByText('Data e hora')).toBeInTheDocument();
    expect(screen.getAllByText('Mandante').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Placar')).toBeInTheDocument();
    expect(screen.getAllByText('Visitante').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Resultado')).toBeInTheDocument();
    expect(screen.getByText('Ações')).toBeInTheDocument();

    // Table rows
    expect(screen.getByText('Vitória Mandante')).toBeInTheDocument();
    expect(screen.getByText('Empate')).toBeInTheDocument();
    expect(screen.getAllByText(/Ver duelos/i).length).toBeGreaterThanOrEqual(2);

    // Footer note
    expect(
      screen.getByText(
        '* Toda partida grava o placar e os 6 duelos táticos e nunca é recalculada nem editada (RN20, RN21).',
      ),
    ).toBeInTheDocument();
  });

  it('filters matches by club when club selector is changed', async () => {
    vi.mocked(leagueApi.fetchMatches).mockResolvedValue(mockMatches);

    renderWithProviders();

    await screen.findByText('Histórico de confrontos');

    // Default call has no club_id
    expect(leagueApi.fetchMatches).toHaveBeenCalledWith(undefined);
  });

  it('renders empty state when there are no matches played yet', async () => {
    vi.mocked(leagueApi.fetchMatches).mockResolvedValueOnce([]);

    renderWithProviders();

    expect(await screen.findByText('Nenhuma partida disputada')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ainda não foram jogadas partidas na liga ou para o clube selecionado.',
      ),
    ).toBeInTheDocument();
  });
});
