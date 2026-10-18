import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle } from 'lucide-react';
import { useClubLineupQuery, useSaveLineupMutation } from '../hooks/use-clubs';
import type { ClubDetail, FormationType } from '../types';

interface ClubLineupTabProps {
  club: ClubDetail;
}

const FORMATIONS: { type: FormationType; label: string; desc: string }[] = [
  { type: '3-1', label: '3-1', desc: '1 Goleiro, 3 Defensores (ZAG/LAT), 1 Atacante' },
  { type: '2-2', label: '2-2', desc: '1 Goleiro, 2 Defensores (ZAG/LAT), 2 Atacantes' },
  { type: '2-1-1', label: '2-1-1', desc: '1 Goleiro, 2 Defensores (ZAG/LAT), 1 Meia, 1 Atacante' },
  { type: '1-2-1', label: '1-2-1', desc: '1 Goleiro, 1 Defensor (ZAG/LAT), 2 Meias, 1 Atacante' },
];

import { validateLineup } from '../utils/lineup-validator';

export function ClubLineupTab({ club }: ClubLineupTabProps) {
  const { data: lineup, isLoading } = useClubLineupQuery(club.id);
  const [selectedFormation, setSelectedFormation] = useState<FormationType>('2-1-1');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (lineup?.formation) {
      setSelectedFormation(lineup.formation);
    }
    if (lineup?.players) {
      setSelectedIds(lineup.players.map((p) => p.id));
    }
  }, [lineup]);

  const { mutate: doSaveLineup, isPending } = useSaveLineupMutation(club.id);

  const squad = club.players || [];
  const selectedPlayers = squad.filter((p) => selectedIds.includes(p.id));
  const validation = validateLineup(selectedFormation, selectedPlayers);

  const handleTogglePlayer = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((pId) => pId !== id);
      } else {
        if (prev.length >= 5) return prev; // max 5
        return [...prev, id];
      }
    });
  };

  const handleSave = () => {
    if (!validation.valid) return;
    doSaveLineup({
      formation: selectedFormation,
      playerIds: selectedIds,
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">Carregando escalação...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base text-foreground">Escalação Tática</h3>
            {lineup?.complete ? (
              <Badge variant="success" dot>
                Escalação Completa (5 titulares)
              </Badge>
            ) : (
              <Badge variant="warning" dot>
                Escalação Incompleta
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Selecione uma formação oficial e exatamente 5 titulares aptos do elenco para disputar
            partidas.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={!validation.valid || isPending}
          isLoading={isPending}
          variant="default"
          size="sm"
          className="shrink-0"
        >
          Salvar Escalação
        </Button>
      </div>

      {/* Validation alert if invalid */}
      {!validation.valid && selectedIds.length > 0 && (
        <Alert variant="warning" className="py-2.5">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <AlertTitle className="text-xs font-semibold">Ajuste a escalação</AlertTitle>
            <AlertDescription className="text-xs">{validation.message}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* Formation Selector */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          1. Escolha a Formação Tática
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FORMATIONS.map((f) => (
            <button
              key={f.type}
              type="button"
              onClick={() => setSelectedFormation(f.type)}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
                selectedFormation === f.type
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/30 text-primary'
                  : 'border-border bg-card hover:bg-secondary text-foreground'
              }`}
            >
              <span className="font-bold font-mono text-base">{f.label}</span>
              <span className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{f.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Campinho / Pitch Diagram & Player Selection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Campinho tático visual (Figma Formação diagram) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#0D542B] rounded-2xl p-6 text-white border-4 border-[#07381C] shadow-inner min-h-[340px] relative overflow-hidden select-none">
          {/* Linhas do campo */}
          <div className="absolute inset-4 border-2 border-white/20 rounded-xl pointer-events-none" />
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/20 -translate-y-1/2 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/20 rounded-full pointer-events-none" />

          {/* Formação Label */}
          <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-wider">
            {selectedFormation}
          </div>

          {/* Titulares escalados no campinho */}
          <div className="relative z-10 w-full h-full flex flex-col justify-between py-4 items-center gap-6">
            {/* Ataque */}
            <div className="flex justify-center gap-6 w-full">
              {selectedPlayers
                .filter((p) => p.position === 'ATA')
                .map((p) => (
                  <div key={p.id} className="flex flex-col items-center text-center">
                    <span className="h-8 w-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xs shadow-md border-2 border-white">
                      {p.position}
                    </span>
                    <span className="text-[11px] font-semibold mt-1 drop-shadow-md truncate max-w-[90px]">
                      {p.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
            </div>

            {/* Meio-campo */}
            <div className="flex justify-center gap-6 w-full">
              {selectedPlayers
                .filter((p) => p.position === 'MEI')
                .map((p) => (
                  <div key={p.id} className="flex flex-col items-center text-center">
                    <span className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-md border-2 border-white">
                      {p.position}
                    </span>
                    <span className="text-[11px] font-semibold mt-1 drop-shadow-md truncate max-w-[90px]">
                      {p.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
            </div>

            {/* Defesa */}
            <div className="flex justify-center gap-6 w-full">
              {selectedPlayers
                .filter((p) => p.position === 'ZAG' || p.position === 'LAT')
                .map((p) => (
                  <div key={p.id} className="flex flex-col items-center text-center">
                    <span className="h-8 w-8 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs shadow-md border-2 border-white">
                      {p.position}
                    </span>
                    <span className="text-[11px] font-semibold mt-1 drop-shadow-md truncate max-w-[90px]">
                      {p.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
            </div>

            {/* Goleiro */}
            <div className="flex justify-center w-full">
              {selectedPlayers
                .filter((p) => p.position === 'GOL')
                .map((p) => (
                  <div key={p.id} className="flex flex-col items-center text-center">
                    <span className="h-8 w-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shadow-md border-2 border-white">
                      GOL
                    </span>
                    <span className="text-[11px] font-semibold mt-1 drop-shadow-md truncate max-w-[90px]">
                      {p.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Squad Selection List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              2. Selecione os 5 Titulares ({selectedIds.length} / 5)
            </h4>
            <span className="text-xs text-muted-foreground">Clique para marcar/desmarcar</span>
          </div>

          <div className="rounded-xl border border-border bg-card divide-y divide-border/60 max-h-[380px] overflow-y-auto">
            {squad.map((player) => {
              const isSelected = selectedIds.includes(player.id);
              const isSick = player.condition === 'DOENTE';

              return (
                <div
                  key={player.id}
                  onClick={() => !isSick && handleTogglePlayer(player.id)}
                  className={`flex items-center justify-between p-3 transition-colors ${
                    isSick
                      ? 'opacity-40 cursor-not-allowed bg-secondary/30'
                      : isSelected
                        ? 'bg-primary/5 cursor-pointer'
                        : 'hover:bg-secondary/40 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      disabled={isSick || (!isSelected && selectedIds.length >= 5)}
                      onCheckedChange={() => !isSick && handleTogglePlayer(player.id)}
                      id={`lineup-${player.id}`}
                    />
                    <div>
                      <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <span>{player.name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                          {player.position}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {player.age} anos • {player.condition} • {player.overall} OVR
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <Badge variant="default" className="text-[10px]">
                        Titular
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
