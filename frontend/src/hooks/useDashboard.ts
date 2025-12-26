import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

export interface DashboardFilters {
  agencyId?: string;
  clientId?: string;
  year?: number;
  month?: number;
}

type AgencyOption = { id: string; name: string };
type ClientOption = { id: string; name: string };

type ProposalWithRelations = {
  id: string;
  title: string;
  status: string;
  stageId: string | null;
  totalValue: number;
  createdAt: string;
  agencyId: string;
  clientId: string | null;
  client: { name: string } | null;
  stage: { id: string; name: string; isClosed: boolean; isLost: boolean } | null;
};

type ProposalServiceWithPartner = {
  id: string;
  value: number | null;
  commissionType: string | null;
  commissionValue: number | null;
  proposalId: string;
  partnerId: string | null;
  partner: { name: string } | null;
};

const toQueryString = (params: Record<string, unknown>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string') {
      search.set(key, value);
    } else {
      search.set(key, JSON.stringify(value));
    }
  });
  return search.toString();
};

export function useDashboard(filters: DashboardFilters = {}) {
  const { isSuperAdmin, profile } = useAuth();
  const userAgencyId = profile?.agency_id;

  // Fetch agencies for filter (super admin only)
  const agenciesQuery = useQuery({
    queryKey: ['dashboard-agencies'],
    queryFn: async () => {
      const query = toQueryString({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      });

      const { data } = await apiFetch<{ data: AgencyOption[] }>(`/api/agency?${query}`);
      return data;
    },
    enabled: isSuperAdmin,
  });

  // Fetch clients for filter
  const clientsQuery = useQuery({
    queryKey: ['dashboard-clients', filters.agencyId, userAgencyId, isSuperAdmin],
    queryFn: async () => {
      const where: Record<string, unknown> = {};

      if (!isSuperAdmin && userAgencyId) {
        where.agencyId = userAgencyId;
      } else if (filters.agencyId) {
        where.agencyId = filters.agencyId;
      }

      const query = toQueryString({
        where,
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });

      const { data } = await apiFetch<{ data: ClientOption[] }>(`/api/client?${query}`);
      return data;
    },
  });

  // Fetch proposals with pipeline stages to determine closed status
  const proposalsQuery = useQuery({
    queryKey: ['dashboard-proposals', filters, userAgencyId, isSuperAdmin],
    queryFn: async () => {
      const where: Record<string, unknown> = {};

      // Filter by agency
      if (!isSuperAdmin && userAgencyId) {
        where.agencyId = userAgencyId;
      } else if (filters.agencyId) {
        where.agencyId = filters.agencyId;
      }

      // Filter by client
      if (filters.clientId) {
        where.clientId = filters.clientId;
      }

      // Filter by year/month
      if (filters.year && filters.month) {
        const startDate = new Date(filters.year, filters.month - 1, 1);
        const endDate = new Date(filters.year, filters.month, 0);
        where.createdAt = { gte: startDate.toISOString(), lte: endDate.toISOString() };
      } else if (filters.year) {
        const startDate = new Date(filters.year, 0, 1);
        const endDate = new Date(filters.year, 11, 31);
        where.createdAt = { gte: startDate.toISOString(), lte: endDate.toISOString() };
      }

      const query = toQueryString({
        where,
        include: {
          stage: { select: { id: true, name: true, isClosed: true, isLost: true } },
          client: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const { data } = await apiFetch<{ data: ProposalWithRelations[] }>(`/api/proposal?${query}`);
      return data;
    },
  });

  // Fetch proposal services for revenue calculation
  const servicesQuery = useQuery({
    queryKey: ['dashboard-services', filters, userAgencyId, isSuperAdmin],
    queryFn: async () => {
      // First get the proposal IDs based on filters
      const proposalIds = proposalsQuery.data?.map(p => p.id) || [];
      
      if (proposalIds.length === 0) return [];

      const query = toQueryString({
        where: { proposalId: { in: proposalIds } },
        include: { partner: { select: { name: true } } },
      });

      const { data } = await apiFetch<{ data: ProposalServiceWithPartner[] }>(`/api/proposalService?${query}`);
      return data;
    },
    enabled: !!proposalsQuery.data,
  });

  // Calculate metrics - Only count revenue/profit from CLOSED proposals (using pipeline_stages.is_closed)
  const proposals = proposalsQuery.data || [];
  const services = servicesQuery.data || [];
  
  // Check if proposal is closed by looking at pipeline_stages.is_closed flag
  const closedProposals = proposals.filter(p => {
    const stage = p.stage;
    return stage?.isClosed === true;
  });
  
  // Calculate revenue from services of closed proposals
  const closedProposalIds = closedProposals.map(p => p.id);
  const closedServices = services.filter(s => closedProposalIds.includes(s.proposalId));
  
  const totalRevenue = closedServices.reduce((sum, s) => sum + (s.value || 0), 0);
  // Commission is calculated from each service
  const totalCommission = closedServices.reduce((sum, s) => {
    const serviceValue = s.value || 0;
    const serviceComm = (s as any).commissionType === 'percentage'
      ? (serviceValue * (s.commissionValue || 0)) / 100
      : (s.commissionValue || 0);
    return sum + serviceComm;
  }, 0);
  
  const totalProposals = proposals.length;
  const closedCount = closedProposals.length;
  const lostCount = proposals.filter(p => {
    const stage = p.stage;
    return stage?.isLost === true;
  }).length;
  const conversionRate = totalProposals > 0 ? Math.round((closedCount / totalProposals) * 100) : 0;

  // Proposals by stage
  const proposalsByStage = proposals.reduce((acc, p) => {
    const stage = p.stage;
    const stageName = stage?.name || 'Sem etapa';
    if (!acc[stageName]) {
      acc[stageName] = { count: 0, value: 0 };
    }
    acc[stageName].count++;
    // Get services value for this proposal
    const proposalServices = services.filter(s => s.proposalId === p.id);
    const proposalValue = proposalServices.reduce((sum, s) => sum + (s.value || 0), 0);
    acc[stageName].value += proposalValue;
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  // Top clients by revenue (from closed proposals only)
  const clientRevenue = closedProposals.reduce((acc, p) => {
    const clientName = p.client?.name || 'Sem cliente';
    const proposalServices = closedServices.filter(s => s.proposalId === p.id);
    const revenue = proposalServices.reduce((sum, s) => sum + (s.value || 0), 0);
    if (!acc[clientName]) acc[clientName] = 0;
    acc[clientName] += revenue;
    return acc;
  }, {} as Record<string, number>);

  const topClients = Object.entries(clientRevenue)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top partners by revenue (from closed proposals only)
  const partnerRevenue = closedServices.reduce((acc, s) => {
    const partnerName = s.partner?.name || 'Sem parceiro';
    if (!acc[partnerName]) acc[partnerName] = 0;
    acc[partnerName] += s.value || 0;
    return acc;
  }, {} as Record<string, number>);

  const topPartners = Object.entries(partnerRevenue)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Monthly revenue (last 6 months) - only from closed proposals
  const revenueByMonth = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
    const monthProposals = closedProposals.filter(p => {
      const pDate = new Date(p.createdAt || '');
      return pDate.getMonth() === date.getMonth() && pDate.getFullYear() === date.getFullYear();
    });
    const monthProposalIds = monthProposals.map(p => p.id);
    const monthServices = closedServices.filter(s => monthProposalIds.includes(s.proposalId));
    const revenue = monthServices.reduce((sum, s) => sum + (s.value || 0), 0);
    const commission = monthServices.reduce((sum, s) => {
      const serviceValue = s.value || 0;
      const serviceComm = (s as any).commissionType === 'percentage'
        ? (serviceValue * (s.commissionValue || 0)) / 100
        : (s.commissionValue || 0);
      return sum + serviceComm;
    }, 0);
    revenueByMonth.push({
      month: monthName,
      revenue,
      profit: commission,
    });
  }

  return {
    // Data for filters
    agencies: agenciesQuery.data || [],
    clients: clientsQuery.data || [],
    
    // Metrics
    metrics: {
      totalRevenue,
      totalProfit: totalCommission, // Profit is now the commission
      totalCommission,
      totalProposals,
      closedCount,
      lostCount,
      conversionRate,
      proposalsByStage: Object.entries(proposalsByStage).map(([stage, data]) => ({
        stage,
        count: data.count,
        value: data.value,
      })),
      topClients,
    topPartners,
    revenueByMonth,
  },
  
  // Loading states
  isLoading: proposalsQuery.isLoading || servicesQuery.isLoading || agenciesQuery.isLoading || clientsQuery.isLoading,
  };
}
