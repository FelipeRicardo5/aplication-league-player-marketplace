import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, AlertTriangle, Lock, Swords } from 'lucide-react';
import { useClubLineupQuery, useSaveLineupMutation } from '../hooks/use-clubs';
import type { ClubDetail, FormationType } from '../types';
import type { Player } from '@/features/players/types';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ClubLineupTabProps {
  club: ClubDetail;
}

const FORMATIONS: { type: FormationType; label: string; desc: string }[] = [
  { type: '3-1', label: '3-1', desc: 'Defesa 3, ataque 1' },
  { type: '2-2', label: '2-2', desc: 'Defesa 2, ataque 2' },
  { type: '2-1-1', label: '2-1-1', desc: 'Defesa 2, meio 1, ataque 1' },
  { type: '1-2-1', label: '1-2-1', desc: 'Defesa 1, meio 2, ataque 1' },
];

interface SlotConfig {
  id: number;
  label: string;
  sub: string;
  role: 'GOL' | 'DEF' | 'MEI' | 'ATA';
}

function getFormationSlots(formation: FormationType): SlotConfig[] {
  switch (formation) {
    case '3-1':
      return [
        { id: 0, label: 'Goleiro', sub: 'GOL', role: 'GOL' },
        { id: 1, label: 'Defesa', sub: 'ZAG ou LAT', role: 'DEF' },
        { id: 2, label: 'Defesa', sub: 'ZAG ou LAT', role: 'DEF' },
        { id: 3, label: 'Defesa', sub: 'ZAG ou LAT', role: 'DEF' },
        { id: 4, label: 'Ataque', sub: 'ATA', role: 'ATA' },
      ];
    case '2-2':
      return [
        { id: 0, label: 'Goleiro', sub: 'GOL', role: 'GOL' },
        { id: 1, label: 'Defesa', sub: 'ZAG ou LAT', role: 'DEF' },
        { id: 2, label: 'Defesa', sub: 'ZAG ou LAT', role: 'DEF' },
        { id: 3, label: 'Ataque', sub: 'ATA', role: 'ATA' },
        { id: 4, label: 'Ataque', sub: 'ATA', role: 'ATA' },
      ];
    case '2-1-1':
      return [
        { id: 0, label: 'Goleiro', sub: 'GOL', role: 'GOL' },
        { id: 1, label: 'Defesa', sub: 'ZAG ou LAT', role: 'DEF' },
        { id: 2, label: 'Defesa', sub: 'ZAG ou LAT', role: 'DEF' },
        { id: 3, label: 'Meio', sub: 'MEI', role: 'MEI' },
        { id: 4, label: 'Ataque', sub: 'ATA', role: 'ATA' },
      ];
    case '1-2-1':
      return [
        { id: 0, label: 'Goleiro', sub: 'GOL', role: 'GOL' },
        { id: 1, label: 'Defesa', sub: 'ZAG ou LAT', role: 'DEF' },
        { id: 2, label: 'Meio', sub: 'MEI', role: 'MEI' },
        { id: 3, label: 'Meio', sub: 'MEI', role: 'MEI' },
        { id: 4, label: 'Ataque', sub: 'ATA', role: 'ATA' },
      ];
  }
}

function MiniPitch({ formation }: { formation: FormationType }) {
  const getDots = () => {
    switch (formation) {
      case '3-1':
        return { ata: 1, mei: 0, def: 3, gol: 1 };
      case '2-2':
        return { ata: 2, mei: 0, def: 2, gol: 1 };
      case '2-1-1':
        return { ata: 1, mei: 1, def: 2, gol: 1 };
      case '1-2-1':
        return { ata: 1, mei: 2, def: 1, gol: 1 };
    }
  };
  const dots = getDots();

  return (
    <div className="w-8 h-10 rounded-md bg-[#0c532b] p-1 flex flex-col justify-between items-center border border-[#0a4222] shrink-0">
      <div className="flex justify-center gap-1 w-full">
        {Array.from({ length: dots.ata }).map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
        ))}
      </div>
      {dots.mei > 0 && (
        <div className="flex justify-center gap-1 w-full">
          {Array.from({ length: dots.mei }).map((_, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
          ))}
        </div>
      )}
      <div className="flex justify-center gap-1 w-full">
        {Array.from({ length: dots.def }).map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
        ))}
      </div>
      <div className="flex justify-center w-full">
        <span className="w-1.5 h-1.5 rounded-full bg-white" />
      </div>
    </div>
  );
}

function getConditionBadge(condition: string) {
  switch (condition) {
    case 'APTO':
      return (
        <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          Apto
        </span>
      );
    case 'MAL_CONDICIONADO':
      return (
        <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-amber-700 px-2 py-0.5 rounded-md border border-amber-200 bg-amber-50">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
          Mal condicionado
        </span>
      );
    case 'DOENTE':
      return (
        <span className="inline-flex items-center gap-1.5 font-sans text-xs font-medium text-rose-700 px-2 py-0.5 rounded-md border border-rose-200 bg-rose-50">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
          Doente
        </span>
      );
    default:
      return null;
  }
}

function getSurname(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getPositionRoleLabel(position: string) {
  switch (position) {
    case 'GOL':
      return 'Goleiro';
    case 'ZAG':
      return 'Zagueiro';
    case 'LAT':
      return 'Lateral';
    case 'MEI':
      return 'Meio-campo';
    case 'ATA':
      return 'Atacante';
    default:
      return position;
  }
}

function renderSlotAttributes(formation: FormationType, slotIndex: number, player: Player) {
  // Slot 0: Goleiro -> só defende
  if (slotIndex === 0) {
    return (
      <span>
        Defesa <strong className="text-slate-900 font-bold tabular-nums">{player.defending}</strong>
      </span>
    );
  }
  // Slot 1: 1º de linha -> só defende
  if (slotIndex === 1) {
    return (
      <span>
        Defesa <strong className="text-slate-900 font-bold tabular-nums">{player.defending}</strong>
      </span>
    );
  }
  // Slot 2: 2º de linha -> ataca e defende
  if (slotIndex === 2) {
    const isMidfield = formation === '1-2-1';
    const attackAttr = isMidfield ? 'Passe' : 'Drible';
    const attackVal = isMidfield ? player.passing : player.dribbling;
    return (
      <span className="space-x-1.5">
        <span>
          {attackAttr} <strong className="text-slate-900 font-bold tabular-nums">{attackVal}</strong>
        </span>
        <span>
          Defesa <strong className="text-slate-900 font-bold tabular-nums">{player.defending}</strong>
        </span>
      </span>
    );
  }
  // Slot 3: 3º de linha -> só ataca
  if (slotIndex === 3) {
    if (formation === '3-1') {
      return (
        <span>
          Drible <strong className="text-slate-900 font-bold tabular-nums">{player.dribbling}</strong>
        </span>
      );
    }
    if (formation === '2-2') {
      return (
        <span>
          Finalização <strong className="text-slate-900 font-bold tabular-nums">{player.shooting}</strong>
        </span>
      );
    }
    // 2-1-1 ou 1-2-1 (MEI)
    return (
      <span>
        Passe <strong className="text-slate-900 font-bold tabular-nums">{player.passing}</strong>
      </span>
    );
  }
  // Slot 4: 4º de linha (o mais avançado) -> só ataca com Finalização
  return (
    <span>
      Finalização <strong className="text-slate-900 font-bold tabular-nums">{player.shooting}</strong>
    </span>
  );
}

export function ClubLineupTab({ club }: ClubLineupTabProps) {
  const { data: lineup, isLoading, refetch } = useClubLineupQuery(club.id);
  const [selectedFormation, setSelectedFormation] = useState<FormationType>('2-1-1');
  const [slotPlayerIds, setSlotPlayerIds] = useState<(number | null)[]>([null, null, null, null, null]);
  const [apiError, setApiError] = useState<string | null>(null);

  const squad: Player[] = club.players || [];

  // Mapeia os titulares salvos na formação correspondente
  const lineupKey = `${lineup?.formation || ''}_${lineup?.complete}_${lineup?.players?.map((p) => p.id).join('-') || ''}`;

  useEffect(() => {
    if (!lineup) return;
    if (lineup.formation) {
      setSelectedFormation(lineup.formation);
    }
    if (lineup.players && lineup.players.length > 0) {
      const formation = lineup.formation || '2-1-1';
      const slots = getFormationSlots(formation);
      const newSlotIds: (number | null)[] = [null, null, null, null, null];
      const assignedPlayerIds = new Set<number>();

      // Preenche os slots por compatibilidade de função
      slots.forEach((slot, index) => {
        const matchingPlayer = lineup.players.find((p) => {
          if (assignedPlayerIds.has(p.id)) return false;
          if (slot.role === 'GOL') return p.position === 'GOL';
          if (slot.role === 'DEF') return p.position === 'ZAG' || p.position === 'LAT';
          if (slot.role === 'MEI') return p.position === 'MEI';
          if (slot.role === 'ATA') return p.position === 'ATA';
          return false;
        });

        if (matchingPlayer) {
          newSlotIds[index] = matchingPlayer.id;
          assignedPlayerIds.add(matchingPlayer.id);
        }
      });

      setSlotPlayerIds(newSlotIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineupKey]);

  const { mutate: doSaveLineup, isPending } = useSaveLineupMutation(
    club.id,
    () => {
      setApiError(null);
      refetch();
    },
    club.name,
  );

  const slots = getFormationSlots(selectedFormation);

  // Troca de formação: reorganiza slots mantendo jogadores compatíveis
  const handleFormationChange = (newFormation: FormationType) => {
    setSelectedFormation(newFormation);
    const newSlots = getFormationSlots(newFormation);
    const currentAssignedPlayers = slotPlayerIds
      .map((id) => (id ? squad.find((p) => p.id === id) : null))
      .filter((p): p is Player => p !== null);

    const newSlotIds: (number | null)[] = [null, null, null, null, null];
    const usedPlayerIds = new Set<number>();

    newSlots.forEach((slot, index) => {
      const match = currentAssignedPlayers.find((p) => {
        if (usedPlayerIds.has(p.id)) return false;
        if (slot.role === 'GOL') return p.position === 'GOL';
        if (slot.role === 'DEF') return p.position === 'ZAG' || p.position === 'LAT';
        if (slot.role === 'MEI') return p.position === 'MEI';
        if (slot.role === 'ATA') return p.position === 'ATA';
        return false;
      });

      if (match) {
        newSlotIds[index] = match.id;
        usedPlayerIds.add(match.id);
      }
    });

    setSlotPlayerIds(newSlotIds);
    setApiError(null);
  };

  const handleSelectPlayerForSlot = (slotIndex: number, playerIdStr: string) => {
    const playerId = playerIdStr === 'NONE' ? null : Number(playerIdStr);
    setSlotPlayerIds((prev) => {
      const next = [...prev];
      // Se o jogador já estava em outro slot, limpa o anterior
      if (playerId !== null) {
        const existingIndex = next.findIndex((id) => id === playerId);
        if (existingIndex !== -1 && existingIndex !== slotIndex) {
          next[existingIndex] = null;
        }
      }
      next[slotIndex] = playerId;
      return next;
    });
    setApiError(null);
  };

  const handleResetToSaved = () => {
    if (lineup?.formation) {
      handleFormationChange(lineup.formation);
    } else {
      setSlotPlayerIds([null, null, null, null, null]);
    }
    setApiError(null);
  };

  const selectedPlayers: (Player | null)[] = slotPlayerIds.map((id) =>
    id ? squad.find((p) => p.id === id) || null : null,
  );

  const activeStarterPlayers: Player[] = selectedPlayers.filter((p): p is Player => p !== null);

  const isComplete =
    slotPlayerIds.every((id) => id !== null && id !== undefined) &&
    activeStarterPlayers.length === 5 &&
    activeStarterPlayers.every((p) => p.condition !== 'DOENTE');

  const malCondicionados = activeStarterPlayers.filter((p) => p.condition === 'MAL_CONDICIONADO');

  const assignedPlayerIds = new Set(slotPlayerIds.filter((id): id is number => id !== null));
  const reservePlayers = squad.filter((p) => !assignedPlayerIds.has(p.id));

  const handleSave = () => {
    if (!isComplete) return;
    setApiError(null);
    doSaveLineup(
      {
        formation: selectedFormation,
        playerIds: activeStarterPlayers.map((p) => p.id),
      },
      {
        onError: (err) => {
          if (err instanceof ApiError) {
            setApiError(err.message);
          } else {
            setApiError('Não foi possível salvar a escalação informada.');
          }
          refetch();
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center text-xs text-slate-400">
        Carregando escalação tática...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Formulário de Titulares e Tabela de Vagas (Figma 75-160001) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            {/* Cabeçalho do Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Titulares</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  1 goleiro e 4 jogadores de linha, na formação escolhida. Salvar troca os 5 de uma vez.
                </p>
              </div>

              {/* Badge de Status da Escalação */}
              {isComplete ? (
                <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200 bg-emerald-50 shrink-0">
                  <span className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full border border-emerald-600 text-[9px] font-bold leading-none">
                    ✓
                  </span>
                  Completa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-amber-700 px-2.5 py-1 rounded-md border border-amber-200 bg-amber-50 shrink-0">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Incompleta
                </span>
              )}
            </div>

            {/* Banner de Erro/Recusa da API (Figma 75-160523) */}
            {apiError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 flex items-start gap-2.5 text-rose-700 my-4">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-rose-700">A escalação foi recusada</p>
                  <p className="text-xs text-rose-600 leading-relaxed">{apiError}</p>
                </div>
              </div>
            )}

            {/* Banner de Escalação Incompleta após Venda / Doença (Figma 75-163024) */}
            {!apiError &&
              lineup &&
              !lineup.complete &&
              (lineup.players?.length > 0 || lineup.formation !== null) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 flex items-start gap-2.5 text-amber-800 my-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-amber-900">A escalação está incompleta</p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Titular vendido ou doente saiu da escalação. O clube só volta a jogar depois de escalar de novo.
                    </p>
                  </div>
                </div>
              )}

            {/* Aviso de Elenco Vazio */}
            {squad.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 flex items-start gap-2.5 text-slate-700 my-4">
                <AlertCircle className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">Nenhum jogador no elenco</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Compre pelo menos 5 jogadores livres no mercado para poder montar a escalação do clube.
                  </p>
                </div>
              </div>
            )}

            {/* Seção Escolha da Formação */}
            <div className="my-5">
              <div className="mb-2.5">
                <h4 className="text-xs font-bold text-slate-900">Formação</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Os números contam os jogadores de linha de trás para frente. O goleiro fica fora da conta.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {FORMATIONS.map((f) => {
                  const isSelected = selectedFormation === f.type;
                  return (
                    <button
                      key={f.type}
                      type="button"
                      onClick={() => handleFormationChange(f.type)}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer select-none',
                        isSelected
                          ? 'border-2 border-blue-600 bg-blue-50/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50/60',
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <MiniPitch formation={f.type} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                'h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0',
                                isSelected
                                  ? 'border-blue-600'
                                  : 'border-slate-300 bg-white',
                              )}
                            >
                              {isSelected && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                            </span>
                            <span className="font-bold text-sm text-slate-900">{f.label}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">
                            {f.desc}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tabela de Vagas e Seleção dos 5 Titulares */}
            <div className="border border-slate-200 rounded-xl overflow-hidden my-4">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px] text-xs font-semibold text-slate-600">
                      Vaga
                    </TableHead>
                    <TableHead className="min-w-[190px] text-xs font-semibold text-slate-600">
                      Titular
                    </TableHead>
                    <TableHead className="w-[140px] text-xs font-semibold text-slate-600">
                      Condição
                    </TableHead>
                    <TableHead className="w-[70px] text-xs font-semibold text-slate-600">
                      Overall
                    </TableHead>
                    <TableHead className="min-w-[150px] text-xs font-semibold text-slate-600">
                      Atributos usados
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slots.map((slot, index) => {
                    const assignedPlayer = selectedPlayers[index];

                    // Filtra jogadores elegíveis para a vaga
                    const eligiblePlayers = squad.filter((p) => {
                      if (slot.role === 'GOL') return p.position === 'GOL';
                      if (slot.role === 'DEF') return p.position === 'ZAG' || p.position === 'LAT';
                      if (slot.role === 'MEI') return p.position === 'MEI';
                      if (slot.role === 'ATA') return p.position === 'ATA';
                      return false;
                    });

                    return (
                      <TableRow key={slot.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* 1. Vaga */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-slate-900 block">
                              {slot.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {slot.sub}
                            </span>
                          </div>
                        </TableCell>

                        {/* 2. Titular Select Dropdown */}
                        <TableCell>
                          <Select
                            value={assignedPlayer ? String(assignedPlayer.id) : 'NONE'}
                            onValueChange={(val) => handleSelectPlayerForSlot(index, val)}
                          >
                            <SelectTrigger
                              aria-label={`Selecionar titular para ${slot.label}`}
                              className={cn(
                                'h-8.5 text-xs bg-white rounded-lg cursor-pointer',
                                !assignedPlayer &&
                                  lineup &&
                                  !lineup.complete &&
                                  (lineup.players?.length > 0 || lineup.formation !== null)
                                  ? 'border-amber-300 ring-1 ring-amber-200'
                                  : 'border-slate-200',
                              )}
                            >
                              <SelectValue placeholder="Selecione um jogador" />
                            </SelectTrigger>
                            <SelectContent className="max-h-56">
                              <SelectItem value="NONE" className="text-xs text-slate-400">
                                -- Nenhum --
                              </SelectItem>
                              {eligiblePlayers.map((p) => {
                                const isAssignedOtherSlot =
                                  assignedPlayerIds.has(p.id) && assignedPlayer?.id !== p.id;
                                const isSick = p.condition === 'DOENTE';

                                return (
                                  <SelectItem
                                    key={p.id}
                                    value={String(p.id)}
                                    disabled={isSick}
                                    className="text-xs cursor-pointer"
                                  >
                                    <span className="font-medium">{p.name}</span>{' '}
                                    <span className="text-slate-400 font-mono">({p.position})</span>
                                    {isAssignedOtherSlot && (
                                      <span className="text-[10px] text-slate-400 ml-1.5">
                                        (já alocado)
                                      </span>
                                    )}
                                    {isSick && (
                                      <span className="text-[10px] text-rose-600 font-bold ml-1.5">
                                        (DOENTE)
                                      </span>
                                    )}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* 3. Condição */}
                        <TableCell>
                          {assignedPlayer ? (
                            getConditionBadge(assignedPlayer.condition)
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </TableCell>

                        {/* 4. Overall */}
                        <TableCell>
                          {assignedPlayer ? (
                            <span className="font-sans font-bold text-xs text-slate-900 tabular-nums">
                              {assignedPlayer.overall}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </TableCell>

                        {/* 5. Atributos Usados */}
                        <TableCell>
                          {assignedPlayer ? (
                            <div className="text-xs text-slate-600 font-sans">
                              {renderSlotAttributes(selectedFormation, index, assignedPlayer)}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Alerta de Mal Condicionados (Figma 75-160001) */}
            {malCondicionados.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 flex items-start gap-2.5 my-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-amber-800">
                    {malCondicionados.map((p) => p.name).join(' e ')}{' '}
                    {malCondicionados.length === 1
                      ? 'está mal condicionado'
                      : 'estão mal condicionados'}
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Podem jogar, mas cada atributo vale 15% a menos durante a partida.
                  </p>
                </div>
              </div>
            )}

            {/* Rodapé de Ações */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 mt-4">
              <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
                A escalação vale até ser trocada. Titular vendido ou que fica doente sai dela, e o clube só volta a jogar depois de escalar de novo.
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetToSaved}
                  disabled={isPending}
                  className="h-9 px-4 text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={!isComplete || isPending}
                  onClick={handleSave}
                  isLoading={isPending}
                  className="h-9 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  Salvar escalação
                </Button>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Depois de salvar, a tela mostra a mensagem de sucesso e a escalação devolvida pela API, na ordem do elenco (RN19 e F12).
          </p>
        </div>

        {/* Coluna Direita: Em campo (Campinho) e Reservas */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card Em Campo (Campinho) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="mb-3">
              <h4 className="text-sm font-bold text-slate-900">Em campo</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Prévia da formação {selectedFormation}, do goleiro ao ataque.
              </p>
            </div>

            {/* Campinho Tático Visual Fiel ao Figma */}
            <div className="rounded-2xl bg-[#0c532b] border border-[#0a4222] p-4 min-h-[380px] relative overflow-hidden flex flex-col justify-between items-center text-white select-none shadow-inner">
              {/* Linhas e marcações do campo */}
              <div className="absolute inset-3 border border-white/20 rounded-xl pointer-events-none" />
              <div className="absolute top-1/2 left-3 right-3 h-[1px] bg-white/20 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/20 pointer-events-none" />
              <div className="absolute top-3 left-1/4 right-1/4 h-10 border-b border-l border-r border-white/20 pointer-events-none" />
              <div className="absolute bottom-3 left-1/4 right-1/4 h-10 border-t border-l border-r border-white/20 pointer-events-none" />

              {/* Ataque (Topo) */}
              <div className="relative z-10 flex justify-center gap-6 w-full pt-2">
                {slots
                  .map((slot, index) => ({ slot, player: selectedPlayers[index] }))
                  .filter(({ slot }) => slot.role === 'ATA')
                  .map(({ slot, player }) => (
                    <div key={slot.id} className="flex flex-col items-center text-center">
                      {player ? (
                        <div className="w-9 h-9 rounded-full bg-[#155dfc] text-white font-bold text-xs flex items-center justify-center shadow-md border-2 border-white relative">
                          {getInitials(player.name)}
                          {player.condition === 'MAL_CONDICIONADO' && (
                            <span
                              className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-500 border border-white flex items-center justify-center text-[8px] font-bold text-white shadow-xs"
                              title="Mal condicionado"
                            >
                              !
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full border-2 border-dashed border-white/60 bg-white/10 text-white/70 font-medium text-xs flex items-center justify-center shadow-xs">
                          ?
                        </div>
                      )}
                      <span className="text-[10px] font-medium text-white drop-shadow-md text-center max-w-[65px] truncate mt-0.5">
                        {player ? getSurname(player.name) : 'Ataque'}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Meio-campo (se houver na formação) */}
              {slots.some((s) => s.role === 'MEI') && (
                <div className="relative z-10 flex justify-center gap-6 w-full py-1">
                  {slots
                    .map((slot, index) => ({ slot, player: selectedPlayers[index] }))
                    .filter(({ slot }) => slot.role === 'MEI')
                    .map(({ slot, player }) => (
                      <div key={slot.id} className="flex flex-col items-center text-center">
                        {player ? (
                          <div className="w-9 h-9 rounded-full bg-[#155dfc] text-white font-bold text-xs flex items-center justify-center shadow-md border-2 border-white relative">
                            {getInitials(player.name)}
                            {player.condition === 'MAL_CONDICIONADO' && (
                              <span
                                className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-500 border border-white flex items-center justify-center text-[8px] font-bold text-white shadow-xs"
                                title="Mal condicionado"
                              >
                                !
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full border-2 border-dashed border-white/60 bg-white/10 text-white/70 font-medium text-xs flex items-center justify-center shadow-xs">
                            ?
                          </div>
                        )}
                        <span className="text-[10px] font-medium text-white drop-shadow-md text-center max-w-[65px] truncate mt-0.5">
                          {player ? getSurname(player.name) : 'Meio'}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {/* Defesa */}
              <div className="relative z-10 flex justify-center gap-6 w-full py-1">
                {slots
                  .map((slot, index) => ({ slot, player: selectedPlayers[index] }))
                  .filter(({ slot }) => slot.role === 'DEF')
                  .map(({ slot, player }) => (
                    <div key={slot.id} className="flex flex-col items-center text-center">
                      {player ? (
                        <div className="w-9 h-9 rounded-full bg-[#155dfc] text-white font-bold text-xs flex items-center justify-center shadow-md border-2 border-white relative">
                          {getInitials(player.name)}
                          {player.condition === 'MAL_CONDICIONADO' && (
                            <span
                              className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-500 border border-white flex items-center justify-center text-[8px] font-bold text-white shadow-xs"
                              title="Mal condicionado"
                            >
                              !
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full border-2 border-dashed border-white/60 bg-white/10 text-white/70 font-medium text-xs flex items-center justify-center shadow-xs">
                          ?
                        </div>
                      )}
                      <span className="text-[10px] font-medium text-white drop-shadow-md text-center max-w-[65px] truncate mt-0.5">
                        {player ? getSurname(player.name) : 'Defesa'}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Goleiro (Base) */}
              <div className="relative z-10 flex justify-center w-full pb-2">
                {slots
                  .map((slot, index) => ({ slot, player: selectedPlayers[index] }))
                  .filter(({ slot }) => slot.role === 'GOL')
                  .map(({ slot, player }) => (
                    <div key={slot.id} className="flex flex-col items-center text-center">
                      {player ? (
                        <div className="w-9 h-9 rounded-full bg-[#155dfc] text-white font-bold text-xs flex items-center justify-center shadow-md border-2 border-white relative">
                          {getInitials(player.name)}
                          {player.condition === 'MAL_CONDICIONADO' && (
                            <span
                              className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-500 border border-white flex items-center justify-center text-[8px] font-bold text-white shadow-xs"
                              title="Mal condicionado"
                            >
                              !
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full border-2 border-dashed border-white/60 bg-white/10 text-white/70 font-medium text-xs flex items-center justify-center shadow-xs">
                          ?
                        </div>
                      )}
                      <span className="text-[10px] font-medium text-white drop-shadow-md text-center max-w-[65px] truncate mt-0.5">
                        {player ? getSurname(player.name) : 'Goleiro'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Regra de partida explicativa */}
            <div className="flex items-start gap-2 pt-3 text-[11px] text-slate-500 leading-tight">
              <Swords className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Na partida, atacam os 3 jogadores de linha mais avançados e defendem o goleiro e os 2 mais recuados. É gol quando o ataque é maior que a defesa.
              </span>
            </div>
          </div>

          {/* Card Reservas */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="mb-3">
              <h4 className="text-sm font-bold text-slate-900">Reservas</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Jogadores do elenco fora da escalação.
              </p>
            </div>

            {reservePlayers.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Nenhum reserva no elenco.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {reservePlayers.map((player) => (
                  <div key={player.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                          {getInitials(player.name)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-900 truncate block">
                            {player.name}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            {getPositionRoleLabel(player.position)}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">{getConditionBadge(player.condition)}</div>
                    </div>

                    {player.condition === 'DOENTE' && (
                      <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200/50">
                        <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>Doente não pode ser escalado.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
