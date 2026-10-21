import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Swords,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/formatters';
import { fetchMatchById } from '../api/league-api';
import { apiGet } from '@/lib/api';
import type { ClubSummary } from '@/features/clubs/types';
import type { MatchDuelPlayer } from '../types';
import { CardSkeleton } from '@/components/feedback/loading-skeleton';
import { ErrorState } from '@/components/feedback/error-state';
import { cn } from '@/lib/utils';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Coordenadas percentuais (x, y) de cada slot tático no campo horizontal.
 * Mandante (lado esquerdo, x de 8% a 42%): ataca da esquerda para a direita.
 * Visitante (lado direito, x de 58% a 92%): ataca da direita para a esquerda.
 */
interface PitchSlotPosition {
  x: number;
  y: number;
}

function getFormationPitchPositions(formation: string, side: 'home' | 'away'): PitchSlotPosition[] {
  const isHome = side === 'home';

  // [Goleiro, 1º linha, 2º linha, 3º linha, 4º linha]
  switch (formation) {
    case '3-1':
      // 1 GOL, 3 defensores/meias alinhados na linha de defesa/meio, 1 atacante isolado
      return isHome
        ? [
            { x: 8, y: 50 },
            { x: 23, y: 22 },
            { x: 23, y: 50 },
            { x: 23, y: 78 },
            { x: 40, y: 50 },
          ]
        : [
            { x: 92, y: 50 },
            { x: 77, y: 22 },
            { x: 77, y: 50 },
            { x: 77, y: 78 },
            { x: 60, y: 50 },
          ];

    case '2-2':
      // 1 GOL, 2 defensores, 2 atacantes
      return isHome
        ? [
            { x: 8, y: 50 },
            { x: 22, y: 32 },
            { x: 22, y: 68 },
            { x: 38, y: 32 },
            { x: 38, y: 68 },
          ]
        : [
            { x: 92, y: 50 },
            { x: 78, y: 32 },
            { x: 78, y: 68 },
            { x: 62, y: 32 },
            { x: 62, y: 68 },
          ];

    case '1-2-1':
      // 1 GOL, 1 defensor central, 2 meias abertos, 1 atacante central
      return isHome
        ? [
            { x: 8, y: 50 },
            { x: 20, y: 50 },
            { x: 30, y: 24 },
            { x: 30, y: 76 },
            { x: 42, y: 50 },
          ]
        : [
            { x: 92, y: 50 },
            { x: 80, y: 50 },
            { x: 70, y: 24 },
            { x: 70, y: 76 },
            { x: 58, y: 50 },
          ];

    case '2-1-1':
    default:
      // 1 GOL, 2 defensores, 1 meia central, 1 atacante
      return isHome
        ? [
            { x: 8, y: 50 },
            { x: 21, y: 30 },
            { x: 21, y: 70 },
            { x: 32, y: 50 },
            { x: 42, y: 50 },
          ]
        : [
            { x: 92, y: 50 },
            { x: 79, y: 30 },
            { x: 79, y: 70 },
            { x: 68, y: 50 },
            { x: 58, y: 50 },
          ];
  }
}

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const matchId = Number(id);

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiGet<ClubSummary[]>('clubs'),
    staleTime: 1000 * 60,
  });

  const {
    data: match,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => fetchMatchById(matchId),
    enabled: Boolean(matchId),
  });

  const clubsMap = useMemo(() => {
    const map = new Map<number, ClubSummary>();
    if (clubs) {
      for (const c of clubs) map.set(c.id, c);
    }
    return map;
  }, [clubs]);

  // Extrai os 5 titulares de cada clube a partir dos 6 duelos (RN20)
  const starters = useMemo(() => {
    if (!match?.duels || match.duels.length < 6) {
      return { homeStarters: [], awayStarters: [] };
    }

    const duels = match.duels;
    // Mandante titulares:
    // Duelo 4 defensor = GOL
    // Duelo 5 defensor = 1º de linha (ZAG)
    // Duelo 6 defensor = 2º de linha (LAT)
    // Duelo 2 atacante = 3º de linha (MEI)
    // Duelo 1 atacante = 4º de linha (ATA)
    const homeStarters: MatchDuelPlayer[] = [
      duels[3].defender,
      duels[4].defender,
      duels[5].defender,
      duels[1].attacker,
      duels[0].attacker,
    ];

    // Visitante titulares:
    // Duelo 1 defensor = GOL
    // Duelo 2 defensor = 1º de linha (ZAG)
    // Duelo 3 defensor = 2º de linha (LAT)
    // Duelo 5 atacante = 3º de linha (MEI)
    // Duelo 4 atacante = 4º de linha (ATA)
    const awayStarters: MatchDuelPlayer[] = [
      duels[0].defender,
      duels[1].defender,
      duels[2].defender,
      duels[4].attacker,
      duels[3].attacker,
    ];

    return { homeStarters, awayStarters };
  }, [match?.duels]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-secondary" />
        <CardSkeleton count={3} />
      </div>
    );
  }

  if (isError || !match) {
    return (
      <ErrorState
        title="Partida não encontrada"
        message={error?.message || 'Não foi possível carregar os dados desta partida.'}
        onRetry={refetch}
      />
    );
  }

  const homeClub = clubsMap.get(match.home.club_id);
  const awayClub = clubsMap.get(match.away.club_id);
  const homeAcronym = homeClub?.acronym || getInitials(match.home.club_name);
  const awayAcronym = awayClub?.acronym || getInitials(match.away.club_name);

  const homePitchPositions = getFormationPitchPositions(match.home.formation, 'home');
  const awayPitchPositions = getFormationPitchPositions(match.away.formation, 'away');

  const turnoMandanteDuels = match.duels?.slice(0, 3) || [];
  const turnoVisitanteDuels = match.duels?.slice(3, 6) || [];

  return (
    <div className="space-y-6">
      {/* Navegação de retorno */}
      <div className="flex items-center justify-between">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer -ml-2"
        >
          <Link to="/matches">
            <ArrowLeft className="h-4 w-4" />
            Voltar para partidas
          </Link>
        </Button>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDateTime(match.played_at)}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Encerrada
          </span>
        </div>
      </div>

      {/* Card Principal do Placar (Scoreboard conforme Figma L03) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Mandante */}
          <div className="flex items-center gap-4 flex-1 justify-end order-1 sm:order-1 text-right">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {match.home.club_name}
              </h2>
              <div className="flex items-center justify-end gap-2 mt-1">
                <span className="text-xs text-slate-500 font-medium">Mandante</span>
                <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {match.home.formation}
                </span>
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 font-bold text-lg border border-slate-200 shadow-2xs shrink-0">
              {homeAcronym}
            </div>
          </div>

          {/* Placar Central */}
          <div className="flex flex-col items-center justify-center px-6 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 shrink-0 order-2">
            <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-wider font-sans tabular-nums">
              {match.home.goals} <span className="text-slate-400 font-light mx-1">-</span> {match.away.goals}
            </div>
            <span className="text-[11px] text-slate-500 font-medium mt-1">
              Tempo regulamentar
            </span>
            <div className="mt-1">
              {match.result === 'MANDANTE' ? (
                <Badge variant="success" className="text-[10px] rounded-md">
                  Vitória Mandante
                </Badge>
              ) : match.result === 'VISITANTE' ? (
                <Badge variant="default" className="text-[10px] rounded-md bg-blue-600 text-white">
                  Vitória Visitante
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] rounded-md">
                  Empate
                </Badge>
              )}
            </div>
          </div>

          {/* Visitante */}
          <div className="flex items-center gap-4 flex-1 justify-start order-3 sm:order-3 text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 font-bold text-lg border border-slate-200 shadow-2xs shrink-0">
              {awayAcronym}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {match.away.club_name}
              </h2>
              <div className="flex items-center justify-start gap-2 mt-1">
                <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {match.away.formation}
                </span>
                <span className="text-xs text-slate-500 font-medium">Visitante</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campo Tático Horizontal (Em campo conforme Figma L03) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Swords className="h-4 w-4 text-blue-600" />
              Em campo
            </h3>
            <p className="text-xs text-slate-500">
              Disposição tática dos 5 titulares de cada clube durante o confronto.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-blue-700">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block" />
              {match.home.club_name} ({match.home.formation})
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="h-2.5 w-2.5 rounded-full bg-white border border-slate-400 inline-block" />
              {match.away.club_name} ({match.away.formation})
            </span>
          </div>
        </div>

        {/* Gramado Verde com linhas de demarcação */}
        <div className="relative w-full h-[260px] sm:h-[300px] rounded-2xl bg-[#0e5929] border-2 border-[#093f1c] overflow-hidden select-none shadow-inner">
          {/* Faixas verticais do gramado */}
          <div className="absolute inset-0 flex opacity-25">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={cn('flex-1 h-full', i % 2 === 0 ? 'bg-black/10' : 'bg-transparent')}
              />
            ))}
          </div>

          {/* Linhas brancas do campo */}
          <div className="absolute inset-3 border border-white/40 rounded-lg pointer-events-none">
            {/* Linha do meio de campo */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/40 -translate-x-1/2" />
            {/* Círculo central */}
            <div className="absolute top-1/2 left-1/2 h-24 w-24 rounded-full border border-white/40 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 rounded-full bg-white/60 -translate-x-1/2 -translate-y-1/2" />

            {/* Área Mandante (esquerda) */}
            <div className="absolute top-1/2 left-0 h-40 w-16 -translate-y-1/2 border-r border-y border-white/40 rounded-r-md" />
            <div className="absolute top-1/2 left-0 h-24 w-8 -translate-y-1/2 border-r border-y border-white/40" />

            {/* Área Visitante (direita) */}
            <div className="absolute top-1/2 right-0 h-40 w-16 -translate-y-1/2 border-l border-y border-white/40 rounded-l-md" />
            <div className="absolute top-1/2 right-0 h-24 w-8 -translate-y-1/2 border-l border-y border-white/40" />
          </div>

          {/* Jogadores Mandante (Azul) */}
          {starters.homeStarters.map((player, idx) => {
            const pos = homePitchPositions[idx] || { x: 20, y: 50 };
            const isSick = player.condition === 'MAL_CONDICIONADO';

            return (
              <div
                key={`home-${player.player_id}-${idx}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-default transition-transform hover:scale-110 z-10"
              >
                <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs shadow-md ring-2 ring-white/80">
                  <span>{player.position}</span>
                  {isSick && (
                    <span
                      title="Mal condicionado (-15% atributos)"
                      className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-bold shadow-xs"
                    >
                      !
                    </span>
                  )}
                </div>
                <span className="mt-1 px-1.5 py-0.2 rounded bg-black/60 text-white font-semibold text-[10px] whitespace-nowrap drop-shadow-sm max-w-[85px] truncate">
                  {player.player_name}
                </span>
              </div>
            );
          })}

          {/* Jogadores Visitante (Branco) */}
          {starters.awayStarters.map((player, idx) => {
            const pos = awayPitchPositions[idx] || { x: 80, y: 50 };
            const isSick = player.condition === 'MAL_CONDICIONADO';

            return (
              <div
                key={`away-${player.player_id}-${idx}`}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-default transition-transform hover:scale-110 z-10"
              >
                <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-slate-900 font-bold text-xs shadow-md ring-2 ring-black/20">
                  <span>{player.position}</span>
                  {isSick && (
                    <span
                      title="Mal condicionado (-15% atributos)"
                      className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-bold shadow-xs"
                    >
                      !
                    </span>
                  )}
                </div>
                <span className="mt-1 px-1.5 py-0.2 rounded bg-black/60 text-white font-semibold text-[10px] whitespace-nowrap drop-shadow-sm max-w-[85px] truncate">
                  {player.player_name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela dos 6 Duelos Táticos (Figma L03) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80">
          <h3 className="text-base font-bold text-slate-900">6 Duelos Táticos</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Confrontos diretos resolvidos pela API (RN20) entre atacante e defensor correspondente.
          </p>
        </div>

        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16 text-center text-xs font-semibold text-slate-600">
                Duelo
              </TableHead>
              <TableHead className="min-w-[170px] text-xs font-semibold text-slate-600">
                Atacante
              </TableHead>
              <TableHead className="w-[150px] text-xs font-semibold text-slate-600">
                Atributo de Ataque
              </TableHead>
              <TableHead className="min-w-[170px] text-xs font-semibold text-slate-600">
                Defensor
              </TableHead>
              <TableHead className="w-[150px] text-xs font-semibold text-slate-600">
                Atributo de Defesa
              </TableHead>
              <TableHead className="w-[120px] text-center text-xs font-semibold text-slate-600">
                Resultado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Turno Mandante */}
            <TableRow className="bg-blue-50/40 hover:bg-blue-50/60 font-semibold border-y border-blue-100">
              <TableCell colSpan={6} className="py-2 px-4 text-xs text-blue-900">
                Turno Mandante — Ataque do {match.home.club_name} vs Defesa do{' '}
                {match.away.club_name}
              </TableCell>
            </TableRow>
            {turnoMandanteDuels.map((d) => (
              <TableRow key={`duel-${d.order}`} className="hover:bg-slate-50/60 transition-colors">
                <TableCell className="text-center font-bold font-mono text-xs text-slate-700">
                  {d.order}º
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{d.attacker.player_name}</span>
                    <span className="inline-flex items-center text-[10px] font-medium text-slate-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded shadow-2xs">
                      {d.attacker.position}
                    </span>
                    {d.attacker.condition === 'MAL_CONDICIONADO' && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-sans tabular-nums text-slate-700">
                  <span className="capitalize">{d.attacker.attribute}</span>{' '}
                  <span className="font-bold text-slate-900">{d.attacker.value}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{d.defender.player_name}</span>
                    <span className="inline-flex items-center text-[10px] font-medium text-slate-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded shadow-2xs">
                      {d.defender.position}
                    </span>
                    {d.defender.condition === 'MAL_CONDICIONADO' && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-sans tabular-nums text-slate-700">
                  <span className="capitalize">{d.defender.attribute}</span>{' '}
                  <span className="font-bold text-slate-900">{d.defender.value}</span>
                </TableCell>
                <TableCell className="text-center">
                  {d.goal ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Gol
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      <XCircle className="h-3 w-3 text-slate-400" />
                      Sem gol
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {/* Turno Visitante */}
            <TableRow className="bg-slate-100/60 hover:bg-slate-100/80 font-semibold border-y border-slate-200">
              <TableCell colSpan={6} className="py-2 px-4 text-xs text-slate-900">
                Turno Visitante — Ataque do {match.away.club_name} vs Defesa do{' '}
                {match.home.club_name}
              </TableCell>
            </TableRow>
            {turnoVisitanteDuels.map((d) => (
              <TableRow key={`duel-${d.order}`} className="hover:bg-slate-50/60 transition-colors">
                <TableCell className="text-center font-bold font-mono text-xs text-slate-700">
                  {d.order}º
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{d.attacker.player_name}</span>
                    <span className="inline-flex items-center text-[10px] font-medium text-slate-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded shadow-2xs">
                      {d.attacker.position}
                    </span>
                    {d.attacker.condition === 'MAL_CONDICIONADO' && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-sans tabular-nums text-slate-700">
                  <span className="capitalize">{d.attacker.attribute}</span>{' '}
                  <span className="font-bold text-slate-900">{d.attacker.value}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{d.defender.player_name}</span>
                    <span className="inline-flex items-center text-[10px] font-medium text-slate-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded shadow-2xs">
                      {d.defender.position}
                    </span>
                    {d.defender.condition === 'MAL_CONDICIONADO' && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-sans tabular-nums text-slate-700">
                  <span className="capitalize">{d.defender.attribute}</span>{' '}
                  <span className="font-bold text-slate-900">{d.defender.value}</span>
                </TableCell>
                <TableCell className="text-center">
                  {d.goal ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Gol
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      <XCircle className="h-3 w-3 text-slate-400" />
                      Sem gol
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Nota da regra de negócio */}
      <p className="text-[11px] text-slate-500">
        * Toda partida grava o placar e os 6 duelos táticos e nunca é recalculada nem editada (RN20, RN21).
      </p>
    </div>
  );
}
