import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Wallet, Users, Landmark, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const clubId = Number(id);

  const [activeTab, setActiveTab] = useState<'squad' | 'lineup' | 'transactions'>('squad');
  const [sellingPlayer, setSellingPlayer] = useState<ClubPlayer | null>(null);

  const { data: club, isLoading, isError, error, refetch } = useClubDetailQuery(clubId || null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={3} />
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
      {/* Navigation & Header */}
      <div>
        <Link
          to="/clubs"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para lista de clubes
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl border border-primary/20 shrink-0">
              {club.acronym}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>{club.name}</span>
                <span className="text-sm font-mono text-muted-foreground font-normal">
                  (ID #{club.id})
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Elenco ativo com {players.length} de 12 jogadores permitidos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-border">
          <CardContent className="p-0 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-medium block">
                Caixa Disponível
              </span>
              <span className="text-xl font-bold text-foreground">
                {formatCurrency(club.cash, true)}
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Teto de compra: {formatCurrency(club.cash / 2, true)} (50%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 border-border">
          <CardContent className="p-0 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-medium block">
                Valor do Elenco
              </span>
              <span className="text-xl font-bold text-foreground">
                {formatCurrency(club.squad_value, true)}
              </span>
              <span className="text-[11px] text-muted-foreground block">
                {players.length} atletas contratados
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="p-4 border-border">
          <CardContent className="p-0 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-[#016630] shrink-0">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-medium block">
                Patrimônio Líquido
              </span>
              <span className="text-xl font-bold text-[#016630]">
                {formatCurrency(club.net_worth, true)}
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Caixa + Valor do elenco
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'squad' | 'lineup' | 'transactions')}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="squad" className="text-xs sm:text-sm">
            Elenco ({players.length})
          </TabsTrigger>
          <TabsTrigger value="lineup" className="text-xs sm:text-sm">
            Escalação
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs sm:text-sm">
            Transações
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Elenco */}
        <TabsContent value="squad" className="space-y-4">
          {players.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6 text-muted-foreground" />}
              title="Elenco vazio"
              description="Este clube ainda não contratou nenhum jogador no mercado."
            />
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jogador</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Condição</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead>Valor de Mercado</TableHead>
                    <TableHead>Fim da Fidelidade</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                    <TableHead>Multa</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((p) => {
                    const contract = p.contract;

                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{p.name}</span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 font-mono"
                            >
                              {p.position}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm">{p.age} anos</TableCell>

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
                          >
                            {p.condition}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span className="font-mono font-bold text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {p.overall}
                          </span>
                        </TableCell>

                        <TableCell className="font-semibold text-sm text-foreground">
                          {formatCurrency(p.market_value, true)}
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {contract?.loyalty_until ? formatDate(contract.loyalty_until) : '-'}
                        </TableCell>

                        <TableCell className="text-xs">
                          {contract ? (
                            contract.remaining_days > 0 ? (
                              <span className="text-warning font-semibold">
                                {contract.remaining_days} dias
                              </span>
                            ) : (
                              <span className="text-[#016630]">Cumprida</span>
                            )
                          ) : (
                            '-'
                          )}
                        </TableCell>

                        <TableCell className="text-xs">
                          {contract ? (
                            contract.penalty_rate > 0 ? (
                              <span className="text-warning font-bold">
                                {formatPercent(contract.penalty_rate)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">0%</span>
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
                            className="gap-1.5 text-xs text-warning hover:text-warning hover:border-warning"
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
        </TabsContent>

        {/* Tab 2: Escalação */}
        <TabsContent value="lineup">
          <ClubLineupTab club={club} />
        </TabsContent>

        {/* Tab 3: Transações */}
        <TabsContent value="transactions">
          <ClubTransactionsTab clubId={club.id} clubAcronym={club.acronym} />
        </TabsContent>
      </Tabs>

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
