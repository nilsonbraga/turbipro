import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

export interface DashboardFilters {
  agencyId?: string;
  clientId?: string;
  year?: number;
  month?: number;
  period?: 'today' | 'week' | 'month' | 'year' | 'all';
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
  userId: string | null;
  client: { name: string } | null;
  stage: { id: string; name: string; isClosed: boolean; isLost: boolean } | null;
  createdBy: { id: string; name: string | null; email: string | null } | null;
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

type FinancialTransaction = {
  id: string;
  agencyId: string;
  type: string;
  status: string | null;
  totalValue: number;
  profitValue: number | null;
  launchDate: string;
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

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

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
      period: filters.period ?? null,
    }),
    [filters.agencyId, filters.clientId, filters.year, filters.month, filters.period]
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

      const query = toQueryString({
        where,
        include: {
          stage: { select: { id: true, name: true, isClosed: true, isLost: true } },
          client: { select: { name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
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
  const financialQuery = useQuery({
    queryKey: ['dashboard-financial', normalizedFilters, userAgencyId, isSuperAdmin],
    queryFn: async () => {
      const where: Record<string, unknown> = { type: 'income', status: { in: ['paid', 'pending', 'scheduled'] } };
      if (!isSuperAdmin && userAgencyId) where.agencyId = userAgencyId;
      else if (filters.agencyId) where.agencyId = filters.agencyId;
      const query = toQueryString({
        where,
        select: { id: true, totalValue: true, profitValue: true, status: true, type: true, launchDate: true, agencyId: true },
      });
      const { data } = await apiFetch<{ data: FinancialTransaction[] }>(`/api/financialTransaction?${query}`);
      return data ?? [];
    },
    enabled: true,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const financial = financialQuery.data ?? [];

  // métricas calculadas SEM criar hooks condicionais
  const metrics = useMemo(() => {
    const resolvePeriod = () => {
      if (filters.period) return filters.period;
      if (filters.month) return 'month';
      if (filters.year) return 'year';
      return 'all';
    };

    const period = resolvePeriod();
    const periodNow = new Date();
    const targetYear = filters.year ?? periodNow.getFullYear();
    const targetMonthIndex = (filters.month ?? periodNow.getMonth() + 1) - 1;

    let rangeStart: Date | null = null;
    let rangeEnd: Date | null = null;

    if (period === 'today') {
      rangeStart = new Date(periodNow.getFullYear(), periodNow.getMonth(), periodNow.getDate(), 0, 0, 0, 0);
      rangeEnd = new Date(periodNow.getFullYear(), periodNow.getMonth(), periodNow.getDate(), 23, 59, 59, 999);
    } else if (period === 'week') {
      const weekday = periodNow.getDay();
      const diff = weekday === 0 ? -6 : 1 - weekday;
      rangeStart = new Date(periodNow);
      rangeStart.setDate(periodNow.getDate() + diff);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeStart.getDate() + 6);
      rangeEnd.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      rangeStart = new Date(targetYear, targetMonthIndex, 1, 0, 0, 0, 0);
      rangeEnd = new Date(targetYear, targetMonthIndex + 1, 0, 23, 59, 59, 999);
    } else if (period === 'year') {
      rangeStart = new Date(targetYear, 0, 1, 0, 0, 0, 0);
      rangeEnd = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    }

    const matchesFilterDate = (dateValue: string | null | undefined) => {
      if (period === 'all') return true;
      const date = new Date(dateValue || '');
      if (!Number.isFinite(date.getTime())) return false;
      if (!rangeStart || !rangeEnd) return true;
      return date >= rangeStart && date <= rangeEnd;
    };

    const proposalsCreatedScope = proposals.filter((p) => matchesFilterDate(p.createdAt));
    const proposalScopeIds = new Set(proposalsCreatedScope.map((p) => p.id));
    const servicesScope = services.filter((s) => proposalScopeIds.has(s.proposalId));
    const financialScope = financial.filter((f) => matchesFilterDate(f.launchDate));

    // Receita e lucro preferencialmente vindos do financeiro (apenas pagos para evitar superestimar)
    const statusNormalized = (s: string | null | undefined) => (s || '').toLowerCase();
    const paidFinancial = financialScope.filter((f) => statusNormalized(f.status) === 'paid');
    const forecastFinancial = financialScope.filter((f) => ['paid', 'scheduled', 'pending'].includes(statusNormalized(f.status)));
    const paidFinancialAll = financial.filter((f) => statusNormalized(f.status) === 'paid');

    const financialRevenuePaid = paidFinancial.reduce((sum, f) => sum + toNumber(f.totalValue), 0);
    const financialProfitPaid = paidFinancial.reduce((sum, f) => sum + toNumber(f.profitValue), 0);
    const financialRevenueForecast = forecastFinancial.reduce((sum, f) => sum + toNumber(f.totalValue), 0);
    const financialProfitForecast = forecastFinancial.reduce((sum, f) => sum + toNumber(f.profitValue), 0);

    // closed proposals
    const closedProposals = proposals.filter((p) => p.stage?.isClosed === true && matchesFilterDate(p.updatedAt));
    const closedProposalIds = new Set(closedProposals.map((p) => p.id));
    const lostProposals = proposals.filter((p) => p.stage?.isLost === true && matchesFilterDate(p.updatedAt));
    const lostProposalIds = new Set(lostProposals.map((p) => p.id));
    const openProposals = proposalsCreatedScope.filter((p) => !p.stage?.isClosed && !p.stage?.isLost);
    const openProposalIds = new Set(openProposals.map((p) => p.id));

    const closedServices = services.filter((s) => closedProposalIds.has(s.proposalId));
    const openServices = servicesScope.filter((s) => openProposalIds.has(s.proposalId));
    const lostServices = services.filter((s) => lostProposalIds.has(s.proposalId));

    const allClosedProposals = proposals.filter((p) => p.stage?.isClosed === true);
    const allClosedProposalIds = new Set(allClosedProposals.map((p) => p.id));
    const closedServicesAll = services.filter((s) => allClosedProposalIds.has(s.proposalId));

    // Usar apenas serviços fechados como base dos KPIs (mantendo alinhado com propostas)
    const servicesRevenue = closedServices.reduce((sum, s) => sum + toNumber(s.value), 0);
    const servicesCommission = closedServices.reduce((sum, s) => {
      const v = toNumber(s.value);
      return sum + calcCommission(v, s.commissionType, s.commissionValue);
    }, 0);
    // Principais KPIs: usar valores pagos (realizados). Previsão fica em campos auxiliares.
    const totalRevenue = financialRevenuePaid || servicesRevenue;
    const totalCommission = financialProfitPaid || servicesCommission;

    const totalProposals = proposalsCreatedScope.length;
    const closedCount = closedProposals.length;
    const lostCount = lostProposals.length;
    const closedCreatedInScope = proposalsCreatedScope.filter(
      (p) => p.stage?.isClosed === true && matchesFilterDate(p.updatedAt)
    ).length;
    const conversionRate = totalProposals > 0 ? Math.round((closedCreatedInScope / totalProposals) * 100) : 0;
    const openValue = openServices.reduce((sum, s) => sum + (s.value || 0), 0);
    const lostValue = lostServices.reduce((sum, s) => sum + (s.value || 0), 0);
    const servicesTotalValue = servicesScope.reduce((sum, s) => sum + (s.value || 0), 0);
    const servicesTotalCount = servicesScope.length;

    // Propostas por estágio (count e value = volume de serviços)
    const useScopedPipeline = proposalsCreatedScope.length > 0;
    const pipelineProposals = useScopedPipeline ? proposalsCreatedScope : proposals;
    const pipelineServices = useScopedPipeline ? servicesScope : services;
    const byStage: Record<string, { count: number; value: number }> = {};
    for (const p of pipelineProposals) {
      const stageName = p.stage?.name || 'Sem etapa';
      const sumValue = pipelineServices
        .filter((s) => s.proposalId === p.id)
        .reduce((acc, s) => acc + toNumber(s.value), 0);
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
        .reduce((acc, s) => acc + toNumber(s.value), 0);
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
      partnerRevenue[name] = (partnerRevenue[name] || 0) + toNumber(s.value);
    }

    const topPartners = Object.entries(partnerRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Receita por mês (últimos 6 meses) - financeiro se existir, senão serviços fechados
    const revenueByMonth: Array<{ month: string; revenue: number; profit: number }> = [];
    const proposalsByMonth: Array<{ month: string; proposals: number }> = [];
    const conversionByMonth: Array<{ month: string; conversion: number }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });

      const monthFinancial = paidFinancialAll.filter((f) => {
        const d = new Date(f.launchDate || '');
        return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
      });
      const closedInMonth = allClosedProposals.filter((p) => {
        const d = new Date(p.updatedAt || '');
        return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
      });
      const closedMonthIds = new Set(closedInMonth.map((p) => p.id));
      const closedServicesMonth = closedServicesAll.filter((s) => closedMonthIds.has(s.proposalId));

      const revenue =
        monthFinancial.length > 0
          ? monthFinancial.reduce((sum, f) => sum + toNumber(f.totalValue), 0)
          : closedServicesMonth.reduce((sum, s) => sum + toNumber(s.value), 0);

      const profit =
        monthFinancial.length > 0
          ? monthFinancial.reduce((sum, f) => sum + toNumber(f.profitValue), 0)
          : closedServicesMonth.reduce((sum, s) => sum + calcCommission(toNumber(s.value), s.commissionType, s.commissionValue), 0);

      revenueByMonth.push({ month: monthName, revenue, profit });

      const proposalsInMonth = proposals.filter((p) => {
        const created = new Date(p.createdAt || '');
        return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
      });
      const closedCreatedInMonth = proposalsInMonth.filter((p) => {
        if (!p.stage?.isClosed) return false;
        const updated = new Date(p.updatedAt || '');
        return updated.getMonth() === date.getMonth() && updated.getFullYear() === date.getFullYear();
      });
      const monthTotal = proposalsInMonth.length;
      const monthConversion = monthTotal > 0 ? Math.round((closedCreatedInMonth.length / monthTotal) * 100) : 0;
      proposalsByMonth.push({ month: monthName, proposals: monthTotal });
      conversionByMonth.push({ month: monthName, conversion: monthConversion });
    }

    const nowMonthCheck = new Date();
    const createdThisMonth = proposalsCreatedScope.filter((p) => {
      const d = new Date(p.createdAt || '');
      return d.getMonth() === nowMonthCheck.getMonth() && d.getFullYear() === nowMonthCheck.getFullYear();
    }).length;

    // Resumo por vendedor (quem criou a proposta)
    const proposalValueMap = new Map<string, { revenue: number; profit: number }>();
    for (const p of closedProposals) {
      const servicesOfProposal = closedServices.filter((s) => s.proposalId === p.id);
      const revenue = servicesOfProposal.reduce((sum, s) => sum + toNumber(s.value), 0);
      const profit = servicesOfProposal.reduce((sum, s) => sum + calcCommission(toNumber(s.value), s.commissionType, s.commissionValue), 0);
      proposalValueMap.set(p.id, { revenue, profit });
    }

    const sellersMap = new Map<
      string,
      {
        id: string | null;
        name: string;
        email: string | null;
        proposals: number;
        closed: number;
        revenue: number;
        profit: number;
      }
    >();

    const ensureSeller = (id: string | null, name: string, email: string | null) => {
      const key = id || 'sem-vendedor';
      if (!sellersMap.has(key)) {
        sellersMap.set(key, { id, name, email, proposals: 0, closed: 0, revenue: 0, profit: 0 });
      }
      return sellersMap.get(key)!;
    };

    for (const p of proposalsCreatedScope) {
      const fallbackId = profile?.id ?? (profile as any)?.user_id ?? null;
      const fallbackName = profile?.name || (profile as any)?.full_name || profile?.email || 'Você';
      const fallbackEmail = profile?.email || null;

      const sellerId = p.createdBy?.id ?? fallbackId;
      const sellerName = p.createdBy?.name || p.createdBy?.email || fallbackName;
      const sellerEmail = p.createdBy?.email ?? fallbackEmail;

      const seller = ensureSeller(sellerId, sellerName, sellerEmail);
      seller.proposals += 1;
      if (p.stage?.isClosed) {
        seller.closed += 1;
        const val = proposalValueMap.get(p.id);
        seller.revenue += val?.revenue ?? 0;
        seller.profit += val?.profit ?? 0;
      }
    }

    const sellerSummary = Array.from(sellersMap.values()).map((s) => {
      const conversion = s.proposals > 0 ? Math.round((s.closed / s.proposals) * 100) : 0;
      return { ...s, conversion };
    });

    sellerSummary.sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      totalProfit: totalCommission,
      totalRevenueForecast: financialRevenueForecast || servicesRevenue,
      totalProfitForecast: financialProfitForecast || servicesCommission,
      totalProposals,
      conversionRate,
      openProposalsCount: openProposals.length,
      closedProposalsCount: closedCount,
      lostProposalsCount: lostCount,
      openValue,
      closedValue: totalRevenue,
      lostValue,
      servicesTotalValue,
      servicesTotalCount,
      newProposalsThisMonth: createdThisMonth,
      proposalsByStage,
      topClients,
      topPartners,
      revenueByMonth,
      proposalsByMonth,
      conversionByMonth,
      sellerSummary,
    };
  }, [proposals, services, financial, filters.year, filters.month, filters.period]);

  // estados
  const isInitialLoading =
    proposalsQuery.isLoading || servicesQuery.isLoading || financialQuery.isLoading;

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
