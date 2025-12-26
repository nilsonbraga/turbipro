import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface Tag {
  id: string;
  agency_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TagInput {
  name: string;
  color?: string;
}

const mapBackendToFront = (tag: any): Tag => ({
  id: tag.id,
  agency_id: tag.agencyId,
  name: tag.name,
  color: tag.color,
  created_at: tag.createdAt,
});

export function useTags() {
  const { agency, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tags', agency?.id, isSuperAdmin],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (!isSuperAdmin && agency?.id) {
        where.agencyId = agency.id;
      }

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/tag?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!agency?.id || isSuperAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (input: TagInput) => {
      if (!agency?.id && !isSuperAdmin) throw new Error('Agência não encontrada');

      const created = await apiFetch<any>(`/api/tag`, {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          color: input.color ?? '#3B82F6',
          agencyId: agency!.id,
        }),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({ title: 'Tag criada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar tag', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: TagInput & { id: string }) => {
      const updated = await apiFetch<any>(`/api/tag/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: input.name,
          color: input.color,
        }),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({ title: 'Tag atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar tag', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/tag/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast({ title: 'Tag excluída com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir tag', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tags: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createTag: createMutation.mutate,
    updateTag: updateMutation.mutate,
    deleteTag: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
