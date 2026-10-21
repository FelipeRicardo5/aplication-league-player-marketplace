import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { StandingsPage } from './standings-page';
import { ToastProvider } from '@/components/feedback/toast-provider';
import * as leagueApi from '../api/league-api';
import * as apiModule from '@/lib/api';
import type { StandingRow, Match } from '../types';

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

const mockStandings: StandingRow[] = [
  {
    position: 1,
    club_id: 1,
    club_name: 'Águias FC',
    played: 2,
    wins: 2,
    draws: 0,
    losses: 0,
    goals_for: 5,
    goals_against: 1,
    goal_difference: 4,
    points: 6,
  },
  {
    position: 2,
    club_id: 2,
    club_name: 'Delta FC',
    played: 2,
    wins: 0,
    draws: 0,
    losses: 2,
    goals_for: 1,
    goals_against: 5,
    goal_difference: -4,
    points: 0,
  },
];

const mockRecentMatches: Match[] = [
  {
    id: 1,
    played_at: '2026-11-05T18:30:00-03:00',
    home: { club_id: 1, club_name: 'Águias FC', formation: '2-1-1', goals: 2 },
    away: { club_id: 2, club_name: 'Delta FC', formation: '2-1-1', goals: 1 },
    result: 'MANDANTE',
  },
];

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
          <StandingsPage />
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('StandingsPage Component (Figma L05 / 54:150880)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiModule.apiGet).mockResolvedValue([
      { id: 1, name: 'Águias FC', acronym: 'AGU' },
      { id: 2, name: 'Delta FC', acronym: 'DEL' },
    ]);
  });

  it('renders standings table with 10 columns having Pts as the LAST column and sidebar cards', async () => {
    vi.mocked(leagueApi.fetchStandings).mockResolvedValueOnce(mockStandings);
    vi.mocked(leagueApi.fetchMatches).mockResolvedValueOnce(mockRecentMatches);

    renderWithProviders();

    // Header
    expect(await screen.findByRole('heading', { name: 'Classificação' })).toBeInTheDocument();
    expect(
      screen.getByText('Todos os clubes, com 3 pontos por vitória e 1 por empate.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nova partida/i })).toBeInTheDocument();

    // Table Column Headers
    expect(await screen.findByText('#')).toBeInTheDocument();
    expect(screen.getByText('Clube')).toBeInTheDocument();
    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.getByText('V')).toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('GP')).toBeInTheDocument();
    expect(screen.getByText('GC')).toBeInTheDocument();
    expect(screen.getByText('SG')).toBeInTheDocument();
    expect(screen.getByText('Pts')).toBeInTheDocument();

    // Leader indicator and club names
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Águias FC').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Delta FC').length).toBeGreaterThanOrEqual(1);

    // Legend
    expect(
      screen.getByText(
        'J: jogos · V: vitórias · E: empates · D: derrotas · GP: gols marcados · GC: gols sofridos · SG: saldo de gols · Pts: pontos',
      ),
    ).toBeInTheDocument();

    // Footnote
    expect(
      screen.getByText(
        'Classificação de 1 a 6, com os clubes sem partidas zerados. Pontos, saldo e posição são calculados a cada consulta, nunca gravados (RN21).',
      ),
    ).toBeInTheDocument();

    // Sidebar Card 1: Últimas partidas
    expect(screen.getByText('Últimas partidas')).toBeInTheDocument();
    expect(screen.getByText('Da mais recente para a mais antiga.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver todas as partidas →/i })).toBeInTheDocument();

    // Sidebar Card 2: Ordem da tabela
    expect(screen.getByText('Ordem da tabela')).toBeInTheDocument();
    expect(screen.getByText('Critérios de classificação, nesta ordem.')).toBeInTheDocument();
    expect(screen.getByText('Mais pontos')).toBeInTheDocument();
    expect(screen.getByText('Maior saldo de gols')).toBeInTheDocument();
    expect(screen.getByText('Mais gols marcados')).toBeInTheDocument();
    expect(screen.getByText('Nome do clube, de A a Z')).toBeInTheDocument();
  });
});
