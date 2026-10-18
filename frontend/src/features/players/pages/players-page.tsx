import { useState } from 'react';
import { UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
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
import type { Player, QueryPlayersParams } from '../types';

export function PlayersPage() {
  const [filters, setFilters] = useState<QueryPlayersParams>({
    page: 1,
    limit: 10,
    sort: 'name',
  });

  // Modais e Sheets
  const [createOpen, setCreateOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [conditionPlayer, setConditionPlayer] = useState<Player | null>(null);
  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
  const [deletePlayer, setDeletePlayer] = useState<Player | null>(null);
  const [buyPlayer, setBuyPlayer] = useState<Player | null>(null);

  const { data, isLoading, isError, error, refetch } = usePlayersQuery(filters);

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Jogadores</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie o elenco da liga, consulte valores de mercado calculados e cadastre novos
            atletas.
          </p>
        </div>

        <Button onClick={() => setCreateOpen(true)} className="gap-2 shadow-xs shrink-0">
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
        <TableSkeleton rows={10} cols={7} />
      ) : isError ? (
        <ErrorState
          title="Erro ao carregar jogadores"
          message={error?.message || 'Falha ao buscar a lista de jogadores da API.'}
          onRetry={refetch}
        />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Nenhum jogador encontrado"
          description="Nenhum atleta corresponde aos filtros aplicados. Tente ajustar os parâmetros de busca."
          actionLabel="Limpar Filtros"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="space-y-4">
          <PlayersTable
            players={data.data}
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
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: meta.total_pages }).map((_, i) => {
                    const pageNum = i + 1;
                    // Mostra primeira, última, e páginas ao redor da atual
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
                          className="h-8 w-8 p-0 text-xs"
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
                  className="gap-1 text-xs"
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

      <PlayerDeleteDialog
        player={deletePlayer}
        open={Boolean(deletePlayer)}
        onOpenChange={(open) => !open && setDeletePlayer(null)}
      />

      <BuyPlayerDialog
        player={buyPlayer}
        open={Boolean(buyPlayer)}
        onOpenChange={(open) => !open && setBuyPlayer(null)}
      />
    </div>
  );
}
