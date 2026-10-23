import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { fetchClubTransactions, downloadTransactionsCsv } from '../api/transactions-api';
import type { TransactionsSummary } from '../types';
import { TableSkeleton } from '@/components/feedback/loading-skeleton';
import { ErrorState } from '@/components/feedback/error-state';
import { useToast } from '@/components/feedback/use-toast';
import { cn } from '@/lib/utils';

export interface ClubTransactionsTabProps {
  clubId: number;
  clubAcronym: string;
  clubPlayers?: Array<{ id: number; name: string; position?: string }>;
}

type TypeFilter = 'TODOS' | 'COMPRA' | 'VENDA';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface SummaryFooterProps {
  summary?: TransactionsSummary;
}

function SummaryFooter({ summary }: SummaryFooterProps) {
  const totalSpent = summary?.total_spent ?? 0;
  const totalReceived = summary?.total_received ?? 0;
  const totalFees = summary?.total_fees ?? 0;
  const totalPenalties = summary?.total_penalties ?? 0;
  const totalProfit = summary?.total_profit ?? 0;
  const netCashImpact = totalReceived - totalSpent;

  return (
    <div className="border-t border-slate-200/80 bg-slate-50/80 p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80">
        {/* 1. Total em compras */}
        <div className="sm:px-3 pt-2 sm:pt-0 first:pt-0 first:sm:pl-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total em compras
          </span>
          <div className="flex items-baseline mt-1">
            <span className="text-base sm:text-lg font-bold text-slate-900 font-sans tabular-nums">
              {formatCurrency(totalSpent, false)}
            </span>
            <span className="text-xs text-slate-400 font-normal ml-1">moedas</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Gastos em aquisições</span>
        </div>

        {/* 2. Total em vendas */}
        <div className="sm:px-3 pt-2 sm:pt-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total em vendas
          </span>
          <div className="flex items-baseline mt-1">
            <span className="text-base sm:text-lg font-bold text-emerald-700 font-sans tabular-nums">
              {formatCurrency(totalReceived, false)}
            </span>
            <span className="text-xs text-slate-400 font-normal ml-1">moedas</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Recebido por vendas</span>
        </div>

        {/* 3. Taxas e comissões */}
        <div className="sm:px-3 pt-2 sm:pt-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Taxas e comissões
          </span>
          <div className="flex items-baseline mt-1">
            <span className="text-base sm:text-lg font-bold text-slate-700 font-sans tabular-nums">
              {formatCurrency(totalFees, false)}
            </span>
            <span className="text-xs text-slate-400 font-normal ml-1">moedas</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Taxas pagas à liga</span>
        </div>

        {/* 4. Multas por rescisão */}
        <div className="sm:px-3 pt-2 sm:pt-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Multas por rescisão
          </span>
          <div className="flex items-baseline mt-1">
            <span
              className={cn(
                'text-base sm:text-lg font-bold font-sans tabular-nums',
                totalPenalties > 0 ? 'text-amber-700' : 'text-slate-700',
              )}
            >
              {formatCurrency(totalPenalties, false)}
            </span>
            <span className="text-xs text-slate-400 font-normal ml-1">moedas</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Multas de fidelidade</span>
        </div>

        {/* 5. Impacto líquido no caixa */}
        <div className="sm:px-3 pt-2 sm:pt-0 last:pb-0">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Impacto líquido
          </span>
          <div className="flex items-baseline mt-1">
            <span
              className={cn(
                'text-base sm:text-lg font-bold font-sans tabular-nums',
                netCashImpact > 0
                  ? 'text-emerald-700'
                  : netCashImpact < 0
                    ? 'text-rose-600'
                    : 'text-slate-900',
              )}
            >
              {netCashImpact > 0
                ? `+${formatCurrency(netCashImpact, false)}`
                : netCashImpact < 0
                  ? `-${formatCurrency(Math.abs(netCashImpact), false)}`
                  : '0,00'}
            </span>
            <span className="text-xs text-slate-400 font-normal ml-1">moedas</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {totalProfit !== 0
              ? `Lucro total: ${totalProfit > 0 ? `+${formatCurrency(totalProfit, false)}` : formatCurrency(totalProfit, false)}`
              : 'Vendas − Compras'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ClubTransactionsTab({
  clubId,
  clubAcronym,
  clubPlayers = [],
}: ClubTransactionsTabProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('TODOS');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  // Registro de jogadores conhecidos para preencher o dropdown de filtro
  const [knownPlayers, setKnownPlayers] = useState<Map<number, { id: number; name: string }>>(
    () => new Map(),
  );

  // Mapeamento de posições para exibição no badge do jogador
  const playerPositions = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of clubPlayers) {
      if (p.position) {
        map.set(p.id, p.position);
      }
    }
    return map;
  }, [clubPlayers]);

  // Atualiza knownPlayers com jogadores atuais do elenco
  useEffect(() => {
    if (clubPlayers.length > 0) {
      setKnownPlayers((prev) => {
        const next = new Map(prev);
        for (const p of clubPlayers) {
          next.set(p.id, { id: p.id, name: p.name });
        }
        return next;
      });
    }
  }, [clubPlayers]);

  // Determina parâmetro type para a API
  let typeParam: string | undefined = undefined;
  if (typeFilter === 'COMPRA') typeParam = 'COMPRA';
  if (typeFilter === 'VENDA') typeParam = 'VENDA';

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['transactions', clubId, typeParam, selectedPlayerId],
    queryFn: () =>
      fetchClubTransactions(clubId, {
        type: typeParam,
        player_id: selectedPlayerId,
      }),
  });

  // Atualiza knownPlayers com transações carregadas
  useEffect(() => {
    if (data?.data && data.data.length > 0) {
      setKnownPlayers((prev) => {
        const next = new Map(prev);
        for (const tx of data.data) {
          next.set(tx.player_id, { id: tx.player_id, name: tx.player_name });
        }
        return next;
      });
    }
  }, [data?.data]);

  // Lista ordenada alfabeticamente para o Select
  const playerOptions = useMemo(() => {
    return Array.from(knownPlayers.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
    );
  }, [knownPlayers]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await downloadTransactionsCsv(clubId, clubAcronym, {
        type: typeParam,
        player_id: selectedPlayerId,
      });
      toastSuccess('CSV exportado', 'O extrato de transações foi baixado com sucesso.');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível baixar o extrato de transações.';
      toastError('Erro ao exportar CSV', message);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePlayerChange = (value: string) => {
    if (value === 'ALL') {
      setSelectedPlayerId(undefined);
    } else {
      setSelectedPlayerId(Number(value));
    }
  };

  const handleClearAllFilters = () => {
    setTypeFilter('TODOS');
    setSelectedPlayerId(undefined);
  };

  const summary = data?.summary;
  const transactions = data?.data || [];

  return (
    <div className="space-y-4">
      {/* Header com título, subtítulo e botão exportar CSV (Figma 9-41319) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Histórico de transações
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro imutável de todas as compras e vendas de jogadores pelo clube.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          isLoading={isExporting}
          disabled={isExporting}
          className="gap-2 shrink-0 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium h-9 px-3.5 rounded-lg cursor-pointer self-start sm:self-auto"
        >
          <Download className="h-4 w-4 text-slate-500" />
          Exportar CSV
        </Button>
      </div>

      {/* Barra de Filtros: Tipo (Pills) e Filtrar por jogador (Select) */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 py-1">
        {/* Filtro por Tipo */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Tipo:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-1">
            <button
              type="button"
              onClick={() => setTypeFilter('TODOS')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer',
                typeFilter === 'TODOS'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60',
              )}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('COMPRA')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer',
                typeFilter === 'COMPRA'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60',
              )}
            >
              Compras
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('VENDA')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer',
                typeFilter === 'VENDA'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60',
              )}
            >
              Vendas
            </button>
          </div>
        </div>

        {/* Filtro por Jogador */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">
            Filtrar por jogador:
          </span>
          <Select
            value={selectedPlayerId !== undefined ? String(selectedPlayerId) : 'ALL'}
            onValueChange={handlePlayerChange}
          >
            <SelectTrigger className="h-8 w-[200px] text-xs rounded-lg border-slate-200 bg-white">
              <SelectValue placeholder="Todos os jogadores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os jogadores</SelectItem>
              {playerOptions.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPlayerId !== undefined && (
            <button
              type="button"
              onClick={() => setSelectedPlayerId(undefined)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer underline-offset-2 hover:underline ml-1"
            >
              Limpar filtro
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo principal: Loading / Erro / Vazio / Tabela com Rodapé */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={8} />
      ) : isError ? (
        <ErrorState
          title="Erro ao carregar transações"
          message={error?.message || 'Falha ao buscar histórico financeiro do clube.'}
          onRetry={refetch}
        />
      ) : transactions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="p-12 flex flex-col items-center justify-center min-h-[280px] text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 mb-3 border border-slate-200/60">
              <History className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Nenhuma transação registrada
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              Compras e vendas feitas pelo clube aparecem aqui.
            </p>
            {(typeFilter !== 'TODOS' || selectedPlayerId !== undefined) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllFilters}
                className="mt-4 text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Limpar filtros aplicados
              </Button>
            )}
          </div>

          {/* Rodapé de resumo mesmo com lista vazia (exibe 0,00 conforme Figma) */}
          <SummaryFooter summary={summary} />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[130px] text-xs font-semibold text-slate-600">
                  Data e hora
                </TableHead>
                <TableHead className="w-[90px] text-xs font-semibold text-slate-600">
                  Tipo
                </TableHead>
                <TableHead className="min-w-[180px] text-xs font-semibold text-slate-600">
                  Jogador
                </TableHead>
                <TableHead className="w-[110px] text-xs font-semibold text-slate-600">
                  Valor
                </TableHead>
                <TableHead className="w-[120px] text-xs font-semibold text-slate-600">
                  Taxa / Comissão
                </TableHead>
                <TableHead className="w-[90px] text-xs font-semibold text-slate-600">
                  Multa
                </TableHead>
                <TableHead className="w-[100px] text-xs font-semibold text-slate-600">
                  Lucro
                </TableHead>
                <TableHead className="w-[130px] text-right text-xs font-semibold text-slate-600">
                  Impacto no caixa
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const position = playerPositions.get(tx.player_id);

                return (
                  <TableRow key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* 1. Data e hora */}
                    <TableCell className="text-xs font-sans text-slate-600 whitespace-nowrap tabular-nums">
                      {formatDateTime(tx.created_at)}
                    </TableCell>

                    {/* 2. Tipo */}
                    <TableCell>
                      {tx.type === 'COMPRA' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                          Compra
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          Venda
                        </span>
                      )}
                    </TableCell>

                    {/* 3. Jogador: Avatar + Nome + Posição */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {getInitials(tx.player_name)}
                        </div>
                        <span className="font-bold text-sm text-slate-900">
                          {tx.player_name}
                        </span>
                        {position && (
                          <span className="inline-flex items-center justify-center font-sans text-[11px] font-medium text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 bg-white shadow-2xs">
                            ({position})
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* 4. Valor de mercado no momento */}
                    <TableCell className="font-sans font-semibold text-sm text-slate-900 tabular-nums">
                      {formatCurrency(tx.value, false)}
                    </TableCell>

                    {/* 5. Taxa de compra ou Comissão de venda */}
                    <TableCell className="font-sans text-xs text-slate-600 tabular-nums">
                      {formatCurrency(tx.fee, false)}
                    </TableCell>

                    {/* 6. Multa de fidelidade */}
                    <TableCell
                      className={cn(
                        'font-sans text-xs tabular-nums',
                        tx.penalty > 0 ? 'text-amber-700 font-semibold' : 'text-slate-600',
                      )}
                    >
                      {formatCurrency(tx.penalty, false)}
                    </TableCell>

                    {/* 7. Lucro da venda com sinal */}
                    <TableCell className="font-sans text-xs tabular-nums">
                      {tx.profit === null ? (
                        <span className="text-slate-400">-</span>
                      ) : tx.profit > 0 ? (
                        <span className="text-emerald-700 font-semibold">
                          +{formatCurrency(tx.profit, false)}
                        </span>
                      ) : tx.profit < 0 ? (
                        <span className="text-rose-600 font-semibold">
                          {formatCurrency(tx.profit, false)}
                        </span>
                      ) : (
                        <span className="text-slate-600">0,00</span>
                      )}
                    </TableCell>

                    {/* 8. Impacto no caixa com sinal */}
                    <TableCell className="text-right font-bold text-sm font-sans tabular-nums">
                      {tx.cash_change > 0 ? (
                        <span className="text-emerald-700">
                          +{formatCurrency(tx.cash_change, false)}
                        </span>
                      ) : tx.cash_change < 0 ? (
                        <span className="text-rose-600">
                          {formatCurrency(tx.cash_change, false)}
                        </span>
                      ) : (
                        <span className="text-slate-900">0,00</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Linha/Barra de Rodapé com Totais Financeiros (FIGMA-016 / H01) */}
          <SummaryFooter summary={summary} />
        </div>
      )}

      {/* Nota de rodapé da regra de negócio imutável */}
      <p className="text-[11px] text-slate-500">
        * Toda transação guarda os valores e o nome do momento e nunca é recalculada nem editada (RN17).
      </p>
    </div>
  );
}
