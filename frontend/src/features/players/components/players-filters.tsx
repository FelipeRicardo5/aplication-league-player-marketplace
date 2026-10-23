import { useState, useEffect } from 'react';
import { Search, RotateCcw, Shirt, HeartPulse, Shield, User, Tag } from 'lucide-react';
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

  // Debounce da busca textual (400ms) conforme Figma J03
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
      // Regra de interface: não combinar 'só livres' com clube
      onFilterChange({ free: true, club_id: undefined, page: 1 });
    } else {
      onFilterChange({ free: undefined, page: 1 });
    }
  };

  const handleClubChange = (val: string) => {
    if (val === 'ALL') {
      onFilterChange({ club_id: undefined, page: 1 });
    } else {
      onFilterChange({ club_id: Number(val), free: undefined, page: 1 });
    }
  };

  const getAgeRangeValue = () => {
    if (filters.min_age === 16 && filters.max_age === 21) return '16-21';
    if (filters.min_age === 22 && filters.max_age === 28) return '22-28';
    if (filters.min_age === 29 && filters.max_age === 34) return '29-34';
    if (filters.min_age === 35 && filters.max_age === 45) return '35-45';
    return 'ALL';
  };

  const handleAgeRangeChange = (val: string) => {
    switch (val) {
      case '16-21':
        onFilterChange({ min_age: 16, max_age: 21, page: 1 });
        break;
      case '22-28':
        onFilterChange({ min_age: 22, max_age: 28, page: 1 });
        break;
      case '29-34':
        onFilterChange({ min_age: 29, max_age: 34, page: 1 });
        break;
      case '35-45':
        onFilterChange({ min_age: 35, max_age: 45, page: 1 });
        break;
      default:
        onFilterChange({ min_age: undefined, max_age: undefined, page: 1 });
        break;
    }
  };

  const getValueRangeValue = () => {
    if (filters.min_value === 0 && filters.max_value === 20) return '0-20';
    if (filters.min_value === 20 && filters.max_value === 50) return '20-50';
    if (filters.min_value === 50 && filters.max_value === 100) return '50-100';
    if (filters.min_value === 100 && filters.max_value === 550) return '100-550';
    return 'ALL';
  };

  const handleValueRangeChange = (val: string) => {
    switch (val) {
      case '0-20':
        onFilterChange({ min_value: 0, max_value: 20, page: 1 });
        break;
      case '20-50':
        onFilterChange({ min_value: 20, max_value: 50, page: 1 });
        break;
      case '50-100':
        onFilterChange({ min_value: 50, max_value: 100, page: 1 });
        break;
      case '100-550':
        onFilterChange({ min_value: 100, max_value: 550, page: 1 });
        break;
      default:
        onFilterChange({ min_value: undefined, max_value: undefined, page: 1 });
        break;
    }
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    filters.position ||
    filters.condition ||
    filters.club_id ||
    filters.free ||
    filters.min_age ||
    filters.min_value,
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Campo de Busca textual com ícone */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8.5 text-xs bg-slate-50/70 border-slate-200 rounded-lg placeholder:text-slate-400"
            aria-label="Buscar jogador por nome"
          />
        </div>

        {/* Dropdown: Posição */}
        <div className="w-[130px]">
          <Select
            value={filters.position || 'ALL'}
            onValueChange={(val) =>
              onFilterChange({ position: val === 'ALL' ? undefined : (val as Position), page: 1 })
            }
          >
            <SelectTrigger
              aria-label="Filtrar por posição"
              className="h-8.5 text-xs bg-slate-50/70 border-slate-200 rounded-lg cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Shirt className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <SelectValue placeholder="Posição" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                Todas posições
              </SelectItem>
              <SelectItem value="GOL" className="text-xs">
                Goleiro (GOL)
              </SelectItem>
              <SelectItem value="ZAG" className="text-xs">
                Zagueiro (ZAG)
              </SelectItem>
              <SelectItem value="LAT" className="text-xs">
                Lateral (LAT)
              </SelectItem>
              <SelectItem value="MEI" className="text-xs">
                Meio-campo (MEI)
              </SelectItem>
              <SelectItem value="ATA" className="text-xs">
                Atacante (ATA)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dropdown: Condição */}
        <div className="w-[150px]">
          <Select
            value={filters.condition || 'ALL'}
            onValueChange={(val) =>
              onFilterChange({
                condition: val === 'ALL' ? undefined : (val as Condition),
                page: 1,
              })
            }
          >
            <SelectTrigger
              aria-label="Filtrar por condição física"
              className="h-8.5 text-xs bg-slate-50/70 border-slate-200 rounded-lg cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <HeartPulse className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <SelectValue placeholder="Condição" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                Todas condições
              </SelectItem>
              <SelectItem value="APTO" className="text-xs">
                Apto
              </SelectItem>
              <SelectItem value="MAL_CONDICIONADO" className="text-xs">
                Mal condicionado
              </SelectItem>
              <SelectItem value="DOENTE" className="text-xs">
                Doente
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dropdown: Clube */}
        <div className="w-[160px]">
          <Select
            value={filters.club_id ? String(filters.club_id) : 'ALL'}
            onValueChange={handleClubChange}
            disabled={filters.free === true}
          >
            <SelectTrigger
              aria-label="Filtrar por clube"
              className={cn(
                'h-8.5 text-xs bg-slate-50/70 border-slate-200 rounded-lg cursor-pointer',
                filters.free === true && 'opacity-50 cursor-not-allowed',
              )}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Shield className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <SelectValue placeholder="Clube" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                Todos os clubes
              </SelectItem>
              {clubs?.map((club) => (
                <SelectItem key={club.id} value={String(club.id)} className="text-xs">
                  {club.name} ({club.acronym})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dropdown: Faixa de Idade */}
        <div className="w-[145px]">
          <Select value={getAgeRangeValue()} onValueChange={handleAgeRangeChange}>
            <SelectTrigger
              aria-label="Filtrar por faixa de idade"
              className="h-8.5 text-xs bg-slate-50/70 border-slate-200 rounded-lg cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <SelectValue placeholder="Idade" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                Todas idades
              </SelectItem>
              <SelectItem value="16-21" className="text-xs">
                Jovens (16 a 21)
              </SelectItem>
              <SelectItem value="22-28" className="text-xs">
                Auge (22 a 28)
              </SelectItem>
              <SelectItem value="29-34" className="text-xs">
                Experientes (29 a 34)
              </SelectItem>
              <SelectItem value="35-45" className="text-xs">
                Veteranos (≥ 35)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dropdown: Faixa de Valor de Mercado */}
        <div className="w-[170px]">
          <Select value={getValueRangeValue()} onValueChange={handleValueRangeChange}>
            <SelectTrigger
              aria-label="Filtrar por valor de mercado"
              className="h-8.5 text-xs bg-slate-50/70 border-slate-200 rounded-lg cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Tag className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <SelectValue placeholder="Valor de mercado" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                Todos valores
              </SelectItem>
              <SelectItem value="0-20" className="text-xs">
                Até R$ 20,00
              </SelectItem>
              <SelectItem value="20-50" className="text-xs">
                R$ 20,00 a R$ 50,00
              </SelectItem>
              <SelectItem value="50-100" className="text-xs">
                R$ 50,00 a R$ 100,00
              </SelectItem>
              <SelectItem value="100-550" className="text-xs">
                Acima de R$ 100,00
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Switch Só Livres */}
        <div className="flex items-center gap-2 px-1">
          <Switch
            id="only-free"
            checked={Boolean(filters.free)}
            onCheckedChange={handleOnlyFreeToggle}
            disabled={Boolean(filters.club_id)}
          />
          <Label
            htmlFor="only-free"
            className={cn(
              'cursor-pointer text-xs font-medium text-slate-700 select-none',
              filters.club_id && 'opacity-50 cursor-not-allowed',
            )}
          >
            Só livres
          </Label>
        </div>

        {/* Botão Limpar Filtros */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchTerm('');
            onReset();
          }}
          className={cn(
            'h-8 px-2.5 text-xs gap-1.5 rounded-lg cursor-pointer ml-auto transition-colors',
            hasActiveFilters
              ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-medium'
              : 'text-slate-400 hover:text-slate-600',
          )}
          aria-label="Limpar filtros"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}
