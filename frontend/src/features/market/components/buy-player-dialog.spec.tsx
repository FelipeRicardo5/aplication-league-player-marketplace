import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { BuyPlayerDialog } from './buy-player-dialog';
import { BuyPlayerSuccessDialog, type BuyTransactionResult } from './buy-player-success-dialog';
import { ToastProvider } from '@/components/feedback/toast-provider';
import type { Player } from '@/features/players/types';

const mockPlayer: Player = {
  id: 2,
  name: 'Meia Lua',
  position: 'LAT',
  age: 25,
  agility: 85,
  overall: 78,
  potential: 82,
  base_value: 35,
  market_value: 37,
  condition: 'APTO',
  club_id: null,
  pace: 80,
  shooting: 60,
  passing: 70,
  dribbling: 75,
  defending: 72,
  physical: 68,
};

const mockClubs = [
  {
    id: 1,
    name: 'Águias FC',
    acronym: 'AGU',
    cash: 300,
    squad_value: 0,
    net_worth: 300,
    players: [],
  },
  {
    id: 2,
    name: 'Delta FC',
    acronym: 'DEL',
    cash: 50,
    squad_value: 100,
    net_worth: 150,
    players: [],
  },
];

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(() => Promise.resolve(mockClubs)),
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('BuyPlayerDialog Component (Figma node 9-43048 / M01)', () => {
  it('renders modal header, player summary with fee calculation and separated date/time inputs', async () => {
    render(
      <BuyPlayerDialog
        player={mockPlayer}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    // Modal title & description
    expect(screen.getByRole('heading', { name: 'Comprar jogador' })).toBeInTheDocument();
    expect(
      screen.getByText(/Contrate o atleta livre para o elenco do clube/i),
    ).toBeInTheDocument();

    // Player summary
    expect(screen.getByText('Meia Lua')).toBeInTheDocument();
    expect(screen.getByText('LAT')).toBeInTheDocument();
    expect(screen.getByText('Apto')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument(); // Overall

    // Inputs separados de data e hora para a fidelidade
    expect(screen.getByLabelText(/Data/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hora/i)).toBeInTheDocument();

    // Buttons
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar compra/i })).toBeInTheDocument();
  });

  it('renders notice box with official league rules (RN12, RN13, RN15)', () => {
    render(
      <BuyPlayerDialog
        player={mockPlayer}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(
      screen.getByText(/O contrato nasce ATIVO. Se o clube vender o jogador antes do fim da fidelidade/i),
    ).toBeInTheDocument();
  });
});

describe('BuyPlayerSuccessDialog Component (Figma node 54:143944 / M05)', () => {
  const mockTransaction: BuyTransactionResult = {
    id: 10,
    club_id: 1,
    club_name: 'Águias FC',
    club_acronym: 'AGU',
    player_id: 2,
    player_name: 'Meia Lua',
    player_position: 'LAT',
    type: 'COMPRA',
    value: 37,
    fee: 1.85,
    penalty: 0,
    profit: null,
    cash_change: -38.85,
    created_at: '2026-11-02T10:15:00-03:00',
    contract: {
      purchase_value: 37,
      loyalty_until: '2027-03-02T10:15:00-03:00',
      status: 'ATIVO',
    },
    club_cash: 261.15,
  };

  it('renders success dialog with full transaction details and navigation buttons', () => {
    render(
      <BuyPlayerSuccessDialog
        transaction={mockTransaction}
        open={true}
        onOpenChange={vi.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(
      screen.getByRole('heading', { name: 'Compra realizada com sucesso!' }),
    ).toBeInTheDocument();

    expect(screen.getAllByText(/Meia Lua/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Águias FC/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/37,00 moedas/i)).toBeInTheDocument();
    expect(screen.getByText(/1,85 moedas/i)).toBeInTheDocument();
    expect(screen.getByText(/38,85 moedas/i)).toBeInTheDocument();
    expect(screen.getByText(/261,15 moedas/i)).toBeInTheDocument();

    expect(screen.getAllByRole('button', { name: 'Fechar' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Ver elenco do clube/i })).toBeInTheDocument();
  });
});
