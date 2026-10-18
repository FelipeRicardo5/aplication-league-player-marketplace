import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Shield,
  Swords,
  Trophy,
  ShoppingBag,
  Clock,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Percent,
} from 'lucide-react';
import { usePlayersQuery } from '@/features/players/hooks/use-players';
import { useClubsQuery } from '@/features/clubs/hooks/use-clubs';
import { useMatchesQuery, useStandingsQuery } from '@/features/league/hooks/use-league';
import { Button } from '@/components/ui/button';

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
      {/* Moldura principal da prancheta do Figma (W01 / W02) */}
      <div className="relative w-full max-w-[1140px] rounded-[28px] border border-border bg-card p-6 sm:p-10 md:p-12 lg:p-14 shadow-xs overflow-hidden my-auto">
        {/* =========================================================================
            DECORAÇÃO DE CAMPO DE FUTEBOL EM SVG (Alinhada em toda a extensão do card)
           ========================================================================= */}
        <svg
          className="absolute inset-0 w-full h-full stroke-border/70 pointer-events-none select-none"
          viewBox="0 0 1100 680"
          fill="none"
          strokeWidth="1.5"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Linhas externas do gramado com bordas arredondadas */}
          <rect x="25" y="25" width="1050" height="630" rx="20" />

          {/* Linha divisória de meio de campo */}
          <line x1="550" y1="25" x2="550" y2="655" />

          {/* Círculo central e ponto central */}
          <circle cx="550" cy="340" r="85" />
          <circle cx="550" cy="340" r="4" fill="currentColor" className="text-border" />

          {/* Área esquerda (Goleira, Grande Área e Pequena Área) */}
          <rect x="25" y="140" width="165" height="400" />
          <rect x="25" y="240" width="60" height="200" />
          <path d="M 190 280 A 75 75 0 0 1 190 400" />
          <circle cx="130" cy="340" r="3" fill="currentColor" className="text-border" />

          {/* Área direita (Goleira, Grande Área e Pequena Área) */}
          <rect x="910" y="140" width="165" height="400" />
          <rect x="1015" y="240" width="60" height="200" />
          <path d="M 910 280 A 75 75 0 0 0 910 400" />
          <circle cx="970" cy="340" r="3" fill="currentColor" className="text-border" />

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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-2xl shadow-xs">
              P
            </div>
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Passe
            </span>
          </div>

          {/* Pill / Selo da Liga (W01 com líder vs W02 sem partidas) */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3.5 py-1 text-xs text-muted-foreground shadow-2xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Liga Fictícia 2026
            </span>
            <span className="text-muted-foreground/60">·</span>
            {hasMatches && leader ? (
              <span>
                líder: <strong className="text-foreground">{leader.club_name}</strong>,{' '}
                {leader.points} pontos
              </span>
            ) : (
              <span>Nenhuma partida jogada</span>
            )}
          </div>

          {/* Headline Principal */}
          <h1 className="text-2xl sm:text-4xl md:text-[42px] font-bold tracking-tight text-foreground max-w-3xl leading-[1.15]">
            Gestão da liga, do mercado à classificação
          </h1>

          {/* Subtítulo explicativo */}
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Cadastre jogadores, monte os clubes e negocie com contrato de fidelidade. Depois, escale
            os titulares e jogue partidas com placar calculado pelos atributos.
          </p>

          {/* Botão de Ação + Atalho Enter */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Button
              size="lg"
              onClick={() => navigate('/players')}
              className="h-11 px-7 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm flex items-center gap-2 shadow-xs cursor-pointer group"
            >
              <span>Iniciar</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>ou tecle</span>
              <kbd className="pointer-events-none inline-flex h-6 items-center rounded border border-border bg-muted/60 px-2 font-mono text-[11px] font-medium text-foreground shadow-2xs">
                Enter
              </kbd>
            </div>
          </div>

          {/* Barra de Métricas Rápidas Inline */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>{totalPlayers} jogadores</span>
            </div>
            <span className="text-muted-foreground/50">·</span>

            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>{freePlayers} livres</span>
            </div>
            <span className="text-muted-foreground/50">·</span>

            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>{totalClubs} clubes</span>
            </div>
            <span className="text-muted-foreground/50">·</span>

            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Swords className="h-3.5 w-3.5 text-indigo-600" />
              <span>{totalMatches} partidas</span>
            </div>
            <span className="text-muted-foreground/50">·</span>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/80" />
              <span>Não precisa de login</span>
            </div>
          </div>

          {/* =========================================================================
              CARDS DA ESTEIRA (01 A 06) CONECTADOS COM CHEVRON
             ========================================================================= */}
          <div className="w-full pt-4 md:pt-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-2 sm:gap-2.5">
              {/* Card 01 · Jogadores */}
              <div className="w-full flex-1 rounded-xl border border-border/80 bg-card p-4 text-left shadow-2xs flex flex-col justify-between min-h-[145px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-7 w-7 rounded-md bg-blue-50 text-primary flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground/70">01</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Jogadores</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Nascem livres e Apto; o valor de mercado vem da condição, agilidade e idade.
                  </p>
                </div>
              </div>

              <ChevronRight className="hidden lg:block h-4 w-4 text-muted-foreground/40 shrink-0" />

              {/* Card 02 · Clubes */}
              <div className="w-full flex-1 rounded-xl border border-border/80 bg-card p-4 text-left shadow-2xs flex flex-col justify-between min-h-[145px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-7 w-7 rounded-md bg-blue-50 text-primary flex items-center justify-center">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground/70">02</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Clubes</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Começam com 300,00 em caixa e sem jogadores.
                  </p>
                </div>
              </div>

              <ChevronRight className="hidden lg:block h-4 w-4 text-muted-foreground/40 shrink-0" />

              {/* Card 03 · Compra */}
              <div className="w-full flex-1 rounded-xl border border-border/80 bg-card p-4 text-left shadow-2xs flex flex-col justify-between min-h-[145px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-7 w-7 rounded-md bg-blue-50 text-primary flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground/70">03</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Compra</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Valor + taxa, até 50% do caixa, com contrato de fidelidade.
                  </p>
                </div>
              </div>

              <ChevronRight className="hidden lg:block h-4 w-4 text-muted-foreground/40 shrink-0" />

              {/* Card 04 · Venda */}
              <div className="w-full flex-1 rounded-xl border border-border/80 bg-card p-4 text-left shadow-2xs flex flex-col justify-between min-h-[145px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-7 w-7 rounded-md bg-blue-50 text-primary flex items-center justify-center">
                    <Percent className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground/70">04</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Venda</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Multa antes do fim da fidelidade e comissão sobre o lucro.
                  </p>
                </div>
              </div>

              <ChevronRight className="hidden lg:block h-4 w-4 text-muted-foreground/40 shrink-0" />

              {/* Card 05 · Histórico */}
              <div className="w-full flex-1 rounded-xl border border-border/80 bg-card p-4 text-left shadow-2xs flex flex-col justify-between min-h-[145px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-7 w-7 rounded-md bg-blue-50 text-primary flex items-center justify-center">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground/70">05</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Histórico</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Toda compra e venda fica registrada, com totais e CSV.
                  </p>
                </div>
              </div>

              <ChevronRight className="hidden lg:block h-4 w-4 text-muted-foreground/40 shrink-0" />

              {/* Card 06 · Liga */}
              <div className="w-full flex-1 rounded-xl border border-border/80 bg-card p-4 text-left shadow-2xs flex flex-col justify-between min-h-[145px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-7 w-7 rounded-md bg-blue-50 text-primary flex items-center justify-center">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground/70">06</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">Liga</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    Escale 5 titulares e jogue partidas que entram na classificação.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé do Frame */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80 pt-2">
            <Clock className="h-3 w-3" />
            <span>Liga Fictícia 2026 · Horário de Brasília (UTC-3)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
