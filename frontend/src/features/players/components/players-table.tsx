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
import { formatCurrency } from '@/lib/formatters';
import type { Player } from '../types';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

interface ClubSummary {
  id: number;
  name: string;
  acronym: string;
}

interface PlayersTableProps {
  players: Player[];
  onViewDetail: (player: Player) => void;
  onEdit: (player: Player) => void;
  onChangeCondition: (player: Player) => void;
  onBuy: (player: Player) => void;
  onDelete: (player: Player) => void;
}

export function PlayersTable({
  players,
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

  const getClubName = (clubId: number | null) => {
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

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Jogador</TableHead>
            <TableHead>Idade</TableHead>
            <TableHead>Condição</TableHead>
            <TableHead>Clube</TableHead>
            <TableHead>Overall</TableHead>
            <TableHead>Valor base</TableHead>
            <TableHead>Valor de mercado</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => {
            const club = getClubName(player.club_id);

            return (
              <TableRow key={player.id}>
                {/* Jogador + Posição */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground shrink-0 border border-border">
                      {player.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        <button
                          onClick={() => onViewDetail(player)}
                          className="hover:text-primary transition-colors hover:underline text-left"
                        >
                          {player.name}
                        </button>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                          {player.position}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">ID: #{player.id}</div>
                    </div>
                  </div>
                </TableCell>

                {/* Idade */}
                <TableCell className="text-sm">{player.age} anos</TableCell>

                {/* Condição */}
                <TableCell>{getConditionBadge(player.condition)}</TableCell>

                {/* Clube */}
                <TableCell>
                  {club ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-secondary text-[10px] font-bold">
                        {club.acronym}
                      </span>
                      {club.name}
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Livre
                    </Badge>
                  )}
                </TableCell>

                {/* Overall */}
                <TableCell>
                  <span className="inline-flex items-center justify-center rounded-md bg-primary/10 text-primary font-bold px-2 py-0.5 text-xs font-mono">
                    {player.overall}
                  </span>
                </TableCell>

                {/* Valor Base */}
                <TableCell className="text-xs text-muted-foreground">
                  {formatCurrency(player.base_value, true)}
                </TableCell>

                {/* Valor de Mercado */}
                <TableCell className="font-semibold text-sm text-foreground">
                  {formatCurrency(player.market_value, true)}
                </TableCell>

                {/* Ações */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Ações para ${player.name}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Opções do jogador</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onViewDetail(player)} className="gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(player)} className="gap-2">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                        Editar jogador
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onChangeCondition(player)} className="gap-2">
                        <HeartPulse className="h-4 w-4 text-muted-foreground" />
                        Alterar condição
                      </DropdownMenuItem>

                      {player.club_id === null && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onBuy(player)} className="gap-2">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                            <span className="text-primary font-medium">Comprar para clube</span>
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(player)}
                        disabled={player.club_id !== null}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir jogador
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
