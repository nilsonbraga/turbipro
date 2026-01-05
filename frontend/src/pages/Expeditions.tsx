import { useMemo, useState } from 'react';
import { useExpeditionGroups, ExpeditionGroup, ExpeditionGroupWithAgency } from '@/hooks/useExpeditionGroups';
import { useAgencies } from '@/hooks/useAgencies';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/hooks/useClients';
import { useProposals } from '@/hooks/useProposals';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { useTasks, useTaskColumns } from '@/hooks/useTasks';
import { useCollaborators } from '@/hooks/useCollaborators';
import { ExpeditionGroupDialog } from '@/components/expeditions/ExpeditionGroupDialog';
import { ExpeditionRegistrationsDialog } from '@/components/expeditions/ExpeditionRegistrationsDialog';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { ProposalDialog } from '@/components/proposals/ProposalDialog';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users, 
  MapPin, 
  Calendar, 
  Clock,
  Compass,
  CalendarDays,
  CreditCard,
  DollarSign,
  Hourglass,
  Loader2,
  Copy,
  Check,
  Building2,
  ClipboardList,
  FileText,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formatCurrencyValue = (value: number, currency = 'BRL') =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);

const parseCurrencyValue = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.includes(',')
      ? trimmed.replace(/\./g, '').replace(',', '.')
      : trimmed;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export default function Expeditions() {
  const { isSuperAdmin, isAdmin, agency } = useAuth();
  const [agencyFilter, setAgencyFilter] = useState<string | null>(null);
  const { groups, isLoading, createGroup, updateGroup, deleteGroup, isCreating, isUpdating, isDeleting } = useExpeditionGroups(agencyFilter);
  const { agencies } = useAgencies();
  const { clients } = useClients();
  const { stages } = usePipelineStages();
  const { collaborators } = useCollaborators();
  const { columns } = useTaskColumns();
  const { createTask } = useTasks();
  const { createProposal } = useProposals();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ExpeditionGroup | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<ExpeditionGroup | null>(null);
  const [registrationsDialogOpen, setRegistrationsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ExpeditionGroup | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | 'year'>('all');

  // Task and Lead dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskPrefill, setTaskPrefill] = useState<{ title: string; description: string } | null>(null);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadPrefill, setLeadPrefill] = useState<{ title: string; notes: string } | null>(null);

  const now = new Date();
  const filteredGroups = groups.filter((group) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      group.destination.toLowerCase().includes(searchLower) ||
      (group.description?.toLowerCase().includes(searchLower));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && group.is_active) ||
      (statusFilter === 'inactive' && !group.is_active);

    const startDate = new Date(group.start_date);
    const matchesPeriod =
      periodFilter === 'all' ||
      (periodFilter === 'year' && startDate.getFullYear() === now.getFullYear()) ||
      (periodFilter === 'month' &&
        startDate.getFullYear() === now.getFullYear() &&
        startDate.getMonth() === now.getMonth());

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const handleEdit = (group: ExpeditionGroup) => {
    setEditingGroup(group);
    setDialogOpen(true);
  };

  const handleDelete = (group: ExpeditionGroup) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const handleViewRegistrations = (group: ExpeditionGroup) => {
    setSelectedGroup(group);
    setRegistrationsDialogOpen(true);
  };

  const handleViewPublicPage = (group: ExpeditionGroup) => {
    const url = `${window.location.origin}/expeditions/${group.public_token}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyUrl = async (group: ExpeditionGroup) => {
    const url = `${window.location.origin}/expeditions/${group.public_token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(group.id);
    toast({ title: 'URL copiada!' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = () => {
    if (groupToDelete) {
      deleteGroup(groupToDelete.id);
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    }
  };

  const handleSubmit = (data: any) => {
    if (data.id) {
      updateGroup(data);
    } else {
      // For super admin creating without agency, use the filter or first agency
      if (isSuperAdmin && !agency?.id) {
        data.agency_id = agencyFilter || agencies?.[0]?.id;
      }
      createGroup(data);
    }
    setEditingGroup(null);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Build description for task/lead based on group info
  const buildParticipantsList = (group: ExpeditionGroup) => {
    const lines: string[] = [];
    lines.push(`Expedição: ${group.destination}`);
    lines.push(`Data: ${formatDate(group.start_date)} (${group.duration_days} dias)`);
    lines.push(`Vagas: ${group.registrations_count || 0}/${group.max_participants}`);
    if (group.waitlist_count && group.waitlist_count > 0) {
      lines.push(`Lista de espera: ${group.waitlist_count}`);
    }
    return lines.join('\n');
  };

  const handleCreateTask = (group: ExpeditionGroup) => {
    const taskData = {
      title: `Expedição: ${group.destination}`,
      description: buildParticipantsList(group),
    };
    setTaskPrefill(taskData);
    setTaskDialogOpen(true);
  };

  const handleCreateLead = (group: ExpeditionGroup) => {
    const leadData = {
      title: `Expedição: ${group.destination}`,
      notes: buildParticipantsList(group),
    };
    setLeadPrefill(leadData);
    setLeadDialogOpen(true);
  };

  const handleSaveTask = (data: any) => {
    createTask.mutate(data);
    setTaskDialogOpen(false);
    setTaskPrefill(null);
  };

  const handleSaveLead = (data: any) => {
    createProposal(data);
    setLeadDialogOpen(false);
    setLeadPrefill(null);
  };

  const upcomingGroups = groups.filter(g => new Date(g.start_date) >= new Date() && g.is_active);
  const totalParticipants = groups.reduce((acc, g) => acc + (g.registrations_count || 0), 0);
  const totalWaitlist = groups.reduce((acc, g) => acc + (g.waitlist_count || 0), 0);
  const agencyOptions = useMemo(
    () => [
      { value: 'all', label: 'Todas as agências' },
      ...(agencies ?? []).map((ag) => ({ value: ag.id, label: ag.name })),
    ],
    [agencies],
  );

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Grupos de Expedição</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus grupos e inscrições</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-white"
            />
          </div>
          <Button size="sm" onClick={() => { setEditingGroup(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Grupo
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'Ativo', value: 'active' },
            { label: 'Inativo', value: 'inactive' },
            { label: 'Todos', value: 'all' },
          ].map((option) => {
            const isActive = statusFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value as typeof statusFilter)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#f06a12] text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="hidden sm:block h-5 w-px bg-border" />
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'Este ano', value: 'year' },
            { label: 'Este mês', value: 'month' },
            { label: 'Todos', value: 'all' },
          ].map((option) => {
            const isActive = periodFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriodFilter(option.value as typeof periodFilter)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#f06a12] text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {isSuperAdmin && (
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Filtrar por agência</span>
            </div>
            <Combobox
              options={agencyOptions}
              value={agencyFilter || 'all'}
              onValueChange={(value) => setAgencyFilter(value === 'all' ? null : value)}
              placeholder="Todas as agências"
              searchPlaceholder="Buscar agência..."
              emptyText="Nenhuma agência encontrada"
              buttonClassName="w-64 h-9"
              contentClassName="w-72"
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total de grupos</p>
                <p className="text-2xl font-semibold">{groups.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Próximos grupos</p>
                <p className="text-2xl font-semibold">{upcomingGroups.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <CalendarDays className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Inscritos</p>
                <p className="text-2xl font-semibold">{totalParticipants}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Lista de espera</p>
                <p className="text-2xl font-semibold">{totalWaitlist}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Hourglass className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
            <CardContent className="p-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : filteredGroups.length === 0 ? (
          <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
            <CardContent className="p-10 text-center text-muted-foreground">
              Nenhum grupo encontrado
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map((group) => {
            const hasCover = Boolean(group.cover_image_url);
            const currency = group.currency || 'BRL';
            const cashValue = parseCurrencyValue(group.price_cash);
            const installmentValue = parseCurrencyValue(group.price_installment);
            const priceCash = cashValue !== null ? formatCurrencyValue(cashValue, currency) : null;
            const priceInstallment =
              installmentValue !== null ? formatCurrencyValue(installmentValue, currency) : null;
            const installmentCount =
              typeof group.installments_count === 'number' && group.installments_count > 0
                ? group.installments_count
                : null;
            const installmentValuePer =
              installmentValue !== null && installmentCount ? installmentValue / installmentCount : null;
            const installmentPerLabel =
              installmentValuePer !== null ? formatCurrencyValue(installmentValuePer, currency) : null;

            return (
              <Card
                key={group.id}
                className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg overflow-hidden cursor-pointer"
                onClick={(event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('[data-card-action]')) {
                    return;
                  }
                  handleEdit(group);
                }}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col gap-1 lg:flex-row lg:items-stretch">
                    {hasCover && (
                      <div className="w-full lg:w-1/6">
                        <img
                          src={group.cover_image_url}
                          alt={`Capa ${group.destination}`}
                          className="h-36 w-full object-cover lg:h-full"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-4 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-3">
                          {!hasCover && (
                            <div className="h-10 w-10 shrink-0 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                              <MapPin className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold">{group.destination}</p>
                              {isSuperAdmin && (
                                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                                  {(group as ExpeditionGroupWithAgency).agency_name || 'N/A'}
                                </Badge>
                              )}
                            </div>
                            {group.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {group.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              group.is_active ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {group.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" data-card-action>
                            <DropdownMenuItem onClick={() => handleViewRegistrations(group)}>
                              <Users className="w-4 h-4 mr-2" />
                              Ver Inscritos
                            </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewPublicPage(group)}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Landing page
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyUrl(group)}>
                                {copiedId === group.id ? (
                                  <Check className="w-4 h-4 mr-2" />
                                ) : (
                                  <Copy className="w-4 h-4 mr-2" />
                                )}
                                Copiar Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleCreateTask(group)}>
                                <ClipboardList className="w-4 h-4 mr-2" />
                                Criar Tarefa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCreateLead(group)}>
                                <FileText className="w-4 h-4 mr-2" />
                                Criar Lead
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(group)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(group)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    <div className="mt-auto flex flex-wrap items-center gap-5 text-sm text-muted-foreground sm:justify-end">
                      {priceCash && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-orange-500" />
                          <span>{priceCash}</span>
                          <span className="text-xs text-muted-foreground">à vista</span>
                        </div>
                      )}
                      {(installmentPerLabel || priceInstallment) && (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-orange-500" />
                          {installmentCount && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                              {installmentCount}x
                            </span>
                          )}
                          <span>{installmentPerLabel || priceInstallment}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(group.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {group.duration_days} {group.duration_days === 1 ? 'dia' : 'dias'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                          onClick={() => handleViewRegistrations(group)}
                        >
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {group.registrations_count}/{group.max_participants} vagas
                          </span>
                          {(group.waitlist_count || 0) > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              +{group.waitlist_count} espera
                            </Badge>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialogs */}
      <ExpeditionGroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        group={editingGroup}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
      />

      <ExpeditionRegistrationsDialog
        open={registrationsDialogOpen}
        onOpenChange={setRegistrationsDialogOpen}
        group={selectedGroup}
      />

      {/* Task Dialog - inline */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        columns={columns}
        defaultColumnId={columns[0]?.id}
        agencyId={agencyFilter ?? agency?.id ?? null}
        onSave={handleSaveTask}
        isLoading={createTask.isPending}
        prefillData={taskPrefill}
      />

      {/* Proposal Dialog - inline */}
      <ProposalDialog
        open={leadDialogOpen}
        onOpenChange={setLeadDialogOpen}
        clients={clients || []}
        stages={stages}
        collaborators={collaborators.filter(c => c.status === 'active').map(c => ({ id: c.id, name: c.name }))}
        isAdmin={isAdmin || isSuperAdmin}
        onSubmit={handleSaveLead}
        proposal={leadPrefill ? { title: leadPrefill.title, notes: leadPrefill.notes } as any : null}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o grupo "{groupToDelete?.destination}"? 
              Todos os inscritos também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
