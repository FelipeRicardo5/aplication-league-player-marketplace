import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlayersFilters } from './players-filters';

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

describe('PlayersFilters Component', () => {
  it('renders search input and controls properly', () => {
    const onFilterChange = vi.fn();
    const onReset = vi.fn();

    render(
      <PlayersFilters
        filters={{ page: 1, limit: 10 }}
        onFilterChange={onFilterChange}
        onReset={onReset}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByPlaceholderText(/Buscar por nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Só livres/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Limpar filtros/i })).toBeInTheDocument();
  });

  it('debounces search input changes', async () => {
    const onFilterChange = vi.fn();
    const onReset = vi.fn();

    render(
      <PlayersFilters
        filters={{ page: 1, limit: 10 }}
        onFilterChange={onFilterChange}
        onReset={onReset}
      />,
      { wrapper: createWrapper() },
    );

    const input = screen.getByPlaceholderText(/Buscar por nome/i);
    fireEvent.change(input, { target: { value: 'Eduardo' } });

    // Início imediato: ainda não chamou devido ao debounce
    expect(onFilterChange).not.toHaveBeenCalled();

    // Aguarda o término do debounce (400ms)
    await waitFor(
      () => {
        expect(onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Eduardo', page: 1 }),
        );
      },
      { timeout: 1000 },
    );
  });

  it('disables club selector when free is true', () => {
    const onFilterChange = vi.fn();
    const onReset = vi.fn();

    render(
      <PlayersFilters
        filters={{ page: 1, limit: 10, free: true }}
        onFilterChange={onFilterChange}
        onReset={onReset}
      />,
      { wrapper: createWrapper() },
    );

    const clubTrigger = screen.getByLabelText('Filtrar por clube');
    expect(clubTrigger).toBeDisabled();
  });

  it('disables free switch when club_id is set', () => {
    const onFilterChange = vi.fn();
    const onReset = vi.fn();

    render(
      <PlayersFilters
        filters={{ page: 1, limit: 10, club_id: 1 }}
        onFilterChange={onFilterChange}
        onReset={onReset}
      />,
      { wrapper: createWrapper() },
    );

    const freeSwitch = screen.getByRole('switch', { name: /Só livres/i });
    expect(freeSwitch).toBeDisabled();
  });

  it('triggers onReset and resets search input on click Limpar filtros', () => {
    const onFilterChange = vi.fn();
    const onReset = vi.fn();

    render(
      <PlayersFilters
        filters={{ page: 1, limit: 10, search: 'Carlos' }}
        onFilterChange={onFilterChange}
        onReset={onReset}
      />,
      { wrapper: createWrapper() },
    );

    const input = screen.getByPlaceholderText(/Buscar por nome/i) as HTMLInputElement;
    expect(input.value).toBe('Carlos');

    const resetButton = screen.getByRole('button', { name: /Limpar filtros/i });
    fireEvent.click(resetButton);

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('');
  });
});
