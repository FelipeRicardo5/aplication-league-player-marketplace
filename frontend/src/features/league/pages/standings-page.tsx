import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useStandingsQuery, useMatchesQuery } from '../hooks/use-league';
import { CreateMatchDialog } from '../components/create-match-dialog';
import { formatDateTime } from '@/lib/formatters';
import { TableSkeleton } from '@/components/feedback/loading-skeleton';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { ClubSummary } from '@/features/clubs/types';
import type { Match } from '../types';
import { cn } from '@/lib/utils';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function StandingsPage() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: standings, isLoading, isError, error, refetch } = useStandingsQuery();
  const { data: matches } = useMatchesQuery();

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiGet<ClubSummary[]>('clubs'),
    staleTime: 1000 * 60,
  });

  const clubsMap = useMemo(() => {
    const map = new Map<number, ClubSummary>();
    if (clubs) {
      for (const c of clubs) map.set(c.id, c);
    }
    return map;
  }, [clubs]);

  const recentMatches = matches ? matches.slice(0, 3) : [];

  const handleMatchCreated = (match: Match) => {
    refetch();
    navigate(`/matches/${match.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header (Figma L05 / 54:150880) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shrink-0">
            <List className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Classificação</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Todos os clubes, com 3 pontos por vitória e 1 por empate.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          variant="outline"
          className="gap-1.5 shrink-0 border-slate-200 bg-white text-slate-900 hover:bg-slate-50 text-xs sm:text-sm font-medium h-9 px-3.5 rounded-lg shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Nova partida
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
          icon={<List className="h-6 w-6 text-slate-400" />}
          title="Nenhum clube na liga"
          description="Ainda não existem clubes cadastrados para compor a tabela da liga."
        />
      ) : (
        /* Layout de 2 colunas conforme Figma L05 */
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna da Esquerda: Tabela de Classificação */}
            <div className="lg:col-span-8 space-y-3">
              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 text-center text-xs font-semibold text-slate-500">
                        #
                      </TableHead>
                      <TableHead className="min-w-[160px] text-xs font-semibold text-slate-500">
                        Clube
                      </TableHead>
                      <TableHead className="w-10 text-center text-xs font-semibold text-slate-500">
                        J
                      </TableHead>
                      <TableHead className="w-10 text-center text-xs font-semibold text-slate-500">
                        V
                      </TableHead>
                      <TableHead className="w-10 text-center text-xs font-semibold text-slate-500">
                        E
                      </TableHead>
                      <TableHead className="w-10 text-center text-xs font-semibold text-slate-500">
                        D
                      </TableHead>
                      <TableHead className="w-10 text-center text-xs font-semibold text-slate-500">
                        GP
                      </TableHead>
                      <TableHead className="w-10 text-center text-xs font-semibold text-slate-500">
                        GC
                      </TableHead>
                      <TableHead className="w-12 text-center text-xs font-semibold text-slate-500">
                        SG
                      </TableHead>
                      <TableHead className="w-14 text-center text-xs font-semibold text-slate-500">
                        Pts
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((row) => {
                      const isLeader = row.position === 1;
                      const clubAcronym =
                        clubsMap.get(row.club_id)?.acronym || getInitials(row.club_name);

                      return (
                        <TableRow
                          key={row.club_id}
                          className="hover:bg-slate-50/60 transition-colors border-b border-slate-100 last:border-b-0"
                        >
                          {/* Posição */}
                          <TableCell className="text-center py-3">
                            <span
                              className={cn(
                                'inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold',
                                isLeader
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-700 font-semibold',
                              )}
                            >
                              {row.position}
                            </span>
                          </TableCell>

                          {/* Clube */}
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 items-center justify-center rounded bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 border border-slate-200/60 shrink-0">
                                {clubAcronym}
                              </span>
                              <Link
                                to={`/clubs/${row.club_id}`}
                                className="font-semibold text-xs sm:text-sm text-slate-900 underline underline-offset-2 hover:text-blue-600 transition-colors"
                              >
                                {row.club_name}
                              </Link>
                            </div>
                          </TableCell>

                          {/* Jogos (J) */}
                          <TableCell className="text-center text-xs font-sans tabular-nums text-slate-600 py-3">
                            {row.played}
                          </TableCell>

                          {/* Vitórias (V) */}
                          <TableCell className="text-center text-xs font-sans tabular-nums text-slate-600 py-3">
                            {row.wins}
                          </TableCell>

                          {/* Empates (E) */}
                          <TableCell className="text-center text-xs font-sans tabular-nums text-slate-600 py-3">
                            {row.draws}
                          </TableCell>

                          {/* Derrotas (D) */}
                          <TableCell className="text-center text-xs font-sans tabular-nums text-slate-600 py-3">
                            {row.losses}
                          </TableCell>

                          {/* Gols Pró (GP) */}
                          <TableCell className="text-center text-xs font-sans tabular-nums text-slate-600 py-3">
                            {row.goals_for}
                          </TableCell>

                          {/* Gols Contra (GC) */}
                          <TableCell className="text-center text-xs font-sans tabular-nums text-slate-600 py-3">
                            {row.goals_against}
                          </TableCell>

                          {/* Saldo de Gols (SG) */}
                          <TableCell className="text-center text-xs font-sans tabular-nums text-slate-600 py-3">
                            {row.goal_difference > 0
                              ? `+${row.goal_difference}`
                              : row.goal_difference}
                          </TableCell>

                          {/* Pontos (Pts) - Última Coluna */}
                          <TableCell className="text-center font-bold text-xs sm:text-sm text-slate-900 font-sans tabular-nums py-3">
                            {row.points}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Legenda de siglas (Figma L05) */}
                <div className="border-t border-slate-100 bg-white px-4 py-3 text-[11px] text-slate-400">
                  J: jogos · V: vitórias · E: empates · D: derrotas · GP: gols marcados · GC: gols sofridos · SG: saldo de gols · Pts: pontos
                </div>
              </div>
            </div>

            {/* Coluna da Direita: Painel Lateral (Figma L05) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Card 1: Últimas Partidas */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Últimas partidas</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Da mais recente para a mais antiga.</p>
                </div>

                {recentMatches.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Nenhuma partida disputada ainda.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 pt-1">
                    {recentMatches.map((m) => {
                      const homeWon = m.home.goals > m.away.goals;
                      const awayWon = m.away.goals > m.home.goals;

                      return (
                        <Link
                          key={m.id}
                          to={`/matches/${m.id}`}
                          className="block py-2.5 hover:bg-slate-50/60 rounded-lg px-1 transition-colors group"
                        >
                          <div className="text-[11px] text-slate-400 mb-1">
                            {formatDateTime(m.played_at)}
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-800">
                            <span
                              className={cn(
                                'truncate',
                                homeWon ? 'font-bold text-slate-900' : 'font-normal text-slate-700',
                              )}
                            >
                              {m.home.club_name}
                            </span>
                            <span className="shrink-0 mx-2 inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-900 text-xs tabular-nums">
                              {m.home.goals} × {m.away.goals}
                            </span>
                            <span
                              className={cn(
                                'truncate text-right',
                                awayWon ? 'font-bold text-slate-900' : 'font-normal text-slate-700',
                              )}
                            >
                              {m.away.club_name}
                            </span>
                          </div>
                        </Link>
                      );
                    })}

                    <div className="pt-3 text-center">
                      <Link
                        to="/matches"
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        Ver todas as partidas →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Ordem da Tabela (Figma L05) */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ordem da tabela</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Critérios de classificação, nesta ordem.</p>
                </div>

                <div className="space-y-2.5 pt-1">
                  {[
                    { num: 1, text: 'Mais pontos' },
                    { num: 2, text: 'Maior saldo de gols' },
                    { num: 3, text: 'Mais gols marcados' },
                    { num: 4, text: 'Nome do clube, de A a Z' },
                  ].map((item) => (
                    <div key={item.num} className="flex items-center gap-2.5 text-xs text-slate-700">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px] shrink-0">
                        {item.num}
                      </span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Nota de rodapé da RN21 (Figma L05) */}
          <p className="text-xs text-slate-400 pt-1">
            Classificação de 1 a 6, com os clubes sem partidas zerados. Pontos, saldo e posição são calculados a cada consulta, nunca gravados (RN21).
          </p>
        </div>
      )}

      {/* Modal para simular/criar nova partida */}
      <CreateMatchDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onMatchCreated={handleMatchCreated}
      />
    </div>
  );
}
