import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Swords, Plus, Calendar, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateTime } from '@/lib/formatters';
import { useMatchesQuery } from '../hooks/use-league';
import { CreateMatchDialog } from '../components/create-match-dialog';
import { TableSkeleton } from '@/components/feedback/loading-skeleton';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { ClubSummary } from '@/features/clubs/types';
import type { Match } from '../types';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function MatchesPage() {
  const navigate = useNavigate();
  const [selectedClubId, setSelectedClubId] = useState<number | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiGet<ClubSummary[]>('clubs'),
    staleTime: 1000 * 60,
  });

  const { data: matches, isLoading, isError, error, refetch } = useMatchesQuery(selectedClubId);

  const clubsMap = useMemo(() => {
    const map = new Map<number, ClubSummary>();
    if (clubs) {
      for (const c of clubs) map.set(c.id, c);
    }
    return map;
  }, [clubs]);

  const latestMatch = matches && matches.length > 0 ? matches[0] : null;

  const handleMatchCreated = (match: Match) => {
    navigate(`/matches/${match.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header (Figma L01) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Partidas</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Histórico de confrontos e simulação de novas partidas da liga.
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2 shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium h-9 px-3.5 rounded-lg shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Nova partida
        </Button>
      </div>

      {/* Card de Destaque: Último confronto realizado (Figma L01) */}
      {latestMatch && !selectedClubId && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              Último confronto
            </span>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDateTime(latestMatch.played_at)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            {/* Mandante */}
            <div className="flex items-center gap-3 flex-1 justify-end order-1 sm:order-1 text-right">
              <div>
                <span className="font-bold text-base text-slate-900 block">
                  {latestMatch.home.club_name}
                </span>
                <span className="text-[11px] text-slate-500">Mandante</span>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-800 font-bold text-sm border border-slate-200 shrink-0">
                {clubsMap.get(latestMatch.home.club_id)?.acronym ||
                  getInitials(latestMatch.home.club_name)}
              </div>
            </div>

            {/* Placar Central */}
            <div className="flex flex-col items-center justify-center px-5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0 order-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans tabular-nums">
                {latestMatch.home.goals} - {latestMatch.away.goals}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Tempo regulamentar</span>
            </div>

            {/* Visitante */}
            <div className="flex items-center gap-3 flex-1 justify-start order-3 sm:order-3 text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-800 font-bold text-sm border border-slate-200 shrink-0">
                {clubsMap.get(latestMatch.away.club_id)?.acronym ||
                  getInitials(latestMatch.away.club_name)}
              </div>
              <div>
                <span className="font-bold text-base text-slate-900 block">
                  {latestMatch.away.club_name}
                </span>
                <span className="text-[11px] text-slate-500">Visitante</span>
              </div>
            </div>

            {/* Ação */}
            <div className="order-4 sm:order-4 shrink-0 sm:pl-4">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <Link to={`/matches/${latestMatch.id}`}>
                  <Eye className="h-3.5 w-3.5 text-slate-500" />
                  Ver duelos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Seção do Histórico com Filtro de Clube */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Histórico de confrontos</h2>
            <p className="text-xs text-slate-500">
              Partidas disputadas em ordem cronológica reversa
            </p>
          </div>

          <div className="w-[200px] sm:w-[220px]">
            <Select
              value={selectedClubId ? String(selectedClubId) : 'ALL'}
              onValueChange={(val) => setSelectedClubId(val === 'ALL' ? undefined : Number(val))}
            >
              <SelectTrigger
                aria-label="Filtrar partidas por clube"
                className="h-8 text-xs rounded-lg border-slate-200 bg-white"
              >
                <SelectValue placeholder="Filtrar por clube" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os clubes</SelectItem>
                {clubs?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({c.acronym})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content states */}
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : isError ? (
          <ErrorState
            title="Erro ao carregar partidas"
            message={error?.message || 'Falha ao buscar o histórico de partidas da liga.'}
            onRetry={refetch}
          />
        ) : !matches || matches.length === 0 ? (
          <EmptyState
            icon={<Swords className="h-6 w-6 text-slate-500" />}
            title="Nenhuma partida disputada"
            description="Ainda não foram jogadas partidas na liga ou para o clube selecionado."
            actionLabel="Nova partida"
            actionIcon={<Plus className="h-4 w-4" />}
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[130px] text-xs font-semibold text-slate-600">
                    Data e hora
                  </TableHead>
                  <TableHead className="min-w-[160px] text-xs font-semibold text-slate-600">
                    Mandante
                  </TableHead>
                  <TableHead className="w-[100px] text-center text-xs font-semibold text-slate-600">
                    Placar
                  </TableHead>
                  <TableHead className="min-w-[160px] text-xs font-semibold text-slate-600">
                    Visitante
                  </TableHead>
                  <TableHead className="w-[140px] text-center text-xs font-semibold text-slate-600">
                    Resultado
                  </TableHead>
                  <TableHead className="w-[110px] text-right text-xs font-semibold text-slate-600">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((m) => {
                  const homeAcronym =
                    clubsMap.get(m.home.club_id)?.acronym || getInitials(m.home.club_name);
                  const awayAcronym =
                    clubsMap.get(m.away.club_id)?.acronym || getInitials(m.away.club_name);

                  return (
                    <TableRow key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* 1. Data e hora */}
                      <TableCell className="text-xs font-sans text-slate-600 whitespace-nowrap tabular-nums">
                        {formatDateTime(m.played_at)}
                      </TableCell>

                      {/* 2. Mandante */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 shrink-0">
                            {homeAcronym}
                          </span>
                          <span className="font-bold text-sm text-slate-900">
                            {m.home.club_name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono bg-slate-50 border border-slate-200 rounded px-1.5 py-0.2">
                            {m.home.formation}
                          </span>
                        </div>
                      </TableCell>

                      {/* 3. Placar */}
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center font-bold font-sans text-xs tabular-nums px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-slate-900">
                          {m.home.goals} - {m.away.goals}
                        </span>
                      </TableCell>

                      {/* 4. Visitante */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {m.away.club_name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono bg-slate-50 border border-slate-200 rounded px-1.5 py-0.2">
                            {m.away.formation}
                          </span>
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 shrink-0">
                            {awayAcronym}
                          </span>
                        </div>
                      </TableCell>

                      {/* 5. Resultado */}
                      <TableCell className="text-center">
                        {m.result === 'MANDANTE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            Vitória Mandante
                          </span>
                        ) : m.result === 'VISITANTE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                            Vitória Visitante
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Empate
                          </span>
                        )}
                      </TableCell>

                      {/* 6. Ações */}
                      <TableCell className="text-right">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs gap-1 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md cursor-pointer"
                        >
                          <Link to={`/matches/${m.id}`}>
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            Ver duelos
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Rodapé da tabela com contagem e paginação */}
            <div className="border-t border-slate-200/80 bg-slate-50/50 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
              <span>
                {matches.length} {matches.length === 1 ? 'partida realizada' : 'partidas realizadas'}
              </span>
            </div>
          </div>
        )}

        {/* Nota da RN20 / RN21 */}
        <p className="text-[11px] text-slate-500">
          * Toda partida grava o placar e os 6 duelos táticos e nunca é recalculada nem editada (RN20, RN21).
        </p>
      </div>

      {/* Modal Nova Partida */}
      <CreateMatchDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onMatchCreated={handleMatchCreated}
      />
    </div>
  );
}
