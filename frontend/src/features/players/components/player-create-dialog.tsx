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
  createPlayerSchema,
  type CreatePlayerFormInput,
  POSITIONS,
} from '../schemas/player.schema';
import { useCreatePlayerMutation } from '../hooks/use-players';
import { calculatePreviewOverall, calculatePreviewBaseValue } from '@/lib/domain-preview';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Lock, Sparkles, UserPlus, AlertCircle, AlertTriangle } from 'lucide-react';

interface PlayerCreateDialogProps {
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
  const age = Number(watch('age')) || 22;
  const agility = Number(watch('agility')) || 0;
  const potential = Number(watch('potential')) || 0;
  const pace = Number(watch('pace')) || 0;
  const shooting = Number(watch('shooting')) || 0;
  const passing = Number(watch('passing')) || 0;
  const dribbling = Number(watch('dribbling')) || 0;
  const defending = Number(watch('defending')) || 0;
  const physical = Number(watch('physical')) || 0;
  const selectedPosition = watch('position') || 'MEI';

  const sumAttrs = pace + shooting + passing + dribbling + defending + physical;
  const maxAttr = Math.max(pace, shooting, passing, dribbling, defending, physical);

  // Prévia calculada em tempo real (RN06)
  const previewOverall = calculatePreviewOverall(selectedPosition, {
    pace,
    shooting,
    passing,
    dribbling,
    defending,
    physical,
  });

  const previewBaseValue = calculatePreviewBaseValue(previewOverall, potential, age);

  const onSubmit = (data: CreatePlayerFormInput) => {
    doCreate(data);
  };

  const previewAttributes = [
    { label: 'Velocidade', code: 'VEL', value: pace, max: 99, color: 'bg-blue-600' },
    { label: 'Finalização', code: 'FIN', value: shooting, max: 99, color: 'bg-blue-600' },
    { label: 'Passe', code: 'PAS', value: passing, max: 99, color: 'bg-blue-600' },
    { label: 'Drible', code: 'DRI', value: dribbling, max: 99, color: 'bg-blue-600' },
    { label: 'Defesa', code: 'DEF', value: defending, max: 99, color: 'bg-blue-600' },
    { label: 'Físico', code: 'FIS', value: physical, max: 99, color: 'bg-blue-600' },
    { label: 'Agilidade', code: 'AGI', value: agility, max: 100, color: 'bg-sky-600' },
    { label: 'Potencial', code: 'POT', value: potential, max: 99, color: 'bg-indigo-600' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Cadastrar Novo Jogador
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Preencha os dados cadastrais e atributos técnicos do jogador. O valor base será
                calculado automaticamente pela API.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna da esquerda: Formulário de entrada (7 colunas) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Nome Completo */}
              <div className="space-y-1.5">
                <Label htmlFor="create-name" className="text-xs font-semibold text-slate-700">
                  Nome Completo
                </Label>
                <Input
                  id="create-name"
                  placeholder="Ex.: Carlos Eduardo Silva"
                  {...register('name')}
                  error={Boolean(errors.name)}
                />
                {errors.name && <p className="text-xs text-[#BF000F]">{errors.name.message}</p>}
              </div>

              {/* Seletor de Posição com Toggle Group (5 botões) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Posição em Campo
                </Label>
                <input type="hidden" {...register('position')} />
                <div
                  role="radiogroup"
                  aria-label="Posição em Campo"
                  className="grid grid-cols-5 gap-1.5"
                >
                  {POSITION_OPTIONS.map((pos) => {
                    const isSelected = selectedPosition === pos.value;
                    return (
                      <button
                        key={pos.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() =>
                          setValue('position', pos.value, { shouldValidate: true })
                        }
                        className={cn(
                          'flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-xs transition-all duration-150 cursor-pointer select-none',
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-semibold shadow-2xs ring-1 ring-blue-600/30'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                        )}
                      >
                        <span className="font-mono font-bold text-xs leading-tight">
                          {pos.value}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-full">
                          {pos.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors.position && (
                  <p className="text-xs text-[#BF000F]">{errors.position.message}</p>
                )}
              </div>

              {/* Idade, Agilidade e Potencial */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="create-age" className="text-xs font-semibold text-slate-700">
                    Idade (16-45)
                  </Label>
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
                    <Label
                      htmlFor="create-agility"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Agilidade
                    </Label>
                    {age >= 35 && (
                      <span className="text-[10px] text-amber-600 font-medium">≤85</span>
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
                  {errors.agility && (
                    <p className="text-xs text-[#BF000F]">{errors.agility.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor="create-potential"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Potencial
                    </Label>
                    {age >= 33 ? (
                      <span className="text-[10px] text-blue-600 font-medium">={maxAttr}</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">≥{maxAttr}</span>
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
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Atributos Técnicos (1 a 99)
                  </h4>
                  <div
                    className={cn(
                      'text-xs font-mono font-semibold px-2 py-0.5 rounded-md border',
                      sumAttrs > 480
                        ? 'bg-[#FEF2F2] border-[#FFCACA] text-[#BF000F]'
                        : 'bg-slate-100 border-slate-200 text-slate-700',
                    )}
                  >
                    Soma: {sumAttrs} / 480
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="create-pace" className="text-xs text-slate-600">
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
                    <Label htmlFor="create-shooting" className="text-xs text-slate-600">
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
                    <Label htmlFor="create-passing" className="text-xs text-slate-600">
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
                    <Label htmlFor="create-dribbling" className="text-xs text-slate-600">
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
                    <Label htmlFor="create-defending" className="text-xs text-slate-600">
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
                    <Label htmlFor="create-physical" className="text-xs text-slate-600">
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
            </div>

            {/* Coluna da direita: Painel de Prévia dos Atributos (5 colunas) */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 flex flex-col justify-between gap-4">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Prévia dos Atributos
                    </h4>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                    Tempo Real
                  </span>
                </div>

                {/* Cards de destaque Overall e Valor Base */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Card Overall */}
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500">Overall</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                        <Lock className="h-2.5 w-2.5 text-slate-400" /> RN06
                      </span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-blue-600 tabular-nums my-1">
                      {previewOverall}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate">
                      Ponderação: {selectedPosition}
                    </span>
                  </div>

                  {/* Card Valor Base */}
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500">Valor Base</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                        <Lock className="h-2.5 w-2.5 text-slate-400" /> RN06
                      </span>
                    </div>
                    <div className="text-xl font-bold font-mono text-slate-900 tabular-nums my-1">
                      {formatCurrency(previewBaseValue, true)}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate">
                      {age <= 21 ? 'Bônus Jovem Promessa' : `${age} anos`}
                    </span>
                  </div>
                </div>

                {/* Barras de Atributos */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Desempenho Relativo
                  </div>
                  <div className="space-y-1.5">
                    {previewAttributes.map((attr) => {
                      const percent = Math.min(
                        100,
                        Math.max(0, Math.round(((Number(attr.value) || 0) / attr.max) * 100)),
                      );
                      return (
                        <div key={attr.code} className="space-y-0.5">
                          <div className="flex justify-between text-[11px] font-medium">
                            <span className="text-slate-600">
                              {attr.label}{' '}
                              <span className="text-slate-400 font-mono text-[10px]">
                                ({attr.code})
                              </span>
                            </span>
                            <span className="font-mono font-semibold text-slate-800 tabular-nums">
                              {attr.value || 0}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-200', attr.color)}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Mensagens de Alerta Contextual */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                {sumAttrs > 480 && (
                  <div className="p-2 rounded-lg bg-[#FEF2F2] border border-[#FFCACA] text-[#BF000F] text-xs flex items-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>Soma dos atributos ({sumAttrs}) excede o limite máximo de 480.</span>
                  </div>
                )}
                {potential < maxAttr && (
                  <div className="p-2 rounded-lg bg-[#FFFBEB] border border-[#FEE685] text-[#953D00] text-xs flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>Potencial ({potential}) não pode ser inferior ao maior atributo ({maxAttr}).</span>
                  </div>
                )}
                {age >= 33 && potential !== maxAttr && (
                  <div className="p-2 rounded-lg bg-[#FFFBEB] border border-[#FEE685] text-[#953D00] text-xs flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>Para atletas com 33+ anos, potencial deve ser igual ao maior atributo ({maxAttr}).</span>
                  </div>
                )}
                {age >= 35 && agility > 85 && (
                  <div className="p-2 rounded-lg bg-[#FFFBEB] border border-[#FEE685] text-[#953D00] text-xs flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>Para atletas com 35+ anos, a agilidade não pode ultrapassar 85 ({agility}).</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              isLoading={isPending}
              disabled={sumAttrs > 480}
            >
              Salvar Jogador
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
