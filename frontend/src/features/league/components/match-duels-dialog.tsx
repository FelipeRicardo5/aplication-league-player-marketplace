import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/formatters';
import { useMatchDetailQuery } from '../hooks/use-league';
import { Swords, CheckCircle2 } from 'lucide-react';
import type { Match } from '../types';

interface MatchDuelsDialogProps {
  match: Match | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MatchDuelsDialog({ match, open, onOpenChange }: MatchDuelsDialogProps) {
  const matchId = match?.id || null;
  const { data: detailedMatch, isLoading } = useMatchDetailQuery(matchId);

  const currentMatch = detailedMatch || match;

  if (!currentMatch) return null;

  const duels = currentMatch.duels || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Swords className="h-5 w-5 text-primary" />
            <DialogTitle>Duelos da Partida #{currentMatch.id}</DialogTitle>
          </div>
          <DialogDescription>{formatDateTime(currentMatch.played_at)}</DialogDescription>
        </DialogHeader>

        {/* Placar Header */}
        <div className="rounded-xl border border-border bg-secondary/30 p-4 text-center my-2">
          <div className="flex items-center justify-around">
            <div className="text-center flex-1">
              <span className="font-bold text-base text-foreground block truncate">
                {currentMatch.home.club_name}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {currentMatch.home.formation}
              </span>
            </div>

            <div className="flex items-center gap-3 px-4">
              <span className="text-3xl font-extrabold font-mono text-foreground">
                {currentMatch.home.goals}
              </span>
              <span className="text-xl font-bold text-muted-foreground">×</span>
              <span className="text-3xl font-extrabold font-mono text-foreground">
                {currentMatch.away.goals}
              </span>
            </div>

            <div className="text-center flex-1">
              <span className="font-bold text-base text-foreground block truncate">
                {currentMatch.away.club_name}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {currentMatch.away.formation}
              </span>
            </div>
          </div>
        </div>

        {/* 6 Duelos */}
        <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Detalhamento dos 6 Duelos
          </h4>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Carregando duelos...
            </div>
          ) : duels.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Nenhum detalhe de duelo disponível para esta partida.
            </div>
          ) : (
            duels.map((duel) => {
              const isHomeAttacking = duel.attacking_club_id === currentMatch.home.club_id;
              const attackingClubName = isHomeAttacking
                ? currentMatch.home.club_name
                : currentMatch.away.club_name;

              return (
                <div
                  key={duel.order}
                  className={`p-3 rounded-xl border transition-all ${
                    duel.goal ? 'border-[#B9F8CF] bg-[#F0FDF4]/50' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-muted-foreground">
                      Duelo #{duel.order} • Ataque: {attackingClubName}
                    </span>
                    {duel.goal ? (
                      <Badge variant="success" className="gap-1 font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        GOL!
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-[10px]">
                        Defendido
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Atacante */}
                    <div className="rounded-lg bg-secondary/50 p-2">
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                        Atacante
                      </span>
                      <span className="font-semibold text-foreground truncate block">
                        {duel.attacker.player_name} ({duel.attacker.position})
                      </span>
                      <div className="flex justify-between items-center mt-1 text-muted-foreground">
                        <span>{duel.attacker.attribute}:</span>
                        <span className="font-mono font-bold text-foreground">
                          {duel.attacker.value}
                        </span>
                      </div>
                    </div>

                    {/* Defensor */}
                    <div className="rounded-lg bg-secondary/50 p-2">
                      <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                        Defensor
                      </span>
                      <span className="font-semibold text-foreground truncate block">
                        {duel.defender.player_name} ({duel.defender.position})
                      </span>
                      <div className="flex justify-between items-center mt-1 text-muted-foreground">
                        <span>{duel.defender.attribute}:</span>
                        <span className="font-mono font-bold text-foreground">
                          {duel.defender.value}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
