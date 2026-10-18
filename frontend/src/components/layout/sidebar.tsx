import { NavLink } from 'react-router-dom';
import { Users, Shield, Swords, List, Plus, Trophy, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { BrandLogo } from './brand-logo';
import type { Match } from '@/features/league/types';

interface ClubSummary {
  id: number;
  name: string;
  acronym: string;
}

interface SidebarProps {
  onItemClick?: () => void;
  className?: string;
  isCollapsed?: boolean;
}

export function Sidebar({ onItemClick, className, isCollapsed = false }: SidebarProps) {
  // Busca lista de clubes
  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiGet<ClubSummary[]>('clubs'),
    staleTime: 1000 * 60,
  });

  // Busca contagem total de jogadores
  const { data: playersData } = useQuery({
    queryKey: ['players-count'],
    queryFn: () => apiGet<{ meta: { total: number } }>('players?limit=1'),
    staleTime: 1000 * 60,
  });

  // Busca partidas para contagem e resumo da última partida
  const { data: matches } = useQuery({
    queryKey: ['matches'],
    queryFn: () => apiGet<Match[]>('matches'),
    staleTime: 1000 * 60,
  });

  const clubsCount = clubs?.length ?? 0;
  const playersCount = playersData?.meta?.total ?? 0;
  const matchesCount = matches?.length ?? 0;

  const lastMatch =
    matches && matches.length > 0 ? [...matches].sort((a, b) => b.id - a.id)[0] : null;

  const lastMatchText = lastMatch
    ? `${lastMatch.home.club_name} ${lastMatch.home.goals} × ${lastMatch.away.goals} ${lastMatch.away.club_name}`
    : 'Sem partidas registradas';

  const getClubInitial = (name: string) => {
    return name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase();
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center rounded-xl text-xs font-medium transition-all select-none group',
      isCollapsed
        ? 'justify-center p-2 w-10 h-10 mx-auto'
        : 'gap-2.5 px-3 py-2 w-full',
      isActive
        ? 'bg-white text-slate-900 font-medium border border-slate-200/90 shadow-xs'
        : 'text-slate-800 hover:bg-white/60 hover:text-slate-900 border border-transparent',
    );

  return (
    <aside
      className={cn(
        'flex flex-col h-full w-full select-none justify-between transition-all duration-300',
        isCollapsed ? 'items-center px-1' : '',
        className,
      )}
    >
      {/* Brand Header */}
      <NavLink
        to="/"
        onClick={onItemClick}
        className={cn(
          'flex items-center mb-4 hover:opacity-85 transition-opacity cursor-pointer shrink-0',
          isCollapsed ? 'justify-center p-1' : 'gap-2.5 px-2 py-1',
        )}
        title="Passe - Gestão da liga"
      >
        <BrandLogo className="h-8 w-8" />
        {!isCollapsed && (
          <div className="min-w-0">
            <h1 className="font-semibold text-sm leading-tight tracking-tight text-slate-900 truncate">
              Passe
            </h1>
            <p className="text-[11px] text-slate-500 font-normal truncate">Gestão da liga</p>
          </div>
        )}
      </NavLink>

      {/* Nav items */}
      <div className={cn('flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 w-full', isCollapsed ? 'pr-0' : '')}>
        {/* Mercado Group */}
        <div>
          {!isCollapsed ? (
            <h2 className="px-2.5 text-xs font-medium text-slate-500 mb-1.5">
              Mercado
            </h2>
          ) : null}
          <nav className="space-y-1">
            <NavLink
              to="/players"
              onClick={onItemClick}
              className={navLinkClass}
              title={isCollapsed ? `Jogadores (${playersCount})` : undefined}
            >
              {({ isActive }) => (
                <>
                  <Users
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-[#155DFC]' : 'text-slate-700 group-hover:text-slate-900',
                    )}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="text-slate-900 font-medium">Jogadores</span>
                      <span
                        className={cn(
                          'ml-auto text-xs font-normal',
                          isActive ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-800',
                        )}
                      >
                        {playersCount}
                      </span>
                    </>
                  )}
                </>
              )}
            </NavLink>
            <NavLink
              to="/clubs"
              end
              onClick={onItemClick}
              className={navLinkClass}
              title={isCollapsed ? `Clubes (${clubsCount})` : undefined}
            >
              {({ isActive }) => (
                <>
                  <Shield
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-[#155DFC]' : 'text-slate-700 group-hover:text-slate-900',
                    )}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="text-slate-900 font-medium">Clubes</span>
                      <span
                        className={cn(
                          'ml-auto text-xs font-normal',
                          isActive ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-800',
                        )}
                      >
                        {clubsCount}
                      </span>
                    </>
                  )}
                </>
              )}
            </NavLink>
          </nav>
        </div>

        {/* Liga Group */}
        <div>
          {!isCollapsed ? (
            <h2 className="px-2.5 text-xs font-medium text-slate-500 mb-1.5">
              Liga
            </h2>
          ) : (
            <div className="w-6 h-px bg-slate-200/60 mx-auto my-2" />
          )}
          <nav className="space-y-1">
            <NavLink
              to="/matches"
              onClick={onItemClick}
              className={navLinkClass}
              title={isCollapsed ? `Partidas (${matchesCount})` : undefined}
            >
              {({ isActive }) => (
                <>
                  <Swords
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-[#155DFC]' : 'text-slate-700 group-hover:text-slate-900',
                    )}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="text-slate-900 font-medium">Partidas</span>
                      <span
                        className={cn(
                          'ml-auto text-xs font-normal',
                          isActive ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-800',
                        )}
                      >
                        {matchesCount}
                      </span>
                    </>
                  )}
                </>
              )}
            </NavLink>
            <NavLink
              to="/standings"
              onClick={onItemClick}
              className={navLinkClass}
              title={isCollapsed ? 'Classificação' : undefined}
            >
              {({ isActive }) => (
                <>
                  <List
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-[#155DFC]' : 'text-slate-700 group-hover:text-slate-900',
                    )}
                  />
                  {!isCollapsed && <span className="text-slate-900 font-medium">Classificação</span>}
                </>
              )}
            </NavLink>
          </nav>
        </div>

        {/* Clubes Group */}
        <div>
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-2.5 mb-1.5">
              <h2 className="text-xs font-medium text-slate-500">
                Clubes
              </h2>
              <NavLink
                to="/clubs"
                onClick={onItemClick}
                className="text-slate-400 hover:text-slate-800 transition-colors p-0.5 rounded cursor-pointer"
                title="Gerenciar clubes"
              >
                <Plus className="h-3.5 w-3.5" />
              </NavLink>
            </div>
          ) : (
            <div className="w-6 h-px bg-slate-200/60 mx-auto my-2" />
          )}
          <nav className="space-y-1">
            {clubs?.map((club) => (
              <NavLink
                key={club.id}
                to={`/clubs/${club.id}`}
                onClick={onItemClick}
                className={navLinkClass}
                title={isCollapsed ? club.name : undefined}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded text-[11px] font-semibold shrink-0 transition-colors',
                        isActive
                          ? 'bg-blue-50 text-[#155DFC] border border-blue-200/60'
                          : 'bg-slate-200/70 text-slate-700',
                      )}
                    >
                      {getClubInitial(club.name)}
                    </span>
                    {!isCollapsed && (
                      <span className="truncate text-slate-900 font-medium">{club.name}</span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>


      {/* Footer Summary Card - Completamente ocultado/removido quando comprimido */}
      {!isCollapsed && (
        <div className="mt-auto pt-3 shrink-0">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs space-y-2.5">
            {/* Bloco Liga */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0">
                <Trophy className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-slate-900 leading-tight truncate">
                  Liga Fictícia 2026
                </h4>
                <p className="text-[11px] text-slate-500 leading-tight truncate mt-0.5">
                  {clubsCount} clubes · {playersCount} jogadores
                </p>
              </div>
            </div>

            {/* Bloco Última Partida */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0">
                <Swords className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-slate-900 leading-tight truncate">
                  Última partida
                </h4>
                <p className="text-[11px] text-slate-500 leading-tight truncate mt-0.5">
                  {lastMatchText}
                </p>
              </div>
            </div>

            {/* Fuso Horário */}
            <div className="border-t border-slate-100 pt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <Clock className="h-3 w-3 text-slate-400 shrink-0" />
              <span>Horário de Brasília (UTC-3)</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}


