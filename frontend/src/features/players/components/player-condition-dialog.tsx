import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useUpdateConditionMutation } from '../hooks/use-players';
import type { Player } from '../types';
import { cn } from '@/lib/utils';

interface PlayerConditionDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerConditionDialog({ player, open, onOpenChange }: PlayerConditionDialogProps) {
  const [selectedCondition, setSelectedCondition] = useState<
    'APTO' | 'MAL_CONDICIONADO' | 'DOENTE'
  >('APTO');

  useEffect(() => {
    if (player) {
      if (player.condition === 'LESIONADO') {
        setSelectedCondition('MAL_CONDICIONADO');
      } else {
        setSelectedCondition(player.condition as 'APTO' | 'MAL_CONDICIONADO' | 'DOENTE');
      }
    }
  }, [player]);

  const { mutate: doUpdateCondition, isPending } = useUpdateConditionMutation(() => {
    onOpenChange(false);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;
    doUpdateCondition({
      id: player.id,
      data: { condition: selectedCondition },
    });
  };

  const isTransitionFromDoenteToApto =
    player?.condition === 'DOENTE' && selectedCondition === 'APTO';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Condição Física</DialogTitle>
          <DialogDescription>
            Defina o estado físico de #{player?.id} - {player?.name}.
          </DialogDescription>
        </DialogHeader>

        {/* Warning if selecting DOENTE and player has club */}
        {selectedCondition === 'DOENTE' && player?.club_id !== null && (
          <Alert variant="warning" className="py-2.5">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <AlertTitle className="text-xs font-semibold">Atenção à escalação</AlertTitle>
              <AlertDescription className="text-xs">
                Ao passar a Doente, se o jogador for titular ele sairá automaticamente da escalação,
                tornando-a incompleta até que 5 titulares sejam definidos novamente.
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Rule 409 transition prevention notice */}
        {isTransitionFromDoenteToApto && (
          <Alert variant="destructive" className="py-2.5">
            <AlertDescription className="text-xs">
              Transição direta de DOENTE para APTO não é permitida pela liga. O jogador deve passar
              primeiro por MAL_CONDICIONADO.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <RadioGroup
            value={selectedCondition}
            onValueChange={(val) =>
              setSelectedCondition(val as 'APTO' | 'MAL_CONDICIONADO' | 'DOENTE')
            }
            className="space-y-2.5"
          >
            <div
              className={cn(
                'flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-all duration-150',
                selectedCondition === 'APTO'
                  ? 'border-emerald-300 bg-emerald-50/50 shadow-2xs ring-1 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              <RadioGroupItem value="APTO" id="cond-apto" className="mt-0.5" />
              <Label htmlFor="cond-apto" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-1.5 font-semibold text-sm text-[#016630]">
                  <span className="h-2 w-2 rounded-full bg-[#016630]" />
                  <span>Apto</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pronto para atuar em partidas com rendimento total.
                </p>
              </Label>
            </div>

            <div
              className={cn(
                'flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-all duration-150',
                selectedCondition === 'MAL_CONDICIONADO'
                  ? 'border-amber-300 bg-amber-50/50 shadow-2xs ring-1 ring-amber-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              <RadioGroupItem value="MAL_CONDICIONADO" id="cond-mal" className="mt-0.5" />
              <Label htmlFor="cond-mal" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-1.5 font-semibold text-sm text-[#953D00]">
                  <span className="h-2 w-2 rounded-full bg-[#953D00]" />
                  <span>Mal condicionado</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pode atuar, mas sofre desconto de 15% em seus atributos durante duelos de partida.
                </p>
              </Label>
            </div>

            <div
              className={cn(
                'flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-all duration-150',
                selectedCondition === 'DOENTE'
                  ? 'border-rose-300 bg-rose-50/50 shadow-2xs ring-1 ring-rose-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              <RadioGroupItem value="DOENTE" id="cond-doente" className="mt-0.5" />
              <Label htmlFor="cond-doente" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-1.5 font-semibold text-sm text-[#BF000F]">
                  <span className="h-2 w-2 rounded-full bg-[#BF000F]" />
                  <span>Doente</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Impossibilitado de jogar. É removido da escalação se titular.
                </p>
              </Label>
            </div>
          </RadioGroup>

          <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="rounded-md"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={isPending}
              disabled={isTransitionFromDoenteToApto}
              className="rounded-md"
            >
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
