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
import type { Player, Condition, Position } from '../types';
import { Edit, HeartPulse, ShoppingCart, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';

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

const getConditionBadge = (condition: Condition) => {
  switch (condition) {
    case 'APTO':
      return (
        <Badge variant="success" dot className="rounded-md">
          Apto
        </Badge>
      );
    case 'MAL_CONDICIONADO':
      return (
        <Badge variant="warning" dot className="rounded-md">
          Mal condicionado
        </Badge>
      );
    case 'LESIONADO':
      return (
        <Badge variant="destructive" dot className="rounded-md">
          Lesionado
        </Badge>
      );
    case 'DOENTE':
      return (
        <Badge variant="destructive" dot className="rounded-md">
          Doente
        </Badge>
      );
  }
};

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
    { label: 'Velocidade', code: 'VEL', value: player.pace, max: 99 },
    { label: 'Finalização', code: 'FIN', value: player.shooting, max: 99 },
    { label: 'Passe', code: 'PAS', value: player.passing, max: 99 },
    { label: 'Drible', code: 'DRI', value: player.dribbling, max: 99 },
    { label: 'Defesa', code: 'DEF', value: player.defending, max: 99 },
    { label: 'Físico', code: 'FIS', value: player.physical, max: 99 },
    { label: 'Agilidade', code: 'AGI', value: player.agility, max: 100 },
  ];

  const potentialPercent = Math.min(100, Math.round((player.potential / 99) * 100));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col h-full w-full sm:max-w-md p-6">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-lg border border-blue-200/80 shrink-0">
              {player.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg font-bold text-slate-900">{player.name}</SheetTitle>
                {getPositionBadge(player.position)}
              </div>
              <SheetDescription asChild>
                <div className="text-xs flex items-center gap-2 text-slate-500">
                  <span>#{player.id}</span>
                  <span>•</span>
                  <span>{player.age} anos</span>
                  <span>•</span>
                  {getConditionBadge(player.condition)}
                </div>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* 4 KPIs Superiores (Figma J12): Overall, Agilidade, Idade, Potencial */}
        <div className="grid grid-cols-4 gap-2 my-4">
          <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-2xs">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
              Overall
            </span>
            <span className="text-xl font-bold font-mono text-blue-600 block mt-0.5 tabular-nums">
              {player.overall}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-2xs">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
              Agilidade
            </span>
            <span className="text-xl font-bold font-mono text-slate-800 block mt-0.5 tabular-nums">
              {player.agility}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-2xs">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
              Idade
            </span>
            <span className="text-xl font-bold font-mono text-slate-800 block mt-0.5 tabular-nums">
              {player.age}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-2xs">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-medium">
              Potencial
            </span>
            <span className="text-xl font-bold font-mono text-indigo-600 block mt-0.5 tabular-nums">
              {player.potential}
            </span>
          </div>
        </div>

        {/* Valores e Contrato */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 mb-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Situação Contratual:</span>
            {club ? (
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="h-4 w-4 rounded bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                  {club.acronym}
                </span>
                {club.name}
              </span>
            ) : (
              <Badge
                variant="outline"
                className="text-[11px] font-medium text-slate-600 bg-white border-slate-200 rounded-md"
              >
                Agente Livre
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-medium block">
                Valor Base
              </span>
              <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums">
                {formatCurrency(player.base_value, true)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-medium block">
                Valor de Mercado
              </span>
              <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                {formatCurrency(player.market_value, true)}
              </span>
            </div>
          </div>
        </div>

        {/* Atributos com Barras de Progresso e Marca de Potencial (Figma J12 / FIGMA-013) */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Atributos Técnicos
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Escala 1 a 99</span>
          </div>

          <div className="space-y-2.5">
            {attributes.map((attr) => {
              const currentPercent = Math.min(
                100,
                Math.max(0, Math.round((attr.value / attr.max) * 100)),
              );

              return (
                <div key={attr.code} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                      {attr.label}{' '}
                      <span className="text-slate-400 font-mono text-[10px]">({attr.code})</span>
                    </span>
                    <span className="font-mono font-semibold text-slate-800 tabular-nums">
                      {attr.value}
                    </span>
                  </div>
                  {/* Barra dupla: teto translúcido do potencial + preenchimento atual */}
                  <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                    {/* Marcação translúcida de teto de potencial (rgba(21,93,252,0.22)) */}
                    <div
                      className="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-300"
                      style={{
                        width: `${potentialPercent}%`,
                        backgroundColor: 'rgba(21, 93, 252, 0.22)',
                      }}
                      title={`Teto de potencial: ${player.potential}`}
                    />
                    {/* Valor atual */}
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${currentPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legenda visual da barra dupla */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-xs bg-blue-600 inline-block" /> Atributo Atual
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-3 rounded-xs inline-block"
                style={{ backgroundColor: 'rgba(21, 93, 252, 0.22)' }}
              />{' '}
              Teto Potencial ({player.potential})
            </span>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <SheetFooter className="gap-2 pt-4 border-t border-slate-200 mt-auto">
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit(player);
              }}
              className="gap-1.5 rounded-md"
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
              className="gap-1.5 rounded-md"
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
                className="col-span-2 gap-1.5 rounded-md"
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
                className="col-span-2 gap-1.5 rounded-md"
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
