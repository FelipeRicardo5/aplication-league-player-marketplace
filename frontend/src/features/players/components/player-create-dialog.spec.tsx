import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlayerCreateDialog } from './player-create-dialog';

const mutateMock = vi.fn();

vi.mock('../hooks/use-players', () => ({
  useCreatePlayerMutation: (callback?: () => void) => ({
    mutate: (data: unknown) => {
      mutateMock(data);
      if (callback) callback();
    },
    isPending: false,
  }),
}));

function renderComponent(open = true, onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <PlayerCreateDialog open={open} onOpenChange={onOpenChange} />
      </QueryClientProvider>,
    ),
    onOpenChange,
  };
}

describe('PlayerCreateDialog Component (Figma J05/J06)', () => {
  it('renders modal header, position toggle buttons and live preview panel', () => {
    renderComponent(true);

    expect(screen.getByRole('heading', { name: /Cadastrar Novo Jogador/i })).toBeInTheDocument();

    // 5 position buttons
    expect(screen.getByRole('radio', { name: /Goleiro/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Zagueiro/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Lateral/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Meio-campo/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Atacante/i })).toBeInTheDocument();

    // Default position is MEI
    expect(screen.getByRole('radio', { name: /Meio-campo/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    // Live preview elements
    expect(screen.getByText(/Prévia dos Atributos/i)).toBeInTheDocument();
    expect(screen.getByText(/Tempo Real/i)).toBeInTheDocument();
    expect(screen.getByText(/^Overall$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Valor Base$/i)).toBeInTheDocument();
  });

  it('updates position selection when clicking another position toggle button', async () => {
    const user = userEvent.setup();
    renderComponent(true);

    const ataButton = screen.getByRole('radio', { name: /Atacante/i });
    await user.click(ataButton);

    expect(ataButton).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /Meio-campo/i })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('displays warning and disables submit when attribute sum exceeds 480', async () => {
    renderComponent(true);

    const paceInput = screen.getByLabelText(/Velocidade/i);
    fireEvent.change(paceInput, { target: { value: '95' } });

    const shootInput = screen.getByLabelText(/Finalização/i);
    fireEvent.change(shootInput, { target: { value: '95' } });

    const passInput = screen.getByLabelText(/Passe/i);
    fireEvent.change(passInput, { target: { value: '95' } });

    const dribInput = screen.getByLabelText(/Drible/i);
    fireEvent.change(dribInput, { target: { value: '95' } });

    const defInput = screen.getByLabelText(/Defesa/i);
    fireEvent.change(defInput, { target: { value: '95' } });

    const physInput = screen.getByLabelText(/Físico/i);
    fireEvent.change(physInput, { target: { value: '95' } });

    // 95 * 6 = 570 > 480
    await waitFor(() => {
      expect(screen.getByText(/excede o limite máximo de 480/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Salvar Jogador/i });
    expect(submitBtn).toBeDisabled();
  });

  it('submits valid form data with required fields', async () => {
    mutateMock.mockClear();
    const user = userEvent.setup();
    renderComponent(true);

    const nameInput = screen.getByPlaceholderText(/Carlos Eduardo Silva/i);
    await user.type(nameInput, 'Lucas Paquetá');

    const submitBtn = screen.getByRole('button', { name: /Salvar Jogador/i });
    expect(submitBtn).not.toBeDisabled();
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledTimes(1);
      expect(mutateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Lucas Paquetá',
          position: 'MEI',
        }),
      );
    });
  });
});
