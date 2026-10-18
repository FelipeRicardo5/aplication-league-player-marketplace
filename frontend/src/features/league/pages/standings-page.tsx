import { Trophy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useStandingsQuery } from '../hooks/use-league';
import { TableSkeleton } from '@/components/feedback/loading-skeleton';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';

export function StandingsPage() {
  const { data: standings, isLoading, isError, error, refetch, isFetching } = useStandingsQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Classificação Geral
          </h1>
          <p className="text-sm text-muted-foreground">
            Tabela de pontuação dinâmica calculada oficialmente pelo regulamento da liga.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          isLoading={isFetching}
          className="gap-2 shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar Tabela
        </Button>
      </div>

      {/* Content states */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={10} />
      ) : isError ? (
        <ErrorState
          title="Erro ao carregar classificação"
          message={error?.message || 'Falha ao buscar a tabela da liga.'}
          onRetry={refetch}
        />
      ) : !standings || standings.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-6 w-6 text-muted-foreground" />}
          title="Nenhum clube na liga"
          description="Ainda não existem clubes cadastrados para compor a tabela da liga."
        />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Pos</TableHead>
                <TableHead>Clube</TableHead>
                <TableHead className="text-center font-bold">P</TableHead>
                <TableHead className="text-center">J</TableHead>
                <TableHead className="text-center">V</TableHead>
                <TableHead className="text-center">E</TableHead>
                <TableHead className="text-center">D</TableHead>
                <TableHead className="text-center">GP</TableHead>
                <TableHead className="text-center">GC</TableHead>
                <TableHead className="text-center">SG</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((row) => {
                const isLeader = row.position === 1;
                const isG3 = row.position <= 3;

                return (
                  <TableRow key={row.club_id} className={isLeader ? 'bg-amber-500/5' : undefined}>
                    {/* Posição */}
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold font-mono ${
                          isLeader
                            ? 'bg-amber-500 text-white'
                            : isG3
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {row.position}º
                      </span>
                    </TableCell>

                    {/* Clube */}
                    <TableCell>
                      <Link
                        to={`/clubs/${row.club_id}`}
                        className="font-semibold text-sm text-foreground hover:text-primary hover:underline transition-colors flex items-center gap-2"
                      >
                        <span>{row.club_name}</span>
                        {isLeader && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-600 border-amber-300"
                          >
                            Líder
                          </Badge>
                        )}
                      </Link>
                    </TableCell>

                    {/* Pontos (P) */}
                    <TableCell className="text-center font-extrabold text-base text-foreground font-mono">
                      {row.points}
                    </TableCell>

                    {/* Jogos (J) */}
                    <TableCell className="text-center text-sm font-mono text-muted-foreground">
                      {row.played}
                    </TableCell>

                    {/* Vitórias (V) */}
                    <TableCell className="text-center text-sm font-mono text-foreground font-medium">
                      {row.wins}
                    </TableCell>

                    {/* Empates (E) */}
                    <TableCell className="text-center text-sm font-mono text-muted-foreground">
                      {row.draws}
                    </TableCell>

                    {/* Derrotas (D) */}
                    <TableCell className="text-center text-sm font-mono text-muted-foreground">
                      {row.losses}
                    </TableCell>

                    {/* Gols Pró (GP) */}
                    <TableCell className="text-center text-sm font-mono text-muted-foreground">
                      {row.goals_for}
                    </TableCell>

                    {/* Gols Contra (GC) */}
                    <TableCell className="text-center text-sm font-mono text-muted-foreground">
                      {row.goals_against}
                    </TableCell>

                    {/* Saldo de Gols (SG) */}
                    <TableCell className="text-center text-sm font-mono font-semibold">
                      <span
                        className={
                          row.goal_difference > 0
                            ? 'text-[#016630]'
                            : row.goal_difference < 0
                              ? 'text-[#BF000F]'
                              : 'text-muted-foreground'
                        }
                      >
                        {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
