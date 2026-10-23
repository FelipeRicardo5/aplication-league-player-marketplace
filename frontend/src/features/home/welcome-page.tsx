import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  User,
  Shield,
  Swords,
  Trophy,
  ShoppingCart,
  HandCoins,
  History,
  Clock,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { usePlayersQuery } from '@/features/players/hooks/use-players';
import { useClubsQuery } from '@/features/clubs/hooks/use-clubs';
import { useMatchesQuery, useStandingsQuery } from '@/features/league/hooks/use-league';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/layout/brand-logo';

export function WelcomePage() {
  const navigate = useNavigate();

  // Busca dados consolidados da liga via TanStack Query
  const { data: playersData } = usePlayersQuery({ limit: 1 });
  const { data: freePlayersData } = usePlayersQuery({
    free: true,
    limit: 1,
  });
  const { data: clubsData } = useClubsQuery();
  const { data: matchesData } = useMatchesQuery();
  const { data: standingsData } = useStandingsQuery();

  const totalPlayers = playersData?.meta?.total_items ?? 0;
  const freePlayers = freePlayersData?.meta?.total_items ?? 0;
  const totalClubs = clubsData?.length ?? 0;
  const totalMatches = matchesData?.length ?? 0;
  const leader = standingsData && standingsData.length > 0 ? standingsData[0] : null;

  // Estado W01 (com partidas) vs W02 (sem partidas)
  const hasMatches = totalMatches > 0;

  // Atalho global: pressionar Enter inicia a navegação para /players
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        const isInput =
          activeTag === 'input' ||
          activeTag === 'textarea' ||
          activeTag === 'select' ||
          document.activeElement?.getAttribute('contenteditable') === 'true';

        if (!isInput) {
          e.preventDefault();
          navigate('/players');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#FAFAFA] dark:bg-zinc-950 select-none overflow-x-hidden">
      {/* Moldura principal da prancheta do Figma (W01 / W02 - nó 42:63529) */}
      <div className="relative w-full max-w-[1140px] rounded-[28px] border border-slate-200/80 bg-white dark:bg-zinc-900 p-6 sm:p-10 md:p-12 lg:p-14 shadow-xs overflow-hidden my-auto">
        {/* =========================================================================
            DECORAÇÃO DE CAMPO DE FUTEBOL EM SVG (Fidelidade ao nó 42:63529)
           ========================================================================= */}
        <svg
          className="absolute inset-0 w-full h-full stroke-slate-200/80 dark:stroke-zinc-800 pointer-events-none select-none"
          viewBox="0 0 1100 680"
          fill="none"
          strokeWidth="1.5"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Goleiras externas (redes projetadas para fora da linha de fundo) */}
          <rect x="5" y="275" width="20" height="130" rx="3" />
          <rect x="1075" y="275" width="20" height="130" rx="3" />

          {/* Linhas externas do gramado com bordas arredondadas */}
          <rect x="25" y="25" width="1050" height="630" rx="20" />

          {/* Linha divisória de meio de campo */}
          <line x1="550" y1="25" x2="550" y2="655" />

          {/* Círculo central e ponto central */}
          <circle cx="550" cy="340" r="85" />
          <circle
            cx="550"
            cy="340"
            r="4"
            fill="currentColor"
            className="text-slate-300 dark:text-zinc-700"
          />

          {/* Área esquerda (Goleira, Grande Área e Pequena Área) */}
          <rect x="25" y="140" width="165" height="400" />
          <rect x="25" y="240" width="60" height="200" />
          <path d="M 190 280 A 75 75 0 0 1 190 400" />
          <circle
            cx="130"
            cy="340"
            r="3"
            fill="currentColor"
            className="text-slate-300 dark:text-zinc-700"
          />

          {/* Área direita (Goleira, Grande Área e Pequena Área) */}
          <rect x="910" y="140" width="165" height="400" />
          <rect x="1015" y="240" width="60" height="200" />
          <path d="M 910 280 A 75 75 0 0 0 910 400" />
          <circle
            cx="970"
            cy="340"
            r="3"
            fill="currentColor"
            className="text-slate-300 dark:text-zinc-700"
          />

          {/* Escanteios */}
          <path d="M 25 55 A 30 30 0 0 0 55 25" />
          <path d="M 25 625 A 30 30 0 0 1 55 655" />
          <path d="M 1045 25 A 30 30 0 0 0 1075 55" />
          <path d="M 1045 655 A 30 30 0 0 1 1075 625" />
        </svg>

        {/* Conteúdo centralizado */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-6 md:space-y-7">
          {/* Monograma e Nome Passe */}
          <div className="flex items-center gap-3">
            <BrandLogo className="h-11 w-11 shadow-xs" />
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Passe
            </span>
          </div>

          {/* Pill / Selo da Liga (W01 com líder vs W02 sem partidas) */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 dark:bg-zinc-800/90 px-3.5 py-1 text-xs shadow-2xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Liga Fictícia 2026
            </span>
            <span className="text-slate-300">·</span>
            {hasMatches && leader ? (
              <span className="text-slate-500 font-normal">
                líder: <span className="text-slate-700 font-medium">{leader.club_name}</span>,{' '}
                {leader.points} pontos
              </span>
            ) : (
              <span className="text-slate-500">Nenhuma partida jogada</span>
            )}
          </div>

          {/* Headline Principal */}
          <h1 className="text-2xl sm:text-4xl md:text-[42px] font-bold tracking-tight text-slate-900 dark:text-white max-w-3xl leading-[1.15]">
            Gestão da liga, do mercado à classificação
          </h1>

          {/* Subtítulo explicativo */}
          <p className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Cadastre jogadores, monte os clubes e negocie com contrato de fidelidade. Depois, escale
            os titulares e jogue partidas com placar calculado pelos atributos.
          </p>

          {/* Botão de Ação + Atalho Enter */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Button
              size="lg"
              onClick={() => navigate('/players')}
              className="h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm flex items-center gap-2 shadow-xs cursor-pointer group"
            >
              <span>Iniciar</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>ou tecle</span>
              <kbd className="pointer-events-none inline-flex h-5 items-center rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[11px] font-medium text-slate-600 shadow-2xs">
                Enter
              </kbd>
            </div>
          </div>

          {/* Barra de Métricas Rápidas Inline (Figma node 42:63529) */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs pt-1">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {totalPlayers} jogadores
              </span>
            </div>
            <span className="text-slate-300">·</span>

            <div className="flex items-center gap-1.5 text-slate-500">
              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {freePlayers} livres
              </span>
            </div>
            <span className="text-slate-300">·</span>

            <div className="flex items-center gap-1.5 text-slate-500">
              <Shield className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {totalClubs} clubes
              </span>
            </div>
            <span className="text-slate-300">·</span>

            <div className="flex items-center gap-1.5 text-slate-500">
              <Swords className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {totalMatches} partidas
              </span>
            </div>
            <span className="text-slate-300">·</span>

            <div className="flex items-center gap-1.5 text-slate-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>Não precisa de login</span>
            </div>
          </div>

          {/* =========================================================================
              CARDS DA ESTEIRA (01 A 06) CONECTADOS COM CHEVRON (Figma node 42:63529)
             ========================================================================= */}
          <div className="w-full pt-4 md:pt-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-2 sm:gap-2.5">
              {/* Card 01 · Jogadores */}
              <div className="w-full flex-1 rounded-2xl border border-slate-200/80 bg-white dark:bg-zinc-800 p-4 text-left shadow-2xs flex flex-col justify-between min-h-[145px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 font-sans">01</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Jogadores</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed mt-1">
                    Nascem livres e Apto; o valor de mercado vem da condição, agilidade e idade.
                  </p>
                </div>
              </div>

              <ChevronRight className="hidden lg:block h-3.5 w-3.5 text-slate-300 shrink-0" />

              {/* Card 02 · Clubes */}
              <div className="w-full flex-1 rounded-2xl border border-slate-200/80 bg-white dark:bg-zinc-800 p-4 text-left shadow-2xs flex flex-col justify-between min-h-[145px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 font-sans">02</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Clubes</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed mt-1">
                    Começam com 300,00 em caixa e sem jogadores.
                  </p>
                </div>
              </div>

              <ChevronRight className="hidden lg:block h-3.5 w-3.5 text-slate-300 shrink-0" />

              {/* Card 03 · Compra */}
              <div className="w-full flex-1 rounded-2xl border border-slate-200/80 bg-white dark:bg-zinc-800 p-4 text-left shadow-2xs flex flex-col justify-between min-h-[145px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 font-sans">03</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Compra</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed mt-1">
                    Valor + taxa, até 50% do caixa, com contrato de fidelidade.
                  </p>
                </div>
              </div>

              <ChevronRight className="hidden lg:block h-3.5 w-3.5 text-slate-300 shrink-0" />

              {/* Card 04 · Venda */}
              <div className="w-full flex-1 rounded-2xl border border-slate-200/80 bg-white dark:bg-zinc-800 p-4 text-left shadow-2xs flex flex-col justify-between min-h-[145px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <HandCoins className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 font-sans">04</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Venda</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed mt-1">
                    Multa antes do fim da fidelidade e comissão sobre o lucro.
                  </p>
                </div>
              </div>

              <ChevronRight className="hidden lg:block h-3.5 w-3.5 text-slate-300 shrink-0" />

              {/* Card 05 · Histórico */}
              <div className="w-full flex-1 rounded-2xl border border-slate-200/80 bg-white dark:bg-zinc-800 p-4 text-left shadow-2xs flex flex-col justify-between min-h-[145px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <History className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 font-sans">05</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Histórico</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed mt-1">
                    Toda compra e venda fica registrada, com totais e CSV.
                  </p>
                </div>
              </div>

              <ChevronRight className="hidden lg:block h-3.5 w-3.5 text-slate-300 shrink-0" />

              {/* Card 06 · Liga */}
              <div className="w-full flex-1 rounded-2xl border border-slate-200/80 bg-white dark:bg-zinc-800 p-4 text-left shadow-2xs flex flex-col justify-between min-h-[145px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 font-sans">06</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Liga</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed mt-1">
                    Escale 5 titulares e jogue partidas que entram na classificação.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé do Frame (Figma node 42:63529) */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-2">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Liga Fictícia 2026 - Horário de Brasília (UTC-3)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
