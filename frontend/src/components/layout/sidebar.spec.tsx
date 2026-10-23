import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './sidebar';

const mockClubs = [
  { id: 1, name: 'Íbis Sport Club', acronym: 'IBI' },
  { id: 2, name: 'Sport Club do Recife', acronym: 'SPO' },
  { id: 3, name: 'Santa Cruz Futebol Clube', acronym: 'STC' },
];

const mockPlayersData = {
  data: [],
  meta: {
    page: 1,
    limit: 1,
    total_items: 42,
    total_pages: 42,
  },
};

const mockMatches = [
  {
    id: 1,
    played_at: '2026-10-22T20:00:00-03:00',
    home: { club_id: 1, club_name: 'Íbis Sport Club', formation: '3-1', goals: 2 },
    away: { club_id: 2, club_name: 'Sport Club do Recife', formation: '2-2', goals: 1 },
    result: 'MANDANTE',
  },
  {
    id: 2,
    played_at: '2026-10-22T21:00:00-03:00',
    home: { club_id: 2, club_name: 'Sport Club do Recife', formation: '2-2', goals: 3 },
    away: { club_id: 1, club_name: 'Íbis Sport Club', formation: '3-1', goals: 0 },
    result: 'MANDANTE',
  },
];

vi.mock('@/features/clubs/hooks/use-clubs', () => ({
  useClubsQuery: () => ({ data: mockClubs, isLoading: false }),
}));

vi.mock('@/features/players/hooks/use-players', () => ({
  usePlayersQuery: () => ({ data: mockPlayersData, isLoading: false }),
}));

vi.mock('@/features/league/hooks/use-league', () => ({
  useMatchesQuery: () => ({ data: mockMatches, isLoading: false }),
}));

function renderSidebar(props: { isCollapsed?: boolean } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Sidebar isCollapsed={props.isCollapsed} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correct counts for players (total_items), matches and clubs when expanded', () => {
    renderSidebar({ isCollapsed: false });

    // Jogadores count should be 42 (from meta.total_items)
    const playersCountBadge = screen.getByText('42');
    expect(playersCountBadge).toBeInTheDocument();

    // Partidas count should be 2
    const matchesCountBadge = screen.getByText('2');
    expect(matchesCountBadge).toBeInTheDocument();

    // Clubes count in nav should be 3
    const clubsCountBadge = screen.getByText('3');
    expect(clubsCountBadge).toBeInTheDocument();

    // Footer summary card should display the counts
    expect(screen.getByText(/3 clubes · 42 jogadores/i)).toBeInTheDocument();

    // Latest match text
    expect(screen.getByText(/Sport Club do Recife 3 × 0 Íbis Sport Club/i)).toBeInTheDocument();
  });

  it('renders club items in sidebar list', () => {
    renderSidebar({ isCollapsed: false });

    expect(screen.getByText('Íbis Sport Club')).toBeInTheDocument();
    expect(screen.getByText('Sport Club do Recife')).toBeInTheDocument();
  });
});
