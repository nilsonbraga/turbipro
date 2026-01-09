import { useState, useMemo } from 'react';
import { useAgencies, Agency } from '@/hooks/useAgencies';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { AgencyDialog } from '@/components/agencies/AgencyDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, MoreHorizontal, Mail, Phone, Edit, Trash2, Building2, CheckCircle, XCircle, Loader2, Power, Calendar, CreditCard, AlertTriangle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { AgencySubscription } from '@/hooks/useAgencySubscription';

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
};

type ExpirationFilter = 'all' | 'this_week' | 'this_month' | 'this_semester';

export default function Agencies() {
  const { isSuperAdmin } = useAuth();
  const { agencies, isLoading, createAgency, updateAgency, deactivateAgency, deleteAgency, isCreating, isUpdating, isDeactivating, isDeleting } = useAgencies();
  const { plans } = useSubscriptionPlans();
  const [searchTerm, setSearchTerm] = useState('');
  const [expirationFilter, setExpirationFilter] = useState<ExpirationFilter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agencyToDeactivate, setAgencyToDeactivate] = useState<Agency | null>(null);
  const [agencyToDelete, setAgencyToDelete] = useState<Agency | null>(null);

  // Fetch all subscriptions
  const { data: subscriptions } = useQuery({
    queryKey: ['all-agency-subscriptions'],
    queryFn: async () => {
      const { data } = await apiFetch<{ data: any[] }>(`/api/agencySubscription`);
      return (data || []).map((s: any) => ({
        id: s.id,
        agency_id: s.agencyId,
        plan_id: s.planId,
        billing_cycle: s.billingCycle,
        status: s.status,
        stripe_customer_id: s.stripeCustomerId,
        stripe_subscription_id: s.stripeSubscriptionId,
        current_period_start: s.currentPeriodStart,
        current_period_end: s.currentPeriodEnd,
        grace_period_days: s.gracePeriodDays ?? 0,
        coupon_id: s.couponId ?? null,
        discount_applied: s.discountApplied ?? 0,
        created_at: s.createdAt,
        updated_at: s.updatedAt,
      })) as AgencySubscription[];
    },
    enabled: isSuperAdmin,
  });

  // Redireciona se não for super_admin
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const getSubscriptionForAgency = (agencyId: string) => {
    return subscriptions?.find(s => s.agency_id === agencyId);
  };

  const getPlanName = (planId: string | null) => {
    if (!planId) return 'Sem plano';
    const plan = plans?.find(p => p.id === planId);
    return plan?.name || 'Plano desconhecido';
  };

  const getDaysUntilExpiration = (sub: AgencySubscription | undefined) => {
    if (!sub?.current_period_end) return null;
    const endDate = new Date(sub.current_period_end);
    let finalDate = endDate;
    if (sub.status === 'past_due') {
      finalDate = new Date(endDate.getTime() + (sub.grace_period_days * 24 * 60 * 60 * 1000));
    }
    const now = new Date();
    const diffTime = finalDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredAgencies = useMemo(() => {
    let result = agencies.filter(agency => {
      const searchLower = searchTerm.toLowerCase();
      return (
        agency.name.toLowerCase().includes(searchLower) ||
        (agency.email?.toLowerCase().includes(searchLower)) ||
        (agency.cnpj?.includes(searchTerm))
      );
    });

    // Apply expiration filter
    if (expirationFilter !== 'all') {
      const now = new Date();
      result = result.filter(agency => {
        const sub = getSubscriptionForAgency(agency.id);
        const days = getDaysUntilExpiration(sub);
        if (days === null) return false;
        
        switch (expirationFilter) {
          case 'this_week':
            return days >= 0 && days <= 7;
          case 'this_month':
            return days >= 0 && days <= 30;
          case 'this_semester':
            return days >= 0 && days <= 180;
          default:
            return true;
        }
      });
    }

    return result;
  }, [agencies, searchTerm, expirationFilter, subscriptions]);

  const handleEdit = (agency: Agency) => {
    setEditingAgency(agency);
    setDialogOpen(true);
  };

  const handleDeactivate = (agency: Agency) => {
    setAgencyToDeactivate(agency);
    setDeactivateDialogOpen(true);
  };

  const handleDelete = (agency: Agency) => {
    setAgencyToDelete(agency);
    setDeleteDialogOpen(true);
  };

  const confirmDeactivate = () => {
    if (agencyToDeactivate) {
      deactivateAgency(agencyToDeactivate.id);
      setDeactivateDialogOpen(false);
      setAgencyToDeactivate(null);
    }
  };

  const confirmDelete = () => {
    if (agencyToDelete) {
      deleteAgency(agencyToDelete.id);
      setDeleteDialogOpen(false);
      setAgencyToDelete(null);
    }
  };

  const handleSubmit = (data: any) => {
    if (data.id) {
      updateAgency(data);
    } else {
      createAgency(data);
    }
    setEditingAgency(null);
  };

  const getStatusBadge = (sub: AgencySubscription | undefined) => {
    if (!sub) {
      return <Badge variant="outline" className="text-muted-foreground">Sem assinatura</Badge>;
    }
    switch (sub.status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Ativa</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pendente</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{sub.status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Agências</h1>
          <p className="text-sm text-muted-foreground">Gerencie as agências cadastradas</p>
        </div>
        <Button onClick={() => { setEditingAgency(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Agência
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agencies.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {subscriptions?.filter(s => s.status === 'active' || s.status === 'trialing').length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Com assinatura ativa</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {agencies.filter(a => {
                    const days = getDaysUntilExpiration(getSubscriptionForAgency(a.id));
                    return days !== null && days >= 0 && days <= 7;
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">Expirando (7 dias)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {agencies.filter(a => !a.is_active).length}
                </p>
                <p className="text-sm text-muted-foreground">Inativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 bg-white border-slate-200 pl-9"
              />
            </div>
            <Select value={expirationFilter} onValueChange={(v) => setExpirationFilter(v as ExpirationFilter)}>
              <SelectTrigger className="w-[220px] h-9 bg-white border-slate-200">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por expiração" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as agências</SelectItem>
                <SelectItem value="this_week">Expira esta semana</SelectItem>
                <SelectItem value="this_month">Expira este mês</SelectItem>
                <SelectItem value="this_semester">Expira no semestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border-0 shadow-none bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wide text-slate-500">Agência</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-slate-500">CNPJ</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-slate-500">Contato</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-slate-500">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-slate-500">Plano</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-slate-500">Assinatura</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-slate-500">Expira em</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma agência encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgencies.map((agency, index) => {
                  const sub = getSubscriptionForAgency(agency.id);
                  const daysLeft = getDaysUntilExpiration(sub);
                  return (
                    <TableRow key={agency.id} className={index % 2 === 0 ? 'bg-slate-50/60 hover:bg-slate-50' : 'hover:bg-slate-50'}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{agency.name}</p>
                            {agency.address && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {agency.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{agency.cnpj || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {agency.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span>{agency.email}</span>
                            </div>
                          )}
                          {agency.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span>{agency.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agency.is_active ? "default" : "secondary"}>
                          {agency.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{getPlanName(sub?.plan_id || null)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(sub)}
                        {sub?.current_period_start && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Desde {formatDate(sub.current_period_start)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {daysLeft !== null ? (
                          <div className={`text-sm ${daysLeft <= 7 ? 'text-destructive font-medium' : daysLeft <= 30 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            {daysLeft < 0 ? (
                              <span className="text-destructive">Expirado há {Math.abs(daysLeft)} dias</span>
                            ) : daysLeft === 0 ? (
                              <span className="text-destructive">Expira hoje</span>
                            ) : (
                              <span>{daysLeft} dias</span>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDate(sub?.current_period_end || null)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(agency)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {agency.is_active && (
                              <DropdownMenuItem 
                                className="text-amber-600"
                                onClick={() => handleDeactivate(agency)}
                              >
                                <Power className="w-4 h-4 mr-2" />
                                Desativar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(agency)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir Permanentemente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <AgencyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agency={editingAgency}
        subscription={editingAgency ? getSubscriptionForAgency(editingAgency.id) : null}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
      />

      {/* Deactivate Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Agência</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar a agência "{agencyToDeactivate?.name}"?
              A agência não poderá mais acessar o sistema, mas os dados serão mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate} className="bg-amber-600 text-white hover:bg-amber-700">
              {isDeactivating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agência Permanentemente</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="text-destructive font-semibold">ATENÇÃO: Esta ação é irreversível!</span>
              <br /><br />
              Tem certeza que deseja excluir permanentemente a agência "{agencyToDelete?.name}"?
              Todos os dados serão removidos, incluindo clientes, propostas, parceiros e usuários.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir Permanentemente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
