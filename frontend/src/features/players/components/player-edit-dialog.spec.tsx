import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlayerEditDialog } from './player-edit-dialog';
import type { Player } from '../types';

const mutateMock = vi.fn();

vi.mock('../hooks/use-players', () => ({
  useUpdatePlayerMutation: (callback?: () => void) => ({
    mutate: (args: unknown) => {
      mutateMock(args);
      if (callback) callback();
    },
    isPending: false,
  }),
}));

const mockPlayerWithClub: Player = {
  id: 7,
  name: 'Danilo Freitas',
  position: 'ZAG',
  agility: 25,
  age: 30,
  condition: 'APTO',
  base_value: 36.0,
  market_value: 27.0,
  pace: 60,
  shooting: 40,
  passing: 60,
  dribbling: 55,
  defending: 78,
  physical: 75,
  potential: 78,
  overall: 71,
  club_id: 1, // Has club (Delta FC)
};

const mockPlayerFree: Player = {
  ...mockPlayerWithClub,
  id: 8,
  club_id: null, // Free agent
};

function renderComponent(player: Player | null = mockPlayerWithClub, open = true) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const onOpenChange = vi.fn();

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <PlayerEditDialog player={player} open={open} onOpenChange={onOpenChange} />
      </QueryClientProvider>,
    ),
    onOpenChange,
  };
}

describe('PlayerEditDialog Component (Figma node 52-131441)', () => {
  it('renders exact modal header, inputs, helpers, locked attributes and action buttons', () => {
    renderComponent(mockPlayerWithClub);

    // Header
    expect(screen.getByRole('heading', { name: 'Editar jogador' })).toBeInTheDocument();
    expect(
      screen.getByText('Edite nome, posição, idade e agilidade. Os demais dados não mudam.'),
    ).toBeInTheDocument();

    // Nome
    expect(screen.getByDisplayValue('Danilo Freitas')).toBeInTheDocument();
    expect(
      screen.getByText('De 3 a 100 caracteres, com pelo menos duas palavras e sem números.'),
    ).toBeInTheDocument();

    // Posição buttons with club notice
    expect(screen.getByRole('radio', { name: /ZAG/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /GOL/i })).toBeDisabled();
    expect(
      screen.getByText(
        'Jogador com clube não muda de posição: as outras posições ficam desabilitadas.',
      ),
    ).toBeInTheDocument();

    // Idade and Agilidade
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    expect(screen.getByText('De 16 a 45, sem diminuir (atual: 30).')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    expect(screen.getByText('De 1 a 100 (até 85 com 35 anos ou mais).')).toBeInTheDocument();

    // Locked Attributes Notice Card
    expect(
      screen.getByText(
        'Não mudam depois do cadastro: valor base (36,00), indicadores e potencial.',
      ),
    ).toBeInTheDocument();

    // Buttons
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument();
  });

  it('allows changing position when player has no club', async () => {
    const user = userEvent.setup();
    renderComponent(mockPlayerFree);

    const meiButton = screen.getByRole('radio', { name: /MEI/i });
    expect(meiButton).not.toBeDisabled();
    await user.click(meiButton);

    expect(meiButton).toHaveAttribute('aria-checked', 'true');
  });

  it('submits updated values when clicking Salvar alterações', async () => {
    mutateMock.mockClear();
    const user = userEvent.setup();
    renderComponent(mockPlayerWithClub);

    const nameInput = screen.getByDisplayValue('Danilo Freitas');
    await user.clear(nameInput);
    await user.type(nameInput, 'Danilo Freitas Silva');

    const submitBtn = screen.getByRole('button', { name: 'Salvar alterações' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledTimes(1);
      expect(mutateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 7,
          data: expect.objectContaining({
            name: 'Danilo Freitas Silva',
          }),
        }),
      );
    });
  });
});
