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
import {
  createPlayerSchema,
  type CreatePlayerFormInput,
  POSITIONS,
} from '../schemas/player.schema';
import { useCreatePlayerMutation } from '../hooks/use-players';

interface PlayerCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerCreateDialog({ open, onOpenChange }: PlayerCreateDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreatePlayerFormInput>({
    resolver: zodResolver(createPlayerSchema),
    defaultValues: {
      name: '',
      position: 'MEI',
      age: 22,
      agility: 75,
      pace: 70,
      shooting: 70,
      passing: 70,
      dribbling: 70,
      defending: 60,
      physical: 70,
      potential: 82,
    },
  });

  const { mutate: doCreate, isPending } = useCreatePlayerMutation(() => {
    reset();
    onOpenChange(false);
  });

  // Observa campos para cálculos em tempo real
  const age = watch('age') || 22;
  const pace = watch('pace') || 0;
  const shooting = watch('shooting') || 0;
  const passing = watch('passing') || 0;
  const dribbling = watch('dribbling') || 0;
  const defending = watch('defending') || 0;
  const physical = watch('physical') || 0;
  const selectedPosition = watch('position');

  const sumAttrs = pace + shooting + passing + dribbling + defending + physical;
  const maxAttr = Math.max(pace, shooting, passing, dribbling, defending, physical);

  const onSubmit = (data: CreatePlayerFormInput) => {
    doCreate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Jogador</DialogTitle>
          <DialogDescription>
            Preencha os dados cadastrais e atributos técnicos do jogador. O valor base será
            calculado automaticamente pela API.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Identificação básica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="create-name">Nome Completo</Label>
              <Input
                id="create-name"
                placeholder="Ex.: Carlos Eduardo Silva"
                {...register('name')}
                error={Boolean(errors.name)}
              />
              {errors.name && <p className="text-xs text-[#BF000F]">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-position">Posição</Label>
              <Select
                value={selectedPosition}
                onValueChange={(val) =>
                  setValue('position', val as (typeof POSITIONS)[number], { shouldValidate: true })
                }
              >
                <SelectTrigger id="create-position">
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
              {errors.position && (
                <p className="text-xs text-[#BF000F]">{errors.position.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-age">Idade (16 a 45)</Label>
              <Input
                id="create-age"
                type="number"
                min={16}
                max={45}
                {...register('age')}
                error={Boolean(errors.age)}
              />
              {errors.age && <p className="text-xs text-[#BF000F]">{errors.age.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="create-agility">Agilidade (1 a 100)</Label>
                {age >= 35 && (
                  <span className="text-[11px] text-warning font-medium">
                    Máx. 85 para ≥ 35 anos
                  </span>
                )}
              </div>
              <Input
                id="create-agility"
                type="number"
                min={1}
                max={age >= 35 ? 85 : 100}
                {...register('agility')}
                error={Boolean(errors.agility)}
              />
              {errors.agility && <p className="text-xs text-[#BF000F]">{errors.agility.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="create-potential">Potencial (1 a 99)</Label>
                {age >= 33 ? (
                  <span className="text-[11px] text-primary font-medium">
                    Exatamente {maxAttr} (≥ 33 anos)
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Mín. {maxAttr}</span>
                )}
              </div>
              <Input
                id="create-potential"
                type="number"
                min={1}
                max={99}
                {...register('potential')}
                error={Boolean(errors.potential)}
              />
              {errors.potential && (
                <p className="text-xs text-[#BF000F]">{errors.potential.message}</p>
              )}
            </div>
          </div>

          {/* Atributos técnicos */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Atributos Técnicos (1 a 99)
              </h4>
              <div
                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  sumAttrs > 480 ? 'bg-[#FEF2F2] text-[#BF000F]' : 'bg-secondary text-foreground'
                }`}
              >
                Soma: {sumAttrs} / 480
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="create-pace" className="text-xs">
                  Velocidade (VEL)
                </Label>
                <Input
                  id="create-pace"
                  type="number"
                  min={1}
                  max={99}
                  {...register('pace')}
                  error={Boolean(errors.pace)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="create-shooting" className="text-xs">
                  Finalização (FIN)
                </Label>
                <Input
                  id="create-shooting"
                  type="number"
                  min={1}
                  max={99}
                  {...register('shooting')}
                  error={Boolean(errors.shooting)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="create-passing" className="text-xs">
                  Passe (PAS)
                </Label>
                <Input
                  id="create-passing"
                  type="number"
                  min={1}
                  max={99}
                  {...register('passing')}
                  error={Boolean(errors.passing)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="create-dribbling" className="text-xs">
                  Drible (DRI)
                </Label>
                <Input
                  id="create-dribbling"
                  type="number"
                  min={1}
                  max={99}
                  {...register('dribbling')}
                  error={Boolean(errors.dribbling)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="create-defending" className="text-xs">
                  Defesa (DEF)
                </Label>
                <Input
                  id="create-defending"
                  type="number"
                  min={1}
                  max={99}
                  {...register('defending')}
                  error={Boolean(errors.defending)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="create-physical" className="text-xs">
                  Físico (FIS)
                </Label>
                <Input
                  id="create-physical"
                  type="number"
                  min={1}
                  max={99}
                  {...register('physical')}
                  error={Boolean(errors.physical)}
                />
              </div>
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
            <Button type="submit" variant="default" isLoading={isPending} disabled={sumAttrs > 480}>
              Salvar Jogador
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
