import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Shield, ArrowUpDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/formatters';
import { ClubCreateDialog } from '../components/club-create-dialog';
import { useClubsQuery } from '../hooks/use-clubs';
import { CardSkeleton } from '@/components/feedback/loading-skeleton';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';

export function ClubsPage() {
  const [sort, setSort] = useState<string>('name');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: clubs, isLoading, isError, error, refetch } = useClubsQuery(sort);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Clubes da Liga</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o patrimônio, caixa disponível e valor de elenco das agremiações da liga.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Ordenação */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[180px] sm:w-[220px]" aria-label="Ordenar clubes">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome (A-Z)</SelectItem>
                <SelectItem value="net_worth_desc">Patrimônio (Maior primeiro)</SelectItem>
                <SelectItem value="net_worth_asc">Patrimônio (Menor primeiro)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
            <PlusCircle className="h-4 w-4" />
            Novo Clube
          </Button>
        </div>
      </div>

      {/* Content states */}
      {isLoading ? (
        <CardSkeleton count={6} />
      ) : isError ? (
        <ErrorState
          title="Erro ao carregar clubes"
          message={error?.message || 'Falha ao buscar a lista de clubes da liga.'}
          onRetry={refetch}
        />
      ) : !clubs || clubs.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-6 w-6 text-muted-foreground" />}
          title="Nenhum clube cadastrado"
          description="Ainda não existem agremiações cadastradas na liga. Crie o primeiro clube para iniciar."
          actionLabel="Cadastrar Primeiro Clube"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((club) => (
            <Link
              key={club.id}
              to={`/clubs/${club.id}`}
              className="group block transition-all focus:outline-none"
            >
              <Card className="h-full border-border transition-all hover:border-primary/40 hover:shadow-md p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                        {club.acronym}
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                          {club.name}
                        </h3>
                        <span className="text-xs text-muted-foreground font-mono">
                          ID: #{club.id}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/60 my-2 text-center">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                        Caixa
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {formatCurrency(club.cash, true)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                        Elenco
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {formatCurrency(club.squad_value, true)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                        Patrimônio
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {formatCurrency(club.net_worth, true)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                  <span>Ver detalhes, elenco e tática</span>
                  <span className="text-primary font-medium">Acessar &rarr;</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <ClubCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
