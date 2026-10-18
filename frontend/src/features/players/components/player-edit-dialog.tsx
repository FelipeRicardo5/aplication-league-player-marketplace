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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  updatePlayerSchema,
  type UpdatePlayerFormInput,
  POSITIONS,
} from '../schemas/player.schema';
import { useUpdatePlayerMutation } from '../hooks/use-players';
import type { Player } from '../types';

interface PlayerEditDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  const hasClub = Boolean(player?.club_id);

  const onSubmit = (data: UpdatePlayerFormInput) => {
    if (!player) return;
    doUpdate({ id: player.id, data });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Jogador</DialogTitle>
          <DialogDescription>
            Atualize as informações cadastrais de #{player?.id} - {player?.name}.
          </DialogDescription>
        </DialogHeader>

        {hasClub && (
          <Alert variant="warning" className="py-2.5">
            <AlertDescription className="text-xs">
              Jogador com vínculo ativo a um clube não pode ter a posição alterada (RN08).
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Nome Completo</Label>
            <Input id="edit-name" {...register('name')} error={Boolean(errors.name)} />
            {errors.name && <p className="text-xs text-[#BF000F]">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-position">Posição</Label>
            <Select
              value={selectedPosition}
              disabled={hasClub}
              onValueChange={(val) =>
                setValue('position', val as (typeof POSITIONS)[number], { shouldValidate: true })
              }
            >
              <SelectTrigger
                id="edit-position"
                className={hasClub ? 'opacity-60 cursor-not-allowed' : ''}
              >
                <SelectValue placeholder="Selecione a posição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GOL">Goleiro (GOL)</SelectItem>
                <SelectItem value="ZAG">Zagueiro (ZAG)</SelectItem>
                <SelectItem value="LAT">Lateral (LAT)</SelectItem>
                <SelectItem value="MEI">Meio-campo (MEI)</SelectItem>
                <SelectItem value="ATA">Atacante (ATA)</SelectItem>
              </SelectContent>
            </Select>
            {errors.position && <p className="text-xs text-[#BF000F]">{errors.position.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-age">Idade (mín. {player?.age})</Label>
              <Input
                id="edit-age"
                type="number"
                min={player?.age || 16}
                max={45}
                {...register('age')}
                error={Boolean(errors.age)}
              />
              {errors.age && <p className="text-xs text-[#BF000F]">{errors.age.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="edit-agility">Agilidade</Label>
                {age >= 35 && <span className="text-[10px] text-warning font-medium">Máx. 85</span>}
              </div>
              <Input
                id="edit-agility"
                type="number"
                min={1}
                max={age >= 35 ? 85 : 100}
                {...register('agility')}
                error={Boolean(errors.agility)}
              />
              {errors.agility && <p className="text-xs text-[#BF000F]">{errors.agility.message}</p>}
            </div>
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
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
