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
import { calculatePreviewOverall } from '@/lib/domain-preview';
import { cn } from '@/lib/utils';
import { Lock, User, AlertCircle, Info, SlidersHorizontal, FileText } from 'lucide-react';

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

  const hasFormErrors = Object.keys(errors).length > 0 || sumAttrs > 480;

  // Prévia calculada em tempo real (RN06)
  const previewOverall = calculatePreviewOverall(selectedPosition, {
    pace,
    shooting,
    passing,
    dribbling,
    defending,
    physical,
  });

  const onSubmit = (data: CreatePlayerFormInput) => {
    doCreate(data);
  };

  const previewAttributes = [
    { label: 'Velocidade', code: 'VEL', value: pace, max: 99 },
    { label: 'Finalização', code: 'FIN', value: shooting, max: 99 },
    { label: 'Passe', code: 'PAS', value: passing, max: 99 },
    { label: 'Drible', code: 'DRI', value: dribbling, max: 99 },
    { label: 'Defesa', code: 'DEF', value: defending, max: 99 },
    { label: 'Físico', code: 'FIS', value: physical, max: 99 },
    { label: 'Agilidade', code: 'AGI', value: agility, max: 100 },
    { label: 'Potencial', code: 'POT', value: potential, max: 99 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle
            aria-label="Cadastrar Novo Jogador"
            className="text-lg font-bold text-slate-900"
          >
            Novo jogador
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-0.5">
            {hasFormErrors
              ? 'Corrija os campos destacados para salvar.'
              : 'Preencha os dados do atleta. Os dados técnicos não mudam após o cadastro.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* 1. Nome com ícone de usuário */}
          <div className="space-y-1.5">
            <Label htmlFor="create-name" className="text-xs font-semibold text-slate-800">
              Nome
            </Label>
            <div className="relative">
              <User className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="create-name"
                className="pl-9"
                placeholder="Ex.: Carlos Eduardo Silva"
                {...register('name')}
                error={Boolean(errors.name)}
              />
            </div>
            {errors.name ? (
              <p className="text-xs text-[#BF000F] flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errors.name.message}
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                De 3 a 100 caracteres, com pelo menos duas palavras e sem números.
              </p>
            )}
          </div>

          {/* 2. Posição com 5 botões de alternância */}
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
                    onClick={() => setValue('position', pos.value, { shouldValidate: true })}
                    className={cn(
                      'flex flex-col items-center justify-center py-2.5 px-1 rounded-lg border text-xs transition-all duration-150 cursor-pointer select-none',
                      isSelected
                        ? 'border-blue-600 bg-white text-blue-600 font-bold shadow-2xs ring-1 ring-blue-600/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    <span className="font-mono font-bold text-xs uppercase leading-tight">
                      {pos.value}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] truncate max-w-full leading-tight mt-0.5',
                        isSelected ? 'text-blue-600' : 'text-muted-foreground',
                      )}
                    >
                      {pos.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.position && (
              <p className="text-xs text-[#BF000F] flex items-center gap-1 mt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errors.position.message}
              </p>
            )}
          </div>

          {/* 3. Idade, Agilidade e Valor base (moedas) em 3 colunas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-age" className="text-xs font-semibold text-slate-800">
                Idade
              </Label>
              <Input
                id="create-age"
                type="number"
                min={16}
                max={45}
                {...register('age')}
                error={Boolean(errors.age)}
              />
              {errors.age ? (
                <p className="text-xs text-[#BF000F] flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.age.message || 'Use uma idade de 16 a 45 anos.'}
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">De 16 a 45 anos.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-agility" className="text-xs font-semibold text-slate-800">
                Agilidade
              </Label>
              <Input
                id="create-agility"
                type="number"
                min={1}
                max={age >= 35 ? 85 : 100}
                {...register('agility')}
                error={Boolean(errors.agility)}
              />
              {errors.agility ? (
                <p className="text-xs text-[#BF000F] flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.agility.message}
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">
                  De 1 a 100 (até 85 com 35 anos ou mais).
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-800">Valor base (moedas)</Label>
              <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 select-none">
                <Lock className="h-4 w-4 text-slate-400" />
                <span>Após salvar</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Calculado no cadastro.</p>
            </div>
          </div>

          {/* 4. Indicadores técnicos com layout lado a lado com a Prévia */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Indicadores técnicos</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Seis atributos e o potencial, de 1 a 99. Não mudam depois do cadastro; a soma dos
                seis atributos não pode passar de 480.
              </p>
            </div>

            <div className="grid grid-cols-12 gap-4 items-stretch">
              {/* Entradas de Atributos: 8 colunas (4 por linha) */}
              <div className="col-span-12 lg:col-span-8 space-y-3">
                {/* Linha 1: Velocidade, Finalização, Passe, Drible */}
                <div className="grid grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="create-pace" className="text-xs font-semibold text-slate-800">
                      Velocidade
                    </Label>
                    <Input
                      id="create-pace"
                      type="number"
                      min={1}
                      max={99}
                      {...register('pace')}
                      error={Boolean(errors.pace)}
                    />
                    {errors.pace && (
                      <p className="text-[11px] text-[#BF000F] flex items-center gap-0.5 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        Use um valor de 1 a 99.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="create-shooting"
                      className="text-xs font-semibold text-slate-800"
                    >
                      Finalização
                    </Label>
                    <Input
                      id="create-shooting"
                      type="number"
                      min={1}
                      max={99}
                      {...register('shooting')}
                      error={Boolean(errors.shooting)}
                    />
                    {errors.shooting && (
                      <p className="text-[11px] text-[#BF000F] flex items-center gap-0.5 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        Use um valor de 1 a 99.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="create-passing"
                      className="text-xs font-semibold text-slate-800"
                    >
                      Passe
                    </Label>
                    <Input
                      id="create-passing"
                      type="number"
                      min={1}
                      max={99}
                      {...register('passing')}
                      error={Boolean(errors.passing)}
                    />
                    {errors.passing && (
                      <p className="text-[11px] text-[#BF000F] flex items-center gap-0.5 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        Use um valor de 1 a 99.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="create-dribbling"
                      className="text-xs font-semibold text-slate-800"
                    >
                      Drible
                    </Label>
                    <Input
                      id="create-dribbling"
                      type="number"
                      min={1}
                      max={99}
                      {...register('dribbling')}
                      error={Boolean(errors.dribbling)}
                    />
                    {errors.dribbling && (
                      <p className="text-[11px] text-[#BF000F] flex items-center gap-0.5 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        Use um valor de 1 a 99.
                      </p>
                    )}
                  </div>
                </div>

                {/* Linha 2: Defesa, Físico, Potencial, Overall */}
                <div className="grid grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <Label
                      htmlFor="create-defending"
                      className="text-xs font-semibold text-slate-800"
                    >
                      Defesa
                    </Label>
                    <Input
                      id="create-defending"
                      type="number"
                      min={1}
                      max={99}
                      {...register('defending')}
                      error={Boolean(errors.defending)}
                    />
                    {errors.defending && (
                      <p className="text-[11px] text-[#BF000F] flex items-center gap-0.5 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        Use um valor de 1 a 99.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="create-physical"
                      className="text-xs font-semibold text-slate-800"
                    >
                      Físico
                    </Label>
                    <Input
                      id="create-physical"
                      type="number"
                      min={1}
                      max={99}
                      {...register('physical')}
                      error={Boolean(errors.physical)}
                    />
                    {errors.physical && (
                      <p className="text-[11px] text-[#BF000F] flex items-center gap-0.5 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        Use um valor de 1 a 99.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Label
                        htmlFor="create-potential"
                        className="text-xs font-semibold text-slate-800"
                      >
                        Potencial
                      </Label>
                      {age >= 33 && (
                        <span className="text-[10px] text-blue-600 font-medium">={maxAttr}</span>
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
                      <p className="text-[11px] text-[#BF000F] flex items-center gap-0.5 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        Informe o potencial.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-800">Overall</Label>
                    <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 select-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                      <span>Após salvar</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Calculado automaticamente</p>
                  </div>
                </div>
              </div>

              {/* Card Lateral: Prévia dos atributos (4 colunas) */}
              <div className="col-span-12 lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center gap-2 text-slate-700 pb-2 border-b border-slate-100">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">Prévia dos atributos</span>
                </div>

                {hasFormErrors ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center my-auto">
                    <FileText className="h-8 w-8 text-slate-300 mb-2 stroke-1" />
                    <p className="text-xs text-slate-400 leading-tight">
                      Corrija os valores destacados para ver a prévia.
                    </p>
                  </div>
                ) : (
                  <div className="py-2 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="text-xs text-slate-500 font-medium">Overall Estimado</span>
                      <span className="text-base font-bold font-mono text-blue-600 tabular-nums">
                        {previewOverall}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {previewAttributes.map((attr) => {
                        const percent = Math.min(
                          100,
                          Math.max(0, Math.round(((Number(attr.value) || 0) / attr.max) * 100)),
                        );
                        return (
                          <div key={attr.code} className="space-y-0.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-600">{attr.code}</span>
                              <span className="font-mono font-semibold text-slate-800 tabular-nums">
                                {attr.value || 0}
                              </span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-600 transition-all duration-150"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sumAttrs > 480 && (
                  <div className="mt-2 p-2 rounded-lg bg-[#FEF2F2] border border-[#FFCACA] text-[#BF000F] text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Soma ({sumAttrs}) excede 480.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rodapé com info na esquerda e botões na direita */}
          <DialogFooter className="gap-2 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Info className="h-4 w-4 text-slate-400 shrink-0" />
              <span>O jogador começa livre e Apto.</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="rounded-lg border-slate-200"
              >
                Cancelar
              </Button>
              <Button
                aria-label="Salvar Jogador"
                type="submit"
                variant="default"
                isLoading={isPending}
                disabled={sumAttrs > 480}
                className="rounded-lg bg-[#155DFC] hover:bg-blue-700 text-white shadow-xs"
              >
                Salvar jogador
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
