import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface ProposalHistory {
  id: string;
  proposal_id: string;
  user_id: string | null;
  action: string;
  description: string | null;
  old_value: any;
  new_value: any;
  created_at: string;
  user_name?: string;
}

export interface HistoryInput {
  proposal_id: string;
  action: string;
  description?: string;
  old_value?: any;
  new_value?: any;
}

export function useProposalHistory(proposalId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mapBackendToFront = (h: any): ProposalHistory => ({
    id: h.id,
    proposal_id: h.proposalId,
    user_id: h.userId ?? null,
    action: h.action,
    description: h.description ?? null,
    old_value: h.oldValue,
    new_value: h.newValue,
    created_at: h.createdAt,
    user_name: h.user?.name || h.user?.email || 'Sistema',
  });

  const mapFrontToBackend = (input: HistoryInput) => {
    const payload: Record<string, any> = {
      proposalId: input.proposal_id,
      action: input.action,
      description: input.description ?? null,
      oldValue: input.old_value,
      newValue: input.new_value,
    };

    if (user?.id) {
      payload.userId = user.id;
    }

    return payload;
  };

  const query = useQuery({
    queryKey: ['proposal-history', proposalId],
    queryFn: async () => {
      if (!proposalId) return [];

      const params = new URLSearchParams({
        where: JSON.stringify({ proposalId }),
        include: JSON.stringify({ user: { select: { id: true, name: true, email: true } } }),
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/proposalHistory?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!proposalId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: HistoryInput) => {
      const payload = mapFrontToBackend(input);
      const created = await apiFetch<any>(`/api/proposalHistory`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-history', proposalId] });
    },
    onError: (error) => {
      console.error('Error logging history:', error);
    },
  });

  return {
    history: query.data ?? [],
    isLoading: query.isLoading,
    addHistory: createMutation.mutate,
  };
}
