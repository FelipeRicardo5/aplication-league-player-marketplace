import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlayerDetailSheet } from './player-detail-sheet';
import type { Player } from '../types';

const mockPlayerFree: Player = {
  id: 10,
  name: 'Vinicius Júnior',
  position: 'ATA',
  agility: 92,
  age: 23,
  condition: 'APTO',
  base_value: 80.0,
  market_value: 120.0,
  pace: 95,
  shooting: 86,
  passing: 81,
  dribbling: 94,
  defending: 35,
  physical: 78,
  potential: 96,
  overall: 89,
  club_id: null,
};

const mockPlayerWithClub: Player = {
  ...mockPlayerFree,
  id: 11,
  club_id: 1,
};

function renderComponent(props: Partial<Parameters<typeof PlayerDetailSheet>[0]> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const defaultProps = {
    player: mockPlayerFree,
    open: true,
    onOpenChange: vi.fn(),
    onEdit: vi.fn(),
    onChangeCondition: vi.fn(),
    onBuy: vi.fn(),
    ...props,
  };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <PlayerDetailSheet {...defaultProps} />
      </QueryClientProvider>,
    ),
    props: defaultProps,
  };
}

describe('PlayerDetailSheet Component (Figma J12 / node 52-135991)', () => {
  it('renders 4 KPI cards (Valor de mercado, Valor base, Overall, Potencial)', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: 'Vinicius Júnior' })).toBeInTheDocument();

    // 4 KPI cards
    expect(screen.getByText(/^Valor de mercado$/i)).toBeInTheDocument();
    expect(screen.getByText('120,00')).toBeInTheDocument();
    expect(screen.getByText(/Calculado automaticamente/i)).toBeInTheDocument();

    expect(screen.getByText(/^Valor base$/i)).toBeInTheDocument();
    expect(screen.getByText('80,00')).toBeInTheDocument();
    expect(screen.getByText(/Calculado no cadastro/i)).toBeInTheDocument();

    expect(screen.getByText(/^Overall$/i)).toBeInTheDocument();
    expect(screen.getByText('89')).toBeInTheDocument();
    expect(screen.getByText(/Calculado pela posição/i)).toBeInTheDocument();

    expect(screen.getByText(/^Potencial$/i)).toBeInTheDocument();
    expect(screen.getByText('96')).toBeInTheDocument();
    expect(screen.getByText(/Informado no cadastro/i)).toBeInTheDocument();
  });

  it('renders player info card with Idade, Agilidade, and Clube', () => {
    renderComponent();

    expect(screen.getByText(/^Idade$/i)).toBeInTheDocument();
    expect(screen.getByText('23 anos')).toBeInTheDocument();

    expect(screen.getByText(/^Agilidade$/i)).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();

    expect(screen.getByText(/^Clube$/i)).toBeInTheDocument();
    expect(screen.getAllByText('Livre').length).toBeGreaterThanOrEqual(1);
  });

  it('renders technical attributes with potential indicator', () => {
    renderComponent();

    expect(screen.getByText(/Velocidade/i)).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText(/Finalização/i)).toBeInTheDocument();
    expect(screen.getByText('86')).toBeInTheDocument();

    // Potential ceiling indicator
    const ceilingIndicators = screen.getAllByTitle(/Teto de potencial: 96/i);
    expect(ceilingIndicators.length).toBeGreaterThan(0);
  });

  it('renders quick action buttons (Editar, Alterar condição, Comprar) and fires callbacks', () => {
    const { props } = renderComponent();

    const editBtn = screen.getByRole('button', { name: /Editar/i });
    fireEvent.click(editBtn);
    expect(props.onEdit).toHaveBeenCalledWith(mockPlayerFree);

    const conditionBtn = screen.getByRole('button', { name: /Alterar condição/i });
    fireEvent.click(conditionBtn);
    expect(props.onChangeCondition).toHaveBeenCalledWith(mockPlayerFree);

    const buyBtn = screen.getByRole('button', { name: /Comprar/i });
    fireEvent.click(buyBtn);
    expect(props.onBuy).toHaveBeenCalledWith(mockPlayerFree);
  });

  it('renders club information when player belongs to a club', () => {
    renderComponent({ player: mockPlayerWithClub });
    expect(screen.getByText(/^Clube$/i)).toBeInTheDocument();
  });
});
