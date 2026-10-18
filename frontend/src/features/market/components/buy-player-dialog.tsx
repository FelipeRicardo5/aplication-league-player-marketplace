import React, { useState } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency, formatIsoForBackend } from '@/lib/formatters';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import { useToast } from '@/components/feedback/use-toast';
import type { Player } from '@/features/players/types';
import { AlertCircle } from 'lucide-react';

interface ClubDetail {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
}

interface BuyPlayerDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuyPlayerDialog({ player, open, onOpenChange }: BuyPlayerDialogProps) {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [selectedClubId, setSelectedClubId] = useState<string>('');
  // Padrão: 1 ano no futuro (365 dias)
  const defaultFutureDate = new Date();
  defaultFutureDate.setFullYear(defaultFutureDate.getFullYear() + 1);
  const defaultIso = formatIsoForBackend(defaultFutureDate).slice(0, 16); // "YYYY-MM-DDTHH:MM"

  const [loyaltyDateStr, setLoyaltyDateStr] = useState<string>(defaultIso);

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiGet<ClubDetail[]>('clubs'),
    staleTime: 1000 * 30,
  });

  const selectedClub = clubs?.find((c) => String(c.id) === selectedClubId);

  // Cálculo orientativo (a regra oficial atômica é validada pelo backend):
  // RN13: taxa de 5% se valor > 30.00
  const marketVal = player?.market_value || 0;
  const estimatedFee = marketVal > 30 ? Math.round(marketVal * 0.05 * 100) / 100 : 0;
  const estimatedTotalCost = Math.round((marketVal + estimatedFee) * 100) / 100;

  const clubCash = selectedClub?.cash || 0;
  const maxAllowedCost = clubCash / 2;
  const exceedsCashLimit = selectedClub && estimatedTotalCost > maxAllowedCost;

  const buyMutation = useMutation({
    mutationFn: async () => {
      if (!player || !selectedClubId) throw new Error('Selecione um clube comprador');

      // Formata com offset de Brasília: AAAA-MM-DDTHH:MM-03:00
      const loyaltyFormatted = `${loyaltyDateStr}:00-03:00`.replace(/:00:00/, ':00');

      return apiPost(`players/${player.id}/buy`, {
        club_id: Number(selectedClubId),
        loyalty_until: loyaltyFormatted,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      success(
        'Compra concluída!',
        `${player?.name} foi contratado pelo ${selectedClub?.name} com sucesso.`,
      );
      onOpenChange(false);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toastError('Compra recusada pela liga', err.message);
      } else {
        toastError('Erro de conexão', 'Falha ao processar a compra do jogador.');
      }
    },
  });

  if (!player) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    buyMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Comprar Jogador</DialogTitle>
          <DialogDescription>
            Contrate <strong>{player.name}</strong> para o elenco do seu clube.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo do jogador */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Posição / Overall:</span>
            <span className="font-semibold text-foreground">
              {player.position} • {player.overall} OVR
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Valor de Mercado:</span>
            <span className="font-bold text-foreground">
              {formatCurrency(player.market_value, true)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Taxa Estimada (5% se &gt; 30):</span>
            <span className="text-muted-foreground">{formatCurrency(estimatedFee, true)}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2 border-t border-border/60">
            <span className="font-semibold text-foreground">Custo Total Estimado:</span>
            <span className="font-bold text-primary text-base">
              {formatCurrency(estimatedTotalCost, true)}
            </span>
          </div>
        </div>

        {/* Alerta de 50% de caixa se exceder */}
        {exceedsCashLimit && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircle className="h-4 w-4" />
            <div>
              <AlertTitle className="text-xs font-semibold">Limite de caixa excedido</AlertTitle>
              <AlertDescription className="text-xs">
                O custo da compra ({formatCurrency(estimatedTotalCost, true)}) excede 50% do caixa
                do {selectedClub?.name} ({formatCurrency(maxAllowedCost, true)}). A API rejeitará a
                operação com status 409.
              </AlertDescription>
            </div>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Clube Comprador */}
          <div className="space-y-1.5">
            <Label htmlFor="buy-club">Clube Comprador</Label>
            <Select value={selectedClubId} onValueChange={setSelectedClubId}>
              <SelectTrigger id="buy-club">
                <SelectValue placeholder="Selecione o clube" />
              </SelectTrigger>
              <SelectContent>
                {clubs?.map((club) => (
                  <SelectItem key={club.id} value={String(club.id)}>
                    {club.name} ({club.acronym}) — Caixa: {formatCurrency(club.cash, true)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fim da Fidelidade */}
          <div className="space-y-1.5">
            <Label htmlFor="buy-loyalty">Data de Término da Fidelidade (máx. 3 anos)</Label>
            <Input
              id="buy-loyalty"
              type="datetime-local"
              value={loyaltyDateStr}
              onChange={(e) => setLoyaltyDateStr(e.target.value)}
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Formato com fuso de Brasília (UTC-3). Até 1.095 dias no futuro.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={buyMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={buyMutation.isPending}
              disabled={!selectedClubId || !loyaltyDateStr || Boolean(exceedsCashLimit)}
            >
              Confirmar Compra
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
