import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface PipelineStage {
  id: string;
  agency_id: string;
  name: string;
  color: string;
  order: number;
  is_closed: boolean;
  is_lost: boolean;
  created_at: string;
  updated_at: string;
}

export interface PipelineStageInput {
  name: string;
  color: string;
  order?: number;
  is_closed?: boolean;
  is_lost?: boolean;
}

export function usePipelineStages() {
  const { agency, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['pipeline-stages', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return [];

      const params = new URLSearchParams({
        where: JSON.stringify({ agencyId: agency.id }),
        orderBy: JSON.stringify({ order: 'asc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/pipelineStage?${params.toString()}`);
      return (data || []).map((s) => ({
        id: s.id,
        agency_id: s.agencyId,
        name: s.name,
        color: s.color,
        order: s.order,
        is_closed: s.isClosed,
        is_lost: s.isLost,
        created_at: s.createdAt,
        updated_at: s.updatedAt,
      })) as PipelineStage[];
    },
    enabled: !!agency?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: PipelineStageInput) => {
      if (!agency?.id) throw new Error('Agência não encontrada');
      
      // Get max order
      const maxOrder = (query.data || []).reduce((max, s) => Math.max(max, s.order), -1);

      const created = await apiFetch<any>(`/api/pipelineStage`, {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          color: input.color,
          order: input.order ?? maxOrder + 1,
          isClosed: input.is_closed ?? false,
          isLost: input.is_lost ?? false,
          agencyId: agency.id,
        }),
      });
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
      toast({ title: 'Estágio criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar estágio', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: PipelineStageInput & { id: string }) => {
      const updated = await apiFetch(`/api/pipelineStage/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: input.name,
          color: input.color,
          order: input.order,
          isClosed: input.is_closed,
          isLost: input.is_lost,
          updatedAt: new Date().toISOString(),
        }),
      });
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
      toast({ title: 'Estágio atualizado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar estágio', description: error.message, variant: 'destructive' });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (stages: { id: string; order: number }[]) => {
      const promises = stages.map(({ id, order }) =>
        apiFetch(`/api/pipelineStage/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ order }),
        }),
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
    },
    onError: (error) => {
      toast({ title: 'Erro ao reordenar estágios', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/pipelineStage/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
      toast({ title: 'Estágio excluído com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir estágio', description: error.message, variant: 'destructive' });
    },
  });

  return {
    stages: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createStage: createMutation.mutate,
    updateStage: updateMutation.mutate,
    reorderStages: reorderMutation.mutate,
    deleteStage: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
