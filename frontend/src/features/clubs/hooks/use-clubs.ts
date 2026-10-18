import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchClubs,
  fetchClubById,
  createClub,
  fetchClubLineup,
  saveClubLineup,
} from '../api/clubs-api';
import type { CreateClubFormInput } from '../schemas/club.schema';
import type { FormationType } from '../types';
import { useToast } from '@/components/feedback/use-toast';
import { ApiError } from '@/lib/api';

export function useClubsQuery(sort = 'name') {
  return useQuery({
    queryKey: ['clubs', sort],
    queryFn: () => fetchClubs(sort),
  });
}

export function useClubDetailQuery(id: number | null) {
  return useQuery({
    queryKey: ['clubs', id],
    queryFn: () => (id ? fetchClubById(id) : null),
    enabled: Boolean(id),
  });
}

export function useClubLineupQuery(clubId: number | null) {
  return useQuery({
    queryKey: ['lineups', clubId],
    queryFn: () => (clubId ? fetchClubLineup(clubId) : null),
    enabled: Boolean(clubId),
  });
}

export function useCreateClubMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: CreateClubFormInput) => createClub(data),
    onSuccess: (newClub) => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      success(
        'Clube cadastrado com sucesso',
        `${newClub.name} (${newClub.acronym}) inicia com 300,00 em caixa.`,
      );
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        error('Não foi possível cadastrar o clube', err.message);
      } else {
        error('Erro inesperado', 'Falha ao registrar novo clube.');
      }
    },
  });
}

export function useSaveLineupMutation(clubId: number, onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ formation, playerIds }: { formation: FormationType; playerIds: number[] }) =>
      saveClubLineup(clubId, formation, playerIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lineups', clubId] });
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId] });
      success(
        'Escalação salva',
        `Formação ${data.formation} confirmada com os 5 titulares devolvidos pela API.`,
      );
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        error('Escalação recusada pela liga', err.message);
      } else {
        error('Erro inesperado', 'Falha ao salvar a escalação do clube.');
      }
    },
  });
}
