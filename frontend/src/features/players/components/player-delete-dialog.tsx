import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useDeletePlayerMutation } from '../hooks/use-players';
import type { Player } from '../types';

interface PlayerDeleteDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerDeleteDialog({ player, open, onOpenChange }: PlayerDeleteDialogProps) {
  const { mutate: doDelete, isPending } = useDeletePlayerMutation(() => {
    onOpenChange(false);
  });

  if (!player) return null;

  const handleDelete = () => {
    doDelete(player.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-1">
            <AlertTriangle className="h-5 w-5 text-[#BF000F]" />
            <DialogTitle>Excluir Jogador</DialogTitle>
          </div>
          <DialogDescription>
            Tem certeza que deseja excluir <strong>{player.name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <p className="text-xs text-muted-foreground my-2">
          Esta operação realiza a exclusão lógica do jogador. Ele não aparecerá mais em listagens ou
          no mercado, mas seus dados históricos em transações e partidas anteriores permanecerão
          preservados para auditoria da liga.
        </p>

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
            type="button"
            variant="destructive"
            onClick={handleDelete}
            isLoading={isPending}
            className="rounded-md"
          >
            Confirmar Exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
