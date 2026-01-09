import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

export interface FinancialService {
  id: string;
  proposal_id: string;
  type: string;
  description: string | null;
  value: number;
  commission_type: string | null;
  commission_value: number | null;
  partner_id: string | null;
  origin: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  partner?: { id: string; name: string } | null;
  proposal?: {
    id: string;
    number: number;
    title: string;
    total_value: number | null;
    stage_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    client?: { id: string; name: string; cpf: string | null } | null;
    agency?: { id: string; name: string } | null;
    stage?: { id: string; name: string; is_closed: boolean } | null;
  } | null;
}

export interface ServiceFilters {
  startDate?: Date;
  endDate?: Date;
  agencyId?: string;
  partnerId?: string;
  serviceType?: string;
  enabled?: boolean;
}

type BackendFinancialService = {
  id: string;
  proposalId: string;
  partnerId: string | null;
  type: string;
  description: string | null;
  value: number | string;
  commissionType: string | null;
  commissionValue: number | string | null;
  origin: string | null;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  partner?: { id: string; name: string } | null;
  proposal?: {
    id: string;
    number: number;
    title: string;
    totalValue: number | string | null;
    stageId: string | null;
    createdAt: string;
    updatedAt: string;
    client?: { id: string; name: string; cpf: string | null } | null;
    agency?: { id: string; name: string } | null;
    stage?: { id: string; name: string; isClosed: boolean } | null;
  } | null;
};

const mapBackendToFront = (service: BackendFinancialService): FinancialService => ({
  id: service.id,
  proposal_id: service.proposalId,
  partner_id: service.partnerId ?? null,
  type: service.type,
  description: service.description ?? null,
  value: Number(service.value || 0),
  commission_type: service.commissionType ?? null,
  commission_value: service.commissionValue !== null ? Number(service.commissionValue) : null,
  origin: service.origin ?? null,
  destination: service.destination ?? null,
  start_date: service.startDate ?? null,
  end_date: service.endDate ?? null,
  created_at: service.createdAt,
  partner: service.partner ? { id: service.partner.id, name: service.partner.name } : null,
  proposal: service.proposal
    ? {
        id: service.proposal.id,
        number: service.proposal.number,
        title: service.proposal.title,
        total_value: Number(service.proposal.totalValue || 0),
        stage_id: service.proposal.stageId,
        created_at: service.proposal.createdAt,
        updated_at: service.proposal.updatedAt,
        client: service.proposal.client
          ? {
              id: service.proposal.client.id,
              name: service.proposal.client.name,
              cpf: service.proposal.client.cpf,
            }
          : null,
        agency: service.proposal.agency
          ? { id: service.proposal.agency.id, name: service.proposal.agency.name }
          : null,
        stage: service.proposal.stage
          ? { id: service.proposal.stage.id, name: service.proposal.stage.name, is_closed: service.proposal.stage.isClosed }
          : null,
      }
    : null,
});

export function useFinancialServices(filters: ServiceFilters = {}) {
  const { user, agency, isSuperAdmin } = useAuth();

  return useQuery({
    queryKey: ['financial-services', filters, agency?.id, isSuperAdmin],
    queryFn: async () => {
      const proposalWhere: Record<string, unknown> = {
        stage: { isClosed: true },
      };

      if (!isSuperAdmin && agency?.id) {
        proposalWhere.agencyId = agency.id;
      } else if (filters.agencyId) {
        proposalWhere.agencyId = filters.agencyId;
      }

      if (filters.startDate || filters.endDate) {
        proposalWhere.updatedAt = {};
        if (filters.startDate) (proposalWhere.updatedAt as any).gte = filters.startDate.toISOString();
        if (filters.endDate) (proposalWhere.updatedAt as any).lte = filters.endDate.toISOString();
      }

      const where: Record<string, unknown> = {
        proposal: proposalWhere,
      };

      if (filters.partnerId) {
        where.partnerId = filters.partnerId;
      }

      if (filters.serviceType) {
        where.type = filters.serviceType;
      }

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        include: JSON.stringify({
          partner: { select: { id: true, name: true } },
          proposal: {
            include: {
              client: { select: { id: true, name: true, cpf: true } },
              agency: { select: { id: true, name: true } },
              stage: { select: { id: true, name: true, isClosed: true } },
            },
          },
        }),
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });

      const { data } = await apiFetch<{ data: BackendFinancialService[] }>(`/api/proposalService?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!user && (filters.enabled ?? true),
  });
}

export function useServiceTotals(services: FinancialService[]) {
  const totalValue = services.reduce((acc, s) => acc + (s.value || 0), 0);
  
  const totalCommission = services.reduce((acc, s) => {
    if (s.commission_type === 'percentage') {
      return acc + ((s.value || 0) * (s.commission_value || 0) / 100);
    }
    return acc + (s.commission_value || 0);
  }, 0);

  const byType = services.reduce((acc, s) => {
    const type = s.type || 'other';
    if (!acc[type]) {
      acc[type] = { count: 0, value: 0, commission: 0 };
    }
    acc[type].count++;
    acc[type].value += s.value || 0;
    if (s.commission_type === 'percentage') {
      acc[type].commission += (s.value || 0) * (s.commission_value || 0) / 100;
    } else {
      acc[type].commission += s.commission_value || 0;
    }
    return acc;
  }, {} as Record<string, { count: number; value: number; commission: number }>);

  const byPartner = services.reduce((acc, s) => {
    const partnerId = s.partner_id || 'no-partner';
    const partnerName = s.partner?.name || 'Sem Fornecedor';
    if (!acc[partnerId]) {
      acc[partnerId] = { name: partnerName, count: 0, value: 0, commission: 0 };
    }
    acc[partnerId].count++;
    acc[partnerId].value += s.value || 0;
    if (s.commission_type === 'percentage') {
      acc[partnerId].commission += (s.value || 0) * (s.commission_value || 0) / 100;
    } else {
      acc[partnerId].commission += s.commission_value || 0;
    }
    return acc;
  }, {} as Record<string, { name: string; count: number; value: number; commission: number }>);

  return {
    totalValue,
    totalCommission,
    byType,
    byPartner,
  };
}
