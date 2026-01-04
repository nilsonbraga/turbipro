import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  DollarSign,
  FileText,
  Target,
  Users,
  ListTodo,
  Layers,
  BarChart3,
} from 'lucide-react';
import { BarChart, Bar, XAxis, RadialBarChart, RadialBar } from 'recharts';
import { endOfMonth, endOfWeek, isSameDay, isWithinInterval, startOfMonth, startOfWeek } from 'date-fns';
import { useDashboard, DashboardFilters } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { apiFetch } from '@/lib/api';
import { useTeamPerformance } from '@/hooks/useTeamPerformance';
import { PerformanceCard } from '@/components/team/PerformanceCard';
import { TaskTodoListView } from '@/components/tasks/TaskTodoListView';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { useTaskColumns, useTasks, Task, TaskInput } from '@/hooks/useTasks';

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
  const [taskFilter, setTaskFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const now = useMemo(() => new Date(), []);
  const [resultsFilter, setResultsFilter] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const resultsFilters = useMemo<DashboardFilters>(() => {
    const base: DashboardFilters = { period: resultsFilter };
    if (resultsFilter === 'month') {
      return { ...base, year: now.getFullYear(), month: now.getMonth() + 1 };
    }
    if (resultsFilter === 'year') {
      return { ...base, year: now.getFullYear() };
    }
    return base;
  }, [resultsFilter, now]);

  const { metrics, isLoading, isFetching } = useDashboard(resultsFilters);
  const { stages: pipelineStages } = usePipelineStages();
  const effectiveMonth = resultsFilters.month ?? now.getMonth() + 1;
  const effectiveYear = resultsFilters.year ?? now.getFullYear();
  const myUserId = user?.id ?? profile?.id ?? (profile as any)?.user_id ?? null;
  const { collaboratorPerformance, isLoading: perfLoading } = useTeamPerformance({
    month: effectiveMonth,
    year: effectiveYear,
    agencyIdFilter: resultsFilters.agencyId,
  });
  const { data: myProposals = [] } = useQuery({
    queryKey: ['dashboard-my-proposals', resultsFilters, myUserId],
    queryFn: async () => {
      if (!myUserId) return [];

      const where: Record<string, unknown> = {};
      if (!isSuperAdmin && profile?.agency_id) where.agencyId = profile.agency_id;
      else if (resultsFilters.agencyId) where.agencyId = resultsFilters.agencyId;
      if (resultsFilters.clientId) where.clientId = resultsFilters.clientId;

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

  const tasksAgencyId = resultsFilters.agencyId ?? profile?.agency_id;
  const { columns: taskColumns = [], isLoading: taskColumnsLoading } = useTaskColumns(tasksAgencyId);
  const { tasks: allTasks = [], isLoading: tasksLoading, moveTask, createTask, updateTask } = useTasks({ agencyId: tasksAgencyId });
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const completedTaskColumn = useMemo(() => {
    if (taskColumns.length === 0) return undefined;
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const keywords = ['feito', 'concluido', 'concluida', 'done', 'completed'];
    return (
      taskColumns.find((column) => {
        const normalizedName = normalize(column.name);
        return keywords.some((keyword) => normalizedName.includes(keyword));
      }) || taskColumns[taskColumns.length - 1]
    );
  }, [taskColumns]);

  const incompleteTasks = useMemo(() => {
    if (!completedTaskColumn) return allTasks;
    return allTasks.filter((task) => task.column_id !== completedTaskColumn.id);
  }, [allTasks, completedTaskColumn]);

  const completedTasks = useMemo(() => {
    if (!completedTaskColumn) return [];
    return allTasks.filter((task) => task.column_id === completedTaskColumn.id);
  }, [allTasks, completedTaskColumn]);
  const taskFilterNow = useMemo(() => new Date(), [taskFilter]);

  const filteredIncompleteTasks = useMemo(() => {
    if (taskFilter === 'all') return incompleteTasks;
    return incompleteTasks.filter((task) => {
      const rawDate = task.due_date ?? task.start_date ?? task.created_at;
      if (!rawDate) return false;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return false;

      if (taskFilter === 'today') {
        return isSameDay(date, taskFilterNow);
      }

      if (taskFilter === 'week') {
        const start = startOfWeek(taskFilterNow, { weekStartsOn: 1 });
        const end = endOfWeek(taskFilterNow, { weekStartsOn: 1 });
        return isWithinInterval(date, { start, end });
      }

      const start = startOfMonth(taskFilterNow);
      const end = endOfMonth(taskFilterNow);
      return isWithinInterval(date, { start, end });
    });
  }, [incompleteTasks, taskFilter, taskFilterNow]);

  const filteredCompletedTasks = useMemo(() => {
    if (taskFilter === 'all') return completedTasks;
    return completedTasks.filter((task) => {
      const rawDate = task.due_date ?? task.start_date ?? task.created_at;
      if (!rawDate) return false;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return false;

      if (taskFilter === 'today') {
        return isSameDay(date, taskFilterNow);
      }

      if (taskFilter === 'week') {
        const start = startOfWeek(taskFilterNow, { weekStartsOn: 1 });
        const end = endOfWeek(taskFilterNow, { weekStartsOn: 1 });
        return isWithinInterval(date, { start, end });
      }

      const start = startOfMonth(taskFilterNow);
      const end = endOfMonth(taskFilterNow);
      return isWithinInterval(date, { start, end });
    });
  }, [completedTasks, taskFilter, taskFilterNow]);

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setTaskDialogOpen(true);
  };

  const handleCompleteTask = (taskId: string) => {
    if (!completedTaskColumn?.id) return;
    setCompletingTaskId(taskId);
    moveTask.mutate(
      { taskId, columnId: completedTaskColumn.id },
      { onSettled: () => setCompletingTaskId(null) },
    );
  };

  const handleSaveTask = (data: TaskInput & { id?: string }) => {
    if (data.id) {
      updateTask.mutate(data as any, {
        onSuccess: () => {
          setTaskDialogOpen(false);
          setSelectedTask(null);
        },
      });
    } else {
      createTask.mutate(
        { ...data, column_id: data.column_id || taskColumns[0]?.id },
        {
          onSuccess: () => {
            setTaskDialogOpen(false);
            setSelectedTask(null);
          },
        },
      );
    }
  };

  const resultsLabel = useMemo(() => {
    if (resultsFilter === 'today') {
      const label = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      return `Resultados de hoje (${label})`;
    }
    if (resultsFilter === 'week') {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      const startLabel = start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      const endLabel = end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      return `Resultados da semana (${startLabel} - ${endLabel})`;
    }
    if (resultsFilter === 'month') {
      const label = new Date(effectiveYear, effectiveMonth - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
      return `Resultados do mês de ${label.charAt(0).toUpperCase() + label.slice(1)}`;
    }
    if (resultsFilter === 'year') {
      return `Resultados de ${effectiveYear}`;
    }
    return 'Resultados de todos os períodos';
  }, [resultsFilter, now, effectiveMonth, effectiveYear]);

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

  const pipelineRadialData = useMemo(() => {
    const toKey = (value: string, index: number) => {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      return slug || `stage-${index}`;
    };
    return pipelineData.map((item, index) => {
      const stageKey = toKey(item.stage, index);
      return {
        stage: item.stage,
        stageKey,
        count: item.count,
        fill: `var(--color-${stageKey})`,
        color: item.color,
      };
    });
  }, [pipelineData]);

  const pipelineRadialConfig = useMemo<ChartConfig>(() => {
    const config: ChartConfig = {
      count: { label: 'Propostas' },
    };
    pipelineRadialData.forEach((item) => {
      config[item.stageKey] = { label: item.stage, color: item.color };
    });
    return config;
  }, [pipelineRadialData]);

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

  const PipelineTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ value?: number; payload?: { stage?: string } }>;
  }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    const stage = item.payload?.stage ?? 'Etapa';
    const value = Number(item.value ?? 0);
    return (
      <div className="rounded-md border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
        <div className="text-muted-foreground">{stage}</div>
        <div className="mt-1 font-mono font-medium text-foreground">{value}</div>
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
      <div className="w-full px-0 py-0 space-y-5 transition-all duration-500 relative">
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{resultsLabel}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: 'Hoje', value: 'today' },
                    { label: 'Semana', value: 'week' },
                    { label: 'Mês', value: 'month' },
                    { label: 'Ano', value: 'year' },
                    { label: 'Todos', value: 'all' },
                  ].map((option) => {
                    const isActive = resultsFilter === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setResultsFilter(option.value as typeof resultsFilter)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-[#f06a12] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* KPIs principais - 6 cards em linha responsiva */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-5">
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
                  hint: 'Lucro previsto',
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
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-4 gap-5 overflow-hidden">
              <Card className="relative overflow-hidden border-0 shadow-none min-w-0 2xl:col-span-2 bg-[#f06a12] text-white">
                <CardHeader className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <ListTodo className="h-5 w-5 text-white/80" />
                      <CardTitle className="text-lg text-white">Tarefas</CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { label: 'Hoje', value: 'today' },
                        { label: 'Semana', value: 'week' },
                        { label: 'Mês', value: 'month' },
                        { label: 'Todos', value: 'all' },
                      ].map((option) => {
                        const isActive = taskFilter === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setTaskFilter(option.value as typeof taskFilter)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                              isActive
                                ? 'bg-white text-[#f06a12]'
                                : 'bg-white/15 text-white/80 hover:bg-white/25'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <CardDescription className="text-white/70">
                    Pendências e acompanhamentos do time
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 p-0">
                  {tasksLoading || taskColumnsLoading ? (
                    <div className="h-[320px] flex items-center justify-center">
                      <Skeleton className="h-24 w-32" />
                    </div>
                  ) : (
                    <div className="h-[320px] overflow-y-auto [&_.shadow-sm]:shadow-none [&_.bg-card\\/80]:!bg-white [&_.bg-muted\\/40]:!bg-white [&_.bg-card\\/80]:border-0 [&_.bg-muted\\/40]:border-0 [&_.bg-card\\/80]:shadow-none [&_.bg-muted\\/40]:shadow-none [&_[role=checkbox]]:self-start [&_[role=checkbox]]:border-orange-200 [&_[role=checkbox]]:bg-white [&_[role=checkbox]]:shadow-sm [&_[role=checkbox]]:shadow-white/40 [&_[role=checkbox][data-state=checked]]:bg-white [&_[role=checkbox][data-state=checked]]:text-[#f06a12]">
                      <TaskTodoListView
                        tasks={filteredIncompleteTasks}
                        completedTasks={filteredCompletedTasks}
                        columns={taskColumns}
                        completedColumnId={completedTaskColumn?.id}
                        completedColumnName={completedTaskColumn?.name}
                        completingTaskId={completingTaskId}
                        onEditTask={handleOpenTask}
                        onCompleteTask={handleCompleteTask}
                        solidCards
                        alignHeaderTop
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="backdrop-blur-lg border-0 shadow-none min-w-0">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Layers className={`h-5 w-5 ${isDark ? 'text-[hsl(var(--primary-end))]' : 'text-[#f06a12]'}`} />
                    <CardTitle className={`text-lg ${textStrong}`}>Pipeline por estágio</CardTitle>
                  </div>
                  <CardDescription className={textMuted}>
                    Distribuição das propostas por etapa
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden">
                  {pipelineData.length ? (
                    <ChartContainer
                      config={pipelineRadialConfig}
                      className="mx-auto aspect-square max-h-[260px]"
                    >
                      <RadialBarChart
                        accessibilityLayer
                        data={pipelineRadialData}
                        innerRadius={36}
                        outerRadius={120}
                      >
                        <ChartTooltip cursor={false} content={<PipelineTooltip />} />
                        <RadialBar dataKey="count" background cornerRadius={8} />
                      </RadialBarChart>
                    </ChartContainer>
                  ) : (
                    <div className={`h-[320px] flex items-center justify-center ${textMuted}`}>Sem dados para exibir</div>
                  )}
                </CardContent>
              </Card>

              <Card className="backdrop-blur-lg border-0 shadow-none min-w-0">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className={`h-5 w-5 ${isDark ? 'text-[hsl(var(--primary-end))]' : 'text-[#f06a12]'}`} />
                    <CardTitle className={`text-lg ${textStrong}`}>Faturamento x Lucro</CardTitle>
                  </div>
                  <CardDescription className={textMuted}>
                    Comparativo dos últimos 6 meses
                  </CardDescription>
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
            </div>

            <TaskDialog
              open={taskDialogOpen}
              onOpenChange={(open) => {
                setTaskDialogOpen(open);
                if (!open) setSelectedTask(null);
              }}
              task={selectedTask}
              columns={taskColumns}
              defaultColumnId={taskColumns[0]?.id}
              agencyId={tasksAgencyId}
              onSave={handleSaveTask}
              isLoading={createTask.isPending || updateTask.isPending}
            />

            {/* Listas principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="backdrop-blur-lg border-0 shadow-none">
                <CardHeader>
                  <CardTitle className={`text-lg flex items-center gap-2 ${textStrong}`}>
                    <Users className={`${isDark ? 'text-[hsl(var(--primary-end))]' : 'text-[#c2410c]'} w-5 h-5`} />
                    Top Clientes
                  </CardTitle>
                  <CardDescription className={textMuted}>
                    Ranking por faturamento acumulado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics?.topClients?.length ? (
                      metrics.topClients.map((client, index) => (
                        <div
                          key={client.name}
                          className={`rounded-2xl px-4 py-3 border transition-colors ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200/70 bg-white'}`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl text-[11px] font-bold tracking-tight flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary-start))] to-[hsl(var(--primary-end))] text-white">
                                {index + 1}
                              </span>
                              <div>
                                <p className={`font-semibold tracking-tight ${textStrong}`}>{client.name}</p>
                                <p className={`text-xs ${textMuted}`}>Faturamento direto</p>
                              </div>
                            </div>
                            <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'}`}>
                              {showRefreshing ? <Skeleton className="h-4 w-20 rounded bg-white/20" /> : formatCurrency(client.revenue)}
                            </div>
                          </div>
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
                  <CardDescription className={textMuted}>
                    Volume de serviços por parceiro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics?.topPartners?.length ? (
                      metrics.topPartners.map((partner, index) => (
                        <div
                          key={partner.name}
                          className={`rounded-2xl px-4 py-3 border transition-colors ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200/70 bg-white'}`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl text-[11px] font-bold tracking-tight flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary-start))] to-[hsl(var(--primary-end))] text-white">
                                {index + 1}
                              </span>
                              <div>
                                <p className={`font-semibold tracking-tight ${textStrong}`}>{partner.name}</p>
                                <p className={`text-xs ${textMuted}`}>Volume em serviços</p>
                              </div>
                            </div>
                            <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'}`}>
                              {showRefreshing ? <Skeleton className="h-4 w-20 rounded bg-white/20" /> : formatCurrency(partner.revenue)}
                            </div>
                          </div>
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
