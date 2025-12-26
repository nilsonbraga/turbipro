import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

export interface Team {
  id: string;
  agency_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamInput {
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export function useTeams() {
  const { user, profile, isSuperAdmin } = useAuth();
  const agencyId = profile?.agency_id;
  const queryClient = useQueryClient();

  const mapBackendToFront = (team: any): Team => ({
    id: team.id,
    agency_id: team.agencyId,
    name: team.name,
    description: team.description ?? null,
    is_active: team.isActive,
    created_at: team.createdAt,
    updated_at: team.updatedAt,
  });

  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ['teams', agencyId],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (agencyId && !isSuperAdmin) {
        where.agencyId = agencyId;
      }

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        orderBy: JSON.stringify({ name: 'asc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/team?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (input: TeamInput) => {
      if (!agencyId) throw new Error('Agency ID is required');
      
      const created = await apiFetch<any>(`/api/team`, {
        method: 'POST',
        body: JSON.stringify({
          agencyId,
          name: input.name,
          description: input.description ?? null,
          isActive: input.is_active ?? true,
        }),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Equipe criada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar equipe: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: TeamInput & { id: string }) => {
      const updated = await apiFetch<any>(`/api/team/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: input.name,
          description: input.description ?? null,
          isActive: input.is_active,
        }),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Equipe atualizada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar equipe: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/team/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Equipe excluída com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir equipe: ${error.message}`);
    },
  });

  return {
    teams,
    isLoading,
    error,
    createTeam: createMutation.mutate,
    updateTeam: updateMutation.mutate,
    deleteTeam: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
