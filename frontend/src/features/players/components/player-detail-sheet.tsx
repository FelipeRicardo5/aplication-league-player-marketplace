import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import type { Player } from '../types';
import { Edit, HeartPulse, ShoppingCart, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

interface ClubSummary {
  id: number;
  name: string;
  acronym: string;
}

interface PlayerDetailSheetProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (player: Player) => void;
  onChangeCondition: (player: Player) => void;
  onBuy: (player: Player) => void;
  onDelete: (player: Player) => void;
}

export function PlayerDetailSheet({
  player,
  open,
  onOpenChange,
  onEdit,
  onChangeCondition,
  onBuy,
  onDelete,
}: PlayerDetailSheetProps) {
  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiGet<ClubSummary[]>('clubs'),
    staleTime: 1000 * 60,
  });

  if (!player) return null;

  const club = clubs?.find((c) => c.id === player.club_id);

  const attributes = [
    { label: 'Velocidade (VEL)', value: player.pace },
    { label: 'Finalização (FIN)', value: player.shooting },
    { label: 'Passe (PAS)', value: player.passing },
    { label: 'Drible (DRI)', value: player.dribbling },
    { label: 'Defesa (DEF)', value: player.defending },
    { label: 'Físico (FIS)', value: player.physical },
    { label: 'Potencial (POT)', value: player.potential },
    { label: 'Agilidade (AGI)', value: player.agility, max: 100 },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col h-full">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg border border-primary/20 shrink-0">
              {player.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-xl">{player.name}</SheetTitle>
                <Badge variant="secondary" className="font-mono text-xs">
                  {player.position}
                </Badge>
              </div>
              <SheetDescription className="text-xs">
                ID #{player.id} • {player.age} anos • {player.condition}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Overall & Finanças */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-medium">
              Overall
            </span>
            <span className="text-2xl font-bold font-mono text-primary">{player.overall}</span>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-medium">
              Valor Base
            </span>
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(player.base_value, true)}
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider block font-medium">
              Mercado
            </span>
            <span className="text-sm font-bold text-foreground">
              {formatCurrency(player.market_value, true)}
            </span>
          </div>
        </div>

        {/* Situação Contratual */}
        <div className="rounded-xl border border-border bg-secondary/50 p-4 mb-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Situação Contratual
          </h4>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Clube Atual:</span>
            {club ? (
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="h-4 w-4 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                  {club.acronym}
                </span>
                {club.name}
              </span>
            ) : (
              <Badge variant="outline">Agente Livre</Badge>
            )}
          </div>
        </div>

        {/* Atributos com Barras de Progresso */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Atributos Técnicos
          </h4>
          <div className="space-y-2.5">
            {attributes.map((attr) => {
              const max = attr.max || 99;
              const percent = Math.min(100, Math.round((attr.value / max) * 100));

              return (
                <div key={attr.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">{attr.label}</span>
                    <span className="font-mono font-semibold text-foreground">{attr.value}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions Footer */}
        <SheetFooter className="gap-2 pt-4 border-t border-border mt-auto">
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit(player);
              }}
              className="gap-1.5"
            >
              <Edit className="h-3.5 w-3.5" />
              Editar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onChangeCondition(player);
              }}
              className="gap-1.5"
            >
              <HeartPulse className="h-3.5 w-3.5" />
              Condição
            </Button>

            {player.club_id === null ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onBuy(player);
                }}
                className="col-span-2 gap-1.5"
              >
                <ShoppingCart className="h-4 w-4" />
                Comprar Jogador
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                disabled={player.club_id !== null}
                onClick={() => {
                  onOpenChange(false);
                  onDelete(player);
                }}
                className="col-span-2 gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Excluir (Indisponível: tem clube)
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
