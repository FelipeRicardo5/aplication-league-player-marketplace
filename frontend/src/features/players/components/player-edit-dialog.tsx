import { useEffect } from 'react';
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
import {
  updatePlayerSchema,
  type UpdatePlayerFormInput,
  POSITIONS,
} from '../schemas/player.schema';
import { useUpdatePlayerMutation } from '../hooks/use-players';
import type { Player } from '../types';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Lock, User } from 'lucide-react';

interface PlayerEditDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const POSITION_OPTIONS: Array<{
  value: (typeof POSITIONS)[number];
  label: string;
}> = [
  { value: 'GOL', label: 'Goleiro' },
  { value: 'ZAG', label: 'Zagueiro' },
  { value: 'LAT', label: 'Lateral' },
  { value: 'MEI', label: 'Meio-campo' },
  { value: 'ATA', label: 'Atacante' },
];

export function PlayerEditDialog({ player, open, onOpenChange }: PlayerEditDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdatePlayerFormInput>({
    resolver: zodResolver(updatePlayerSchema),
    defaultValues: {
      name: '',
      position: 'MEI',
      age: 20,
      agility: 70,
    },
  });

  useEffect(() => {
    if (player) {
      reset({
        name: player.name,
        position: player.position,
        age: player.age,
        agility: player.agility,
      });
    }
  }, [player, reset]);

  const { mutate: doUpdate, isPending } = useUpdatePlayerMutation(() => {
    onOpenChange(false);
  });

  const age = watch('age') || 20;
  const selectedPosition = watch('position');
  const hasClub = Boolean(player?.club_id !== null && player?.club_id !== undefined);

  if (!player) return null;

  const onSubmit = (data: UpdatePlayerFormInput) => {
    doUpdate({ id: player.id, data });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">Editar jogador</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-0.5">
            Edite nome, posição, idade e agilidade. Os demais dados não mudam.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Campo Nome com ícone de usuário */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-xs font-semibold text-slate-800">
              Nome
            </Label>
            <div className="relative">
              <User className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="edit-name"
                className="pl-9"
                placeholder="Nome completo do jogador"
                {...register('name')}
                error={Boolean(errors.name)}
              />
            </div>
            <p className="text-xs text-slate-500">
              De 3 a 100 caracteres, com pelo menos duas palavras e sem números.
            </p>
            {errors.name && <p className="text-xs text-[#BF000F]">{errors.name.message}</p>}
          </div>

          {/* Campo Posição com 5 botões de alternância */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-800">Posição</Label>
            <input type="hidden" {...register('position')} />
            <div role="radiogroup" aria-label="Posição" className="grid grid-cols-5 gap-2">
              {POSITION_OPTIONS.map((pos) => {
                const isSelected = selectedPosition === pos.value;
                return (
                  <button
                    key={pos.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={hasClub}
                    onClick={() =>
                      !hasClub && setValue('position', pos.value, { shouldValidate: true })
                    }
                    className={cn(
                      'flex flex-col items-center justify-center py-2.5 px-1 rounded-lg border text-xs transition-all duration-150 select-none',
                      hasClub
                        ? isSelected
                          ? 'border-blue-600 bg-white text-blue-600 font-bold shadow-2xs ring-1 ring-blue-600/20'
                          : 'border-slate-200 bg-white text-slate-300 opacity-60 cursor-not-allowed'
                        : isSelected
                          ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-bold shadow-2xs ring-1 ring-blue-600/30 cursor-pointer'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 cursor-pointer',
                    )}
                  >
                    <span
                      className={cn(
                        'font-mono font-bold text-xs uppercase leading-tight',
                        hasClub && !isSelected && 'text-slate-400',
                      )}
                    >
                      {pos.value}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] truncate max-w-full leading-tight mt-0.5',
                        hasClub && isSelected
                          ? 'text-blue-600'
                          : hasClub
                            ? 'text-slate-300'
                            : 'text-muted-foreground',
                      )}
                    >
                      {pos.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500">
              {hasClub
                ? 'Jogador com clube não muda de posição: as outras posições ficam desabilitadas.'
                : 'Selecione a nova posição do atleta livre.'}
            </p>
            {errors.position && <p className="text-xs text-[#BF000F]">{errors.position.message}</p>}
          </div>

          {/* Idade e Agilidade lado a lado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-age" className="text-xs font-semibold text-slate-800">
                Idade
              </Label>
              <Input
                id="edit-age"
                type="number"
                min={player.age || 16}
                max={45}
                {...register('age')}
                error={Boolean(errors.age)}
              />
              <p className="text-xs text-slate-500">
                De 16 a 45, sem diminuir (atual: {player.age}).
              </p>
              {errors.age && <p className="text-xs text-[#BF000F]">{errors.age.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-agility" className="text-xs font-semibold text-slate-800">
                Agilidade
              </Label>
              <Input
                id="edit-agility"
                type="number"
                min={1}
                max={age >= 35 ? 85 : 100}
                {...register('agility')}
                error={Boolean(errors.agility)}
              />
              <p className="text-xs text-slate-500">De 1 a 100 (até 85 com 35 anos ou mais).</p>
              {errors.agility && <p className="text-xs text-[#BF000F]">{errors.agility.message}</p>}
            </div>
          </div>

          {/* Aviso com cadeado de dados imutáveis após cadastro */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 flex items-center gap-2.5">
            <Lock className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-600">
              Não mudam depois do cadastro: valor base ({formatCurrency(player.base_value, false)}),
              indicadores e potencial.
            </span>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-slate-100 flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="rounded-md border-slate-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={isPending}
              className="rounded-md bg-[#155DFC] hover:bg-blue-700 text-white shadow-xs"
            >
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
