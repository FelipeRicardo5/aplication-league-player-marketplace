import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import type { Player, Position } from '../types';
import { CheckCircle2, UserPlus, ListFilter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerSuccessDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegisterAnother?: () => void;
}

const getPositionBadge = (pos: Position) => {
  const styles: Record<Position, string> = {
    GOL: 'bg-amber-50 text-amber-700 border-amber-200/80',
    ZAG: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    LAT: 'bg-teal-50 text-teal-700 border-teal-200/80',
    MEI: 'bg-blue-50 text-blue-700 border-blue-200/80',
    ATA: 'bg-rose-50 text-rose-700 border-rose-200/80',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border shadow-2xs',
        styles[pos] || 'bg-slate-100 text-slate-700 border-slate-200',
      )}
    >
      {pos}
    </span>
  );
};

export function PlayerSuccessDialog({
  player,
  open,
  onOpenChange,
  onRegisterAnother,
}: PlayerSuccessDialogProps) {
  if (!player) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 mb-2 shadow-2xs">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Jogador Cadastrado com Sucesso!
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            O atleta foi registrado na liga como Agente Livre e está disponível no mercado.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo do Jogador */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 my-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">{player.name}</span>
              {getPositionBadge(player.position)}
            </div>
            <Badge variant="success" dot className="rounded-md">
              Apto
            </Badge>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/80">
            <div className="bg-white rounded-lg border border-slate-200 p-2 text-center shadow-2xs">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
                Overall
              </span>
              <span className="text-base font-bold font-mono text-blue-600 tabular-nums">
                {player.overall}
              </span>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-2 text-center shadow-2xs">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
                Agilidade
              </span>
              <span className="text-base font-bold font-mono text-slate-800 tabular-nums">
                {player.agility}
              </span>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-2 text-center shadow-2xs">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
                Idade
              </span>
              <span className="text-base font-bold font-mono text-slate-800 tabular-nums">
                {player.age}
              </span>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-2 text-center shadow-2xs">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
                Base
              </span>
              <span className="text-xs font-bold font-mono text-slate-900 tabular-nums truncate block">
                {formatCurrency(player.base_value, true)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          {onRegisterAnother && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onRegisterAnother();
              }}
              className="gap-1.5 w-full sm:w-auto rounded-md"
            >
              <UserPlus className="h-4 w-4" />
              Cadastrar Outro
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            onClick={() => onOpenChange(false)}
            className="gap-1.5 w-full sm:w-auto rounded-md"
          >
            <ListFilter className="h-4 w-4" />
            Ver na Listagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
