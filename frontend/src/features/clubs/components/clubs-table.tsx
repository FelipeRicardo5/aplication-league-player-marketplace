import { Link } from 'react-router-dom';
import { ArrowUpDown, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { formatCurrency } from '@/lib/formatters';
import type { ClubSummary } from '../types';

export interface ClubsTableProps {
  clubs: ClubSummary[];
  sort?: string;
  onSortChange?: (sort: string) => void;
}

const getSortLabel = (sortValue: string) => {
  switch (sortValue) {
    case 'net_worth_desc':
      return 'Ordenar: patrimônio (maior para o menor)';
    case 'net_worth_asc':
      return 'Ordenar: patrimônio (menor para o maior)';
    case 'name':
    default:
      return 'Ordenar: nome';
  }
};

export function ClubsTable({ clubs, sort = 'net_worth_desc', onSortChange }: ClubsTableProps) {
  return (
    <div className="space-y-3">
      {/* Container principal com bordas arredondadas e sombra sutil conforme Figma 9-35767 */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Barra superior de contagem e ordenação */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">
              {clubs.length} {clubs.length === 1 ? 'clube' : 'clubes'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
              {clubs.length} de 20
            </span>
          </div>

          {/* Dropdown de Ordenação */}
          {onSortChange && (
            <Select value={sort} onValueChange={onSortChange}>
              <SelectTrigger
                aria-label="Ordenar clubes"
                className="w-auto h-9 text-xs font-medium border-slate-200 bg-white rounded-lg px-3 py-1.5 gap-2 cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>{getSortLabel(sort)}</span>
                </div>
              </SelectTrigger>
              <SelectContent align="end" className="w-[260px]">
                <div className="px-2 py-1.5 text-[11px] font-medium text-slate-400">
                  Ordenar por
                </div>
                <SelectItem value="name" className="text-xs cursor-pointer">
                  Nome
                </SelectItem>
                <SelectItem value="net_worth_desc" className="text-xs cursor-pointer">
                  Patrimônio (maior para o menor)
                </SelectItem>
                <SelectItem value="net_worth_asc" className="text-xs cursor-pointer">
                  Patrimônio (menor para o maior)
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Tabela de Clubes Fiel ao Figma (6 colunas) */}
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[200px] text-xs font-semibold text-slate-600">
                Clube
              </TableHead>
              <TableHead className="w-[100px] text-xs font-semibold text-slate-600">
                Sigla
              </TableHead>
              <TableHead className="w-[120px] text-right text-xs font-semibold text-slate-600">
                Caixa
              </TableHead>
              <TableHead className="w-[140px] text-right text-xs font-semibold text-slate-600">
                Valor do elenco
              </TableHead>
              <TableHead className="w-[140px] text-right text-xs font-semibold text-slate-600">
                Patrimônio
              </TableHead>
              <TableHead className="w-[110px] text-right text-xs font-semibold text-slate-600">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clubs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-44 text-center py-8">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-800">Nenhum clube encontrado</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Ainda não existem agremiações cadastradas na liga. Crie o primeiro clube para
                      iniciar.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              clubs.map((club) => (
                <TableRow key={club.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* 1. Clube (Monograma + Nome) */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shrink-0">
                        {club.acronym}
                      </div>
                      <Link
                        to={`/clubs/${club.id}`}
                        className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors truncate block max-w-[220px]"
                        title={club.name}
                      >
                        {club.name}
                      </Link>
                    </div>
                  </TableCell>

                  {/* 2. Sigla */}
                  <TableCell>
                    <span className="inline-flex items-center justify-center font-mono text-xs font-medium text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 bg-white shadow-2xs">
                      {club.acronym}
                    </span>
                  </TableCell>

                  {/* 3. Caixa */}
                  <TableCell className="text-right text-xs font-sans text-slate-700 tabular-nums">
                    {formatCurrency(club.cash, false)}
                  </TableCell>

                  {/* 4. Valor do elenco */}
                  <TableCell className="text-right text-xs font-sans text-slate-700 tabular-nums">
                    {formatCurrency(club.squad_value, false)}
                  </TableCell>

                  {/* 5. Patrimônio */}
                  <TableCell className="text-right font-bold text-sm font-sans text-slate-900 tabular-nums">
                    {formatCurrency(club.net_worth, false)}
                  </TableCell>

                  {/* 6. Link Ver clube > */}
                  <TableCell className="text-right">
                    <Link
                      to={`/clubs/${club.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-blue-600 transition-colors"
                    >
                      <span>Ver clube</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Nota de rodapé oficial conforme Figma J01/J04 */}
      <p className="text-xs text-slate-400">
        Clubes pelo nome por padrão ou pelo patrimônio, do maior para o menor, com empate desfeito
        pelo nome.
      </p>
    </div>
  );
}
