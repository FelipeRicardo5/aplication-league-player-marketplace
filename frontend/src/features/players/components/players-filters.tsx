import { useState, useEffect } from 'react';
import { Search, ListFilter, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Condition, Position, QueryPlayersParams } from '../types';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ClubOption {
  id: number;
  name: string;
  acronym: string;
}

interface PlayersFiltersProps {
  filters: QueryPlayersParams;
  onFilterChange: (filters: Partial<QueryPlayersParams>) => void;
  onReset: () => void;
}

export function PlayersFilters({ filters, onFilterChange, onReset }: PlayersFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Debounce da busca textual
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== (filters.search || '')) {
        onFilterChange({ search: searchTerm.trim() ? searchTerm.trim() : undefined, page: 1 });
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, filters.search, onFilterChange]);

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiGet<ClubOption[]>('clubs'),
    staleTime: 1000 * 60,
  });

  const handleOnlyFreeToggle = (checked: boolean) => {
    if (checked) {
      // Regra de interface do enunciado: não permitir combinar 'só livres' com clube
      onFilterChange({ free: true, club_id: undefined, page: 1 });
    } else {
      onFilterChange({ free: undefined, page: 1 });
    }
  };

  const handleClubChange = (val: string) => {
    if (val === 'ALL') {
      onFilterChange({ club_id: undefined, page: 1 });
    } else {
      // Se selecionar um clube, garante que 'só livres' esteja desmarcado
      onFilterChange({ club_id: Number(val), free: undefined, page: 1 });
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome (mín. 2 letras)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            aria-label="Buscar jogador por nome"
          />
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select
            value={filters.sort || 'name'}
            onValueChange={(val) => onFilterChange({ sort: val, page: 1 })}
          >
            <SelectTrigger className="w-[200px]" aria-label="Ordenar por">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
              <SelectItem value="value_desc">Maior valor de mercado</SelectItem>
              <SelectItem value="value_asc">Menor valor de mercado</SelectItem>
              <SelectItem value="age_desc">Maior idade</SelectItem>
              <SelectItem value="age_asc">Menor idade</SelectItem>
              <SelectItem value="position">Posição (GOL a ATA)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
        {/* Posição */}
        <div className="w-[130px]">
          <Select
            value={filters.position || 'ALL'}
            onValueChange={(val) =>
              onFilterChange({ position: val === 'ALL' ? undefined : (val as Position), page: 1 })
            }
          >
            <SelectTrigger aria-label="Filtrar por posição">
              <SelectValue placeholder="Posição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas posições</SelectItem>
              <SelectItem value="GOL">Goleiro (GOL)</SelectItem>
              <SelectItem value="ZAG">Zagueiro (ZAG)</SelectItem>
              <SelectItem value="LAT">Lateral (LAT)</SelectItem>
              <SelectItem value="MEI">Meio-campo (MEI)</SelectItem>
              <SelectItem value="ATA">Atacante (ATA)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Condição */}
        <div className="w-[160px]">
          <Select
            value={filters.condition || 'ALL'}
            onValueChange={(val) =>
              onFilterChange({
                condition: val === 'ALL' ? undefined : (val as Condition),
                page: 1,
              })
            }
          >
            <SelectTrigger aria-label="Filtrar por condição física">
              <SelectValue placeholder="Condição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas condições</SelectItem>
              <SelectItem value="APTO">Apto</SelectItem>
              <SelectItem value="MAL_CONDICIONADO">Mal condicionado</SelectItem>
              <SelectItem value="DOENTE">Doente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clube */}
        <div className="w-[180px]">
          <Select
            value={filters.club_id ? String(filters.club_id) : 'ALL'}
            onValueChange={handleClubChange}
            disabled={filters.free === true}
          >
            <SelectTrigger
              aria-label="Filtrar por clube"
              className={filters.free === true ? 'opacity-50 cursor-not-allowed' : ''}
            >
              <SelectValue placeholder="Clube" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os clubes</SelectItem>
              {clubs?.map((club) => (
                <SelectItem key={club.id} value={String(club.id)}>
                  {club.name} ({club.acronym})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Switch Só Livres */}
        <div className="flex items-center gap-2 pl-2">
          <Switch
            id="only-free"
            checked={Boolean(filters.free)}
            onCheckedChange={handleOnlyFreeToggle}
            disabled={Boolean(filters.club_id)}
          />
          <Label
            htmlFor="only-free"
            className={cn(
              'cursor-pointer text-xs font-medium',
              filters.club_id && 'opacity-50 cursor-not-allowed',
            )}
          >
            Só livres
          </Label>
        </div>

        {/* Reset */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchTerm('');
            onReset();
          }}
          className="ml-auto text-xs text-muted-foreground gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}
