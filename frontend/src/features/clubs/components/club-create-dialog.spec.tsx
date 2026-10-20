import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClubCreateDialog } from './club-create-dialog';
import { ToastProvider } from '@/components/feedback/toast-provider';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

describe('ClubCreateDialog Component (Figma node 54-139627)', () => {
  it('renders dialog with title Novo clube, inputs with helpers and initial cash notice', () => {
    const onOpenChange = vi.fn();

    render(<ClubCreateDialog open={true} onOpenChange={onOpenChange} />, {
      wrapper: createWrapper(),
    });

    // Title & subtitle
    expect(screen.getByRole('heading', { name: 'Novo clube' })).toBeInTheDocument();
    expect(screen.getByText('Informe o nome e a sigla do clube.')).toBeInTheDocument();

    // Inputs & Labels
    expect(screen.getByLabelText(/^Nome$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Sigla$/i)).toBeInTheDocument();

    // Helper texts
    expect(
      screen.getByText(
        'De 3 a 60 caracteres e de 2 a 5 palavras; só letras, espaços, hífen e ponto. Não pode repetir outro clube.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '3 letras de A a Z, maiúsculas, que aparecem no nome nessa ordem; a primeira é a primeira letra do nome.',
      ),
    ).toBeInTheDocument();

    // Notice
    expect(
      screen.getByText('O clube começa com 300,00 em caixa e sem jogadores.'),
    ).toBeInTheDocument();

    // Buttons
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar clube' })).toBeInTheDocument();
  });

  it('validates required fields on empty submit', async () => {
    const onOpenChange = vi.fn();

    render(<ClubCreateDialog open={true} onOpenChange={onOpenChange} />, {
      wrapper: createWrapper(),
    });

    const submitBtn = screen.getByRole('button', { name: 'Criar clube' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/O nome do clube deve ter entre 3 e 60 caracteres/i),
      ).toBeInTheDocument();
    });
  });
});
