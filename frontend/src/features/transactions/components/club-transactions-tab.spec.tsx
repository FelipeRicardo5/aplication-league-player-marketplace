import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClubTransactionsTab } from './club-transactions-tab';
import { ToastProvider } from '@/components/feedback/toast-provider';
import * as transactionsApi from '../api/transactions-api';
import type { ClubTransactionsResponse } from '../types';

vi.mock('../api/transactions-api', () => ({
  fetchClubTransactions: vi.fn(),
  downloadTransactionsCsv: vi.fn(),
}));

const mockTransactionsData: ClubTransactionsResponse = {
  data: [
    {
      id: 11,
      club_id: 1,
      player_id: 2,
      player_name: 'Meia Lua',
      type: 'VENDA',
      value: 40,
      fee: 0.3,
      penalty: 4,
      profit: 3,
      cash_change: 35.7,
      created_at: '2026-11-05T16:40:00-03:00',
    },
    {
      id: 10,
      club_id: 1,
      player_id: 2,
      player_name: 'Meia Lua',
      type: 'COMPRA',
      value: 37,
      fee: 1.85,
      penalty: 0,
      profit: null,
      cash_change: -38.85,
      created_at: '2026-11-02T10:15:00-03:00',
    },
  ],
  summary: {
    total_spent: 38.85,
    total_received: 35.7,
    total_fees: 2.15,
    total_penalties: 4,
    total_profit: 3,
  },
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
}

describe('ClubTransactionsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders transactions table with 8 columns, badges, initials avatar, and summary footer', async () => {
    vi.mocked(transactionsApi.fetchClubTransactions).mockResolvedValueOnce(mockTransactionsData);

    renderWithProviders(
      <ClubTransactionsTab
        clubId={1}
        clubAcronym="AGU"
        clubPlayers={[{ id: 2, name: 'Meia Lua', position: 'LAT' }]}
      />,
    );

    // Header & Subtitle
    expect(screen.getByText('Histórico de transações')).toBeInTheDocument();
    expect(
      screen.getByText('Registro imutável de todas as compras e vendas de jogadores pelo clube.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exportar CSV/i })).toBeInTheDocument();

    // Table headers (wait for query to resolve)
    expect(await screen.findByText('Data e hora')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Jogador')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
    expect(screen.getByText('Taxa / Comissão')).toBeInTheDocument();
    expect(screen.getByText('Multa')).toBeInTheDocument();
    expect(screen.getByText('Lucro')).toBeInTheDocument();
    expect(screen.getByText('Impacto no caixa')).toBeInTheDocument();

    // Transactions rows
    expect(screen.getAllByText('Meia Lua')).toHaveLength(2);
    expect(screen.getAllByText('(LAT)')).toHaveLength(2);
    expect(screen.getAllByText('ML')).toHaveLength(2); // Initials
    expect(screen.getByText('Venda')).toBeInTheDocument();
    expect(screen.getByText('Compra')).toBeInTheDocument();

    // Financial values formatted
    expect(screen.getByText('40,00')).toBeInTheDocument();
    expect(screen.getByText('37,00')).toBeInTheDocument();
    expect(screen.getByText('+3,00')).toBeInTheDocument();
    expect(screen.getByText('+35,70')).toBeInTheDocument();
    expect(screen.getByText('-38,85')).toBeInTheDocument();

    // Summary footer metrics
    expect(screen.getByText('Total em compras')).toBeInTheDocument();
    expect(screen.getByText('Total em vendas')).toBeInTheDocument();
    expect(screen.getByText('Taxas e comissões')).toBeInTheDocument();
    expect(screen.getByText('Multas por rescisão')).toBeInTheDocument();
    expect(screen.getByText('Impacto líquido')).toBeInTheDocument();

    // Summary values
    expect(screen.getByText('38,85')).toBeInTheDocument();
    expect(screen.getByText('35,70')).toBeInTheDocument();
    expect(screen.getByText('2,15')).toBeInTheDocument();
    expect(screen.getAllByText('4,00').length).toBeGreaterThanOrEqual(2);

    // Footer note
    expect(
      screen.getByText(
        '* Toda transação guarda os valores e o nome do momento e nunca é recalculada nem editada (RN17).',
      ),
    ).toBeInTheDocument();
  });

  it('filters by type (Compras, Vendas, Todos)', async () => {
    vi.mocked(transactionsApi.fetchClubTransactions).mockResolvedValue(mockTransactionsData);

    renderWithProviders(<ClubTransactionsTab clubId={1} clubAcronym="AGU" />);

    await screen.findByText('Histórico de transações');

    // Click 'Compras'
    const comprasButton = screen.getByRole('button', { name: /^Compras$/i });
    fireEvent.click(comprasButton);

    await waitFor(() => {
      expect(transactionsApi.fetchClubTransactions).toHaveBeenCalledWith(1, {
        type: 'COMPRA',
        player_id: undefined,
      });
    });

    // Click 'Vendas'
    const vendasButton = screen.getByRole('button', { name: /^Vendas$/i });
    fireEvent.click(vendasButton);

    await waitFor(() => {
      expect(transactionsApi.fetchClubTransactions).toHaveBeenCalledWith(1, {
        type: 'VENDA',
        player_id: undefined,
      });
    });

    // Click 'Todos'
    const todosButton = screen.getByRole('button', { name: /^Todos$/i });
    fireEvent.click(todosButton);

    await waitFor(() => {
      expect(transactionsApi.fetchClubTransactions).toHaveBeenCalledWith(1, {
        type: undefined,
        player_id: undefined,
      });
    });
  });

  it('renders empty state when there are no transactions and shows 0,00 in summary footer', async () => {
    vi.mocked(transactionsApi.fetchClubTransactions).mockResolvedValueOnce({
      data: [],
      summary: {
        total_spent: 0,
        total_received: 0,
        total_fees: 0,
        total_penalties: 0,
        total_profit: 0,
      },
    });

    renderWithProviders(<ClubTransactionsTab clubId={1} clubAcronym="AGU" />);

    expect(await screen.findByText('Nenhuma transação registrada')).toBeInTheDocument();
    expect(
      screen.getByText('Compras e vendas feitas pelo clube aparecem aqui.'),
    ).toBeInTheDocument();

    // Summary footer is still present with 0,00
    expect(screen.getByText('Total em compras')).toBeInTheDocument();
    expect(screen.getAllByText('0,00').length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        '* Toda transação guarda os valores e o nome do momento e nunca é recalculada nem editada (RN17).',
      ),
    ).toBeInTheDocument();
  });

  it('renders error state displaying API error message (e.g. deleted player)', async () => {
    vi.mocked(transactionsApi.fetchClubTransactions).mockRejectedValueOnce(
      new Error('Jogador não encontrado'),
    );

    renderWithProviders(<ClubTransactionsTab clubId={1} clubAcronym="AGU" />);

    expect(await screen.findByText('Erro ao carregar transações')).toBeInTheDocument();
    expect(screen.getByText('Jogador não encontrado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).toBeInTheDocument();
  });

  it('handles CSV export and shows toast feedback', async () => {
    vi.mocked(transactionsApi.fetchClubTransactions).mockResolvedValue(mockTransactionsData);
    vi.mocked(transactionsApi.downloadTransactionsCsv).mockResolvedValueOnce(undefined);

    renderWithProviders(<ClubTransactionsTab clubId={1} clubAcronym="AGU" />);

    const exportButton = await screen.findByRole('button', { name: /Exportar CSV/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(transactionsApi.downloadTransactionsCsv).toHaveBeenCalledWith(1, 'AGU', {
        type: undefined,
        player_id: undefined,
      });
    });

    expect(await screen.findByText('CSV exportado')).toBeInTheDocument();
    expect(
      screen.getByText('O extrato de transações foi baixado com sucesso.'),
    ).toBeInTheDocument();
  });
});
