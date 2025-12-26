import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { proposalInclude, mapBackendProposalToFront, BackendProposal } from './useProposals';
import { ProposalService } from './useProposalServices';

export interface PublicProposalLink {
  id: string;
  proposal_id: string;
  token: string;
  expires_at: string | null;
  created_at: string;
  is_active: boolean;
}

export function usePublicProposalLinks(proposalId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mapBackendToFront = (row: any): PublicProposalLink => ({
    id: row.id,
    proposal_id: row.proposalId,
    token: row.token,
    expires_at: row.expiresAt ?? null,
    created_at: row.createdAt,
    is_active: row.isActive,
  });

  const query = useQuery({
    queryKey: ['public-proposal-links', proposalId],
    queryFn: async () => {
      if (!proposalId) return [];
      
      const params = new URLSearchParams({
        where: JSON.stringify({ proposalId, isActive: true }),
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/publicProposalLink?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!proposalId,
  });

  const createMutation = useMutation({
    mutationFn: async ({ expiresInDays }: { expiresInDays?: number } = {}) => {
      if (!proposalId) throw new Error('Proposal ID is required');
      
      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const created = await apiFetch<any>(`/api/publicProposalLink`, {
        method: 'POST',
        body: JSON.stringify({
          proposalId,
          expiresAt,
        }),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-proposal-links', proposalId] });
      toast({ title: 'Link criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar link', description: error.message, variant: 'destructive' });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/publicProposalLink/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: false }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-proposal-links', proposalId] });
      toast({ title: 'Link desativado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao desativar link', description: error.message, variant: 'destructive' });
    },
  });

  return {
    links: query.data ?? [],
    isLoading: query.isLoading,
    createLink: createMutation.mutateAsync,
    deactivateLink: deactivateMutation.mutate,
    isCreating: createMutation.isPending,
  };
}

// Hook to fetch public proposal by token (no auth needed)
export function usePublicProposal(token: string | null) {
  return useQuery({
    queryKey: ['public-proposal', token],
    queryFn: async () => {
      if (!token) return null;

      const linkParams = new URLSearchParams({
        where: JSON.stringify({ token, isActive: true }),
        include: JSON.stringify({
          proposal: {
            include: {
              ...proposalInclude,
              agency: { select: { id: true, name: true, email: true, phone: true, logoUrl: true } },
            },
          },
        }),
      });

      const { data: links } = await apiFetch<{ data: any[] }>(
        `/api/publicProposalLink?${linkParams.toString()}`,
      );

      const link = links?.[0];
      if (!link?.proposal) return null;

      const proposal = link.proposal as BackendProposal & {
        agency?: { id: string; name: string; email: string | null; phone: string | null; logoUrl: string | null };
      };
      const mappedProposal = mapBackendProposalToFront(proposal);

      const servicesParams = new URLSearchParams({
        where: JSON.stringify({ proposalId: proposal.id }),
        include: JSON.stringify({ partner: { select: { id: true, name: true } } }),
        orderBy: JSON.stringify({ createdAt: 'asc' }),
      });

      const { data: servicesData } = await apiFetch<{ data: any[] }>(
        `/api/proposalService?${servicesParams.toString()}`,
      );

      const services: ProposalService[] = (servicesData || []).map((s) => ({
        id: s.id,
        proposal_id: s.proposalId,
        partner_id: s.partnerId ?? null,
        type: s.type,
        description: s.description ?? null,
        start_date: s.startDate ?? null,
        end_date: s.endDate ?? null,
        origin: s.origin ?? null,
        destination: s.destination ?? null,
        value: Number(s.value || 0),
        commission_type: s.commissionType,
        commission_value: Number(s.commissionValue || 0),
        details: s.details ?? null,
        created_at: s.createdAt,
        partners: s.partner ? { id: s.partner.id, name: s.partner.name } : null,
      }));

      return {
        proposal: mappedProposal,
        services,
        agency: proposal.agency
          ? {
              name: proposal.agency.name,
              logo_url: proposal.agency.logoUrl,
              email: proposal.agency.email,
              phone: proposal.agency.phone,
            }
          : null,
      };
    },
    enabled: !!token,
  });
}
