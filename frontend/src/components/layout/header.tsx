import { PanelLeft, ChevronRight, RotateCw } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { fetchMatchById } from '@/features/league/api/league-api';
import { fetchClubById } from '@/features/clubs/api/clubs-api';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  const location = useLocation();
  const path = location.pathname;
  const parts = path.split('/').filter(Boolean);

  const isMatchDetail = parts[0] === 'matches' && parts.length > 1 && !isNaN(Number(parts[1]));
  const matchId = isMatchDetail ? Number(parts[1]) : undefined;

  const isClubDetail = parts[0] === 'clubs' && parts.length > 1 && !isNaN(Number(parts[1]));
  const clubId = isClubDetail ? Number(parts[1]) : undefined;

  const { data: match } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => fetchMatchById(matchId!),
    enabled: Boolean(matchId),
    staleTime: 1000 * 60,
  });

  const { data: club } = useQuery({
    queryKey: ['club', clubId],
    queryFn: () => fetchClubById(clubId!),
    enabled: Boolean(clubId),
    staleTime: 1000 * 60,
  });

  const getBreadcrumb = () => {
    if (path.startsWith('/players')) {
      return { category: 'Mercado', current: 'Jogadores' };
    }
    if (path.startsWith('/clubs')) {
      if (isClubDetail) {
        return {
          category: 'Mercado',
          section: 'Clubes',
          sectionHref: '/clubs',
          current: club?.name || 'Detalhes do Clube',
        };
      }
      return { category: 'Mercado', current: 'Clubes' };
    }
    if (path.startsWith('/matches')) {
      if (isMatchDetail) {
        const matchTitle = match
          ? `${match.home.club_name} ${match.home.goals} × ${match.away.goals} ${match.away.club_name}`
          : 'Partida';
        return {
          category: 'Liga',
          section: 'Partidas',
          sectionHref: '/matches',
          current: matchTitle,
        };
      }
      return { category: 'Liga', current: 'Partidas' };
    }
    if (path.startsWith('/standings')) {
      return { category: 'Liga', current: 'Classificação' };
    }
    return { category: 'Mercado', current: 'Jogadores' };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="flex h-13 min-h-[52px] items-center justify-between border-b border-slate-100 bg-white px-4 md:px-6 select-none shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg shrink-0 cursor-pointer"
          onClick={onToggleSidebar}
          aria-label="Abrir menu de navegação"
          title={sidebarOpen ? 'Recolher barra lateral' : 'Expandir barra lateral'}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-slate-500 font-medium"
        >
          <span>{breadcrumb.category}</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          {breadcrumb.section && (
            <>
              {breadcrumb.sectionHref ? (
                <Link
                  to={breadcrumb.sectionHref}
                  className="hover:text-slate-900 transition-colors"
                >
                  {breadcrumb.section}
                </Link>
              ) : (
                <span>{breadcrumb.section}</span>
              )}
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </>
          )}
          <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-md">
            {breadcrumb.current}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg shrink-0 cursor-pointer"
          onClick={() => window.location.reload()}
          aria-label="Atualizar dados"
          title="Atualizar dados"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
