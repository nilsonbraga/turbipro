import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  DollarSign,
  FileText,
  Target,
  Users,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from 'recharts';
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
const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);
const formatPercent = (value: number) => `${Math.round(value)}%`;

const STAGE_COLORS: Record<string, string> = {
  Novo: 'hsl(var(--chart-1))',
  Contato: 'hsl(var(--chart-2))',
  Proposta: 'hsl(var(--chart-3))',
  Negociação: 'hsl(var(--chart-4))',
  Fechado: 'hsl(var(--chart-5))',
  Perdido: 'hsl(var(--muted))',
};

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
          <Card key={i} className="border-0 shadow-none">
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6">
        <Card className="border-0 shadow-none">
          <CardContent className="p-6">
            <Skeleton className="h-[320px] w-full" />
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none">
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
  const { isSuperAdmin, profile, user } = useAuth() as any;
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const now = useMemo(() => new Date(), []);
  const filters = useMemo<DashboardFilters>(
    () => ({ year: now.getFullYear(), month: now.getMonth() + 1 }),
    [now]
  );

  const { metrics, isLoading, isFetching } = useDashboard(filters);
  const { stages: pipelineStages } = usePipelineStages();
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
    proposalsByMonth: [],
    conversionByMonth: [],
  };

  const isDark = theme === 'dark';
  const textMuted = isDark ? 'text-[hsl(var(--primary-end)/0.75)]' : 'text-slate-500';
  const textStrong = isDark ? 'text-white' : 'text-slate-900';

  const myPerformance = useMemo(() => {
    const meEmail = profile?.email ?? null;
    const perf = collaboratorPerformance.find(
      (c) => c.collaborator.user_id === myUserId || (meEmail && c.collaborator.email === meEmail),
    );

    if (!perf) return null;
    const leadsCount = myProposals.filter((p: any) => p.userId === myUserId).length;

    return { ...perf, leadsCount } as any;
  }, [collaboratorPerformance, myProposals, myUserId, profile?.email]);

  const currentMonthLabel = useMemo(() => {
    const label = new Date(effectiveYear, effectiveMonth - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [effectiveMonth, effectiveYear]);

  // Aplica tema vindo do perfil quando houver
  useEffect(() => {
    const preferred = (profile?.theme_preference as 'dark' | 'light' | undefined) ?? 'dark';
    setTheme(preferred);
  }, [profile?.theme_preference]);

  // Full skeleton só quando realmente não tem dado útil ainda
  const showFullSkeleton = isLoading || !metrics;

  // Refresh overlay quando já tem tela e está refetching
  const showRefreshing = isFetching && !showFullSkeleton;
  const LIGHT_PIPELINE_COLORS = ['#f5af19', '#f7b23b', '#f9c24d', '#f48a17', '#f45d17', '#f12711'];
  const revenueData = displayMetrics?.revenueByMonth || [];
  const revenueSpark = revenueData.map((item) => ({ month: item.month, value: item.revenue }));
  const profitSpark = revenueData.map((item) => ({ month: item.month, value: item.profit }));
  const proposalsSpark = (displayMetrics.proposalsByMonth || []).map((item: any) => ({ month: item.month, value: item.proposals }));
  const conversionSpark = (displayMetrics.conversionByMonth || []).map((item: any) => ({ month: item.month, value: item.conversion }));
  const closedCount = metrics?.closedProposalsCount ?? 0;
  const ticketMedio = closedCount > 0 ? (metrics?.totalRevenue || 0) / closedCount : 0;
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

  const miniChartConfig = (color: string): ChartConfig => ({
    value: { label: 'Valor', color },
  });

  const MiniChartTooltip = ({
    active,
    payload,
    label,
    formatValue,
  }: {
    active?: boolean;
    payload?: Array<{ value?: number }>;
    label?: string;
    formatValue: (value: number) => string;
  }) => {
    if (!active || !payload?.length) return null;
    const value = Number(payload[0]?.value ?? 0);
    return (
      <div className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-sm">
        <div className="text-slate-500">{label}</div>
        <div className="font-mono font-medium text-slate-900">{formatValue(value)}</div>
      </div>
    );
  };

  const MiniBarChart = ({
    data,
    color,
    formatValue,
  }: {
    data: Array<{ month: string; value: number }>;
    color: string;
    formatValue: (value: number) => string;
  }) => (
    <ChartContainer config={miniChartConfig(color)} className="h-16 w-full aspect-auto">
      <BarChart accessibilityLayer data={data}>
        <XAxis dataKey="month" hide />
        <ChartTooltip cursor={false} content={<MiniChartTooltip formatValue={formatValue} />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={6} barSize={10} />
      </BarChart>
    </ChartContainer>
  );

  return (
    <div
      className="min-h-screen overflow-x-hidden transition-colors duration-500 bg-transparent text-slate-900 font-sans"
    >
      <div className="w-full px-0 py-0 space-y-6 transition-all duration-500 relative">
        <RefreshOverlay show={showRefreshing} isDark={isDark} />

        {showFullSkeleton ? (
          <FullPageSkeleton />
        ) : (
          <>
            {/* Hero + Performance side by side */}
            <div className="grid gap-3 lg:grid-cols-[7fr,3fr] items-stretch">
              <div className="relative overflow-hidden rounded-3xl p-6 transition-colors duration-500 w-full text-white h-[470px] flex flex-col justify-end">
                <img
                  src="/cardhero.jpg"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover scale-110"
                />
                <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-[rgba(60,30,12,0.65)] to-transparent" />
                <div className="relative flex flex-col gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white/80">Tourbine</p>
                    <h1 className="text-3xl font-bold text-white">Centralize e impulsione sua agência</h1>
                    <p className="max-w-3xl text-white/80">
                      Vendas, propostas, comissões, financeiro e operação girando juntos em um só lugar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex h-[470px] w-full">
                {perfLoading ? (
                  <Skeleton className="h-full w-full rounded-3xl" />
                ) : myPerformance ? (
                  <div className="h-full w-full [&>div]:h-full">
                    <PerformanceCard
                      performance={myPerformance}
                      formatCurrency={formatCurrency}
                      className="border-0 shadow-none"
                    />
                  </div>
                ) : (
                  <Card className="h-full w-full flex flex-col justify-center flex-1 border-0 shadow-none">
                    <CardContent className="space-y-2 text-center">
                      <p className="text-sm font-medium text-slate-900">Meta não definida</p>
                      <p className="text-xs text-muted-foreground">
                        Defina uma meta para visualizar sua performance aqui.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-white border-0 shadow-none">
              <div className="flex items-center justify-end">
                <p className="text-sm text-slate-500">
                  Resuldados do mês de <span className="font-medium text-slate-900">{currentMonthLabel}</span>
                </p>
              </div>
            </div>

            {/* KPIs principais - 6 cards em linha responsiva */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-4">
              {[
                {
                  label: 'Faturamento',
                  value: metrics?.totalRevenue ?? 0,
                  icon: DollarSign,
                  hint: 'Propostas fechadas',
                  fmt: (v: number) => formatCurrency(v),
                  spark: revenueSpark,
                  sparkFormat: formatCurrency,
                },
                {
                  label: 'Lucro estimado',
                  value: metrics?.totalProfit ?? 0,
                  icon: TrendingUp,
                  hint: 'Comissões previstas',
                  fmt: (v: number) => formatCurrency(v),
                  spark: profitSpark,
                  sparkFormat: formatCurrency,
                },
                {
                  label: 'Propostas',
                  value: metrics?.totalProposals ?? 0,
                  icon: FileText,
                  hint: 'Emitidas no período',
                  fmt: (v: number) => formatNumber(v),
                  spark: proposalsSpark,
                  sparkFormat: formatNumber,
                },
                {
                  label: 'Ticket médio',
                  value: ticketMedio,
                  icon: DollarSign,
                  hint: 'Por proposta emitida',
                  fmt: (v: number) => formatCurrency(v),
                  spark: revenueSpark,
                  sparkFormat: formatCurrency,
                },
              ].map((card) => (
                <Card key={card.label} className="backdrop-blur-lg border-0 shadow-none">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
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
                    </div>
                    <div className="mt-3">
                      <MiniBarChart data={card.spark} color="hsl(var(--primary-start))" formatValue={card.sparkFormat} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-[3fr,2fr] gap-6 overflow-hidden">
              <Card className="backdrop-blur-lg border-0 shadow-none min-w-0">
                <CardHeader>
                  <CardTitle className={`text-lg ${textStrong}`}>Faturamento x Lucro</CardTitle>
                </CardHeader>
                <CardContent className="overflow-hidden">
                  {revenueData.length ? (
                    <ChartContainer
                      config={
                        {
                          revenue: { label: 'Faturamento', color: isDark ? '#f48a17' : '#f06a12' },
                          profit: { label: 'Lucro', color: '#f06a12bd' },
                        } satisfies ChartConfig
                      }
                      className="h-[320px] w-full"
                    >
                      <BarChart accessibilityLayer data={revenueData}>
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          tick={{ fill: isDark ? '#e5e7eb' : '#0f172a' }}
                        />
                        <Bar
                          dataKey="revenue"
                          stackId="a"
                          fill="var(--color-revenue)"
                          radius={[0, 0, 4, 4]}
                          isAnimationActive={!showRefreshing}
                        />
                        <Bar
                          dataKey="profit"
                          stackId="a"
                          fill="var(--color-profit)"
                          radius={[4, 4, 0, 0]}
                          isAnimationActive={!showRefreshing}
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent hideIndicator formatter={(v) => formatCurrency(Number(v))} />}
                          cursor={false}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className={`h-[320px] flex items-center justify-center ${textMuted}`}>Sem dados para exibir</div>
                  )}
                </CardContent>
              </Card>

              <Card className="backdrop-blur-lg border-0 shadow-none min-w-0">
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
              <Card className="backdrop-blur-lg border-0 shadow-none">
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

              <Card className="backdrop-blur-lg border-0 shadow-none">
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
