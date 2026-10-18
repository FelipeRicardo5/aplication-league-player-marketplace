import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMatches, fetchMatchById, createMatch, fetchStandings } from '../api/league-api';
import { useToast } from '@/components/feedback/use-toast';
import { ApiError } from '@/lib/api';
import type { Match } from '../types';

export function useMatchesQuery(clubId?: number) {
  return useQuery({
    queryKey: ['matches', clubId],
    queryFn: () => fetchMatches(clubId),
  });
}

export function useMatchDetailQuery(id: number | null) {
  return useQuery({
    queryKey: ['matches', id],
    queryFn: () => (id ? fetchMatchById(id) : null),
    enabled: Boolean(id),
  });
}

export function useCreateMatchMutation(onSuccessCallback?: (match: Match) => void) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ homeClubId, awayClubId }: { homeClubId: number; awayClubId: number }) =>
      createMatch(homeClubId, awayClubId),
    onSuccess: (match) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });

      success(
        'Partida concluída!',
        `${match.home.club_name} ${match.home.goals} × ${match.away.goals} ${match.away.club_name}. Placar e duelos calculados pela liga.`,
      );
      if (onSuccessCallback) onSuccessCallback(match);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        error('Não foi possível realizar a partida', err.message);
      } else {
        error('Erro inesperado', 'Falha ao processar simulação da partida.');
      }
    },
  });
}

export function useStandingsQuery() {
  return useQuery({
    queryKey: ['standings'],
    queryFn: () => fetchStandings(),
  });
}
