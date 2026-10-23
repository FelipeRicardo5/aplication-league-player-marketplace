import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Wallet,
  Coins,
  Landmark,
  Shirt,
  ShoppingCart,
  Users,
  FileText,
  History,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate, formatPercent } from '@/lib/formatters';
import { useClubDetailQuery } from '../hooks/use-clubs';
import { ClubLineupTab } from '../components/club-lineup-tab';
import { ClubTransactionsTab } from '@/features/transactions/components/club-transactions-tab';
import { SellPlayerDialog } from '@/features/market/components/sell-player-dialog';
import { CardSkeleton, TableSkeleton } from '@/components/feedback/loading-skeleton';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import type { ClubPlayer } from '../types';
import { cn } from '@/lib/utils';

export function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const clubId = Number(id);

  const [activeTab, setActiveTab] = useState<'squad' | 'lineup' | 'transactions'>('squad');
  const [sellingPlayer, setSellingPlayer] = useState<ClubPlayer | null>(null);

  const { data: club, isLoading, isError, error, refetch } = useClubDetailQuery(clubId || null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton count={4} />
        </div>
        <TableSkeleton rows={6} cols={6} />
      </div>
    );
  }

  if (isError || !club) {
    return (
      <ErrorState
        title="Clube não encontrado"
        message={error?.message || 'Não foi possível carregar os dados deste clube.'}
        onRetry={refetch}
      />
    );
  }

  const players = club.players || [];

  return (
    <div className="space-y-6">
      {/* Page Header Conforme Figma node 54-139627 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-14 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-base border border-slate-200 shrink-0">
            {club.acronym}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{club.name}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center justify-center font-sans text-xs font-medium text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200 bg-white shadow-2xs">
                Sigla {club.acronym}
              </span>
              <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200 bg-white shadow-2xs">
                <Shirt className="h-3.5 w-3.5 text-slate-500" />
                {players.length} de 12 jogadores
              </span>
            </div>
          </div>
        </div>

        <Button
          asChild
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm rounded-lg shadow-xs shrink-0 cursor-pointer h-9 px-3.5"
        >
          <Link to={`/players?free=true&buyerClubId=${club.id}`}>
            <ShoppingCart className="h-4 w-4" />
            Comprar jogadores
          </Link>
        </Button>
      </div>

      {/* 4 KPIs Superiores em Grade 1x4 Fiel ao Figma */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Caixa */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Caixa</span>
            <Wallet className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-slate-900 font-sans tabular-nums">
                {formatCurrency(club.cash, false)}
              </span>
              <span className="text-xs font-normal text-slate-400 ml-1.5">moedas</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Só muda por compras e vendas
            </span>
          </div>
        </div>

        {/* 2. Valor do elenco */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Valor do elenco</span>
            <Coins className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-slate-900 font-sans tabular-nums">
                {formatCurrency(club.squad_value, false)}
              </span>
              <span className="text-xs font-normal text-slate-400 ml-1.5">moedas</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Soma dos valores de mercado
            </span>
          </div>
        </div>

        {/* 3. Patrimônio */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Patrimônio</span>
            <Landmark className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-slate-900 font-sans tabular-nums">
                {formatCurrency(club.net_worth, false)}
              </span>
              <span className="text-xs font-normal text-slate-400 ml-1.5">moedas</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Caixa + valor do elenco</span>
          </div>
        </div>

        {/* 4. Elenco */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Elenco</span>
            <Shirt className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-slate-900 font-sans tabular-nums">
                {players.length} de 12
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Limite de 12 jogadores</span>
          </div>
        </div>
      </div>

      {/* Abas com design de linha conforme Figma */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('squad')}
            className={cn(
              'flex items-center gap-2 pb-3 text-sm transition-colors cursor-pointer border-b-2',
              activeTab === 'squad'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 font-medium',
            )}
          >
            <Shirt className="h-4 w-4" />
            <span>Elenco</span>
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[11px] font-mono leading-tight',
                activeTab === 'squad'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'bg-slate-100 text-slate-600',
              )}
            >
              {players.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lineup')}
            className={cn(
              'flex items-center gap-2 pb-3 text-sm transition-colors cursor-pointer border-b-2',
              activeTab === 'lineup'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 font-medium',
            )}
          >
            <FileText className="h-4 w-4" />
            <span>Escalação</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={cn(
              'flex items-center gap-2 pb-3 text-sm transition-colors cursor-pointer border-b-2',
              activeTab === 'transactions'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 font-medium',
            )}
          >
            <History className="h-4 w-4" />
            <span>Histórico</span>
          </button>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'squad' && (
        <div className="space-y-4">
          {players.length === 0 ? (
            <EmptyState
              icon={<Shirt className="h-6 w-6 text-slate-500" />}
              title="Nenhum jogador no elenco"
              description="Compre jogadores livres para montar o elenco. O limite é de 12 jogadores, e o custo de cada compra não pode passar de 50% do caixa."
              actionLabel="Ver jogadores livres"
              actionIcon={<Users className="h-4 w-4" />}
              actionHref={`/players?free=true&buyerClubId=${club.id}`}
            />
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[180px] text-xs font-semibold text-slate-600">
                      Jogador
                    </TableHead>
                    <TableHead className="w-[80px] text-xs font-semibold text-slate-600">
                      Idade
                    </TableHead>
                    <TableHead className="min-w-[130px] text-xs font-semibold text-slate-600">
                      Condição
                    </TableHead>
                    <TableHead className="w-[80px] text-xs font-semibold text-slate-600">
                      Overall
                    </TableHead>
                    <TableHead className="w-[130px] text-xs font-semibold text-slate-600">
                      Valor de mercado
                    </TableHead>
                    <TableHead className="w-[140px] text-xs font-semibold text-slate-600">
                      Fim da fidelidade
                    </TableHead>
                    <TableHead className="w-[100px] text-xs font-semibold text-slate-600">
                      Multa
                    </TableHead>
                    <TableHead className="w-[100px] text-right text-xs font-semibold text-slate-600">
                      Ação
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((p) => {
                    const contract = p.contract;

                    return (
                      <TableRow key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-sm text-slate-900">{p.name}</span>
                            <span className="inline-flex items-center justify-center font-sans text-xs font-medium text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 bg-white shadow-2xs">
                              {p.position}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs font-sans text-slate-700 tabular-nums">
                          {p.age}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              p.condition === 'APTO'
                                ? 'success'
                                : p.condition === 'MAL_CONDICIONADO'
                                  ? 'warning'
                                  : 'destructive'
                            }
                            dot
                            className="rounded-md"
                          >
                            {p.condition === 'APTO'
                              ? 'Apto'
                              : p.condition === 'MAL_CONDICIONADO'
                                ? 'Mal condicionado'
                                : 'Doente'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span className="font-sans font-bold text-sm text-slate-900 tabular-nums">
                            {p.overall}
                          </span>
                        </TableCell>

                        <TableCell className="font-bold text-sm font-sans tabular-nums text-slate-900">
                          {formatCurrency(p.market_value, false)}
                        </TableCell>

                        <TableCell className="text-xs font-sans text-slate-600">
                          {contract?.loyalty_until ? formatDate(contract.loyalty_until) : '-'}
                        </TableCell>

                        <TableCell className="text-xs font-sans">
                          {contract ? (
                            contract.remaining_days > 0 ? (
                              <span className="text-amber-600 font-semibold tabular-nums">
                                {formatPercent(contract.penalty_rate)}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium">Cumprida</span>
                            )
                          ) : (
                            '-'
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSellingPlayer(p)}
                            className="h-7 px-2.5 gap-1.5 text-xs text-amber-700 border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:text-amber-800 rounded-md cursor-pointer transition-colors"
                          >
                            <TrendingUp className="h-3.5 w-3.5" />
                            Vender
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Escalação */}
      {activeTab === 'lineup' && <ClubLineupTab club={club} />}

      {/* Tab 3: Transações */}
      {activeTab === 'transactions' && (
        <ClubTransactionsTab
          clubId={club.id}
          clubAcronym={club.acronym}
          clubPlayers={club.players}
        />
      )}

      {/* Sell Modal */}
      <SellPlayerDialog
        player={sellingPlayer}
        clubId={club.id}
        open={Boolean(sellingPlayer)}
        onOpenChange={(open) => !open && setSellingPlayer(null)}
      />
    </div>
  );
}
