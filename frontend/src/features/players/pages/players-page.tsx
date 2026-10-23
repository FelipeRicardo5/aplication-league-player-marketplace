import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserPlus, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayersFilters } from '../components/players-filters';
import { PlayersTable } from '../components/players-table';
import { PlayerCreateDialog } from '../components/player-create-dialog';
import { PlayerEditDialog } from '../components/player-edit-dialog';
import { PlayerConditionDialog } from '../components/player-condition-dialog';
import { PlayerDetailSheet } from '../components/player-detail-sheet';
import { PlayerDeleteDialog } from '../components/player-delete-dialog';
import { BuyPlayerDialog } from '@/features/market/components/buy-player-dialog';
import { TableSkeleton } from '@/components/feedback/loading-skeleton';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { usePlayersQuery } from '../hooks/use-players';
import type { Player, PlayersListResponse, QueryPlayersParams } from '../types';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

export function PlayersPage() {
  const [searchParams] = useSearchParams();
  const defaultClubId = searchParams.get('buyerClubId')
    ? Number(searchParams.get('buyerClubId'))
    : undefined;

  const [filters, setFilters] = useState<QueryPlayersParams>(() => ({
    page: 1,
    limit: 10,
    sort: 'name',
    free: searchParams.get('free') === 'true' ? true : undefined,
  }));

  // Modais e Sheets
  const [createOpen, setCreateOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [conditionPlayer, setConditionPlayer] = useState<Player | null>(null);
  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
  const [deletePlayer, setDeletePlayer] = useState<Player | null>(null);
  const [buyPlayer, setBuyPlayer] = useState<Player | null>(null);

  const { data, isLoading, isError, error, refetch } = usePlayersQuery(filters);

  // Consultas leves (limit: 1) para alimentar os contadores das abas da tabela conforme Figma J01/J04
  const { data: allCountData } = useQuery({
    queryKey: ['players', 'tab-count-all'],
    queryFn: () => apiGet<PlayersListResponse>('players', { limit: 1 }),
    staleTime: 1000 * 30,
  });

  const { data: freeCountData } = useQuery({
    queryKey: ['players', 'tab-count-free'],
    queryFn: () => apiGet<PlayersListResponse>('players', { free: true, limit: 1 }),
    staleTime: 1000 * 30,
  });

  const { data: clubCountData } = useQuery({
    queryKey: ['players', 'tab-count-club'],
    queryFn: () => apiGet<PlayersListResponse>('players', { free: false, limit: 1 }),
    staleTime: 1000 * 30,
  });

  const counts = {
    all:
      allCountData?.meta?.total_items ??
      (filters.free === undefined ? (data?.meta?.total_items ?? 0) : 0),
    free:
      freeCountData?.meta?.total_items ??
      (filters.free === true ? (data?.meta?.total_items ?? 0) : 0),
    club:
      clubCountData?.meta?.total_items ??
      (filters.free === false ? (data?.meta?.total_items ?? 0) : 0),
  };

  const activeTab: 'all' | 'free' | 'club' =
    filters.free === true ? 'free' : filters.free === false ? 'club' : 'all';

  const handleTabChange = (tab: 'all' | 'free' | 'club') => {
    if (tab === 'all') {
      setFilters((prev) => ({ ...prev, free: undefined, page: 1 }));
    } else if (tab === 'free') {
      setFilters((prev) => ({ ...prev, free: true, club_id: undefined, page: 1 }));
    } else {
      setFilters((prev) => ({ ...prev, free: false, page: 1 }));
    }
  };

  const handleSortChange = (newSort: string) => {
    setFilters((prev) => ({ ...prev, sort: newSort, page: 1 }));
  };

  const handleFilterChange = (newFilters: Partial<QueryPlayersParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({ page: 1, limit: 10, sort: 'name' });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Page Header Conforme Figma J01 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#155DFC] border border-blue-100/90 shadow-2xs shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Jogadores</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Consulte o catálogo de jogadores da liga, seus atributos, valor de mercado e cadastre
              novos atletas.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2 bg-[#155DFC] hover:bg-blue-700 text-white font-medium text-xs sm:text-sm rounded-lg shadow-xs shrink-0 cursor-pointer h-9 px-3.5"
        >
          <UserPlus className="h-4 w-4" />
          Cadastrar Jogador
        </Button>
      </div>

      {/* Filters */}
      <PlayersFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Content states */}
      {isLoading ? (
        <TableSkeleton rows={10} cols={10} />
      ) : isError ? (
        <ErrorState
          title="Erro ao carregar jogadores"
          message={error?.message || 'Falha ao buscar a lista de jogadores da API.'}
          onRetry={refetch}
        />
      ) : counts.all === 0 &&
        !filters.search &&
        !filters.position &&
        !filters.condition &&
        !filters.club_id ? (
        <EmptyState
          icon={<Users className="h-6 w-6 text-slate-500" />}
          title="Nenhum jogador cadastrado"
          description="Cadastre o primeiro atleta com nome, idade e atributos para começar a montar o mercado da liga."
          actionLabel="Cadastrar jogador"
          actionIcon={<UserPlus className="h-4 w-4" />}
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          <PlayersTable
            players={data?.data ?? []}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            counts={counts}
            sort={filters.sort || 'name'}
            onSortChange={handleSortChange}
            onResetFilters={handleResetFilters}
            onViewDetail={(p) => setDetailPlayer(p)}
            onEdit={(p) => setEditPlayer(p)}
            onChangeCondition={(p) => setConditionPlayer(p)}
            onBuy={(p) => setBuyPlayer(p)}
            onDelete={(p) => setDeletePlayer(p)}
          />

          {/* Pagination Controls */}
          {meta && meta.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-2">
              <span className="text-xs text-muted-foreground">
                Página <strong>{meta.page}</strong> de <strong>{meta.total_pages}</strong> (
                {meta.total_items} jogadores no total)
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="gap-1 text-xs cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: meta.total_pages }).map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === meta.total_pages ||
                      Math.abs(pageNum - meta.page) <= 1
                    ) {
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === meta.page ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="h-8 w-8 p-0 text-xs cursor-pointer"
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                    if (pageNum === meta.page - 2 || pageNum === meta.page + 2) {
                      return (
                        <span key={pageNum} className="px-1 text-xs text-muted-foreground">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page >= meta.total_pages}
                  className="gap-1 text-xs cursor-pointer"
                >
                  Próxima
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs & Sheets */}
      <PlayerCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <PlayerEditDialog
        player={editPlayer}
        open={Boolean(editPlayer)}
        onOpenChange={(open) => !open && setEditPlayer(null)}
      />

      <PlayerConditionDialog
        player={conditionPlayer}
        open={Boolean(conditionPlayer)}
        onOpenChange={(open) => !open && setConditionPlayer(null)}
      />

      <PlayerDetailSheet
        player={detailPlayer}
        open={Boolean(detailPlayer)}
        onOpenChange={(open) => !open && setDetailPlayer(null)}
        onEdit={(p) => setEditPlayer(p)}
        onChangeCondition={(p) => setConditionPlayer(p)}
        onBuy={(p) => setBuyPlayer(p)}
        onDelete={(p) => setDeletePlayer(p)}
      />

      <BuyPlayerDialog
        player={buyPlayer}
        open={Boolean(buyPlayer)}
        onOpenChange={(open) => !open && setBuyPlayer(null)}
        defaultClubId={defaultClubId}
      />

      <PlayerDeleteDialog
        player={deletePlayer}
        open={Boolean(deletePlayer)}
        onOpenChange={(open) => !open && setDeletePlayer(null)}
      />
    </div>
  );
}
