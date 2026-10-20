import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface BuyTransactionResult {
  id: number;
  club_id: number;
  club_name?: string;
  club_acronym?: string;
  player_id: number;
  player_name: string;
  player_position?: string;
  type: 'COMPRA';
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
  created_at: string;
  contract: {
    purchase_value: number;
    loyalty_until: string;
    status: 'ATIVO';
  };
  club_cash: number;
}

interface BuyPlayerSuccessDialogProps {
  transaction: BuyTransactionResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BuyPlayerSuccessDialog({
  transaction,
  open,
  onOpenChange,
}: BuyPlayerSuccessDialogProps) {
  const navigate = useNavigate();

  if (!transaction) return null;

  const totalCost = Math.abs(transaction.cash_change);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 mb-2 shadow-2xs">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Compra realizada com sucesso!
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1 max-w-sm">
            <strong>{transaction.player_name}</strong> foi contratado pelo{' '}
            <strong>{transaction.club_name || 'clube'}</strong> e agora integra o elenco.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo da Transação */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 my-2 text-xs">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/70">
            <span className="text-slate-500">Jogador contratado:</span>
            <span className="font-bold text-slate-900">
              {transaction.player_name}{' '}
              {transaction.player_position && (
                <span className="font-mono text-slate-500 font-normal">
                  ({transaction.player_position})
                </span>
              )}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/70">
            <span className="text-slate-500">Clube comprador:</span>
            <span className="font-bold text-slate-900">
              {transaction.club_name || `Clube #${transaction.club_id}`}{' '}
              {transaction.club_acronym && (
                <span className="font-mono text-slate-500 font-normal">
                  ({transaction.club_acronym})
                </span>
              )}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Valor de mercado:</span>
            <span className="font-semibold text-slate-800 tabular-nums">
              {formatCurrency(transaction.value, false)} moedas
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Taxa de compra (5% se &gt; 30):</span>
            <span className="font-semibold text-slate-800 tabular-nums">
              {formatCurrency(transaction.fee, false)} moedas
            </span>
          </div>

          <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/70">
            <span className="font-bold text-slate-900">Custo total debitado:</span>
            <span className="font-bold text-blue-600 text-sm tabular-nums">
              {formatCurrency(totalCost, false)} moedas
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Novo caixa do clube:</span>
            <span className="font-semibold text-slate-800 tabular-nums">
              {formatCurrency(transaction.club_cash, false)} moedas
            </span>
          </div>

          <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/70">
            <span className="text-slate-500">Fim da fidelidade:</span>
            <span className="font-medium text-slate-900">
              {formatDateTime(transaction.contract.loyalty_until)}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs h-9 px-4 rounded-lg cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Fechar
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              navigate(`/clubs/${transaction.club_id}`);
            }}
            className="text-xs h-9 px-4 rounded-lg cursor-pointer bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs"
          >
            <span>Ver elenco do clube</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
