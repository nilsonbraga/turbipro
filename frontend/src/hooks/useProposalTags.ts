import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface ProposalTag {
  proposal_id: string;
  tag_id: string;
  tags?: { id: string; name: string; color: string };
}

export function useProposalTags(proposalId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mapBackendToFront = (row: any): ProposalTag => ({
    proposal_id: row.proposalId,
    tag_id: row.tagId,
    tags: row.tag
      ? { id: row.tag.id, name: row.tag.name, color: row.tag.color }
      : undefined,
  });

  const query = useQuery({
    queryKey: ['proposal-tags', proposalId],
    queryFn: async () => {
      if (!proposalId) return [];

      const params = new URLSearchParams({
        where: JSON.stringify({ proposalId }),
        include: JSON.stringify({ tag: { select: { id: true, name: true, color: true } } }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/proposalTag?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!proposalId,
  });

  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      if (!proposalId) throw new Error('Proposta não encontrada');

      const params = new URLSearchParams({
        include: JSON.stringify({ tag: { select: { id: true, name: true, color: true } } }),
      });

      const created = await apiFetch<any>(`/api/proposalTag?${params.toString()}`, {
        method: 'POST',
        body: JSON.stringify({ proposalId, tagId }),
      });

      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-tags', proposalId] });
      queryClient.invalidateQueries({ queryKey: ['all-proposal-tags'] });
      toast({ title: 'Tag adicionada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar tag', description: error.message, variant: 'destructive' });
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      if (!proposalId) throw new Error('Proposta não encontrada');

      const params = new URLSearchParams({ proposalId, tagId });
      await apiFetch(`/api/proposalTag?${params.toString()}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-tags', proposalId] });
      queryClient.invalidateQueries({ queryKey: ['all-proposal-tags'] });
      toast({ title: 'Tag removida!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover tag', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tags: query.data ?? [],
    isLoading: query.isLoading,
    addTag: addTagMutation.mutate,
    removeTag: removeTagMutation.mutate,
    isAdding: addTagMutation.isPending,
    isRemoving: removeTagMutation.isPending,
  };
}
