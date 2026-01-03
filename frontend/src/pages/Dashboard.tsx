import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  DollarSign,
  FileText,
  Target,
  Users,
  Filter,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useDashboard, DashboardFilters } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { apiFetch } from '@/lib/api';
import { useTeamPerformance } from '@/hooks/useTeamPerformance';
import { PerformanceCard } from '@/components/team/PerformanceCard';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const STAGE_COLORS: Record<string, string> = {
  Novo: 'hsl(var(--chart-1))',
  Contato: 'hsl(var(--chart-2))',
  Proposta: 'hsl(var(--chart-3))',
  Negociação: 'hsl(var(--chart-4))',
  Fechado: 'hsl(var(--chart-5))',
  Perdido: 'hsl(var(--muted))',
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const ORANGE_PALETTE = ['#f9c24d', '#f7b23b', '#f5af19', '#f48a17', '#f45d17', '#f12711'];

function FullPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[320px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[320px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RefreshOverlay({ show, isDark }: { show: boolean; isDark: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-30 rounded-2xl bg-black/10 backdrop-blur-[2px] flex items-start justify-end p-4 pointer-events-none">
      <div
        className={`rounded-full px-3 py-2 text-sm flex items-center gap-2 border ${
          isDark ? 'bg-white/10 text-white border-white/10' : 'bg-white/80 text-slate-900 border-slate-200'
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-[hsl(var(--primary-end))] animate-pulse" />
        Atualizando dados...
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isSuperAdmin, profile, role, user } = useAuth() as any;
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const { agencies, clients, metrics, isLoading, isFetching } = useDashboard(filters);
  const { stages: pipelineStages } = usePipelineStages();
  const now = useMemo(() => new Date(), []);
  const effectiveMonth = filters.month ?? now.getMonth() + 1;
  const effectiveYear = filters.year ?? now.getFullYear();
  const myUserId = user?.id ?? profile?.id ?? (profile as any)?.user_id ?? null;
  const { collaboratorPerformance, isLoading: perfLoading } = useTeamPerformance({
    month: effectiveMonth,
    year: effectiveYear,
    agencyIdFilter: filters.agencyId,
  });
  const { data: myProposals = [] } = useQuery({
    queryKey: ['dashboard-my-proposals', filters, myUserId],
    queryFn: async () => {
      if (!myUserId) return [];

      const where: Record<string, unknown> = {};
      if (!isSuperAdmin && profile?.agency_id) where.agencyId = profile.agency_id;
      else if (filters.agencyId) where.agencyId = filters.agencyId;
      if (filters.clientId) where.clientId = filters.clientId;

      const startDate = new Date(effectiveYear, effectiveMonth - 1, 1);
      const endDate = new Date(effectiveYear, effectiveMonth, 0, 23, 59, 59);
      where.createdAt = { gte: startDate.toISOString(), lte: endDate.toISOString() };

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        include: JSON.stringify({ stage: { select: { isClosed: true } } }),
      });
      const { data } = await apiFetch<{ data: any[] }>(`/api/proposal?${params.toString()}`);
      return data || [];
    },
    enabled: !!myUserId,
  });
  const displayMetrics = metrics ?? {
    revenueByMonth: [],
    proposalsByStage: [],
    totalProposals: 0,
    totalRevenue: 0,
    totalProfit: 0,
    conversionRate: 0,
    topClients: [],
    topPartners: [],
  };

  const isDark = theme === 'dark';
  const surfaceCard = isDark ? 'bg-white/5 border-[hsl(var(--primary-start)/0.25)]' : 'bg-white border-slate-200';
  const subtleCard = isDark ? 'bg-black/20 border-[hsl(var(--primary-start)/0.2)]' : 'bg-[hsl(var(--primary-start)/0.08)] border-[hsl(var(--primary-start)/0.2)]';
  const textMuted = isDark ? 'text-[hsl(var(--primary-end)/0.75)]' : 'text-slate-500';
  const textStrong = isDark ? 'text-white' : 'text-slate-900';
  const softShadow = isDark ? 'shadow-xl shadow-[hsl(var(--primary-start)/0.25)]' : 'shadow-none';

  const myPerformance = useMemo(() => {
    const meEmail = profile?.email ?? null;
    const perf = collaboratorPerformance.find(
      (c) => c.collaborator.user_id === myUserId || (meEmail && c.collaborator.email === meEmail),
    );

    if (!perf) return null;
    const leadsCount = myProposals.filter((p: any) => p.userId === myUserId).length;

    return { ...perf, leadsCount } as any;
  }, [collaboratorPerformance, myProposals, myUserId, profile?.email]);

  const updateFilter = (key: keyof DashboardFilters, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Aplica tema vindo do perfil quando houver
  useEffect(() => {
    const preferred = (profile?.theme_preference as 'dark' | 'light' | undefined) ?? 'dark';
    setTheme(preferred);
  }, [profile?.theme_preference]);

  const persistTheme = async (nextTheme: 'dark' | 'light') => {
    setTheme(nextTheme);
    if (!profile?.id) return;
    try {
      await apiFetch(`/api/profile/${profile.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          themePreference: nextTheme,
          updatedAt: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('Erro ao atualizar tema do perfil', err);
    }
  };

  // Full skeleton só quando realmente não tem dado útil ainda
  const showFullSkeleton = isLoading || !metrics;

  // Refresh overlay quando já tem tela e está refetching
  const showRefreshing = isFetching && !showFullSkeleton;
  const LIGHT_PIPELINE_COLORS = ['#f5af19', '#f7b23b', '#f9c24d', '#f48a17', '#f45d17', '#f12711'];
  const revenueData = displayMetrics?.revenueByMonth || [];
  const closedCount = metrics?.closedProposalsCount ?? 0;
  const ticketMedio = closedCount > 0 ? (metrics?.totalRevenue || 0) / closedCount : 0;
  const agenciasAtivas = (agencies ?? []).length;
  const pipelineValor = displayMetrics.openValue ?? 0;
  const currentMonth = revenueData[revenueData.length - 1];
  const colorForStage = (stage: string, index: number) => {
    if (isDark) return STAGE_COLORS[stage] || ORANGE_PALETTE[index % ORANGE_PALETTE.length];
    return LIGHT_PIPELINE_COLORS[index % LIGHT_PIPELINE_COLORS.length];
  };
  const pipelineData = useMemo(() => {
    if (!metrics) return [];
    const counts = new Map<string, number>();
    (displayMetrics?.proposalsByStage || []).forEach((p) => counts.set(p.stage, p.count));
    if (pipelineStages.length > 0) {
      return pipelineStages.map((s, idx) => ({
        stage: s.name,
        count: counts.get(s.name) ?? 0,
        color: s.color || colorForStage(s.name, idx),
      }));
    }
    // fallback to known default stages if no pipelineStages hook returned
    const fallbackStages = ['Novo', 'Contato', 'Proposta', 'Negociação', 'Fechado', 'Perdido'];
    return fallbackStages.map((stage, idx) => ({
      stage,
      count: counts.get(stage) ?? 0,
      color: colorForStage(stage, idx),
    }));
  }, [metrics, displayMetrics?.proposalsByStage, pipelineStages]);

  const pipelineCountMap = useMemo(() => {
    const map = new Map<string, number>();
    pipelineData.forEach((p) => map.set(p.stage, p.count));
    return map;
  }, [pipelineData]);

  const pipelineStageLabel = (props: any) => {
    const { x = 0, y = 0, width = 0, height = 0, payload, value } = props || {};
    if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') return null;
    const stage = typeof value === 'string' ? value : String(payload?.stage ?? '');
    const count = pipelineCountMap.get(stage) ?? 0;
    const stageColor = pipelineData.find((p) => p.stage === stage)?.color || colorForStage(stage, 0);
    const hasBar = count > 0;
    const color = hasBar ? '#ffffff' : stageColor;
    const centerY = y + height / 2;
    return (
      <text x={x + 8} y={centerY} dy={0} fill={color} fontSize={12} fontWeight={700} dominantBaseline="central" textAnchor="start">
        {stage}
      </text>
    );
  };

  const pipelineCountLabel = (props: any) => {
    const { x, y, width, height, value } = props || {};
    if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') return null;
    if (typeof value !== 'number' || value === 0) return null;
    const centerY = y + height / 2;
    return (
      <text x={x + width - 8} y={centerY} dy={0} fill="#ffffff" fontSize={12} textAnchor="end" dominantBaseline="central">
        {value}
      </text>
    );
  };

  const pipelineLabelRenderer = (props: any) => {
    const { x, y, width, value, payload } = props || {};
    if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number') return null;
    const stage = String(payload?.stage ?? '');
    const count = typeof value === 'number' ? value : 0;
    const stageColor = pipelineData.find((p) => p.stage === stage)?.color || colorForStage(stage, 0);
    const stageFill = count === 0 ? stageColor : '#ffffff';
    const textY = y + 4;
    return (
      <g>
        <text x={x + 8} y={textY} dy={0} fill={stageFill} fontSize={12}>
          {stage}
        </text>
        {count > 0 && (
          <text x={x + width - 8} y={textY} dy={0} fill="#ffffff" fontSize={12} textAnchor="end">
            {count}
          </text>
        )}
      </g>
    );
  };

  return (
    <div
      className={`min-h-screen overflow-x-hidden transition-colors duration-500 ${
        isDark
          ? 'bg-gradient-to-b from-[#140a08] via-[#130c09] to-[#140a08] text-slate-50'
          : 'bg-gradient-to-b from-[#fff3ea] via-white to-[#fff7e6] text-slate-900'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 transition-all duration-500 relative">
        <RefreshOverlay show={showRefreshing} isDark={isDark} />

        {showFullSkeleton ? (
          <FullPageSkeleton />
        ) : (
          <>
            {/* Hero + Performance side by side */}
            <div className="grid gap-3 lg:grid-cols-[7fr,3fr] items-stretch">
              <div
                className={`relative overflow-hidden rounded-2xl border p-6 transition-colors duration-500 w-full ${softShadow} ${
                  isDark
                    ? 'border-[hsl(var(--primary-start)/0.35)] bg-gradient-to-r from-[#f12711] via-[#f48a17] to-[#f5af19]'
                    : 'border-[hsl(var(--primary-start)/0.2)] bg-gradient-to-r from-[#ffe1d5] via-[#ffd8b7] to-[#ffe6bf] text-slate-900'
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.1),transparent_30%)]" />
                <div className="relative flex flex-col gap-4">
                  <div className="space-y-2">
                    <p className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-slate-900/80'}`}>Painel Inteligente</p>
                    <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Performance em tempo real</h1>
                    <p className={`${isDark ? 'text-white/80' : 'text-slate-800/80'} max-w-3xl`}>
                      Acompanhe faturamento, margens e conversões de todas as agências em um só lugar.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <div className={`rounded-full px-3 py-1 text-sm font-medium flex items-center gap-2 ${isDark ? 'bg-white/20 text-white' : 'bg-white/80 text-slate-900'}`}>
                        <ShieldCheck size={16} />
                        Operações ativas
                      </div>
                      <div className={`rounded-full px-3 py-1 text-sm font-medium flex items-center gap-2 ${isDark ? 'bg-black/30 text-white' : 'bg-[#ffd8b7] text-slate-900'}`}>
                        <Compass size={16} />
                        Visão multiagência
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex h-full w-full">
                {perfLoading ? (
                  <Skeleton className="h-[280px] w-full rounded-2xl" />
                ) : myPerformance ? (
                  <div className="h-full w-full">
                    <PerformanceCard performance={myPerformance} formatCurrency={formatCurrency} />
                  </div>
                ) : (
                  <Card className="h-full w-full flex items-center justify-center flex-1">
                    <CardContent className="text-sm text-muted-foreground">
                      Nenhum dado de performance para você neste período.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className={`rounded-2xl p-4 backdrop-blur-md shadow-lg border ${surfaceCard}`}>
              <div className="flex flex-wrap items-center gap-3">
                <div className={`flex items-center gap-2 rounded-full px-3 py-2 ${isDark ? 'bg-black/30 text-[hsl(var(--primary-end))]' : 'bg-[#fff1e2] text-slate-900'}`}>
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filtros</span>
                </div>

                {isSuperAdmin && (
                  <Select value={filters.agencyId || 'all'} onValueChange={(v) => updateFilter('agencyId', v === 'all' ? undefined : v)}>
                    <SelectTrigger className={`w-[200px] border-[hsl(var(--primary-start)/0.25)] ${isDark ? 'bg-black/40 text-white' : 'bg-white text-slate-900'}`}>
                      <SelectValue placeholder="Todas agências" />
                    </SelectTrigger>
                    <SelectContent className={`border-[hsl(var(--primary-start)/0.25)] ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                      <SelectItem value="all">Todas agências</SelectItem>
                      {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={filters.clientId || 'all'} onValueChange={(v) => updateFilter('clientId', v === 'all' ? undefined : v)}>
                  <SelectTrigger className={`w-[200px] border-[hsl(var(--primary-start)/0.25)] ${isDark ? 'bg-black/40 text-white' : 'bg-white text-slate-900'}`}>
                    <SelectValue placeholder="Todos clientes" />
                  </SelectTrigger>
                  <SelectContent className={`border-[hsl(var(--primary-start)/0.25)] ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                    <SelectItem value="all">Todos clientes</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.year?.toString() || 'all'} onValueChange={(v) => updateFilter('year', v === 'all' ? undefined : parseInt(v, 10))}>
                  <SelectTrigger className={`w-[140px] border-[hsl(var(--primary-start)/0.25)] ${isDark ? 'bg-black/40 text-white' : 'bg-white text-slate-900'}`}>
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent className={`border-[hsl(var(--primary-start)/0.25)] ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                    <SelectItem value="all">Todos anos</SelectItem>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.month?.toString() || 'all'} onValueChange={(v) => updateFilter('month', v === 'all' ? undefined : parseInt(v, 10))}>
                  <SelectTrigger className={`w-[160px] border-[hsl(var(--primary-start)/0.25)] ${isDark ? 'bg-black/40 text-white' : 'bg-white text-slate-900'}`}>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent className={`border-[hsl(var(--primary-start)/0.25)] ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                    <SelectItem value="all">Todos meses</SelectItem>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* KPIs principais - 6 cards em linha responsiva */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
              {[
                { label: 'Faturamento', value: metrics?.totalRevenue ?? 0, icon: DollarSign, hint: 'Propostas fechadas', fmt: (v: number) => formatCurrency(v) },
                { label: 'Lucro estimado', value: metrics?.totalProfit ?? 0, icon: TrendingUp, hint: 'Comissões previstas', fmt: (v: number) => formatCurrency(v) },
                { label: 'Propostas', value: metrics?.totalProposals ?? 0, icon: FileText, hint: 'Emitidas no período', fmt: (v: number) => v },
                { label: 'Conversão', value: metrics?.conversionRate ?? 0, icon: Target, hint: 'Fechadas / total', fmt: (v: number) => `${v}%` },
                { label: 'Ticket médio', value: ticketMedio, icon: DollarSign, hint: 'Por proposta emitida', fmt: (v: number) => formatCurrency(v) },
                { label: 'Clientes ativos', value: clients.length, icon: Users, hint: 'Base cadastrada', fmt: (v: number) => v },
              ].map((card) => (
                <Card key={card.label} className={`backdrop-blur-lg border ${surfaceCard}`}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${textMuted}`}>{card.label}</p>
                      <div className={`text-2xl font-semibold ${textStrong}`}>
                        {showRefreshing ? <Skeleton className="h-7 w-24 rounded bg-white/20" /> : card.fmt(card.value)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{card.hint}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-[hsl(var(--primary-start)/0.2)] text-[hsl(var(--primary-end))]' : 'bg-[#ffe1d5] text-[#c2410c]'}`}>
                      <card.icon className="w-6 h-6" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-[3fr,2fr] gap-6 overflow-hidden">
              <Card className={`backdrop-blur-lg border ${surfaceCard} min-w-0`}>
                <CardHeader>
                  <CardTitle className={`text-lg ${textStrong}`}>Faturamento x Lucro</CardTitle>
                </CardHeader>
                <CardContent className="overflow-hidden">
                  {revenueData.length ? (
                    <ChartContainer
                      config={
                        {
                          revenue: { label: 'Faturamento', color: isDark ? '#f5af19' : '#f48a17' },
                          profit: { label: 'Lucro', color: isDark ? '#f12711' : '#f5af19' },
                        } satisfies ChartConfig
                      }
                      className="h-[320px] w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart accessibilityLayer data={revenueData}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'} />
                          <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tick={{ fill: isDark ? '#e5e7eb' : '#0f172a' }}
                          />
                          <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} isAnimationActive={!showRefreshing} />
                          <Bar dataKey="profit" fill="var(--color-profit)" radius={[0, 0, 4, 4]} isAnimationActive={!showRefreshing} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className={`h-[320px] flex items-center justify-center ${textMuted}`}>Sem dados para exibir</div>
                  )}
                </CardContent>
              </Card>

              <Card className={`backdrop-blur-lg border ${surfaceCard} min-w-0`}>
                <CardHeader>
                  <CardTitle className={`text-lg ${textStrong}`}>Pipeline por estágio</CardTitle>
                </CardHeader>
                <CardContent className="overflow-hidden">
                  {pipelineData.length ? (
                    <ChartContainer
                      config={
                        {
                          count: { label: 'Propostas', color: isDark ? '#f5af19' : '#f48a17' },
                          label: { color: 'var(--background)' },
                        } satisfies ChartConfig
                      }
                      className="h-[320px] w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          accessibilityLayer
                          data={pipelineData}
                          layout="vertical"
                          margin={{ right: 12, left: 8 }}
                        >
                          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'} />
                          <YAxis dataKey="stage" type="category" hide />
                          <XAxis dataKey="count" type="number" hide />
                          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                          <Bar
                            dataKey="count"
                            layout="vertical"
                            radius={4}
                            barSize={26}
                            minPointSize={2}
                            isAnimationActive={!showRefreshing}
                          >
                            <LabelList dataKey="stage" content={pipelineStageLabel} />
                            <LabelList dataKey="count" content={pipelineCountLabel} />
                            {pipelineData.map((entry, idx) => (
                              <Cell key={entry.stage} fill={entry.color || colorForStage(entry.stage, idx)} fillOpacity={entry.count === 0 ? 0.15 : 1} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className={`h-[320px] flex items-center justify-center ${textMuted}`}>Sem dados para exibir</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Listas principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={`backdrop-blur-lg border ${surfaceCard}`}>
                <CardHeader>
                  <CardTitle className={`text-lg flex items-center gap-2 ${textStrong}`}>
                    <Users className={`${isDark ? 'text-[hsl(var(--primary-end))]' : 'text-[#c2410c]'} w-5 h-5`} />
                    Top Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics?.topClients?.length ? (
                      metrics.topClients.map((client, index) => (
                        <div
                          key={client.name}
                          className={`flex items-center justify-between rounded-xl px-4 py-3 border ${isDark ? 'border-[hsl(var(--primary-start)/0.15)] bg-black/20' : 'border-[hsl(var(--primary-start)/0.2)] bg-white'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${isDark ? 'bg-[hsl(var(--primary-start)/0.2)] text-[hsl(var(--primary-end))]' : 'bg-[#ffe1d5] text-[#9a3412]'}`}>
                              {index + 1}
                            </span>
                            <div>
                              <p className={`font-medium ${textStrong}`}>{client.name}</p>
                              <p className={`text-xs ${textMuted}`}>Faturamento direto</p>
                            </div>
                          </div>
                          <div className={`font-medium ${textStrong}`}>{showRefreshing ? <Skeleton className="h-4 w-20 rounded bg-white/20" /> : formatCurrency(client.revenue)}</div>
                        </div>
                      ))
                    ) : (
                      <p className={`${textMuted} text-center py-6`}>Sem dados para exibir</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className={`backdrop-blur-lg border ${surfaceCard}`}>
                <CardHeader>
                  <CardTitle className={`text-lg flex items-center gap-2 ${textStrong}`}>
                    <Target className={`${isDark ? 'text-[hsl(var(--primary-end))]' : 'text-[#c2410c]'} w-5 h-5`} />
                    Top Fornecedores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics?.topPartners?.length ? (
                      metrics.topPartners.map((partner, index) => (
                        <div
                          key={partner.name}
                          className={`flex items-center justify-between rounded-xl px-4 py-3 border ${isDark ? 'border-[hsl(var(--primary-start)/0.15)] bg-black/20' : 'border-[hsl(var(--primary-start)/0.2)] bg-white'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${isDark ? 'bg-[hsl(var(--primary-start)/0.2)] text-[hsl(var(--primary-end))]' : 'bg-[#ffe1d5] text-[#9a3412]'}`}>
                              {index + 1}
                            </span>
                            <div>
                              <p className={`font-medium ${textStrong}`}>{partner.name}</p>
                              <p className={`text-xs ${textMuted}`}>Volume em serviços</p>
                            </div>
                          </div>
                          <div className={`font-medium ${textStrong}`}>{showRefreshing ? <Skeleton className="h-4 w-20 rounded bg-white/20" /> : formatCurrency(partner.revenue)}</div>
                        </div>
                      ))
                    ) : (
                      <p className={`${textMuted} text-center py-6`}>Sem dados para exibir</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
