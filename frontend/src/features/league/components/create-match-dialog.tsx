import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiGet } from '@/lib/api';
import { useCreateMatchMutation } from '../hooks/use-league';
import type { ClubSummary } from '@/features/clubs/types';
import type { Match } from '../types';
import { Swords } from 'lucide-react';

interface CreateMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatchCreated?: (match: Match) => void;
}

export function CreateMatchDialog({ open, onOpenChange, onMatchCreated }: CreateMatchDialogProps) {
  const [homeClubId, setHomeClubId] = useState<string>('');
  const [awayClubId, setAwayClubId] = useState<string>('');

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiGet<ClubSummary[]>('clubs'),
    staleTime: 1000 * 30,
  });

  const { mutate: doSimulate, isPending } = useCreateMatchMutation((match) => {
    onOpenChange(false);
    if (onMatchCreated) onMatchCreated(match);
  });

  const isSameClub = Boolean(homeClubId && awayClubId && homeClubId === awayClubId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeClubId || !awayClubId || isSameClub) return;
    doSimulate({
      homeClubId: Number(homeClubId),
      awayClubId: Number(awayClubId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Swords className="h-5 w-5 text-primary" />
            <DialogTitle>Simular Partida da Liga</DialogTitle>
          </div>
          <DialogDescription>
            Selecione o clube mandante e o visitante para disputar a partida oficial.
          </DialogDescription>
        </DialogHeader>

        {isSameClub && (
          <Alert variant="destructive" className="py-2.5">
            <AlertDescription className="text-xs">
              O clube mandante e o visitante devem ser agremiações diferentes.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="match-home">Clube Mandante</Label>
            <Select value={homeClubId} onValueChange={setHomeClubId}>
              <SelectTrigger id="match-home">
                <SelectValue placeholder="Selecione o mandante" />
              </SelectTrigger>
              <SelectContent>
                {clubs?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({c.acronym})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="match-away">Clube Visitante</Label>
            <Select value={awayClubId} onValueChange={setAwayClubId}>
              <SelectTrigger id="match-away">
                <SelectValue placeholder="Selecione o visitante" />
              </SelectTrigger>
              <SelectContent>
                {clubs?.map((c) => (
                  <SelectItem
                    key={c.id}
                    value={String(c.id)}
                    disabled={String(c.id) === homeClubId}
                  >
                    {c.name} ({c.acronym})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Explicativo */}
          <div className="rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground block">Como funciona a partida:</span>
            <p>
              A API resolve 6 duelos táticos consecutivos entre os 5 titulares de cada clube. O
              atacante testa o atributo do duelo contra o defensor correspondente.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={isPending}
              disabled={!homeClubId || !awayClubId || isSameClub}
            >
              Iniciar Partida
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
