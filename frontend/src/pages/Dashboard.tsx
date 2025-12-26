import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, FileText, Target, Users, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useDashboard, DashboardFilters } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const STAGE_COLORS: Record<string, string> = {
  'Novo': 'hsl(var(--chart-1))',
  'Contato': 'hsl(var(--chart-2))',
  'Proposta': 'hsl(var(--chart-3))',
  'Negociação': 'hsl(var(--chart-4))',
  'Fechado': 'hsl(var(--chart-5))',
  'Perdido': 'hsl(var(--muted))',
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

export default function Dashboard() {
  const { isSuperAdmin } = useAuth();
  const [filters, setFilters] = useState<DashboardFilters>({});
  
  const { agencies, clients, metrics, isLoading } = useDashboard(filters);

  const updateFilter = (key: keyof DashboardFilters, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral do seu negócio</p>
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
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          
          {isSuperAdmin && (
            <Select
              value={filters.agencyId || 'all'}
              onValueChange={(v) => updateFilter('agencyId', v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas agências" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas agências</SelectItem>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select
            value={filters.clientId || 'all'}
            onValueChange={(v) => updateFilter('clientId', v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos clientes</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={filters.year?.toString() || 'all'}
            onValueChange={(v) => updateFilter('year', v === 'all' ? undefined : parseInt(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos anos</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={filters.month?.toString() || 'all'}
            onValueChange={(v) => updateFilter('month', v === 'all' ? undefined : parseInt(v))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos meses</SelectItem>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Total</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalProfit)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Propostas</p>
                <p className="text-2xl font-bold">{metrics.totalProposals}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-chart-4/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Faturamento x Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {metrics.revenueByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="revenue" name="Faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Lucro" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Sem dados para exibir
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Propostas por Estágio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {metrics.proposalsByStage.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.proposalsByStage}
                      dataKey="value"
                      nameKey="stage"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ stage, value }) => `${stage}: ${formatCurrency(value)}`}
                    >
                      {metrics.proposalsByStage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STAGE_COLORS[entry.stage] || `hsl(var(--chart-${(index % 5) + 1}))`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Sem dados para exibir
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topClients.length > 0 ? (
                metrics.topClients.map((client, index) => (
                  <div key={client.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-medium">{client.name}</span>
                    </div>
                    <span className="text-muted-foreground">{formatCurrency(client.revenue)}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">Sem dados para exibir</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Partners */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Top Fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topPartners.length > 0 ? (
                metrics.topPartners.map((partner, index) => (
                  <div key={partner.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-medium">{partner.name}</span>
                    </div>
                    <span className="text-muted-foreground">{formatCurrency(partner.revenue)}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">Sem dados para exibir</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
