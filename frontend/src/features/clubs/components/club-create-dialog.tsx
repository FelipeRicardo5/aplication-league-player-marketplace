import { useState } from 'react';
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
import { Shield, Wallet, AlertCircle } from 'lucide-react';
import { ApiError } from '@/lib/api';
import type { ClubSummary } from '../types';
import { cn } from '@/lib/utils';

interface ClubCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (club: ClubSummary) => void;
}

export function ClubCreateDialog({ open, onOpenChange, onSuccess }: ClubCreateDialogProps) {
  const [apiError, setApiError] = useState<string | null>(null);

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

  const { mutate: doCreateClub, isPending } = useCreateClubMutation((newClub) => {
    reset();
    setApiError(null);
    onOpenChange(false);
    if (onSuccess) onSuccess(newClub);
  });

  const onSubmit = (data: CreateClubFormInput) => {
    setApiError(null);
    doCreateClub(data, {
      onError: (err) => {
        if (err instanceof ApiError) {
          setApiError(err.message);
        } else {
          setApiError('Não foi possível registrar o clube. Verifique os dados informados.');
        }
      },
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setApiError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white rounded-2xl shadow-lg border border-slate-200">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base font-bold text-slate-900">
            Novo clube
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Informe o nome e a sigla do clube.
          </DialogDescription>
        </DialogHeader>

        {/* Banner de Erro da API conforme Figma node 54-139627 */}
        {apiError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 flex items-start gap-2.5 text-rose-700">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-rose-700">Não foi possível criar o clube</p>
              <p className="text-xs text-rose-600 leading-relaxed">{apiError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Campo Nome com ícone de escudo */}
          <div className="space-y-1.5">
            <Label htmlFor="club-name" className="text-xs font-semibold text-slate-700">
              Nome
            </Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="club-name"
                placeholder="Leões da Serra"
                {...register('name')}
                className={cn(
                  'pl-9 h-10 text-xs bg-white border-slate-200 rounded-lg placeholder:text-slate-400 focus-visible:ring-blue-600',
                  (errors.name || apiError) && 'border-rose-500 focus-visible:ring-rose-500',
                )}
                error={Boolean(errors.name)}
              />
            </div>
            {errors.name ? (
              <p className="text-[11px] text-rose-600">{errors.name.message}</p>
            ) : (
              <p className="text-[11px] text-slate-500">
                De 3 a 60 caracteres e de 2 a 5 palavras; só letras, espaços, hífen e ponto. Não pode repetir outro clube.
              </p>
            )}
          </div>

          {/* Campo Sigla */}
          <div className="space-y-1.5">
            <Label htmlFor="club-acronym" className="text-xs font-semibold text-slate-700">
              Sigla
            </Label>
            <Input
              id="club-acronym"
              placeholder="LDS"
              maxLength={3}
              {...register('acronym')}
              className={cn(
                'h-10 text-xs bg-white border-slate-200 rounded-lg uppercase font-mono placeholder:text-slate-400 focus-visible:ring-blue-600',
                errors.acronym && 'border-rose-500 focus-visible:ring-rose-500',
              )}
              error={Boolean(errors.acronym)}
            />
            {errors.acronym ? (
              <p className="text-[11px] text-rose-600">{errors.acronym.message}</p>
            ) : (
              <p className="text-[11px] text-slate-500">
                3 letras de A a Z, maiúsculas, que aparecem no nome nessa ordem; a primeira é a primeira letra do nome.
              </p>
            )}
          </div>

          {/* Card informativo de Caixa Inicial */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center gap-2.5 text-xs text-slate-600 shadow-2xs">
            <Wallet className="h-4 w-4 text-slate-400 shrink-0" />
            <span>O clube começa com 300,00 em caixa e sem jogadores.</span>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className="h-9 px-4 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={isPending}
              className="h-9 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer shadow-xs"
            >
              Criar clube
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
