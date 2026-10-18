import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlayersTable } from './players-table';
import type { Player } from '../types';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockPlayers: Player[] = [
  {
    id: 1,
    name: 'Carlos Silva',
    position: 'ATA',
    agility: 85,
    age: 24,
    condition: 'APTO',
    base_value: 3000,
    market_value: 4500,
    pace: 88,
    shooting: 82,
    passing: 70,
    dribbling: 84,
    defending: 40,
    physical: 75,
    potential: 90,
    overall: 80,
    club_id: null, // Livre
  },
  {
    id: 2,
    name: 'Roberto Souza',
    position: 'ZAG',
    agility: 65,
    age: 30,
    condition: 'MAL_CONDICIONADO',
    base_value: 2000,
    market_value: 1700,
    pace: 60,
    shooting: 45,
    passing: 62,
    dribbling: 55,
    defending: 85,
    physical: 82,
    potential: 85,
    overall: 78,
    club_id: 1, // Com clube
  },
];

describe('PlayersTable Component (Figma J01 / J04)', () => {
  it('renders all 10 official columns from the Figma prototype', () => {
    render(
      <PlayersTable
        players={mockPlayers}
        onViewDetail={vi.fn()}
        onEdit={vi.fn()}
        onChangeCondition={vi.fn()}
        onBuy={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    // 10 Colunas oficiais
    expect(screen.getByRole('columnheader', { name: /^Jogador$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Posição$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Overall$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Agilidade$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Idade$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Condição$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Valor base$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Valor de mercado$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Clube$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Ações$/i })).toBeInTheDocument();
  });

  it('renders situation tabs with dynamic counts and calls onTabChange', () => {
    const onTabChange = vi.fn();

    render(
      <PlayersTable
        players={mockPlayers}
        activeTab="all"
        onTabChange={onTabChange}
        counts={{ all: 22, free: 14, club: 8 }}
        onViewDetail={vi.fn()}
        onEdit={vi.fn()}
        onChangeCondition={vi.fn()}
        onBuy={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('tab', { name: /Todos/i })).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();

    const freeTab = screen.getByRole('tab', { name: /Livres/i });
    expect(freeTab).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();

    const clubTab = screen.getByRole('tab', { name: /Em clubes/i });
    expect(clubTab).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();

    fireEvent.click(freeTab);
    expect(onTabChange).toHaveBeenCalledWith('free');
  });

  it('renders inline "+ Comprar" quick action button exclusively for free players', () => {
    const onBuy = vi.fn();

    render(
      <PlayersTable
        players={mockPlayers}
        onViewDetail={vi.fn()}
        onEdit={vi.fn()}
        onChangeCondition={vi.fn()}
        onBuy={onBuy}
        onDelete={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    // Jogador 1 é livre -> deve exibir botão "Comprar" inline
    const buyButtons = screen.getAllByRole('button', { name: /Comprar/i });
    expect(buyButtons.length).toBe(1);

    fireEvent.click(buyButtons[0]);
    expect(onBuy).toHaveBeenCalledWith(mockPlayers[0]);
  });

  it('renders Agilidade with numeric value and mini progress bar', () => {
    render(
      <PlayersTable
        players={mockPlayers}
        onViewDetail={vi.fn()}
        onEdit={vi.fn()}
        onChangeCondition={vi.fn()}
        onBuy={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
  });

  it('calls onViewDetail when player name button is clicked', () => {
    const onViewDetail = vi.fn();

    render(
      <PlayersTable
        players={mockPlayers}
        onViewDetail={onViewDetail}
        onEdit={vi.fn()}
        onChangeCondition={vi.fn()}
        onBuy={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    const nameBtn = screen.getByRole('button', { name: /^Carlos Silva$/i });
    fireEvent.click(nameBtn);

    expect(onViewDetail).toHaveBeenCalledWith(mockPlayers[0]);
  });
});
