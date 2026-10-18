import { MoreHorizontal, Eye, Edit, HeartPulse, ShoppingCart, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/formatters';
import type { Player, Position } from '../types';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ClubSummary {
  id: number;
  name: string;
  acronym: string;
}

export interface PlayersTableProps {
  players: Player[];
  activeTab?: 'all' | 'free' | 'club';
  onTabChange?: (tab: 'all' | 'free' | 'club') => void;
  counts?: { all: number; free: number; club: number };
  sort?: string;
  onSortChange?: (sort: string) => void;
  onViewDetail: (player: Player) => void;
  onEdit: (player: Player) => void;
  onChangeCondition: (player: Player) => void;
  onBuy: (player: Player) => void;
  onDelete: (player: Player) => void;
}

export function PlayersTable({
  players,
  activeTab = 'all',
  onTabChange,
  counts = { all: players.length, free: 0, club: 0 },
  sort = 'name',
  onSortChange,
  onViewDetail,
  onEdit,
  onChangeCondition,
  onBuy,
  onDelete,
}: PlayersTableProps) {
  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: () => apiGet<ClubSummary[]>('clubs'),
    staleTime: 1000 * 60,
  });

  const getClub = (clubId: number | null) => {
    if (!clubId) return null;
    return clubs?.find((c) => c.id === clubId);
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'APTO':
        return (
          <Badge variant="success" dot>
            Apto
          </Badge>
        );
      case 'MAL_CONDICIONADO':
        return (
          <Badge variant="warning" dot>
            Mal condicionado
          </Badge>
        );
      case 'LESIONADO':
        return (
          <Badge variant="destructive" dot>
            Lesionado
          </Badge>
        );
      case 'DOENTE':
        return (
          <Badge variant="destructive" dot>
            Doente
          </Badge>
        );
      default:
        return <Badge variant="outline">{condition}</Badge>;
    }
  };

  const getPositionBadge = (pos: Position) => {
    return (
      <span className="inline-flex items-center justify-center font-sans text-xs font-medium text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 bg-white shadow-2xs">
        {pos}
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      {/* Card Header: Abas de situação e Seletor de ordenação conforme Figma J01 / J04 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-white">
        {/* Abas: Todos, Livres, Em clubes */}
        <div
          role="tablist"
          aria-label="Situação dos jogadores"
          className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl w-fit"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => onTabChange?.('all')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none',
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium',
            )}
          >
            <span>Todos</span>
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-tight',
                activeTab === 'all'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'bg-slate-200/70 text-slate-600',
              )}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'free'}
            onClick={() => onTabChange?.('free')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none',
              activeTab === 'free'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium',
            )}
          >
            <span>Livres</span>
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-tight',
                activeTab === 'free'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'bg-slate-200/70 text-slate-600',
              )}
            >
              {counts.free}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'club'}
            onClick={() => onTabChange?.('club')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none',
              activeTab === 'club'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium',
            )}
          >
            <span>Em clubes</span>
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-tight',
                activeTab === 'club'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'bg-slate-200/70 text-slate-600',
              )}
            >
              {counts.club}
            </span>
          </button>
        </div>

        {/* Dropdown de Ordenação */}
        {onSortChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Ordenar:</span>
            <Select value={sort} onValueChange={onSortChange}>
              <SelectTrigger
                aria-label="Ordenar jogadores por"
                className="w-[190px] h-8 text-xs bg-slate-50 border-slate-200 rounded-lg cursor-pointer"
              >
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="name" className="text-xs">
                  Nome (A-Z)
                </SelectItem>
                <SelectItem value="value_desc" className="text-xs">
                  Maior valor de mercado
                </SelectItem>
                <SelectItem value="value_asc" className="text-xs">
                  Menor valor de mercado
                </SelectItem>
                <SelectItem value="age_desc" className="text-xs">
                  Maior idade
                </SelectItem>
                <SelectItem value="age_asc" className="text-xs">
                  Menor idade
                </SelectItem>
                <SelectItem value="position" className="text-xs">
                  Posição (GOL a ATA)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Tabela de 10 Colunas Fiel ao Figma */}
      <Table>
        <TableHeader className="bg-slate-50/80">
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[210px] text-xs font-semibold text-slate-600">
              Jogador
            </TableHead>
            <TableHead className="w-[90px] text-xs font-semibold text-slate-600">Posição</TableHead>
            <TableHead className="w-[80px] text-xs font-semibold text-slate-600">Overall</TableHead>
            <TableHead className="min-w-[130px] text-xs font-semibold text-slate-600">
              Agilidade
            </TableHead>
            <TableHead className="w-[85px] text-xs font-semibold text-slate-600">Idade</TableHead>
            <TableHead className="min-w-[145px] text-xs font-semibold text-slate-600">
              Condição
            </TableHead>
            <TableHead className="min-w-[115px] text-xs font-semibold text-slate-600">
              Valor base
            </TableHead>
            <TableHead className="min-w-[135px] text-xs font-semibold text-slate-600">
              Valor de mercado
            </TableHead>
            <TableHead className="min-w-[150px] text-xs font-semibold text-slate-600">Clube</TableHead>
            <TableHead className="w-[130px] text-right text-xs font-semibold text-slate-600">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-44 text-center py-8">
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <p className="text-sm font-semibold text-slate-800">Nenhum jogador encontrado</p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Nenhum atleta corresponde aos filtros ou à situação selecionada nesta visualização.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            players.map((player) => {
              const club = getClub(player.club_id);
              const isFree = player.club_id === null;

              return (
                <TableRow key={player.id} className="hover:bg-slate-50/60 transition-colors">
                {/* 1. Jogador */}
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 shrink-0 border border-slate-200">
                      {player.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <button
                        onClick={() => onViewDetail(player)}
                        className="font-semibold text-sm text-foreground hover:text-primary transition-colors hover:underline text-left truncate block max-w-[180px] cursor-pointer"
                        title={player.name}
                      >
                        {player.name}
                      </button>
                      <div className="text-xs text-muted-foreground font-mono">#{player.id}</div>
                    </div>
                  </div>
                </TableCell>

                {/* 2. Posição */}
                <TableCell>{getPositionBadge(player.position)}</TableCell>

                {/* 3. Overall */}
                <TableCell>
                  <span className="font-sans font-bold text-sm text-slate-900 tabular-nums">
                    {player.overall}
                  </span>
                </TableCell>

                {/* 4. Agilidade (Número + Mini Barra Gráfica) */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs font-semibold text-slate-800 w-6 tabular-nums">
                      {player.agility}
                    </span>
                    <div className="h-1.5 w-14 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200/50">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, player.agility))}%` }}
                      />
                    </div>
                  </div>
                </TableCell>

                {/* 5. Idade */}
                <TableCell className="text-xs font-sans text-slate-700 tabular-nums">
                  {player.age}
                </TableCell>

                {/* 6. Condição */}
                <TableCell>{getConditionBadge(player.condition)}</TableCell>

                {/* 7. Valor Base */}
                <TableCell className="text-xs font-sans tabular-nums text-slate-600">
                  {formatCurrency(player.base_value, false)}
                </TableCell>

                {/* 8. Valor de Mercado */}
                <TableCell className="font-bold text-sm font-sans tabular-nums text-slate-900">
                  {formatCurrency(player.market_value, false)}
                </TableCell>

                {/* 9. Clube */}
                <TableCell>
                  {club ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-900">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-slate-700 border border-slate-200">
                        {club.acronym}
                      </span>
                      <span className="truncate max-w-[120px]" title={club.name}>
                        {club.name}
                      </span>
                    </span>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[11px] font-medium text-slate-500 bg-slate-50 border-slate-200/90 rounded-md"
                    >
                      Livre
                    </Badge>
                  )}
                </TableCell>

                {/* 10. Ações: Botão Rápido Inline '+ Comprar' + Menu Contextual */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {isFree && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onBuy(player)}
                        className="h-7 px-2 text-xs font-medium text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:text-blue-700 gap-1 rounded-md cursor-pointer transition-colors"
                        title="Comprar jogador para um clube"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>Comprar</span>
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Ações para ${player.name}`}
                          className="h-7 w-7 text-slate-500 hover:text-slate-900 rounded-md cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Opções do jogador</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => onViewDetail(player)}
                          className="gap-2 cursor-pointer"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEdit(player)}
                          className="gap-2 cursor-pointer"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                          Editar jogador
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onChangeCondition(player)}
                          className="gap-2 cursor-pointer"
                        >
                          <HeartPulse className="h-4 w-4 text-muted-foreground" />
                          Alterar condição
                        </DropdownMenuItem>

                        {isFree && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onBuy(player)}
                              className="gap-2 cursor-pointer text-blue-600 font-medium focus:text-blue-600"
                            >
                              <ShoppingCart className="h-4 w-4 text-blue-600" />
                              Comprar para clube
                            </DropdownMenuItem>
                          </>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(player)}
                          disabled={!isFree}
                          className="gap-2 text-destructive focus:text-destructive cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir jogador
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          }))}
        </TableBody>
      </Table>
    </div>
  );
}
