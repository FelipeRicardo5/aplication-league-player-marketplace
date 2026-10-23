import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, HeartCrack } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import type { Match, MatchDuelPlayer } from '../types';
import { CardSkeleton } from '@/components/feedback/loading-skeleton';
import { ErrorState } from '@/components/feedback/error-state';
import { cn } from '@/lib/utils';

/**
 * Ícone clássico de bola de futebol preto e branco (Figma L03 / 60:158515).
 */
export function SoccerBallIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="10" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
      {/* Pentágono Central */}
      <polygon points="12,8 15.5,10.5 14,14.5 10,14.5 8.5,10.5" fill="#1E293B" />
      {/* Linhas e gomos periféricos */}
      <line x1="12" y1="8" x2="12" y2="2" stroke="#1E293B" strokeWidth="1.5" />
      <polygon points="10,2 14,2 12,3.5" fill="#1E293B" />
      <line x1="15.5" y1="10.5" x2="21.5" y2="8" stroke="#1E293B" strokeWidth="1.5" />
      <polygon points="21,6.5 22,9.5 19.5,8.5" fill="#1E293B" />
      <line x1="14" y1="14.5" x2="18" y2="20.5" stroke="#1E293B" strokeWidth="1.5" />
      <polygon points="16,21 20,19 17.5,17" fill="#1E293B" />
      <line x1="10" y1="14.5" x2="6" y2="20.5" stroke="#1E293B" strokeWidth="1.5" />
      <polygon points="8,21 4,19 6.5,17" fill="#1E293B" />
      <line x1="8.5" y1="10.5" x2="2.5" y2="8" stroke="#1E293B" strokeWidth="1.5" />
      <polygon points="3,6.5 2,9.5 4.5,8.5" fill="#1E293B" />
    </svg>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Coordenadas percentuais (x, y) de cada slot tático no campo horizontal.
 * Mandante (lado esquerdo): ataca da esquerda para a direita (→).
 * Visitante (lado direito): ataca da direita para a esquerda (←).
 */
interface PitchSlotPosition {
  x: number;
  y: number;
}

function getFormationPitchPositions(formation: string, side: 'home' | 'away'): PitchSlotPosition[] {
  const isHome = side === 'home';

  // [Goleiro, 1º linha (ZAG), 2º linha (LAT), 3º linha (MEI), 4º linha (ATA)]
  switch (formation) {
    case '3-1':
      return isHome
        ? [
            { x: 8, y: 50 },
            { x: 20, y: 24 },
            { x: 20, y: 50 },
            { x: 20, y: 76 },
            { x: 40, y: 56 },
          ]
        : [
            { x: 92, y: 50 },
            { x: 80, y: 24 },
            { x: 80, y: 50 },
            { x: 80, y: 76 },
            { x: 60, y: 56 },
          ];

    case '2-2':
      return isHome
        ? [
            { x: 8, y: 50 },
            { x: 20, y: 34 },
            { x: 20, y: 72 },
            { x: 38, y: 34 },
            { x: 38, y: 72 },
          ]
        : [
            { x: 92, y: 50 },
            { x: 80, y: 34 },
            { x: 80, y: 72 },
            { x: 62, y: 34 },
            { x: 62, y: 72 },
          ];

    case '1-2-1':
      return isHome
        ? [
            { x: 8, y: 50 },
            { x: 19, y: 50 },
            { x: 30, y: 26 },
            { x: 30, y: 74 },
            { x: 42, y: 56 },
          ]
        : [
            { x: 92, y: 50 },
            { x: 81, y: 50 },
            { x: 70, y: 26 },
            { x: 70, y: 74 },
            { x: 58, y: 56 },
          ];

    case '2-1-1':
    default:
      return isHome
        ? [
            { x: 8, y: 50 },
            { x: 20, y: 34 },
            { x: 20, y: 72 },
            { x: 32, y: 56 },
            { x: 42, y: 56 },
          ]
        : [
            { x: 92, y: 50 },
            { x: 80, y: 34 },
            { x: 80, y: 72 },
            { x: 68, y: 56 },
            { x: 58, y: 56 },
          ];
  }
}

/**
 * Formata os atributos utilizados pelo titular nos duelos da partida.
 * Ex.: 'GOL · Def 74', 'ZAG · Def 67', 'LAT · Dri 75 · Def 63', 'MEI · Pas 82', 'ATA · Fin 81'.
 */
function getPlayerPitchAttributeSummary(player: MatchDuelPlayer, duels?: Match['duels']): string {
  const list = duels || [];
  const attackDuel = list.find((d) => d.attacker.player_id === player.player_id);
  const defDuel = list.find((d) => d.defender.player_id === player.player_id);

  const parts: string[] = [player.position];

  const attrAbbr: Record<string, string> = {
    finalizacao: 'Fin',
    passe: 'Pas',
    drible: 'Dri',
    defesa: 'Def',
  };

  if (attackDuel) {
    const key = attackDuel.attacker.attribute.toLowerCase();
    const abbr = attrAbbr[key] || attackDuel.attacker.attribute.slice(0, 3);
    parts.push(`${abbr} ${attackDuel.attacker.value}`);
  }

  if (defDuel) {
    const key = defDuel.defender.attribute.toLowerCase();
    const abbr = attrAbbr[key] || defDuel.defender.attribute.slice(0, 3);
    parts.push(`${abbr} ${defDuel.defender.value}`);
  }

  return parts.join(' · ');
}

function formatAttributeName(attr: string): string {
  switch (attr.toLowerCase()) {
    case 'finalizacao':
      return 'Finalização';
    case 'passe':
      return 'Passe';
    case 'drible':
      return 'Drible';
    case 'defesa':
      return 'Defesa';
    default:
      return attr.charAt(0).toUpperCase() + attr.slice(1);
  }
}

function getDuelSubtitles(order: number, match: Match) {
  const homeName = match.home.club_name;
  const awayName = match.away.club_name;
  const duels = match.duels || [];

  switch (order) {
    case 1:
      return {
        attacker: `${duels[0]?.attacker.position || 'ATA'}, 4º de linha · ${homeName}`,
        defender: `Goleiro · ${awayName}`,
      };
    case 2:
      return {
        attacker: `${duels[1]?.attacker.position || 'MEI'}, 3º de linha · ${homeName}`,
        defender: `${duels[1]?.defender.position || 'ZAG'}, 1º de linha · ${awayName}`,
      };
    case 3:
      return {
        attacker: `${duels[2]?.attacker.position || 'LAT'}, 2º de linha · ${homeName}`,
        defender: `${duels[2]?.defender.position || 'LAT'}, 2º de linha · ${awayName}`,
      };
    case 4:
      return {
        attacker: `${duels[3]?.attacker.position || 'ATA'}, 4º de linha · ${awayName}`,
        defender: `Goleiro · ${homeName}`,
      };
    case 5:
      return {
        attacker: `${duels[4]?.attacker.position || 'MEI'}, 3º de linha · ${awayName}`,
        defender: `${duels[4]?.defender.position || 'ZAG'}, 1º de linha · ${homeName}`,
      };
    case 6:
      return {
        attacker: `${duels[5]?.attacker.position || 'LAT'}, 2º de linha · ${awayName}`,
        defender: `${duels[5]?.defender.position || 'LAT'}, 2º de linha · ${homeName}`,
      };
    default:
      return { attacker: homeName, defender: awayName };
  }
}

const pastelColors = [
  'bg-teal-100 text-teal-800',
  'bg-pink-100 text-pink-800',
  'bg-emerald-100 text-emerald-800',
  'bg-purple-100 text-purple-800',
  'bg-sky-100 text-sky-800',
  'bg-cyan-100 text-cyan-800',
  'bg-indigo-100 text-indigo-800',
  'bg-rose-100 text-rose-800',
];

function getPlayerAvatarColor(id: number): string {
  return pastelColors[id % pastelColors.length];
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

  // Set de IDs dos jogadores que marcaram gol nos duelos
  const goalScorerIds = useMemo(() => {
    const set = new Set<number>();
    if (match?.duels) {
      for (const d of match.duels) {
        if (d.goal) {
          set.add(d.attacker.player_id);
        }
      }
    }
    return set;
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

  const homeGoalsCount = turnoMandanteDuels.filter((d) => d.goal).length;
  const awayGoalsCount = turnoVisitanteDuels.filter((d) => d.goal).length;

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
      </div>

      {/* Card Principal do Placar (Scoreboard conforme Figma L03 / 60:158515) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          {/* Mandante */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-end order-1 sm:order-1 text-right">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {match.home.club_name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Mandante · {match.home.formation}</p>
            </div>
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-800 font-bold text-sm border border-slate-200 shrink-0">
              {homeAcronym}
            </div>
          </div>

          {/* Placar Central com data e status */}
          <div className="flex flex-col items-center justify-center order-2 shrink-0 gap-1.5">
            <div className="flex items-center justify-center px-4 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/60 font-sans tabular-nums font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-wide">
              {match.home.goals} × {match.away.goals}
            </div>
            <span className="text-[11px] text-slate-500">{formatDateTime(match.played_at)}</span>
            <span className="text-[10px] text-slate-400 font-medium">Tempo regulamentar</span>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-medium border border-slate-200/80 bg-white text-slate-700 shadow-2xs">
              {match.result === 'MANDANTE'
                ? 'Vitória do mandante'
                : match.result === 'VISITANTE'
                  ? 'Vitória do visitante'
                  : 'Empate'}
            </span>
          </div>

          {/* Visitante */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-start order-3 sm:order-3 text-left">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-800 font-bold text-sm border border-slate-200 shrink-0">
              {awayAcronym}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {match.away.club_name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Visitante · {match.away.formation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Em campo (Campo Tático Horizontal conforme Figma L03) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        {/* Cabeçalho e Legenda Oficial */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">Em campo</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Titulares de cada clube na formação da partida e os valores usados nos duelos, já com
              o efeito da condição.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#B45309] text-white">
                <HeartCrack className="h-2.5 w-2.5 fill-white stroke-none" />
              </span>
              <span>Mal condicionado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <SoccerBallIcon className="h-4 w-4 shrink-0" />
              <span>Gol no duelo</span>
            </div>
          </div>
        </div>

        {/* 
          Container do Campo
          CONTROLE DE ALTURA MANUAL:
          Para ajustar a altura do campo verticalmente, altere as classes de altura abaixo
          (atualmente: h-[390px] sm:h-[440px]).
        */}
        <div className="overflow-x-auto pb-1">
          <div className="relative w-full min-w-[680px] h-[390px] sm:h-[440px] rounded-2xl bg-[#0D542B] overflow-hidden select-none shadow-sm">
            {/* Listras verticais do gramado (12 faixas com cores autênticas amostradas do Figma #0D542B e #135E32) */}
            <div className="absolute inset-0 flex pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={cn('flex-1 h-full', i % 2 === 0 ? 'bg-[#0D542B]' : 'bg-[#135E32]')}
                />
              ))}
            </div>

            {/* Linhas demarcatórias vetoriais (SVG exato do protótipo) */}
            <svg
              viewBox="0 0 1000 420"
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
            >
              {/* Linha externa de limite */}
              <rect
                x="20"
                y="20"
                width="960"
                height="380"
                rx="8"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
              />
              {/* 4 Arcos de escanteio */}
              <path
                d="M 20 36 A 16 16 0 0 0 36 20"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
              />
              <path
                d="M 20 384 A 16 16 0 0 1 36 400"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
              />
              <path
                d="M 980 36 A 16 16 0 0 1 964 20"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
              />
              <path
                d="M 980 384 A 16 16 0 0 0 964 400"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
              />

              {/* Linha de meio de campo */}
              <line
                x1="500"
                y1="20"
                x2="500"
                y2="400"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
              />
              {/* Círculo central e ponto */}
              <circle
                cx="500"
                cy="210"
                r="55"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
              />
              <circle cx="500" cy="210" r="3.5" fill="rgba(255,255,255,0.6)" />

              {/* Grande área Mandante (esquerda) e Visitante (direita) */}
              <rect
                x="20"
                y="95"
                width="145"
                height="230"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
              />
              <rect
                x="835"
                y="95"
                width="145"
                height="230"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
              />

              {/* Pequena área Mandante e Visitante */}
              <rect
                x="20"
                y="150"
                width="55"
                height="120"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
              />
              <rect
                x="925"
                y="150"
                width="55"
                height="120"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
              />

              {/* Pontos de pênalti */}
              <circle cx="115" cy="210" r="3" fill="rgba(255,255,255,0.6)" />
              <circle cx="885" cy="210" r="3" fill="rgba(255,255,255,0.6)" />

              {/* Meia-lua das grandes áreas */}
              <path
                d="M 165 175 A 50 50 0 0 1 165 245"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
              />
              <path
                d="M 835 175 A 50 50 0 0 0 835 245"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
              />

              {/* Redes dos gols externas */}
              <rect
                x="6"
                y="175"
                width="14"
                height="70"
                rx="2"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
              />
              <rect
                x="980"
                y="175"
                width="14"
                height="70"
                rx="2"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
              />
            </svg>

            {/* Pill no canto superior esquerdo dentro do campo: Mandante */}
            <div className="absolute top-3.5 left-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-xs border border-white/10 text-white text-[11px] font-medium shadow-xs">
              <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
              <span className="font-semibold">{match.home.club_name}</span>
              <span className="text-white/80 font-mono text-[10px]">{match.home.formation}</span>
              <span className="text-white/40">|</span>
              <span className="flex items-center gap-1 text-white/90 text-[10px]">
                ataca
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>

            {/* Pill no canto superior direito dentro do campo: Visitante */}
            <div className="absolute top-3.5 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-xs border border-white/10 text-white text-[11px] font-medium shadow-xs">
              <span className="h-2 w-2 rounded-full bg-white shrink-0" />
              <span className="font-semibold">{match.away.club_name}</span>
              <span className="text-white/80 font-mono text-[10px]">{match.away.formation}</span>
              <span className="text-white/40">|</span>
              <span className="flex items-center gap-1 text-white/90 text-[10px]">
                ataca
                <ArrowLeft className="h-3 w-3" />
              </span>
            </div>

            {/* Jogadores Mandante (Círculo Azul, Texto Branco) */}
            {starters.homeStarters.map((player, idx) => {
              const pos = homePitchPositions[idx] || { x: 20, y: 50 };
              const isSick = player.condition === 'MAL_CONDICIONADO';
              const hasGoal = goalScorerIds.has(player.player_id);
              const attrSummary = getPlayerPitchAttributeSummary(player, match.duels);

              return (
                <div
                  key={`home-${player.player_id}-${idx}`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-default transition-transform hover:scale-110 z-10"
                >
                  <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs shadow-md ring-2 ring-white">
                    <span>{getInitials(player.player_name)}</span>
                    {/* Alerta de condição no topo esquerdo do avatar */}
                    {isSick && (
                      <span
                        title="Mal condicionado (-15% atributos)"
                        className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#B45309] text-white ring-1.5 ring-white shadow-xs"
                      >
                        <HeartCrack className="h-2.5 w-2.5 fill-white stroke-none" />
                      </span>
                    )}
                    {/* Alerta de gol marcado no topo direito do avatar */}
                    {hasGoal && (
                      <span
                        title="Marcou gol no confronto"
                        className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center drop-shadow-sm"
                      >
                        <SoccerBallIcon className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  {/* Tag com nome e atributos usados nos duelos */}
                  <div className="mt-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-center border border-white/5 shadow-xs max-w-[120px]">
                    <span className="block font-bold text-[11px] leading-tight truncate">
                      {player.player_name}
                    </span>
                    <span className="block text-[10px] text-white/80 leading-tight truncate font-sans">
                      {attrSummary}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Jogadores Visitante (Círculo Branco, Texto Escuro) */}
            {starters.awayStarters.map((player, idx) => {
              const pos = awayPitchPositions[idx] || { x: 80, y: 50 };
              const isSick = player.condition === 'MAL_CONDICIONADO';
              const hasGoal = goalScorerIds.has(player.player_id);
              const attrSummary = getPlayerPitchAttributeSummary(player, match.duels);

              return (
                <div
                  key={`away-${player.player_id}-${idx}`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-default transition-transform hover:scale-110 z-10"
                >
                  <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-slate-900 font-bold text-xs shadow-md ring-2 ring-slate-300">
                    <span>{getInitials(player.player_name)}</span>
                    {/* Alerta de condição no topo esquerdo do avatar */}
                    {isSick && (
                      <span
                        title="Mal condicionado (-15% atributos)"
                        className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#B45309] text-white ring-1.5 ring-white shadow-xs"
                      >
                        <HeartCrack className="h-2.5 w-2.5 fill-white stroke-none" />
                      </span>
                    )}
                    {/* Alerta de gol marcado no topo direito do avatar */}
                    {hasGoal && (
                      <span
                        title="Marcou gol no confronto"
                        className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center drop-shadow-sm"
                      >
                        <SoccerBallIcon className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  {/* Tag com nome e atributos usados nos duelos */}
                  <div className="mt-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-center border border-white/5 shadow-xs max-w-[120px]">
                    <span className="block font-bold text-[11px] leading-tight truncate">
                      {player.player_name}
                    </span>
                    <span className="block text-[10px] text-white/80 leading-tight truncate font-sans">
                      {attrSummary}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabela dos 6 Duelos Táticos (Figma L03) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80">
          <h3 className="text-sm sm:text-base font-bold text-slate-900">Duelos</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Os 3 ataques do mandante e depois os 3 do visitante. Os jogadores de linha vão do 1º (o
            mais recuado) ao 4º (o mais avançado), pela ordem do elenco: o 4º ataca o goleiro, o 3º
            ataca o 1º e o 2º ataca o 2º.
          </p>
        </div>

        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16 text-center text-xs font-semibold text-slate-600">
                Duelo
              </TableHead>
              <TableHead className="min-w-[180px] text-xs font-semibold text-slate-600">
                Atacante
              </TableHead>
              <TableHead className="w-[140px] text-xs font-semibold text-slate-600">
                Ataque
              </TableHead>
              <TableHead className="min-w-[180px] text-xs font-semibold text-slate-600">
                Defensor
              </TableHead>
              <TableHead className="w-[140px] text-xs font-semibold text-slate-600">
                Defesa
              </TableHead>
              <TableHead className="w-[120px] text-center text-xs font-semibold text-slate-600">
                Resultado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Header de Grupo: Ataques do Mandante */}
            <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-y border-slate-200">
              <TableCell colSpan={6} className="py-2.5 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      {homeAcronym}
                    </span>
                    <span className="font-semibold text-xs text-slate-800">
                      Ataques do {match.home.club_name} (mandante)
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {homeGoalsCount} {homeGoalsCount === 1 ? 'gol' : 'gols'}
                  </span>
                </div>
              </TableCell>
            </TableRow>
            {turnoMandanteDuels.map((d) => {
              const subtitles = getDuelSubtitles(d.order, match);
              return (
                <TableRow
                  key={`duel-${d.order}`}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <TableCell className="text-center">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                      {d.order}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0',
                          getPlayerAvatarColor(d.attacker.player_id),
                        )}
                      >
                        {getInitials(d.attacker.player_name)}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {d.attacker.player_name}
                        </span>
                        <span className="text-[11px] text-slate-500">{subtitles.attacker}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-sans text-slate-600">
                    {formatAttributeName(d.attacker.attribute)}{' '}
                    <strong className="text-slate-900 font-bold font-sans tabular-nums">
                      {d.attacker.value}
                    </strong>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0',
                          getPlayerAvatarColor(d.defender.player_id),
                        )}
                      >
                        {getInitials(d.defender.player_name)}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {d.defender.player_name}
                        </span>
                        <span className="text-[11px] text-slate-500">{subtitles.defender}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-sans text-slate-600">
                    Defesa{' '}
                    <strong className="text-slate-900 font-bold font-sans tabular-nums">
                      {d.defender.value}
                    </strong>
                  </TableCell>
                  <TableCell className="text-center">
                    {d.goal ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF7EE] text-[#016630] border border-[#B9E6C3]">
                        <SoccerBallIcon className="h-3.5 w-3.5" />
                        Gol
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                        Sem gol
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Header de Grupo: Ataques do Visitante */}
            <TableRow className="bg-slate-50/70 hover:bg-slate-50/70 border-y border-slate-200">
              <TableCell colSpan={6} className="py-2.5 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      {awayAcronym}
                    </span>
                    <span className="font-semibold text-xs text-slate-800">
                      Ataques do {match.away.club_name} (visitante)
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {awayGoalsCount} {awayGoalsCount === 1 ? 'gol' : 'gols'}
                  </span>
                </div>
              </TableCell>
            </TableRow>
            {turnoVisitanteDuels.map((d) => {
              const subtitles = getDuelSubtitles(d.order, match);
              return (
                <TableRow
                  key={`duel-${d.order}`}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <TableCell className="text-center">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                      {d.order}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0',
                          getPlayerAvatarColor(d.attacker.player_id),
                        )}
                      >
                        {getInitials(d.attacker.player_name)}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {d.attacker.player_name}
                        </span>
                        <span className="text-[11px] text-slate-500">{subtitles.attacker}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-sans text-slate-600">
                    {formatAttributeName(d.attacker.attribute)}{' '}
                    <strong className="text-slate-900 font-bold font-sans tabular-nums">
                      {d.attacker.value}
                    </strong>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0',
                          getPlayerAvatarColor(d.defender.player_id),
                        )}
                      >
                        {getInitials(d.defender.player_name)}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {d.defender.player_name}
                        </span>
                        <span className="text-[11px] text-slate-500">{subtitles.defender}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-sans text-slate-600">
                    Defesa{' '}
                    <strong className="text-slate-900 font-bold font-sans tabular-nums">
                      {d.defender.value}
                    </strong>
                  </TableCell>
                  <TableCell className="text-center">
                    {d.goal ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF7EE] text-[#016630] border border-[#B9E6C3]">
                        <SoccerBallIcon className="h-3.5 w-3.5" />
                        Gol
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                        Sem gol
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Nota oficial do rodapé (Figma L03) */}
      <p className="text-[11px] text-slate-500 leading-relaxed">
        Mesma tela logo depois de jogar e ao abrir uma partida do histórico, com as formações dos
        dois clubes e os 6 duelos. Os valores e a condição de cada titular vêm gravados nos duelos
        devolvidos pela API; mal condicionado joga com 15% a menos (RN20).
      </p>
    </div>
  );
}
