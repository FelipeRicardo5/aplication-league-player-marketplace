import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-card/95 px-4 md:px-8 backdrop-blur-xs select-none">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMobileMenu}
        aria-label="Abrir menu de navegação"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Brand in mobile */}
      <Link
        to="/"
        className="flex items-center gap-2 md:hidden hover:opacity-85 transition-opacity"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
          P
        </div>
        <span className="font-semibold text-sm text-foreground">Passe</span>
      </Link>

      <div className="flex-1" />

      {/* Right status */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDF4] px-2.5 py-0.5 text-xs font-medium text-[#016630] border border-[#B9F8CF]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#016630]" />
          Liga Ativa
        </span>
      </div>
    </header>
  );
}
