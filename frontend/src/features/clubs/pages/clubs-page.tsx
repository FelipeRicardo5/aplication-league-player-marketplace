import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClubsTable } from '../components/clubs-table';
import { ClubCreateDialog } from '../components/club-create-dialog';
import { useClubsQuery } from '../hooks/use-clubs';
import { TableSkeleton } from '@/components/feedback/loading-skeleton';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';

export function ClubsPage() {
  const navigate = useNavigate();
  const [sort, setSort] = useState<string>('net_worth_desc');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: clubs, isLoading, isError, error, refetch } = useClubsQuery(sort);

  return (
    <div className="space-y-6">
      {/* Header Conforme Figma node 9-35767 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/90 shadow-2xs shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clubes</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Cada clube começa com 300,00 em caixa e sem jogadores. A liga aceita no máximo 20
              clubes.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm rounded-lg shadow-xs shrink-0 cursor-pointer h-9 px-3.5"
        >
          <Plus className="h-4 w-4" />
          Novo clube
        </Button>
      </div>

      {/* Content states */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : isError ? (
        <ErrorState
          title="Erro ao carregar clubes"
          message={error?.message || 'Falha ao buscar a lista de clubes da liga.'}
          onRetry={refetch}
        />
      ) : clubs && clubs.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-6 w-6 text-slate-500" />}
          title="Nenhum clube cadastrado"
          description="Crie o primeiro clube com nome e sigla. Ele começa com 300,00 em caixa e sem jogadores."
          actionLabel="Novo clube"
          actionIcon={<Plus className="h-4 w-4" />}
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <ClubsTable clubs={clubs ?? []} sort={sort} onSortChange={setSort} />
      )}

      {/* Create Dialog */}
      <ClubCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={(newClub) => navigate(`/clubs/${newClub.id}`)}
      />
    </div>
  );
}
