import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WelcomePage } from './welcome-page';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('WelcomePage Component (Figma W01/W02 node 42:63527)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hero title, description, and league branding', () => {
    render(<WelcomePage />, { wrapper: createWrapper() });

    expect(screen.getByText('Passe')).toBeInTheDocument();
    expect(screen.getByText('Gestão da liga, do mercado à classificação')).toBeInTheDocument();
    expect(
      screen.getByText(/Cadastre jogadores, monte os clubes e negocie com contrato de fidelidade/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar/i })).toBeInTheDocument();
  });

  it('renders inline metrics row matching Figma design', () => {
    render(<WelcomePage />, { wrapper: createWrapper() });

    expect(screen.getByText(/\d+ jogadores/)).toBeInTheDocument();
    expect(screen.getByText(/\d+ livres/)).toBeInTheDocument();
    expect(screen.getByText(/\d+ clubes/)).toBeInTheDocument();
    expect(screen.getByText(/\d+ partidas/)).toBeInTheDocument();
    expect(screen.getByText('Não precisa de login')).toBeInTheDocument();
  });

  it('renders the 6 sequential pipeline step cards with 01-06 indicators', () => {
    render(<WelcomePage />, { wrapper: createWrapper() });

    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();
    expect(screen.getByText('05')).toBeInTheDocument();
    expect(screen.getByText('06')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Jogadores' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Clubes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Compra' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Venda' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Histórico' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Liga' })).toBeInTheDocument();
  });

  it('navigates to /players when "Iniciar" button is clicked', () => {
    render(<WelcomePage />, { wrapper: createWrapper() });

    const startButton = screen.getByRole('button', { name: /Iniciar/i });
    fireEvent.click(startButton);

    expect(mockNavigate).toHaveBeenCalledWith('/players');
  });

  it('navigates to /players when Enter key is pressed outside of inputs', () => {
    render(<WelcomePage />, { wrapper: createWrapper() });

    fireEvent.keyDown(window, { key: 'Enter', code: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith('/players');
  });
});
