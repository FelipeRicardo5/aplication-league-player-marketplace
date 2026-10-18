import { apiGet, apiGetText } from '@/lib/api';
import type { ClubTransactionsResponse, QueryTransactionsParams } from '../types';

export async function fetchClubTransactions(
  clubId: number,
  params?: QueryTransactionsParams,
): Promise<ClubTransactionsResponse> {
  const cleanParams: Record<string, unknown> = {};
  if (params?.type) cleanParams.type = params.type;
  if (params?.player_id) cleanParams.player_id = params.player_id;

  return apiGet<ClubTransactionsResponse>(`clubs/${clubId}/transactions`, cleanParams);
}

export async function downloadTransactionsCsv(
  clubId: number,
  clubAcronym: string,
  params?: QueryTransactionsParams,
): Promise<void> {
  const cleanParams: Record<string, unknown> = {};
  if (params?.type) cleanParams.type = params.type;
  if (params?.player_id) cleanParams.player_id = params.player_id;

  const csvContent = await apiGetText(`clubs/${clubId}/transactions/export`, cleanParams);

  // Cria Blob e link de download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `transacoes-${clubAcronym.toLowerCase()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
