import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface ProposalService {
  id: string;
  proposal_id: string;
  partner_id: string | null;
  type: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  origin: string | null;
  destination: string | null;
  value: number;
  commission_type: string;
  commission_value: number;
  details: Record<string, any> | null;
  created_at: string;
  partners?: { id: string; name: string } | null;
}

export interface ServiceInput {
  proposal_id: string;
  partner_id?: string | null;
  type: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  origin?: string;
  destination?: string;
  value?: number;
  commission_type?: string;
  commission_value?: number;
  details?: Record<string, any>;
}

const toDateOnly = (val?: string | null) => (val ? val.slice(0, 10) : null);
const extractDate = (val?: string | null) => (val ? val.slice(0, 10) : null);
const extractTime = (val?: string | null) => {
  if (!val) return null;
  // If already coming from startTime column, return as is; else derive from ISO string
  if (val.includes(':') && val.length <= 8) return val;
  return val.slice(11, 16);
};

const mapBackendToFront = (s: any): ProposalService => ({
  id: s.id,
  proposal_id: s.proposalId,
  partner_id: s.partnerId ?? null,
  type: s.type,
  description: s.description ?? null,
  start_date: extractDate(s.startDate) ?? null,
  end_date: extractDate(s.endDate) ?? null,
  start_time: s.startTime ?? extractTime(s.startDate) ?? null,
  end_time: s.endTime ?? extractTime(s.endDate) ?? null,
  origin: s.origin ?? null,
  destination: s.destination ?? null,
  value: Number(s.value || 0),
  commission_type: s.commissionType,
  commission_value: Number(s.commissionValue || 0),
  details: s.details ?? null,
  created_at: s.createdAt,
  partners: s.partner ? { id: s.partner.id, name: s.partner.name } : null,
});

const mapFrontToBackend = (input: ServiceInput, options?: { includeProposalId?: boolean }) => {
  const base = {
    partnerId: input.partner_id ?? null,
    type: input.type,
    description: input.description ?? null,
    startDate: toDateOnly(input.start_date),
    endDate: toDateOnly(input.end_date),
    startTime: input.start_time || null,
    endTime: input.end_time || null,
    origin: input.origin ?? null,
    destination: input.destination ?? null,
    value: input.value ?? 0,
    commissionType: input.commission_type ?? 'percentage',
    commissionValue: input.commission_value ?? 0,
    details: input.details ?? {},
  } as Record<string, any>;

  if (options?.includeProposalId !== false) {
    base.proposalId = input.proposal_id;
  }

  return base;
};

export function useProposalServices(proposalId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['proposal-services', proposalId],
    queryFn: async () => {
      if (!proposalId) return [];

      const params = new URLSearchParams({
        where: JSON.stringify({ proposalId }),
        include: JSON.stringify({ partner: { select: { id: true, name: true } } }),
        orderBy: JSON.stringify({ createdAt: 'asc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/proposalService?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!proposalId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: ServiceInput) => {
      const payload = mapFrontToBackend(input);
      const created = await apiFetch<any>(`/api/proposalService`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-services'] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposal-services-totals'] });
      toast({ title: 'Serviço adicionado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao adicionar serviço', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: ServiceInput & { id: string }) => {
      const payload = {
        ...mapFrontToBackend(input, { includeProposalId: false }),
      };
      const updated = await apiFetch<any>(`/api/proposalService/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-services'] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposal-services-totals'] });
      toast({ title: 'Serviço atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar serviço', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/proposalService/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-services'] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposal-services-totals'] });
      toast({ title: 'Serviço removido!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover serviço', description: error.message, variant: 'destructive' });
    },
  });

  return {
    services: query.data ?? [],
    isLoading: query.isLoading,
    createService: createMutation.mutate,
    updateService: updateMutation.mutate,
    deleteService: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
