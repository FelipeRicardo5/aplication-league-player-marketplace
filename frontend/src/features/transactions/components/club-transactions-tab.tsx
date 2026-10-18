import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDateTime, formatSignedCurrency } from '@/lib/formatters';
import { fetchClubTransactions, downloadTransactionsCsv } from '../api/transactions-api';
import { TableSkeleton } from '@/components/feedback/loading-skeleton';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { useToast } from '@/components/feedback/use-toast';

interface ClubTransactionsTabProps {
  clubId: number;
  clubAcronym: string;
}

export function ClubTransactionsTab({ clubId, clubAcronym }: ClubTransactionsTabProps) {
  const { error: toastError } = useToast();
  const [includeCompra, setIncludeCompra] = useState(true);
  const [includeVenda, setIncludeVenda] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Determina parâmetro type
  let typeParam: string | undefined = undefined;
  if (includeCompra && !includeVenda) typeParam = 'COMPRA';
  if (!includeCompra && includeVenda) typeParam = 'VENDA';
  if (includeCompra && includeVenda) typeParam = 'COMPRA,VENDA';

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['transactions', clubId, typeParam],
    queryFn: () => fetchClubTransactions(clubId, { type: typeParam }),
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await downloadTransactionsCsv(clubId, clubAcronym, { type: typeParam });
    } catch {
      toastError('Erro ao exportar CSV', 'Não foi possível baixar o histórico de transações.');
    } finally {
      setIsExporting(false);
    }
  };

  const summary = data?.summary;
  const transactions = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Header com filtros de tipo e botão exportar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-6">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Filtrar Tipo:
          </span>
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-compra"
              checked={includeCompra}
              onCheckedChange={(c) => setIncludeCompra(Boolean(c))}
            />
            <Label htmlFor="filter-compra" className="text-xs cursor-pointer">
              Compras
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-venda"
              checked={includeVenda}
              onCheckedChange={(c) => setIncludeVenda(Boolean(c))}
            />
            <Label htmlFor="filter-venda" className="text-xs cursor-pointer">
              Vendas
            </Label>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          isLoading={isExporting}
          className="gap-2 shrink-0"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Financial Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-3">
            <CardContent className="p-0">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-medium">
                Total Gasto
              </span>
              <span className="text-base font-bold text-foreground">
                {formatCurrency(summary.total_spent, true)}
              </span>
            </CardContent>
          </Card>

          <Card className="p-3">
            <CardContent className="p-0">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-medium">
                Total Recebido
              </span>
              <span className="text-base font-bold text-[#016630]">
                {formatCurrency(summary.total_received, true)}
              </span>
            </CardContent>
          </Card>

          <Card className="p-3">
            <CardContent className="p-0">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-medium">
                Taxas da Liga
              </span>
              <span className="text-base font-semibold text-muted-foreground">
                {formatCurrency(summary.total_fees, true)}
              </span>
            </CardContent>
          </Card>

          <Card className="p-3">
            <CardContent className="p-0">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-medium">
                Multas
              </span>
              <span className="text-base font-semibold text-warning">
                {formatCurrency(summary.total_penalties, true)}
              </span>
            </CardContent>
          </Card>

          <Card className="p-3 col-span-2 md:col-span-1">
            <CardContent className="p-0">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-medium">
                Lucro Líquido
              </span>
              <span className="text-base font-bold text-primary">
                {formatCurrency(summary.total_profit, true)}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table / States */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={8} />
      ) : isError ? (
        <ErrorState
          title="Erro ao carregar transações"
          message={error?.message || 'Falha ao buscar histórico financeiro do clube.'}
          onRetry={refetch}
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<History className="h-6 w-6 text-muted-foreground" />}
          title="Nenhuma transação encontrada"
          description="Este clube ainda não realizou transações com os filtros selecionados."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data e Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Jogador</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Multa</TableHead>
                <TableHead>Lucro</TableHead>
                <TableHead className="text-right">Variação Caixa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(tx.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={tx.type === 'COMPRA' ? 'destructive' : 'success'}
                      className="text-[10px] px-1.5 py-0 font-semibold"
                    >
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm text-foreground">
                    {tx.player_name}
                  </TableCell>
                  <TableCell className="text-sm">{formatCurrency(tx.value, true)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatCurrency(tx.fee, true)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatCurrency(tx.penalty, true)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {tx.profit !== null ? formatCurrency(tx.profit, true) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-bold text-sm">
                    <span className={tx.cash_change > 0 ? 'text-[#016630]' : 'text-[#BF000F]'}>
                      {formatSignedCurrency(tx.cash_change)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
