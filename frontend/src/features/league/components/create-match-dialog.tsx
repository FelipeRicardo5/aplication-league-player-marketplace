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
import { AlertCircle, Swords, Info } from 'lucide-react';
import { apiGet, ApiError } from '@/lib/api';
import { useCreateMatchMutation } from '../hooks/use-league';
import type { ClubSummary } from '@/features/clubs/types';
import type { Match } from '../types';
import { cn } from '@/lib/utils';

interface CreateMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatchCreated?: (match: Match) => void;
}

export function CreateMatchDialog({ open, onOpenChange, onMatchCreated }: CreateMatchDialogProps) {
  const [homeClubId, setHomeClubId] = useState<string>('');
  const [awayClubId, setAwayClubId] = useState<string>('');
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiGet<ClubSummary[]>('clubs'),
    staleTime: 1000 * 30,
  });

  const { mutate: doSimulate, isPending } = useCreateMatchMutation((match) => {
    setApiErrorMessage(null);
    onOpenChange(false);
    if (onMatchCreated) onMatchCreated(match);
  });

  const isSameClub = Boolean(homeClubId && awayClubId && homeClubId === awayClubId);

  const handleHomeChange = (val: string) => {
    setHomeClubId(val);
    setApiErrorMessage(null);
  };

  const handleAwayChange = (val: string) => {
    setAwayClubId(val);
    setApiErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeClubId || !awayClubId || isSameClub) return;

    setApiErrorMessage(null);
    doSimulate(
      {
        homeClubId: Number(homeClubId),
        awayClubId: Number(awayClubId),
      },
      {
        onError: (err: unknown) => {
          if (err instanceof ApiError) {
            setApiErrorMessage(err.message);
          } else if (err instanceof Error) {
            setApiErrorMessage(err.message);
          } else {
            setApiErrorMessage('Não foi possível realizar a partida.');
          }
        },
      },
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setApiErrorMessage(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Swords className="h-5 w-5 text-blue-600" />
            <DialogTitle className="text-lg font-bold text-slate-900">Nova partida</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Escolha o mandante e o visitante para disputar a partida.
          </DialogDescription>
        </DialogHeader>

        {/* Banner de Erro da API (Figma L04 / Barema F13) */}
        {apiErrorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-rose-800">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-xs text-rose-900">
                  A partida não pôde ser realizada
                </h4>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                  {apiErrorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {isSameClub && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-amber-800 text-xs">
            O clube mandante e o visitante devem ser agremiações diferentes.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Mandante */}
          <div className="space-y-1">
            <Label htmlFor="match-home" className="text-xs font-semibold text-slate-700">
              Mandante
            </Label>
            <Select value={homeClubId} onValueChange={handleHomeChange}>
              <SelectTrigger
                id="match-home"
                className={cn(
                  'h-9 text-xs rounded-lg border-slate-200 bg-white',
                  apiErrorMessage && 'border-rose-400 focus:ring-rose-200',
                )}
              >
                <SelectValue placeholder="Selecione o clube mandante" />
              </SelectTrigger>
              <SelectContent>
                {clubs?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name} ({c.acronym})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[11px] text-slate-400 block">
              Clube com mando de campo
            </span>
          </div>

          {/* Visitante */}
          <div className="space-y-1">
            <Label htmlFor="match-away" className="text-xs font-semibold text-slate-700">
              Visitante
            </Label>
            <Select value={awayClubId} onValueChange={handleAwayChange}>
              <SelectTrigger
                id="match-away"
                className={cn(
                  'h-9 text-xs rounded-lg border-slate-200 bg-white',
                  apiErrorMessage && 'border-rose-400 focus:ring-rose-200',
                )}
              >
                <SelectValue placeholder="Selecione o clube visitante" />
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
            <span className="text-[11px] text-slate-400 block">
              Clube que joga fora de casa
            </span>
          </div>

          {/* Regras da partida */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 space-y-1">
            <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-blue-600" />
              Regras da partida
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              A partida é disputada sem sorteio, por meio de 6 duelos táticos diretos entre os 5 titulares de cada clube conforme a RN20.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="h-9 text-xs rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              isLoading={isPending}
              disabled={!homeClubId || !awayClubId || isSameClub}
              className="h-9 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer"
            >
              Jogar partida
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
