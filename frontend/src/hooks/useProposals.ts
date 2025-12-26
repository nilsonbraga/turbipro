import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface Proposal {
  id: string;
  agency_id: string;
  client_id: string | null;
  user_id: string | null;
  assigned_collaborator_id: string | null;
  number: number;
  title: string;
  notes: string | null;
  status: string;
  stage_id: string | null;
  total_value: number;
  discount: number;
  commission_type: string;
  commission_value: number;
  created_at: string;
  updated_at: string;
  clients?: { id: string; name: string; email: string | null; phone: string | null; cpf: string | null; passport: string | null } | null;
  pipeline_stages?: { id: string; name: string; color: string; is_closed: boolean; is_lost: boolean } | null;
  assigned_collaborator?: { id: string; name: string } | null;
}

export interface ProposalInput {
  client_id?: string | null;
  assigned_collaborator_id?: string | null;
  title: string;
  notes?: string;
  status?: string;
  stage_id?: string | null;
  total_value?: number;
  discount?: number;
  commission_type?: string;
  commission_value?: number;
}

export type BackendProposal = {
  id: string;
  agencyId: string;
  clientId: string | null;
  userId: string | null;
  assignedCollaboratorId: string | null;
  number: number;
  title: string;
  notes: string | null;
  status: string;
  stageId: string | null;
  totalValue: number;
  discount: number;
  commissionType: string;
  commissionValue: number;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string; email: string | null; phone: string | null; cpf: string | null; passport: string | null } | null;
  stage?: { id: string; name: string; color: string; isClosed: boolean; isLost: boolean } | null;
  assignedCollaborator?: { id: string; name: string } | null;
};

export const proposalInclude = {
  client: { select: { id: true, name: true, email: true, phone: true, cpf: true, passport: true } },
  stage: { select: { id: true, name: true, color: true, isClosed: true, isLost: true } },
  assignedCollaborator: { select: { id: true, name: true } },
};

export const mapBackendProposalToFront = (p: BackendProposal): Proposal => ({
  id: p.id,
  agency_id: p.agencyId,
  client_id: p.clientId,
  user_id: p.userId,
  assigned_collaborator_id: p.assignedCollaboratorId,
  number: p.number,
  title: p.title,
  notes: p.notes,
  status: p.status,
  stage_id: p.stageId,
  total_value: Number(p.totalValue || 0),
  discount: Number(p.discount || 0),
  commission_type: p.commissionType,
  commission_value: Number(p.commissionValue || 0),
  created_at: p.createdAt,
  updated_at: p.updatedAt,
  clients: p.client ? {
    id: p.client.id,
    name: p.client.name,
    email: p.client.email,
    phone: p.client.phone,
    cpf: p.client.cpf,
    passport: p.client.passport,
  } : null,
  pipeline_stages: p.stage ? {
    id: p.stage.id,
    name: p.stage.name,
    color: p.stage.color,
    is_closed: p.stage.isClosed,
    is_lost: p.stage.isLost,
  } : null,
  assigned_collaborator: p.assignedCollaborator ? {
    id: p.assignedCollaborator.id,
    name: p.assignedCollaborator.name,
  } : null,
});

const mapFrontToBackend = (input: ProposalInput, agencyId: string, userId: string | null) => ({
  clientId: input.client_id ?? null,
  assignedCollaboratorId: input.assigned_collaborator_id ?? null,
  title: input.title,
  notes: input.notes ?? null,
  status: input.status ?? 'new',
  stageId: input.stage_id ?? null,
  totalValue: input.total_value ?? 0,
  discount: input.discount ?? 0,
  commissionType: input.commission_type ?? 'percentage',
  commissionValue: input.commission_value ?? 0,
  agencyId,
  userId,
});

export function useProposals() {
  const { agency, isSuperAdmin, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['proposals', agency?.id, isSuperAdmin],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (!isSuperAdmin && agency?.id) {
        where.agencyId = agency.id;
      }

      const searchParams = new URLSearchParams({
        where: JSON.stringify(where),
        include: JSON.stringify(proposalInclude),
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });

      const { data } = await apiFetch<{ data: BackendProposal[] }>(`/api/proposal?${searchParams.toString()}`);
      return (data || []).map(mapBackendProposalToFront);
    },
    enabled: !!agency?.id || isSuperAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (input: ProposalInput) => {
      if (!agency?.id) throw new Error('Agência não encontrada');

      const payload = mapFrontToBackend(input, agency.id, profile?.id ?? null);
      const created = await apiFetch<BackendProposal>(`/api/proposal`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return mapBackendProposalToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast({ title: 'Proposta criada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar proposta', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: ProposalInput & { id: string }) => {
      if (!agency?.id) throw new Error('Agência não encontrada');
      const payload = {
        ...mapFrontToBackend(input, agency.id, profile?.id ?? null),
        updatedAt: new Date().toISOString(),
      };
      const updated = await apiFetch<BackendProposal>(`/api/proposal/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return mapBackendProposalToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast({ title: 'Proposta atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar proposta', description: error.message, variant: 'destructive' });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage_id }: { id: string; stage_id: string }) => {
      const updated = await apiFetch<BackendProposal>(`/api/proposal/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ stageId: stage_id, updatedAt: new Date().toISOString() }),
      });
      return mapBackendProposalToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
    onError: (error) => {
      toast({ title: 'Erro ao mover proposta', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/proposal/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast({ title: 'Proposta excluída com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir proposta', description: error.message, variant: 'destructive' });
    },
  });

  return {
    proposals: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createProposal: createMutation.mutate,
    createProposalAsync: createMutation.mutateAsync,
    updateProposal: updateMutation.mutate,
    updateProposalStage: updateStageMutation.mutate,
    deleteProposal: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
