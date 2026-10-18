export type TransactionType = 'COMPRA' | 'VENDA';

export interface Transaction {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: TransactionType;
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
  created_at: string;
}

export interface TransactionsSummary {
  total_spent: number;
  total_received: number;
  total_fees: number;
  total_penalties: number;
  total_profit: number;
}

export interface ClubTransactionsResponse {
  data: Transaction[];
  summary: TransactionsSummary;
}

export interface QueryTransactionsParams {
  type?: string; // "COMPRA", "VENDA" ou "COMPRA,VENDA"
  player_id?: number;
}
