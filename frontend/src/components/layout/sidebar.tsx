import { NavLink } from 'react-router-dom';
import { Users, Trophy, Swords, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

interface ClubSummary {
  id: number;
  name: string;
  acronym: string;
}

interface SidebarProps {
  onItemClick?: () => void;
  className?: string;
}

export function Sidebar({ onItemClick, className }: SidebarProps) {
  // Busca a lista de clubes para os atalhos laterais do menu (conforme visto no Figma)
  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiGet<ClubSummary[]>('clubs'),
    staleTime: 1000 * 60,
  });

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-primary/10 text-primary font-semibold'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
    );

  return (
    <aside
      className={cn(
        'flex flex-col h-full w-64 border-r border-border bg-card p-4 select-none',
        className,
      )}
    >
      {/* Brand Header */}
      <NavLink
        to="/"
        onClick={onItemClick}
        className="flex items-center gap-3 px-2 py-3 border-b border-border mb-4 hover:opacity-85 transition-opacity cursor-pointer"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-xs">
          P
        </div>
        <div>
          <h1 className="font-semibold text-base leading-tight tracking-tight text-foreground">
            Passe
          </h1>
          <p className="text-xs text-muted-foreground">Liga de Futebol</p>
        </div>
      </NavLink>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {/* Mercado Group */}
        <div>
          <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Mercado
          </h2>
          <nav className="space-y-1">
            <NavLink to="/players" onClick={onItemClick} className={navLinkClass}>
              <Users className="h-4 w-4" />
              <span>Jogadores</span>
            </NavLink>
          </nav>
        </div>

        {/* Liga Group */}
        <div>
          <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Liga
          </h2>
          <nav className="space-y-1">
            <NavLink to="/matches" onClick={onItemClick} className={navLinkClass}>
              <Swords className="h-4 w-4" />
              <span>Partidas</span>
            </NavLink>
            <NavLink to="/standings" onClick={onItemClick} className={navLinkClass}>
              <Trophy className="h-4 w-4" />
              <span>Classificação</span>
            </NavLink>
          </nav>
        </div>

        {/* Clubes Group */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Clubes
            </h2>
            <NavLink
              to="/clubs"
              onClick={onItemClick}
              className="text-xs text-primary hover:underline font-medium"
            >
              Ver todos
            </NavLink>
          </div>
          <nav className="space-y-1">
            <NavLink to="/clubs" end onClick={onItemClick} className={navLinkClass}>
              <Shield className="h-4 w-4" />
              <span>Todos os Clubes</span>
            </NavLink>

            {/* Atalhos para os clubes retornados pela API */}
            {clubs?.slice(0, 6).map((club) => (
              <NavLink
                key={club.id}
                to={`/clubs/${club.id}`}
                onClick={onItemClick}
                className={navLinkClass}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold bg-secondary text-foreground">
                  {club.acronym}
                </span>
                <span className="truncate">{club.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-border pt-4 mt-auto space-y-2 text-xs text-muted-foreground px-2">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Fuso: Brasília (UTC-3)</span>
        </div>
        <div className="flex justify-between items-center text-[11px] pt-1 border-t border-border/50">
          <span>SENAI/PE CÓD. 237</span>
          <span className="text-primary font-medium">v1.0</span>
        </div>
      </div>
    </aside>
  );
}
