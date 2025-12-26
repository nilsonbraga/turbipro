import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
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
    if (typeof value === 'string') search.set(key, value);
    else search.set(key, JSON.stringify(value));
  });
  return search.toString();
};

function calcCommission(value: number, commissionType: string | null, commissionValue: number | null) {
  const v = value || 0;
  const c = commissionValue || 0;
  if ((commissionType || '').toLowerCase() === 'percentage') return (v * c) / 100;
  return c;
}

export function useDashboard(filters: DashboardFilters = {}) {
  const { isSuperAdmin, profile } = useAuth();
  const userAgencyId = profile?.agency_id;

  // Normaliza filtros para chave estável (evita queryKey “oscilar” por referência)
  const normalizedFilters = useMemo(
    () => ({
      agencyId: filters.agencyId ?? null,
      clientId: filters.clientId ?? null,
      year: filters.year ?? null,
      month: filters.month ?? null,
    }),
    [filters.agencyId, filters.clientId, filters.year, filters.month]
  );

  // Agencies (somente super admin)
  const agenciesQuery = useQuery({
    queryKey: ['dashboard-agencies'],
    queryFn: async () => {
      const query = toQueryString({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      });
      const { data } = await apiFetch<{ data: AgencyOption[] }>(`/api/agency?${query}`);
      return data ?? [];
    },
    enabled: isSuperAdmin,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Clients
  const clientsQuery = useQuery({
    queryKey: ['dashboard-clients', normalizedFilters.agencyId, userAgencyId, isSuperAdmin],
    queryFn: async () => {
      const where: Record<string, unknown> = {};

      if (!isSuperAdmin && userAgencyId) where.agencyId = userAgencyId;
      else if (filters.agencyId) where.agencyId = filters.agencyId;

      const query = toQueryString({
        where,
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });

      const { data } = await apiFetch<{ data: ClientOption[] }>(`/api/client?${query}`);
      return data ?? [];
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Proposals
  const proposalsQuery = useQuery({
    queryKey: ['dashboard-proposals', normalizedFilters, userAgencyId, isSuperAdmin],
    queryFn: async () => {
      const where: Record<string, unknown> = {};

      // agência
      if (!isSuperAdmin && userAgencyId) where.agencyId = userAgencyId;
      else if (filters.agencyId) where.agencyId = filters.agencyId;

      // cliente
      if (filters.clientId) where.clientId = filters.clientId;

      // ano/mês
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
      return data ?? [];
    },
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Services (depende de proposals)
  const servicesQuery = useQuery({
    queryKey: ['dashboard-services', normalizedFilters, userAgencyId, isSuperAdmin],
    queryFn: async () => {
      const proposalIds = proposalsQuery.data?.map((p) => p.id) || [];
      if (proposalIds.length === 0) return [];

      const query = toQueryString({
        where: { proposalId: { in: proposalIds } },
        include: { partner: { select: { name: true } } },
      });

      const { data } = await apiFetch<{ data: ProposalServiceWithPartner[] }>(`/api/proposalService?${query}`);
      return data ?? [];
    },
    enabled: (proposalsQuery.data?.length ?? 0) > 0,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const proposals = proposalsQuery.data ?? [];
  const services = servicesQuery.data ?? [];

  // métricas calculadas SEM criar hooks condicionais
  const metrics = useMemo(() => {
    // closed proposals
    const closedProposals = proposals.filter((p) => p.stage?.isClosed === true);
    const closedProposalIds = new Set(closedProposals.map((p) => p.id));

    const closedServices = services.filter((s) => closedProposalIds.has(s.proposalId));

    const totalRevenue = closedServices.reduce((sum, s) => sum + (s.value || 0), 0);

    const totalCommission = closedServices.reduce((sum, s) => {
      const v = s.value || 0;
      return sum + calcCommission(v, s.commissionType, s.commissionValue);
    }, 0);

    const totalProposals = proposals.length;
    const closedCount = closedProposals.length;
    const lostCount = proposals.filter((p) => p.stage?.isLost === true).length;
    const conversionRate = totalProposals > 0 ? Math.round((closedCount / totalProposals) * 100) : 0;

    // Propostas por estágio (count e value = volume de serviços)
    const byStage: Record<string, { count: number; value: number }> = {};
    for (const p of proposals) {
      const stageName = p.stage?.name || 'Sem etapa';
      const sumValue = services
        .filter((s) => s.proposalId === p.id)
        .reduce((acc, s) => acc + (s.value || 0), 0);
      if (!byStage[stageName]) {
        byStage[stageName] = { count: 0, value: 0 };
      }
      byStage[stageName].count += 1;
      byStage[stageName].value += sumValue;
    }

    const proposalsByStage = Object.entries(byStage).map(([stage, data]) => ({
      stage,
      count: data.count,
      value: data.value,
    }));

    // Top clients (somente fechados)
    const clientRevenue: Record<string, number> = {};
    for (const p of closedProposals) {
      const name = p.client?.name || 'Sem cliente';
      const rev = closedServices
        .filter((s) => s.proposalId === p.id)
        .reduce((acc, s) => acc + (s.value || 0), 0);
      clientRevenue[name] = (clientRevenue[name] || 0) + rev;
    }

    const topClients = Object.entries(clientRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top partners (somente fechados)
    const partnerRevenue: Record<string, number> = {};
    for (const s of closedServices) {
      const name = s.partner?.name || 'Sem parceiro';
      partnerRevenue[name] = (partnerRevenue[name] || 0) + (s.value || 0);
    }

    const topPartners = Object.entries(partnerRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Receita por mês (últimos 6 meses) - somente fechados
    const revenueByMonth: Array<{ month: string; revenue: number; profit: number }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });

      const monthClosed = closedProposals.filter((p) => {
        const d = new Date(p.createdAt || '');
        return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
      });

      const ids = new Set(monthClosed.map((p) => p.id));
      const monthServices = closedServices.filter((s) => ids.has(s.proposalId));

      const revenue = monthServices.reduce((sum, s) => sum + (s.value || 0), 0);
      const profit = monthServices.reduce((sum, s) => sum + calcCommission(s.value || 0, s.commissionType, s.commissionValue), 0);

      revenueByMonth.push({ month: monthName, revenue, profit });
    }

    return {
      totalRevenue,
      totalProfit: totalCommission,
      totalProposals,
      conversionRate,
      proposalsByStage,
      topClients,
      topPartners,
      revenueByMonth,
    };
  }, [proposals, services]);

  // estados
  const isInitialLoading =
    (proposalsQuery.isPending && (proposalsQuery.data?.length ?? 0) === 0) ||
    (servicesQuery.isPending && (servicesQuery.data?.length ?? 0) === 0);

  // refresh “de verdade” = proposals/services refetch
  const isRefreshing = proposalsQuery.isFetching || servicesQuery.isFetching;

  return {
    agencies: agenciesQuery.data ?? [],
    clients: clientsQuery.data ?? [],
    metrics,
    isLoading: isInitialLoading,
    isFetching: isRefreshing,
  };
}
