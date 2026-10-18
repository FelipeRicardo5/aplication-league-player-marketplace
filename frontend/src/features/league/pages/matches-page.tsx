import { useState } from 'react';
import { Swords, PlusCircle, Calendar, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { MatchDuelsDialog } from '../components/match-duels-dialog';
import { CardSkeleton } from '@/components/feedback/loading-skeleton';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { ClubSummary } from '@/features/clubs/types';
import type { Match } from '../types';

export function MatchesPage() {
  const [selectedClubId, setSelectedClubId] = useState<number | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiGet<ClubSummary[]>('clubs'),
    staleTime: 1000 * 60,
  });

  const { data: matches, isLoading, isError, error, refetch } = useMatchesQuery(selectedClubId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Partidas da Liga</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o histórico de confrontos, simule novas partidas e analise os duelos
            individuais.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro por clube */}
          <div className="w-[180px] sm:w-[220px]">
            <Select
              value={selectedClubId ? String(selectedClubId) : 'ALL'}
              onValueChange={(val) => setSelectedClubId(val === 'ALL' ? undefined : Number(val))}
            >
              <SelectTrigger aria-label="Filtrar partidas por clube">
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

          <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
            <PlusCircle className="h-4 w-4" />
            Simular Partida
          </Button>
        </div>
      </div>

      {/* Content states */}
      {isLoading ? (
        <CardSkeleton count={4} />
      ) : isError ? (
        <ErrorState
          title="Erro ao carregar partidas"
          message={error?.message || 'Falha ao buscar o histórico de partidas da liga.'}
          onRetry={refetch}
        />
      ) : !matches || matches.length === 0 ? (
        <EmptyState
          icon={<Swords className="h-6 w-6 text-muted-foreground" />}
          title="Nenhuma partida disputada"
          description="Ainda não foram jogadas partidas na liga ou para o clube selecionado."
          actionLabel="Simular Primeira Partida"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => (
            <Card key={match.id} className="p-5 border-border hover:shadow-xs transition-shadow">
              <CardContent className="p-0 space-y-4">
                {/* Meta info header */}
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/60 pb-2.5">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateTime(match.played_at)}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    Partida #{match.id}
                  </Badge>
                </div>

                {/* Scorecard */}
                <div className="flex items-center justify-between py-1">
                  {/* Mandante */}
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-base text-foreground truncate">
                      {match.home.club_name}
                    </h3>
                    <span className="text-xs text-muted-foreground font-mono">
                      Formação: {match.home.formation}
                    </span>
                  </div>

                  {/* Placar central */}
                  <div className="flex items-center gap-3 px-4 shrink-0">
                    <span className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
                      {match.home.goals}
                    </span>
                    <span className="text-lg font-bold text-muted-foreground">×</span>
                    <span className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
                      {match.away.goals}
                    </span>
                  </div>

                  {/* Visitante */}
                  <div className="flex-1 text-right">
                    <h3 className="font-bold text-base text-foreground truncate">
                      {match.away.club_name}
                    </h3>
                    <span className="text-xs text-muted-foreground font-mono">
                      Formação: {match.away.formation}
                    </span>
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {match.result === 'MANDANTE' && (
                      <span className="text-[#016630] font-medium">
                        Vitória do {match.home.club_name}
                      </span>
                    )}
                    {match.result === 'VISITANTE' && (
                      <span className="text-primary font-medium">
                        Vitória do {match.away.club_name}
                      </span>
                    )}
                    {match.result === 'EMPATE' && (
                      <span className="text-muted-foreground font-medium">Empate</span>
                    )}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveMatch(match)}
                    className="gap-1.5 text-xs text-primary hover:text-primary"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver 6 duelos
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateMatchDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onMatchCreated={(m) => setActiveMatch(m)}
      />

      <MatchDuelsDialog
        match={activeMatch}
        open={Boolean(activeMatch)}
        onOpenChange={(open) => !open && setActiveMatch(null)}
      />
    </div>
  );
}
