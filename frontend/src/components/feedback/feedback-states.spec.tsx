import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { TableSkeleton, CardSkeleton } from './loading-skeleton';
import { Users, Search } from 'lucide-react';

describe('Feedback States Components (Figma E01-E07 node 9:51815)', () => {
  describe('EmptyState Component', () => {
    it('renders empty state card with icon, title, description, and action button', () => {
      const handleAction = vi.fn();

      render(
        <EmptyState
          icon={<Users data-testid="empty-icon" className="h-6 w-6" />}
          title="Nenhum jogador cadastrado"
          description="Cadastre o primeiro atleta com nome, idade e atributos para começar a montar o mercado da liga."
          actionLabel="Cadastrar jogador"
          onAction={handleAction}
        />,
      );

      expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
      expect(screen.getByText('Nenhum jogador cadastrado')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Cadastre o primeiro atleta com nome, idade e atributos para começar a montar o mercado da liga.',
        ),
      ).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /Cadastrar jogador/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('renders search filter empty state (Figma E02)', () => {
      const handleReset = vi.fn();

      render(
        <EmptyState
          icon={<Search data-testid="search-icon" className="h-6 w-6" />}
          title="Nenhum jogador encontrado"
          description="Nenhum atleta corresponde aos filtros aplicados. Tente ajustar ou limpar os filtros para ver mais resultados."
          actionLabel="Limpar filtros"
          onAction={handleReset}
        />,
      );

      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      expect(screen.getByText('Nenhum jogador encontrado')).toBeInTheDocument();
      const btn = screen.getByRole('button', { name: /Limpar filtros/i });
      fireEvent.click(btn);
      expect(handleReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorState Component', () => {
    it('renders error alert with message and retry button', () => {
      const handleRetry = vi.fn();

      render(
        <ErrorState
          title="Erro ao carregar jogadores"
          message="Falha ao buscar a lista de jogadores da API."
          onRetry={handleRetry}
        />,
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Erro ao carregar jogadores')).toBeInTheDocument();
      expect(screen.getByText('Falha ao buscar a lista de jogadores da API.')).toBeInTheDocument();

      const retryBtn = screen.getByRole('button', { name: /Tentar novamente/i });
      expect(retryBtn).toBeInTheDocument();
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('LoadingSkeleton Components', () => {
    it('renders TableSkeleton with specified rows and cols inside a card container (Figma E01)', () => {
      const { container } = render(<TableSkeleton rows={4} cols={5} bordered />);

      // Bordered card container exists
      const card = container.querySelector('.rounded-2xl.border');
      expect(card).toBeInTheDocument();

      // Check pulse elements
      const pulses = container.querySelectorAll('.animate-pulse');
      // 5 header cols + 4 * 5 row cols = 25 pulses
      expect(pulses.length).toBe(25);
    });

    it('renders CardSkeleton with specified count', () => {
      const { container } = render(<CardSkeleton count={3} />);
      const cards = container.querySelectorAll('.rounded-2xl.border');
      expect(cards.length).toBe(3);
    });
  });
});
