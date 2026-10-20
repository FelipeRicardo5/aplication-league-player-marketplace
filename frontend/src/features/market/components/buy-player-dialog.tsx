import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/formatters';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import { useToast } from '@/components/feedback/use-toast';
import type { Player, Position } from '@/features/players/types';
import { AlertCircle, AlertTriangle, ShoppingCart, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BuyPlayerSuccessDialog,
  type BuyTransactionResult,
} from './buy-player-success-dialog';

interface ClubDetail {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
  players?: { id: number }[];
}

interface BuyPlayerDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClubId?: number;
  onSuccess?: (transaction: BuyTransactionResult) => void;
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

export function BuyPlayerDialog({
  player,
  open,
  onOpenChange,
  defaultClubId,
  onSuccess,
}: BuyPlayerDialogProps) {
  const queryClient = useQueryClient();
  const { success } = useToast();

  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [successTransaction, setSuccessTransaction] = useState<BuyTransactionResult | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  // Inicializa data (1 ano no futuro) e hora (12:00)
  const [loyaltyDate, setLoyaltyDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [loyaltyTime, setLoyaltyTime] = useState<string>('12:00');

  useEffect(() => {
    if (open) {
      setApiError(null);
      if (defaultClubId) {
        setSelectedClubId(String(defaultClubId));
      }
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      setLoyaltyDate(d.toISOString().slice(0, 10));
      setLoyaltyTime('12:00');
    }
  }, [open, defaultClubId, player?.id]);

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiGet<ClubDetail[]>('clubs'),
    staleTime: 1000 * 30,
  });

  const selectedClub = clubs?.find((c) => String(c.id) === selectedClubId);

  // RN13: taxa de 5% se valor > 30.00
  const marketVal = player?.market_value || 0;
  const estimatedFee = marketVal > 30 ? Math.round(marketVal * 0.05 * 100) / 100 : 0;
  const estimatedTotalCost = Math.round((marketVal + estimatedFee) * 100) / 100;

  const clubCash = selectedClub?.cash || 0;
  const maxAllowedCost = clubCash / 2;
  const exceedsCashLimit = selectedClub && estimatedTotalCost > maxAllowedCost;
  const remainingCash = Math.round((clubCash - estimatedTotalCost) * 100) / 100;
  const squadCount = selectedClub?.players?.length ?? 0;
  const isSquadFull = squadCount >= 12;

  const buyMutation = useMutation({
    mutationFn: async () => {
      if (!player || !selectedClubId) throw new Error('Selecione um clube comprador');

      const loyaltyFormatted = `${loyaltyDate}T${loyaltyTime}-03:00`;

      return apiPost<BuyTransactionResult>(`players/${player.id}/buy`, {
        club_id: Number(selectedClubId),
        loyalty_until: loyaltyFormatted,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      const enrichedResult: BuyTransactionResult = {
        ...data,
        club_name: selectedClub?.name,
        club_acronym: selectedClub?.acronym,
        player_position: player?.position,
      };

      success(
        'Compra concluída!',
        `${player?.name} foi contratado pelo ${selectedClub?.name || 'clube'} com sucesso.`,
      );

      // Fecha o modal de compra e abre o modal de sucesso (Figma M05)
      onOpenChange(false);
      setSuccessTransaction(enrichedResult);
      setSuccessOpen(true);
      if (onSuccess) onSuccess(enrichedResult);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('Não foi possível processar a compra do jogador.');
      }
    },
  });

  if (!player) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    buyMutation.mutate();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <span>Comprar jogador</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Contrate o atleta livre para o elenco do clube, definindo o contrato e o término da fidelidade.
            </DialogDescription>
          </DialogHeader>

          {/* Banner de Erro/Recusa da API (Figma M02 / M03 / M06 / M07) */}
          {apiError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 flex items-start gap-2.5 text-rose-700 my-2">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-rose-700">A compra foi recusada</p>
                <p className="text-xs text-rose-600 leading-relaxed">{apiError}</p>
              </div>
            </div>
          )}

          {/* Resumo do Jogador Selecionado */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 my-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{player.name}</span>
                {getPositionBadge(player.position)}
              </div>
              <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Apto
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 text-center">
              <div className="bg-white rounded-lg border border-slate-200 p-2 shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                  Overall
                </span>
                <span className="text-base font-bold font-sans text-blue-600 tabular-nums">
                  {player.overall}
                </span>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-2 shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                  Valor
                </span>
                <span className="text-xs font-bold font-sans text-slate-800 tabular-nums">
                  {formatCurrency(player.market_value, false)}
                </span>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 p-2 shadow-2xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                  Taxa (5%)
                </span>
                <span className="text-xs font-bold font-sans text-slate-800 tabular-nums">
                  {formatCurrency(estimatedFee, false)}
                </span>
              </div>

              <div className="bg-white rounded-lg border border-blue-200 bg-blue-50/30 p-2 shadow-2xs">
                <span className="text-[10px] text-blue-700 uppercase tracking-wider block font-medium">
                  Custo Total
                </span>
                <span className="text-xs font-bold font-sans text-blue-700 tabular-nums">
                  {formatCurrency(estimatedTotalCost, false)}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seletor de Clube Comprador */}
            <div className="space-y-1.5">
              <Label htmlFor="buy-club" className="text-xs font-bold text-slate-900">
                Clube comprador
              </Label>
              <Select
                value={selectedClubId}
                onValueChange={(val) => {
                  setSelectedClubId(val);
                  setApiError(null);
                }}
              >
                <SelectTrigger
                  id="buy-club"
                  aria-label="Selecionar clube comprador"
                  className="h-9 text-xs bg-white border-slate-200 rounded-lg cursor-pointer"
                >
                  <SelectValue placeholder="Selecione o clube que irá contratar" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {clubs?.map((club) => (
                    <SelectItem key={club.id} value={String(club.id)} className="text-xs cursor-pointer">
                      <span className="font-semibold text-slate-900">{club.name}</span>{' '}
                      <span className="font-mono text-slate-400">({club.acronym})</span>{' '}
                      <span className="text-slate-500 font-sans ml-1">
                        — Caixa: {formatCurrency(club.cash, false)} moedas
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Informações financeiras do clube selecionado */}
              {selectedClub && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Caixa atual do clube:</span>
                    <strong className="text-slate-900 font-sans tabular-nums">
                      {formatCurrency(clubCash, false)} moedas
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Limite de compra (50% do caixa):</span>
                    <strong className="text-slate-900 font-sans tabular-nums">
                      {formatCurrency(maxAllowedCost, false)} moedas
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/60">
                    <span>Caixa restante previsto:</span>
                    <strong
                      className={cn(
                        'font-sans tabular-nums font-bold',
                        remainingCash >= 0 ? 'text-emerald-700' : 'text-rose-600',
                      )}
                    >
                      {formatCurrency(remainingCash, false)} moedas
                    </strong>
                  </div>
                </div>
              )}

              {/* Alerta de 50% de caixa */}
              {exceedsCashLimit && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 flex items-start gap-2 text-amber-800 mt-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    O custo ({formatCurrency(estimatedTotalCost, false)}) excede 50% do caixa do{' '}
                    {selectedClub?.name} ({formatCurrency(maxAllowedCost, false)}). A API rejeitará a
                    compra (RN13).
                  </p>
                </div>
              )}

              {/* Alerta de Elenco Cheio */}
              {isSquadFull && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 flex items-start gap-2 text-amber-800 mt-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    O {selectedClub?.name} já atingiu o limite de 12 jogadores no elenco (RN14).
                  </p>
                </div>
              )}
            </div>

            {/* Fim da Fidelidade do Contrato (Inputs separados de Data e Hora conforme Figma) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-900">
                Fim da fidelidade do contrato
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="loyalty-date" className="text-[10px] text-slate-500 block mb-1">
                    Data
                  </Label>
                  <Input
                    id="loyalty-date"
                    type="date"
                    value={loyaltyDate}
                    onChange={(e) => {
                      setLoyaltyDate(e.target.value);
                      setApiError(null);
                    }}
                    required
                    className="h-9 text-xs bg-white border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="loyalty-time" className="text-[10px] text-slate-500 block mb-1">
                    Hora
                  </Label>
                  <Input
                    id="loyalty-time"
                    type="time"
                    value={loyaltyTime}
                    onChange={(e) => {
                      setLoyaltyTime(e.target.value);
                      setApiError(null);
                    }}
                    required
                    className="h-9 text-xs bg-white border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                Horário de Brasília (UTC-3). A fidelidade deve ser uma data futura de até 3 anos (1.095 dias).
              </p>
            </div>

            {/* Aviso de Regras da Liga */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 flex items-start gap-2.5 text-slate-600">
              <Shield className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-slate-500">
                O contrato nasce ATIVO. Se o clube vender o jogador antes do fim da fidelidade, pagará multa à liga (RN15). O clube não poderá recomprar este jogador depois (RN12).
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={buyMutation.isPending}
                className="h-9 px-4 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                isLoading={buyMutation.isPending}
                disabled={!selectedClubId || !loyaltyDate || !loyaltyTime || buyMutation.isPending}
                className="h-9 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer gap-1.5"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Confirmar compra</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Sucesso Pós-Compra (Figma node 54:143944 / M05) */}
      <BuyPlayerSuccessDialog
        transaction={successTransaction}
        open={successOpen}
        onOpenChange={setSuccessOpen}
      />
    </>
  );
}
