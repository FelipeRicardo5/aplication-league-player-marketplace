import { Link } from 'react-router-dom';
import { EmptyState } from './empty-state';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <EmptyState
        title="Página não encontrada (404)"
        description="A rota solicitada não existe ou foi movida."
      />
      <Button asChild variant="default" className="mt-4">
        <Link to="/players">Ir para Jogadores</Link>
      </Button>
    </div>
  );
}
