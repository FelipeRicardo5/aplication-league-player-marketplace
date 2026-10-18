import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { apiPost, ApiError } from '@/lib/api';
import { useToast } from '@/components/feedback/use-toast';
import type { ClubPlayer } from '@/features/clubs/types';
import { AlertTriangle, TrendingUp } from 'lucide-react';

interface SellPlayerDialogProps {
  player: ClubPlayer | null;
  clubId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SellPlayerDialog({ player, clubId, open, onOpenChange }: SellPlayerDialogProps) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const sellMutation = useMutation({
    mutationFn: async () => {
      if (!player) throw new Error('Jogador não selecionado');
      return apiPost<{
        id: number;
        value: number;
        fee: number;
        penalty: number;
        profit: number | null;
        cash_change: number;
        club_cash: number;
      }>(`players/${player.id}/sell`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['lineups', clubId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', clubId] });

      success(
        'Venda concluída!',
        `${player?.name} vendido por ${formatCurrency(data.value, true)}. Crédito no caixa: ${formatCurrency(data.cash_change, true)}. Novo caixa: ${formatCurrency(data.club_cash, true)}.`,
      );
      onOpenChange(false);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        error('Venda recusada pela liga', err.message);
      } else {
        error('Erro inesperado', 'Falha ao processar a venda do jogador.');
      }
    },
  });

  if (!player) return null;

  const contract = player.contract;
  const isLoyal = contract ? contract.remaining_days > 0 : false;

  const handleConfirm = () => {
    sellMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-warning mb-1">
            <TrendingUp className="h-5 w-5 text-primary" />
            <DialogTitle>Vender Jogador</DialogTitle>
          </div>
          <DialogDescription>
            Confirme a rescisão contratual e venda de <strong>{player.name}</strong> para o mercado.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo do contrato e valores */}
        <div className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Valor de Mercado Atual:</span>
            <span className="font-bold text-foreground">
              {formatCurrency(player.market_value, true)}
            </span>
          </div>

          {contract && (
            <>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Valor Original de Compra:</span>
                <span>{formatCurrency(contract.purchase_value, true)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Fidelidade Restante:</span>
                <span className={isLoyal ? 'text-warning font-semibold' : 'text-[#016630]'}>
                  {contract.remaining_days > 0
                    ? `${contract.remaining_days} dias (${formatPercent(contract.penalty_rate)} de multa)`
                    : 'Fidelidade cumprida (sem multa)'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Alerta de quebra de contrato se houver multa */}
        {isLoyal && (
          <Alert variant="warning" className="py-2.5">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <AlertTitle className="text-xs font-semibold">
                Rescisão com multa contratual
              </AlertTitle>
              <AlertDescription className="text-xs">
                O contrato de fidelidade ainda está ativo ({contract?.remaining_days} dias). A liga
                aplicará multa de {contract?.penalty_rate}% sobre o valor de mercado (teto de 10,00)
                e comissão progressiva sobre eventual lucro.
              </AlertDescription>
            </div>
          </Alert>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sellMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleConfirm}
            isLoading={sellMutation.isPending}
          >
            Confirmar Venda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
