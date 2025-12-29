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

const normalizeDateInput = (date?: string | null, time?: string | null) => {
  if (!date) return null;
  const timePart = time && time.trim() ? time.trim() : '12:00';
  const dt = new Date(`${date}T${timePart}`);
  if (Number.isNaN(dt.getTime())) return null;
  // use local time to avoid timezone rollback (ex: -03:00)
  return dt.toISOString();
};
const extractDate = (val?: string | null) => (val ? val.slice(0, 10) : null);
const extractTime = (val?: string | null) => {
  if (!val) return null;
  // If already coming from startTime column, return as is; else derive from ISO string
  if (val.includes(':') && val.length <= 8) return val;
  const t = val.slice(11, 16);
  return t && t.includes(':') ? t : null;
};

const computeDatesFromDetails = (type: string, details?: Record<string, any>) => {
  if (!details) return { startDate: null as string | null, endDate: null as string | null, startTime: null as string | null, endTime: null as string | null };

  const toIso = (date?: string | null, time?: string | null) => {
    if (!date) return null;
    const hasTime = time && time.trim().length > 0;
    // If already in ISO, keep as is
    if (date.includes('T')) {
      const d = new Date(date);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    return normalizeDateInput(date, hasTime ? time! : '12:00');
  };

  // Flight: use first departure and last arrival
  if (type === 'flight' && Array.isArray(details.segments) && details.segments.length > 0) {
    const first = details.segments[0];
    const last = details.segments[details.segments.length - 1];
    const startDate = toIso(first?.departureAt?.slice(0, 10) ?? first?.departureAt, first?.departureAt?.slice(11, 16));
    const endDate = toIso(last?.arrivalAt?.slice(0, 10) ?? last?.arrivalAt, last?.arrivalAt?.slice(11, 16));
    const startTime = extractTime(first?.departureAt);
    const endTime = extractTime(last?.arrivalAt);
    return { startDate, endDate, startTime, endTime };
  }

  // Hotel: check-in/out
  if (type === 'hotel') {
    const startDate = toIso(details.checkIn, details.checkInTime);
    const endDate = toIso(details.checkOut, details.checkOutTime);
    const startTime = details.checkInTime || null;
    const endTime = details.checkOutTime || null;
    return { startDate, endDate, startTime, endTime };
  }

  // Generic fallbacks
  const start = details.startDate || details.start_date || details.date || details.pickupAt || details.departureAt || null;
  const end = details.endDate || details.end_date || details.returnDate || details.dropoffAt || details.arrivalAt || null;
  const startDate = toIso(start?.slice?.(0, 10) ?? start, extractTime(start));
  const endDate = toIso(end?.slice?.(0, 10) ?? end, extractTime(end));
  const startTime = extractTime(start);
  const endTime = extractTime(end);

  return { startDate, endDate, startTime, endTime };
};

const mapBackendToFront = (s: any): ProposalService => ({
  id: s.id,
  proposal_id: s.proposalId,
  partner_id: s.partnerId ?? null,
  type: s.type,
  description: s.description ?? null,
  start_date: s.startDate ?? null,
  end_date: s.endDate ?? null,
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
  const normalizedStart = normalizeDateInput(input.start_date, input.start_time);
  const normalizedEnd = normalizeDateInput(input.end_date, input.end_time);
  const derived = computeDatesFromDetails(input.type, input.details);
  const base = {
    partnerId: input.partner_id ?? null,
    type: input.type,
    description: input.description ?? null,
    startDate: derived.startDate ?? normalizedStart,
    endDate: derived.endDate ?? normalizedEnd,
    startTime: derived.startTime ?? input.start_time ?? (input.start_date ? '12:00' : null),
    endTime: derived.endTime ?? input.end_time ?? (input.end_date ? '12:00' : null),
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
      queryClient.invalidateQueries({ queryKey: ['proposal-services'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposal-services-totals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'], exact: false });
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
    onSuccess: (updated, variables) => {
      // Update cache immediately for the current proposal
      if (variables.proposal_id) {
        queryClient.setQueryData<ProposalService[] | undefined>(
          ['proposal-services', variables.proposal_id],
          (old) => (old ? old.map((s) => (s.id === updated.id ? updated : s)) : old),
        );
      }
      queryClient.invalidateQueries({ queryKey: ['proposal-services'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposal'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposal-services-totals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'], exact: false });
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
      queryClient.invalidateQueries({ queryKey: ['proposal-services'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['proposal-services-totals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'], exact: false });
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
