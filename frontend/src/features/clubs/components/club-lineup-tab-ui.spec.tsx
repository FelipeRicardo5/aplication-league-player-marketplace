import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClubLineupTab } from './club-lineup-tab';
import { ToastProvider } from '@/components/feedback/toast-provider';
import type { ClubDetail } from '../types';

const mockClub: ClubDetail = {
  id: 1,
  name: 'Águias FC',
  acronym: 'AGU',
  cash: 51.58,
  squad_value: 222.68,
  net_worth: 274.26,
  players: [
    {
      id: 101,
      name: 'Bruno Tavares',
      position: 'GOL',
      age: 29,
      agility: 58,
      overall: 71,
      potential: 75,
      base_value: 30,
      market_value: 35,
      condition: 'APTO',
      club_id: 1,
      pace: 50,
      shooting: 25,
      passing: 60,
      dribbling: 45,
      defending: 77,
      physical: 70,
    },
    {
      id: 102,
      name: 'Felipe Moura',
      position: 'ZAG',
      age: 27,
      agility: 45,
      overall: 77,
      potential: 80,
      base_value: 40,
      market_value: 45,
      condition: 'APTO',
      club_id: 1,
      pace: 65,
      shooting: 30,
      passing: 55,
      dribbling: 50,
      defending: 83,
      physical: 80,
    },
    {
      id: 103,
      name: 'Diego Ramos',
      position: 'LAT',
      age: 20,
      agility: 81,
      overall: 72,
      potential: 85,
      base_value: 35,
      market_value: 42,
      condition: 'MAL_CONDICIONADO',
      club_id: 1,
      pace: 82,
      shooting: 55,
      passing: 68,
      dribbling: 74,
      defending: 66,
      physical: 65,
    },
    {
      id: 104,
      name: 'Sávio Lima',
      position: 'MEI',
      age: 24,
      agility: 72,
      overall: 66,
      potential: 74,
      base_value: 25,
      market_value: 28,
      condition: 'MAL_CONDICIONADO',
      club_id: 1,
      pace: 70,
      shooting: 60,
      passing: 70,
      dribbling: 68,
      defending: 50,
      physical: 60,
    },
    {
      id: 105,
      name: 'João Silva',
      position: 'ATA',
      age: 26,
      agility: 78,
      overall: 77,
      potential: 80,
      base_value: 45,
      market_value: 52,
      condition: 'APTO',
      club_id: 1,
      pace: 80,
      shooting: 79,
      passing: 65,
      dribbling: 76,
      defending: 35,
      physical: 72,
    },
    {
      id: 106,
      name: 'Lucas Ferraz',
      position: 'MEI',
      age: 28,
      agility: 65,
      overall: 68,
      potential: 70,
      base_value: 20,
      market_value: 20,
      condition: 'DOENTE',
      club_id: 1,
      pace: 60,
      shooting: 55,
      passing: 65,
      dribbling: 62,
      defending: 45,
      physical: 58,
    },
  ],
};

const mockLineupData = {
  club_id: 1,
  formation: '2-1-1' as const,
  complete: true,
  players: mockClub.players.slice(0, 5),
};

vi.mock('../hooks/use-clubs', () => ({
  useClubLineupQuery: () => ({
    data: mockLineupData,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useSaveLineupMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

describe('ClubLineupTab Component (Figma node 75-160001)', () => {
  it('renders Titulares header with complete badge and action buttons', () => {
    render(<ClubLineupTab club={mockClub} />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: 'Titulares' })).toBeInTheDocument();
    expect(screen.getByText(/✓/i)).toBeInTheDocument();
    expect(screen.getByText(/Completa/i)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar escalação' })).toBeInTheDocument();
  });

  it('renders all 4 formation radio options with descriptions and mini pitches', () => {
    render(<ClubLineupTab club={mockClub} />, { wrapper: createWrapper() });

    expect(screen.getByText('3-1')).toBeInTheDocument();
    expect(screen.getByText('2-2')).toBeInTheDocument();
    expect(screen.getByText('2-1-1')).toBeInTheDocument();
    expect(screen.getByText('1-2-1')).toBeInTheDocument();

    expect(screen.getByText('Defesa 2, meio 1, ataque 1')).toBeInTheDocument();
  });

  it('renders the 5 lineup slots with assigned players and condition badges', () => {
    render(<ClubLineupTab club={mockClub} />, { wrapper: createWrapper() });

    expect(screen.getAllByText('Goleiro').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Defesa').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Meio').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Ataque').length).toBeGreaterThanOrEqual(1);

    expect(screen.getAllByText(/Bruno Tavares/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/João Silva/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders mal condicionado warning box when starters have that condition', () => {
    render(<ClubLineupTab club={mockClub} />, { wrapper: createWrapper() });

    expect(
      screen.getByText(/Diego Ramos e Sávio Lima estão mal condicionados/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Podem jogar, mas cada atributo vale 15% a menos durante a partida/i),
    ).toBeInTheDocument();
  });

  it('renders tactical pitch preview (Em campo) and reserves list', () => {
    render(<ClubLineupTab club={mockClub} />, { wrapper: createWrapper() });

    // Em campo card
    expect(screen.getByRole('heading', { name: 'Em campo' })).toBeInTheDocument();
    expect(screen.getByText(/Prévia da formação 2-1-1, do goleiro ao ataque/i)).toBeInTheDocument();
    expect(screen.getByText('Tavares')).toBeInTheDocument();
    expect(screen.getByText('Silva')).toBeInTheDocument();

    // Reservas card
    expect(screen.getByRole('heading', { name: 'Reservas' })).toBeInTheDocument();
    expect(screen.getByText('Lucas Ferraz')).toBeInTheDocument();
    expect(screen.getByText('Doente não pode ser escalado.')).toBeInTheDocument();
  });
});
