import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClubSchema, type CreateClubFormInput } from '../schemas/club.schema';
import { useCreateClubMutation } from '../hooks/use-clubs';
import { Shield } from 'lucide-react';

interface ClubCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClubCreateDialog({ open, onOpenChange }: ClubCreateDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClubFormInput>({
    resolver: zodResolver(createClubSchema),
    defaultValues: {
      name: '',
      acronym: '',
    },
  });

  const { mutate: doCreateClub, isPending } = useCreateClubMutation(() => {
    reset();
    onOpenChange(false);
  });

  const onSubmit = (data: CreateClubFormInput) => {
    doCreateClub(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>Cadastrar Novo Clube</DialogTitle>
          </div>
          <DialogDescription>
            Registre um clube na liga com limite de até 20 agremiações ativas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="club-name">Nome do Clube (2 a 5 palavras)</Label>
            <Input
              id="club-name"
              placeholder="Ex.: Águias Futebol Clube"
              {...register('name')}
              error={Boolean(errors.name)}
            />
            {errors.name && <p className="text-xs text-[#BF000F]">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="club-acronym">Sigla (3 letras maiúsculas)</Label>
            <Input
              id="club-acronym"
              placeholder="Ex.: AFC"
              maxLength={3}
              className="uppercase font-mono"
              {...register('acronym')}
              error={Boolean(errors.acronym)}
            />
            {errors.acronym && <p className="text-xs text-[#BF000F]">{errors.acronym.message}</p>}
            <p className="text-[11px] text-muted-foreground">
              A 1ª letra deve ser a inicial do nome e as demais devem ocorrer no nome em ordem.
            </p>
          </div>

          {/* Caixa inicial */}
          <div className="rounded-xl border border-border bg-secondary/30 p-3 flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Caixa Inicial Padrão:</span>
            <span className="font-bold text-foreground">300,00</span>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="default" isLoading={isPending}>
              Criar Clube
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
