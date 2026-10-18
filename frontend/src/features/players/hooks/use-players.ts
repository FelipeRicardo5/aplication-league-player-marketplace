import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchPlayers,
  fetchPlayerById,
  createPlayer,
  updatePlayer,
  updatePlayerCondition,
  deletePlayer,
} from '../api/players-api';
import type { QueryPlayersParams } from '../types';
import type {
  CreatePlayerFormInput,
  UpdateConditionFormInput,
  UpdatePlayerFormInput,
} from '../schemas/player.schema';
import { useToast } from '@/components/feedback/use-toast';
import { ApiError } from '@/lib/api';

export function usePlayersQuery(params: QueryPlayersParams) {
  return useQuery({
    queryKey: ['players', params],
    queryFn: () => fetchPlayers(params),
  });
}

export function usePlayerDetailQuery(id: number | null) {
  return useQuery({
    queryKey: ['players', id],
    queryFn: () => (id ? fetchPlayerById(id) : null),
    enabled: Boolean(id),
  });
}

export function useCreatePlayerMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: CreatePlayerFormInput) => createPlayer(data),
    onSuccess: (newPlayer) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      success(
        'Jogador cadastrado com sucesso',
        `${newPlayer.name} cadastrado com valor base ${newPlayer.base_value}.`,
      );
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        error('Não foi possível cadastrar o jogador', err.message);
      } else {
        error('Erro inesperado', 'Falha ao processar cadastro do jogador.');
      }
    },
  });
}

export function useUpdatePlayerMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlayerFormInput }) =>
      updatePlayer(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['players', updated.id] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      success('Jogador atualizado', `${updated.name} foi atualizado com sucesso.`);
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        error('Não foi possível atualizar o jogador', err.message);
      } else {
        error('Erro inesperado', 'Falha ao atualizar dados do jogador.');
      }
    },
  });
}

export function useUpdateConditionMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateConditionFormInput }) =>
      updatePlayerCondition(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['players', updated.id] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
      success(
        'Condição alterada',
        `${updated.name} agora está ${updated.condition}. Novo valor de mercado: ${updated.market_value}.`,
      );
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        error('Não foi possível alterar a condição', err.message);
      } else {
        error('Erro inesperado', 'Falha ao alterar a condição física.');
      }
    },
  });
}

export function useDeletePlayerMutation(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: number) => deletePlayer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      success(
        'Jogador excluído',
        'O jogador saiu da lista ativa. Transações e partidas antigas permanecem registradas.',
      );
      if (onSuccessCallback) onSuccessCallback();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        error('Não foi possível excluir o jogador', err.message);
      } else {
        error('Erro inesperado', 'Falha ao excluir o jogador.');
      }
    },
  });
}
