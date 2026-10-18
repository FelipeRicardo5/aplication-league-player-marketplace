import { PanelLeft, ChevronRight, RotateCw } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  const location = useLocation();

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.startsWith('/players')) {
      return { category: 'Mercado', current: 'Jogadores' };
    }
    if (path.startsWith('/clubs')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 1) {
        return { category: 'Mercado', current: 'Detalhes do Clube' };
      }
      return { category: 'Mercado', current: 'Clubes' };
    }
    if (path.startsWith('/matches')) {
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
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">{breadcrumb.current}</span>
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

