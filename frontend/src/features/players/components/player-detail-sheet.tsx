import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import type { Player, Condition, Position } from '../types';
import {
  Coins,
  Tag,
  BarChart2,
  TrendingUp,
  SquarePen,
  HeartPulse,
  ShoppingCart,
} from 'lucide-react';
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
  onDelete?: (player: Player) => void;
}

const getPositionBadge = (pos: Position) => {
  return (
    <span className="inline-flex items-center justify-center font-sans text-xs font-medium text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 bg-white shadow-2xs">
      {pos}
    </span>
  );
};

const getConditionBadge = (condition: Condition) => {
  switch (condition) {
    case 'APTO':
      return (
        <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Apto
        </span>
      );
    case 'MAL_CONDICIONADO':
      return (
        <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-amber-700 px-2 py-0.5 rounded-md border border-amber-200 bg-amber-50">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
          Mal condicionado
        </span>
      );
    case 'DOENTE':
      return (
        <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-rose-700 px-2 py-0.5 rounded-md border border-rose-200 bg-rose-50">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
          Doente
        </span>
      );
    case 'LESIONADO':
      return (
        <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-rose-700 px-2 py-0.5 rounded-md border border-rose-200 bg-rose-50">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
          Lesionado
        </span>
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
}: PlayerDetailSheetProps) {
  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiGet<ClubSummary[]>('clubs'),
    staleTime: 1000 * 60,
  });

  if (!player) return null;

  const club = clubs?.find((c) => c.id === player.club_id);

  const technicalAttributes = [
    { label: 'Velocidade', value: player.pace },
    { label: 'Finalização', value: player.shooting },
    { label: 'Passe', value: player.passing },
    { label: 'Drible', value: player.dribbling },
    { label: 'Defesa', value: player.defending },
    { label: 'Físico', value: player.physical },
  ];

  const initials = player.name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col h-full w-full sm:max-w-md p-6 bg-white overflow-y-auto"
      >
        {/* Header Conforme Figma J12 / node 52-135991 */}
        <SheetHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs shrink-0 border border-slate-200">
              {initials}
            </div>
            <div className="space-y-1 min-w-0">
              <SheetTitle className="text-base font-bold text-slate-900 truncate">
                {player.name}
              </SheetTitle>
              <SheetDescription asChild>
                <div className="flex items-center gap-1.5">
                  {getPositionBadge(player.position)}
                  {getConditionBadge(player.condition)}
                  {club ? (
                    <span className="inline-flex items-center gap-1 font-sans text-xs font-medium text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 bg-white">
                      <span className="font-bold text-[10px] text-slate-600">{club.acronym}</span>
                      <span className="truncate max-w-[120px]">{club.name}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center font-sans text-xs font-medium text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 bg-white">
                      Livre
                    </span>
                  )}
                </div>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* 4 KPIs Superiores em Grade 2x2 Fiel ao Figma */}
        <div className="grid grid-cols-2 gap-3 my-4">
          {/* Card 1: Valor de mercado */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Valor de mercado</span>
              <Coins className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 font-sans tabular-nums">
              {formatCurrency(player.market_value, false)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Calculado automaticamente
            </span>
          </div>

          {/* Card 2: Valor base */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Valor base</span>
              <Tag className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 font-sans tabular-nums">
              {formatCurrency(player.base_value, false)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Calculado no cadastro</span>
          </div>

          {/* Card 3: Overall */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Overall</span>
              <BarChart2 className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 font-sans tabular-nums">
              {player.overall}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Calculado pela posição</span>
          </div>

          {/* Card 4: Potencial */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Potencial</span>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2 font-sans tabular-nums">
              {player.potential}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Informado no cadastro</span>
          </div>
        </div>

        {/* Seção Indicadores técnicos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Indicadores técnicos</h4>
            <span className="text-xs text-slate-400">Escala de 1 a 99</span>
          </div>

          <div className="space-y-3">
            {technicalAttributes.map((attr) => {
              const currentPercent = Math.min(
                100,
                Math.max(0, Math.round((attr.value / 99) * 100)),
              );
              const potentialPercent = Math.min(
                100,
                Math.max(0, Math.round((player.potential / 99) * 100)),
              );

              return (
                <div key={attr.label} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 font-medium w-24 shrink-0">
                    {attr.label}
                  </span>
                  <div className="relative h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                    {/* Teto de potencial translúcido */}
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-blue-200 rounded-full transition-all duration-300"
                      style={{ width: `${potentialPercent}%` }}
                      title={`Teto de potencial: ${player.potential}`}
                    />
                    {/* Valor do atributo atual */}
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${currentPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold font-sans text-slate-900 w-6 text-right tabular-nums">
                    {attr.value}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legenda visual da barra dupla */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
              <span>Valor do atributo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-200 inline-block" />
              <span>Até o potencial ({player.potential}), que nenhum atributo passa</span>
            </div>
          </div>
        </div>

        {/* Card Informativo com Idade, Agilidade e Clube */}
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 my-4 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 text-xs">
            <span className="text-slate-600">Idade</span>
            <span className="font-bold text-slate-900 font-sans tabular-nums">
              {player.age} anos
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-xs">
            <span className="text-slate-600">Agilidade</span>
            <span className="font-bold text-slate-900 font-sans tabular-nums">
              {player.agility}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-xs">
            <span className="text-slate-600">Clube</span>
            <span className="font-bold text-slate-900">{club ? club.name : 'Livre'}</span>
          </div>
        </div>

        {/* Rodapé de Ações Fiel ao Figma */}
        <SheetFooter className="pt-4 border-t border-slate-100 mt-auto flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit(player);
              }}
              className="h-9 px-3 text-xs font-medium text-slate-700 border-slate-200 rounded-lg hover:bg-slate-50 gap-1.5 cursor-pointer"
            >
              <SquarePen className="h-3.5 w-3.5 text-slate-500" />
              <span>Editar</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onChangeCondition(player);
              }}
              className="h-9 px-3 text-xs font-medium text-slate-700 border-slate-200 rounded-lg hover:bg-slate-50 gap-1.5 cursor-pointer"
            >
              <HeartPulse className="h-3.5 w-3.5 text-slate-500" />
              <span>Alterar condição</span>
            </Button>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onBuy(player);
            }}
            className="h-9 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-1.5 cursor-pointer"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Comprar</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
