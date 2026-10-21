import { useMemo } from 'react';
import { Trophy, RefreshCw, Calendar, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { useStandingsQuery, useMatchesQuery } from '../hooks/use-league';
import { formatDateTime } from '@/lib/formatters';
import { TableSkeleton } from '@/components/feedback/loading-skeleton';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { ClubSummary } from '@/features/clubs/types';
import { cn } from '@/lib/utils';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function StandingsPage() {
  const { data: standings, isLoading, isError, error, refetch, isFetching } = useStandingsQuery();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Classificação Geral
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tabela de pontuação dinâmica calculada oficialmente pelo regulamento da liga.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          isLoading={isFetching}
          className="gap-2 shrink-0 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium h-9 px-3.5 rounded-lg cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4 text-slate-500" />
          Atualizar Tabela
        </Button>
      </div>

      {/* Content states */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <TableSkeleton rows={8} cols={10} />
        </div>
      ) : isError ? (
        <ErrorState
          title="Erro ao carregar classificação"
          message={error?.message || 'Falha ao buscar a tabela da liga.'}
          onRetry={refetch}
        />
      ) : !standings || standings.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-6 w-6 text-slate-400" />}
          title="Nenhum clube na liga"
          description="Ainda não existem clubes cadastrados para compor a tabela da liga."
        />
      ) : (
        /* Layout de 2 colunas conforme Figma L05 */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna da Esquerda: Tabela de Classificação */}
          <div className="lg:col-span-8 space-y-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center text-xs font-semibold text-slate-600">
                      Pos
                    </TableHead>
                    <TableHead className="min-w-[160px] text-xs font-semibold text-slate-600">
                      Clube
                    </TableHead>
                    <TableHead className="w-10 text-center text-xs font-semibold text-slate-600">
                      J
                    </TableHead>
                    <TableHead className="w-10 text-center text-xs font-semibold text-slate-600">
                      V
                    </TableHead>
                    <TableHead className="w-10 text-center text-xs font-semibold text-slate-600">
                      E
                    </TableHead>
                    <TableHead className="w-10 text-center text-xs font-semibold text-slate-600">
                      D
                    </TableHead>
                    <TableHead className="w-10 text-center text-xs font-semibold text-slate-600">
                      GP
                    </TableHead>
                    <TableHead className="w-10 text-center text-xs font-semibold text-slate-600">
                      GC
                    </TableHead>
                    <TableHead className="w-12 text-center text-xs font-semibold text-slate-600">
                      SG
                    </TableHead>
                    <TableHead className="w-14 text-center text-xs font-bold text-slate-900">
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
                        className={cn(
                          'hover:bg-slate-50/60 transition-colors',
                          isLeader && 'bg-blue-50/30',
                        )}
                      >
                        {/* Posição */}
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold font-mono',
                              isLeader
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'text-slate-600 bg-slate-100',
                            )}
                          >
                            {row.position}º
                          </span>
                        </TableCell>

                        {/* Clube */}
                        <TableCell>
                          <Link
                            to={`/clubs/${row.club_id}`}
                            className="font-semibold text-sm text-slate-900 hover:text-blue-600 hover:underline transition-colors flex items-center gap-2"
                          >
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 shrink-0">
                              {clubAcronym}
                            </span>
                            <span>{row.club_name}</span>
                            {isLeader && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Líder
                              </span>
                            )}
                          </Link>
                        </TableCell>

                        {/* Jogos (J) */}
                        <TableCell className="text-center text-xs font-sans tabular-nums text-slate-600">
                          {row.played}
                        </TableCell>

                        {/* Vitórias (V) */}
                        <TableCell className="text-center text-xs font-sans tabular-nums text-slate-900 font-medium">
                          {row.wins}
                        </TableCell>

                        {/* Empates (E) */}
                        <TableCell className="text-center text-xs font-sans tabular-nums text-slate-600">
                          {row.draws}
                        </TableCell>

                        {/* Derrotas (D) */}
                        <TableCell className="text-center text-xs font-sans tabular-nums text-slate-600">
                          {row.losses}
                        </TableCell>

                        {/* Gols Pró (GP) */}
                        <TableCell className="text-center text-xs font-sans tabular-nums text-slate-600">
                          {row.goals_for}
                        </TableCell>

                        {/* Gols Contra (GC) */}
                        <TableCell className="text-center text-xs font-sans tabular-nums text-slate-600">
                          {row.goals_against}
                        </TableCell>

                        {/* Saldo de Gols (SG) */}
                        <TableCell className="text-center text-xs font-sans tabular-nums font-semibold">
                          <span
                            className={
                              row.goal_difference > 0
                                ? 'text-[#016630]'
                                : row.goal_difference < 0
                                  ? 'text-[#BF000F]'
                                  : 'text-slate-600'
                            }
                          >
                            {row.goal_difference > 0
                              ? `+${row.goal_difference}`
                              : row.goal_difference}
                          </span>
                        </TableCell>

                        {/* Pontos (Pts) - Última Coluna Conforme FIGMA-018 */}
                        <TableCell className="text-center font-bold text-sm text-slate-900 font-sans tabular-nums">
                          {row.points}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Legenda de siglas */}
              <div className="border-t border-slate-200/80 bg-slate-50/50 px-4 py-2.5 text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                <span><strong>J:</strong> Jogos</span>
                <span>•</span>
                <span><strong>V:</strong> Vitórias</span>
                <span>•</span>
                <span><strong>E:</strong> Empates</span>
                <span>•</span>
                <span><strong>D:</strong> Derrotas</span>
                <span>•</span>
                <span><strong>GP:</strong> Gols Pró</span>
                <span>•</span>
                <span><strong>GC:</strong> Gols Contra</span>
                <span>•</span>
                <span><strong>SG:</strong> Saldo de Gols</span>
                <span>•</span>
                <span><strong>Pts:</strong> Pontos</span>
              </div>
            </div>

            {/* Nota da RN21 */}
            <p className="text-[11px] text-slate-500">
              * A classificação é recalculada e ordenada automaticamente a cada partida realizada (RN21).
            </p>
          </div>

          {/* Coluna da Direita: Painel Lateral (Figma L05) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Card 1: Últimas Partidas */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Últimas partidas
                </h3>
                <p className="text-xs text-slate-500">
                  Resultados dos confrontos mais recentes da liga
                </p>
              </div>

              {recentMatches.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  Nenhuma partida disputada ainda.
                </p>
              ) : (
                <div className="space-y-2 pt-1">
                  {recentMatches.map((m) => {
                    const homeAcronym =
                      clubsMap.get(m.home.club_id)?.acronym || getInitials(m.home.club_name);
                    const awayAcronym =
                      clubsMap.get(m.away.club_id)?.acronym || getInitials(m.away.club_name);

                    return (
                      <Link
                        key={m.id}
                        to={`/matches/${m.id}`}
                        className="block p-2.5 rounded-xl border border-slate-200/80 hover:border-blue-200 hover:bg-slate-50/80 transition-colors group"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>{formatDateTime(m.played_at)}</span>
                          <span className="text-blue-600 font-medium group-hover:underline flex items-center gap-0.5">
                            Ver duelos <ArrowRight className="h-2.5 w-2.5" />
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-semibold text-xs text-slate-900">
                          <span className="flex items-center gap-1.5">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[9px] font-bold">
                              {homeAcronym}
                            </span>
                            {m.home.club_name}
                          </span>
                          <span className="font-bold tabular-nums px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 text-xs">
                            {m.home.goals} - {m.away.goals}
                          </span>
                          <span className="flex items-center gap-1.5">
                            {m.away.club_name}
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[9px] font-bold">
                              {awayAcronym}
                            </span>
                          </span>
                        </div>
                      </Link>
                    );
                  })}

                  <div className="pt-1">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium justify-center h-8 cursor-pointer"
                    >
                      <Link to="/matches">
                        Ver todas as partidas
                        <ArrowRight className="h-3 w-3 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Ordem da Tabela / Critérios de Desempate (Figma L05) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-slate-600" />
                  Ordem da tabela
                </h3>
                <p className="text-xs text-slate-500">
                  Critérios de ordenação e desempate oficiais
                </p>
              </div>

              <ol className="space-y-2 text-xs text-slate-600 pt-1">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span><strong>Pontos:</strong> Vitória vale 3 pts, Empate vale 1 pt e Derrota vale 0 pt.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span><strong>Número de vitórias:</strong> Maior quantidade de vitórias.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span><strong>Saldo de gols:</strong> Gols Pró (GP) menos Gols Contra (GC).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] shrink-0 mt-0.5">
                    4
                  </span>
                  <span><strong>Gols marcados:</strong> Maior quantidade de gols pró (GP).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] shrink-0 mt-0.5">
                    5
                  </span>
                  <span><strong>Confronto direto:</strong> Entre os clubes empatados.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] shrink-0 mt-0.5">
                    6
                  </span>
                  <span><strong>Sorteio:</strong> Pela coordenação da liga (RN21).</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
