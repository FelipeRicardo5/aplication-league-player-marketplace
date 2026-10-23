import { useNavigate } from 'react-router-dom';
import { EmptyState } from './empty-state';
import { Compass } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
      <EmptyState
        icon={<Compass className="h-6 w-6 text-slate-500" />}
        title="Página não encontrada (404)"
        description="A rota solicitada não existe ou foi movida."
        actionLabel="Ir para Jogadores"
        onAction={() => navigate('/players')}
      />
    </div>
  );
}
