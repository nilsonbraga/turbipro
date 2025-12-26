import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { 
  Users, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Target, 
  TrendingUp, 
  DollarSign,
  Trophy,
  Filter,
  UserPlus,
  Building2,
  Goal,
  CalendarDays,
  Clock
} from 'lucide-react';

import { useTeams, Team } from '@/hooks/useTeams';
import { useCollaborators, Collaborator, EmploymentType, CollaboratorLevel, CommissionBase } from '@/hooks/useCollaborators';
import { useCollaboratorGoals, CollaboratorGoal } from '@/hooks/useCollaboratorGoals';
import { useTeamPerformance } from '@/hooks/useTeamPerformance';
import { useShiftTypes, ShiftType, ShiftTypeInput } from '@/hooks/useShiftTypes';
import { useCollaboratorSchedules, CollaboratorSchedule, ScheduleInput } from '@/hooks/useCollaboratorSchedules';
import { useCollaboratorTimeOff, CollaboratorTimeOff, TimeOffInput, timeOffTypeLabels, timeOffStatusLabels } from '@/hooks/useCollaboratorTimeOff';
import { useAuth } from '@/contexts/AuthContext';
import { useAgencies } from '@/hooks/useAgencies';
import { TeamDialog } from '@/components/team/TeamDialog';
import { CollaboratorDialog } from '@/components/team/CollaboratorDialog';
import { GoalDialog } from '@/components/team/GoalDialog';
import { PerformanceCard } from '@/components/team/PerformanceCard';
import { GoalsTrackingCard } from '@/components/team/GoalsTrackingCard';
import { ShiftTypeDialog } from '@/components/team/ShiftTypeDialog';
import { ScheduleDialog } from '@/components/team/ScheduleDialog';
import { TimeOffDialog } from '@/components/team/TimeOffDialog';
import { ScheduleCalendar } from '@/components/team/ScheduleCalendar';
import { CollaboratorSalesDialog } from '@/components/team/CollaboratorSalesDialog';

const employmentTypeLabels: Record<EmploymentType, string> = {
  clt: 'CLT',
  pj: 'PJ',
  freela: 'Freelancer',
};

const levelLabels: Record<CollaboratorLevel, string> = {
  junior: 'Júnior',
  pleno: 'Pleno',
  senior: 'Sênior',
};

const commissionBaseLabels: Record<CommissionBase, string> = {
  sale_value: 'Valor da Venda',
  profit: 'Lucro',
};

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function TeamOperations() {
  const { isSuperAdmin, isAdmin, profile } = useAuth();
  const { agencies } = useAgencies();
  
  const [activeTab, setActiveTab] = useState('collaborators');
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [agencyFilter, setAgencyFilter] = useState<string>('');
  
  // Performance filters
  const currentDate = new Date();
  const [performanceMonth, setPerformanceMonth] = useState(currentDate.getMonth() + 1);
  const [performanceYear, setPerformanceYear] = useState(currentDate.getFullYear());
  const [performanceTeamFilter, setPerformanceTeamFilter] = useState<string>('');

  // Schedule date range
  const scheduleStartDate = useMemo(() => format(startOfMonth(currentDate), 'yyyy-MM-dd'), []);
  const scheduleEndDate = useMemo(() => format(endOfMonth(currentDate), 'yyyy-MM-dd'), []);

  // Dialog states
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [collaboratorDialogOpen, setCollaboratorDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = useState(false);
  
  // Schedule dialog states
  const [shiftTypeDialogOpen, setShiftTypeDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [timeOffDialogOpen, setTimeOffDialogOpen] = useState(false);
  const [deleteShiftTypeDialogOpen, setDeleteShiftTypeDialogOpen] = useState(false);
  const [deleteTimeOffDialogOpen, setDeleteTimeOffDialogOpen] = useState(false);
  
  // Selected items
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<CollaboratorSchedule | null>(null);
  const [selectedTimeOff, setSelectedTimeOff] = useState<CollaboratorTimeOff | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>(undefined);
  const [preselectedCollaboratorId, setPreselectedCollaboratorId] = useState<string | undefined>(undefined);
  
  // Sales dialog
  const [salesDialogOpen, setSalesDialogOpen] = useState(false);
  const [salesCollaborator, setSalesCollaborator] = useState<Collaborator | null>(null);

  // Hooks
  const { teams, isLoading: teamsLoading, createTeam, updateTeam, deleteTeam, isCreating: isCreatingTeam, isUpdating: isUpdatingTeam } = useTeams();
  const { collaborators, isLoading: collaboratorsLoading, createCollaborator, updateCollaborator, deleteCollaborator, isCreating, isUpdating } = useCollaborators({
    teamId: teamFilter || undefined,
    status: statusFilter || undefined,
  });
  const { goals, upsertGoal, deleteGoal, isUpserting, isDeleting: isDeletingGoal } = useCollaboratorGoals({
    month: performanceMonth,
    year: performanceYear,
  });
  const { 
    collaboratorPerformance, 
    teamPerformance, 
    rankings, 
    totals, 
    isLoading: performanceLoading 
  } = useTeamPerformance({
    month: performanceMonth,
    year: performanceYear,
    teamId: performanceTeamFilter || undefined,
    agencyIdFilter: isSuperAdmin ? agencyFilter || undefined : undefined,
  });

  // Schedule hooks
  const { shiftTypes, createShiftType, updateShiftType, deleteShiftType, isCreating: isCreatingShift, isUpdating: isUpdatingShift } = useShiftTypes(agencyFilter || undefined);
  const { schedules, upsertSchedule, bulkCreateSchedules, bulkDeleteSchedules, deleteSchedule: deleteScheduleRecord, isCreating: isCreatingSchedule, isBulkCreating, isBulkDeleting } = useCollaboratorSchedules(agencyFilter || undefined);
  const { timeOffs, createTimeOff, updateTimeOff, deleteTimeOff: deleteTimeOffRecord, isCreating: isCreatingTimeOff, isUpdating: isUpdatingTimeOff } = useCollaboratorTimeOff(agencyFilter || undefined);

  // Goal delete state
  const [deleteGoalDialogOpen, setDeleteGoalDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<CollaboratorGoal | null>(null);

  // Filter collaborators
  const filteredCollaborators = collaborators.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter teams
  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveTeam = (data: any) => {
    if (data.id) {
      updateTeam(data);
    } else {
      createTeam(data);
    }
    setTeamDialogOpen(false);
    setSelectedTeam(null);
  };

  const handleSaveCollaborator = (data: any) => {
    if (data.id) {
      updateCollaborator(data);
    } else {
      createCollaborator(data);
    }
    setCollaboratorDialogOpen(false);
    setSelectedCollaborator(null);
  };

  const handleSaveGoal = (data: any) => {
    upsertGoal(data);
    setGoalDialogOpen(false);
    setSelectedCollaborator(null);
  };

  const handleDeleteGoal = () => {
    if (goalToDelete) {
      deleteGoal(goalToDelete.id);
      setDeleteGoalDialogOpen(false);
      setGoalToDelete(null);
    }
  };

  const getGoalPerformance = (goalCollaboratorId: string) => {
    const perf = collaboratorPerformance.find(p => p.collaborator.id === goalCollaboratorId);
    return {
      currentSales: perf?.totalSales || 0,
      currentProfit: perf?.totalProfit || 0,
      currentDeals: perf?.dealsCount || 0,
    };
  };

  const handleDeleteCollaborator = () => {
    if (selectedCollaborator) {
      deleteCollaborator(selectedCollaborator.id);
      setDeleteDialogOpen(false);
      setSelectedCollaborator(null);
    }
  };

  const handleDeleteTeam = () => {
    if (selectedTeam) {
      deleteTeam(selectedTeam.id);
      setDeleteTeamDialogOpen(false);
      setSelectedTeam(null);
    }
  };

  // Schedule handlers
  const handleSaveShiftType = (data: ShiftTypeInput & { id?: string }) => {
    if (data.id) {
      updateShiftType(data as ShiftTypeInput & { id: string });
    } else {
      createShiftType(data);
    }
    setShiftTypeDialogOpen(false);
    setSelectedShiftType(null);
  };

  const handleDeleteShiftType = () => {
    if (selectedShiftType) {
      deleteShiftType(selectedShiftType.id);
      setDeleteShiftTypeDialogOpen(false);
      setSelectedShiftType(null);
    }
  };

  const handleSaveSchedule = (data: ScheduleInput & { id?: string }) => {
    upsertSchedule(data);
    setScheduleDialogOpen(false);
    setSelectedSchedule(null);
    setPreselectedDate(undefined);
    setPreselectedCollaboratorId(undefined);
  };

  const handleSaveBulkSchedule = (data: ScheduleInput[]) => {
    bulkCreateSchedules(data);
    setScheduleDialogOpen(false);
    setSelectedSchedule(null);
    setPreselectedDate(undefined);
    setPreselectedCollaboratorId(undefined);
  };

  const handleDeleteSchedule = (id: string) => {
    deleteScheduleRecord(id);
    setScheduleDialogOpen(false);
    setSelectedSchedule(null);
  };

  const handleBulkDeleteSchedule = (criteria: { collaborator_id: string; shift_type_id?: string | null; start_time?: string | null; end_time?: string | null }) => {
    bulkDeleteSchedules(criteria);
    setScheduleDialogOpen(false);
    setSelectedSchedule(null);
  };

  // Calculate similar schedules count for bulk delete option
  const getSimilarSchedulesCount = (schedule: CollaboratorSchedule | null): number => {
    if (!schedule) return 0;
    return schedules.filter(s => 
      s.collaborator_id === schedule.collaborator_id &&
      s.shift_type_id === schedule.shift_type_id &&
      s.start_time === schedule.start_time &&
      s.end_time === schedule.end_time
    ).length;
  };

  const handleSaveTimeOff = (data: TimeOffInput & { id?: string }) => {
    if (data.id) {
      updateTimeOff(data as TimeOffInput & { id: string });
    } else {
      createTimeOff(data);
    }
    setTimeOffDialogOpen(false);
    setSelectedTimeOff(null);
    setPreselectedCollaboratorId(undefined);
  };

  const handleDeleteTimeOff = () => {
    if (selectedTimeOff) {
      deleteTimeOffRecord(selectedTimeOff.id);
      setDeleteTimeOffDialogOpen(false);
      setSelectedTimeOff(null);
    }
  };

  const handleAddSchedule = (date: Date, collaboratorId?: string) => {
    setPreselectedDate(date);
    setPreselectedCollaboratorId(collaboratorId);
    setSelectedSchedule(null);
    setScheduleDialogOpen(true);
  };

  const handleEditSchedule = (schedule: CollaboratorSchedule) => {
    setSelectedSchedule(schedule);
    setPreselectedDate(undefined);
    setPreselectedCollaboratorId(undefined);
    setScheduleDialogOpen(true);
  };

  const handleAddTimeOff = (collaboratorId?: string) => {
    setPreselectedCollaboratorId(collaboratorId);
    setSelectedTimeOff(null);
    setTimeOffDialogOpen(true);
  };

  const handleEditTimeOff = (timeOff: CollaboratorTimeOff) => {
    setSelectedTimeOff(timeOff);
    setPreselectedCollaboratorId(undefined);
    setTimeOffDialogOpen(true);
  };

  const handleApproveTimeOff = (timeOff: CollaboratorTimeOff) => {
    updateTimeOff({
      id: timeOff.id,
      collaborator_id: timeOff.collaborator_id,
      type: timeOff.type,
      start_date: timeOff.start_date,
      end_date: timeOff.end_date,
      reason: timeOff.reason,
      status: 'approved',
    });
  };

  const handleRejectTimeOff = (timeOff: CollaboratorTimeOff) => {
    updateTimeOff({
      id: timeOff.id,
      collaborator_id: timeOff.collaborator_id,
      type: timeOff.type,
      start_date: timeOff.start_date,
      end_date: timeOff.end_date,
      reason: timeOff.reason,
      status: 'rejected',
    });
  };

  const handleOpenSalesDialog = (collaborator: Collaborator) => {
    setSalesCollaborator(collaborator);
    setSalesDialogOpen(true);
  };

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Time & Operação</h1>
            <p className="text-muted-foreground">
              Gerencie colaboradores, equipes e acompanhe a performance
            </p>
          </div>

          {isSuperAdmin && (
            <Select value={agencyFilter || 'all'} onValueChange={(v) => setAgencyFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[220px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todas as agências" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as agências</SelectItem>
                {agencies?.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="collaborators" className="gap-2">
              <Users className="h-4 w-4" />
              Colaboradores
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Building2 className="h-4 w-4" />
              Equipes
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2">
              <Target className="h-4 w-4" />
              Metas
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <Trophy className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="schedules" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Escalas
            </TabsTrigger>
          </TabsList>

          {/* Collaborators Tab */}
          <TabsContent value="collaborators" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar colaboradores..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={teamFilter || 'all'} onValueChange={(v) => setTeamFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas as equipes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as equipes</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
              {isAdmin && (
                <Button onClick={() => { setSelectedCollaborator(null); setCollaboratorDialogOpen(true); }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Colaborador
                </Button>
              )}
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Vínculo</TableHead>
                    <TableHead>Cargo / Nível</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaboratorsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filteredCollaborators.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Nenhum colaborador encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCollaborators.map((collaborator) => (
                      <TableRow 
                        key={collaborator.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleOpenSalesDialog(collaborator)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{collaborator.name}</p>
                            {collaborator.cpf && (
                              <p className="text-xs text-muted-foreground">{collaborator.cpf}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {collaborator.email && <p>{collaborator.email}</p>}
                            {collaborator.phone && <p className="text-muted-foreground">{collaborator.phone}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {employmentTypeLabels[collaborator.employment_type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{collaborator.position || '-'}</p>
                            {collaborator.level && (
                              <Badge variant="secondary" className="text-xs">
                                {levelLabels[collaborator.level]}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {collaborator.team?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{collaborator.commission_percentage}%</p>
                            <p className="text-xs text-muted-foreground">
                              {commissionBaseLabels[collaborator.commission_base]}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={collaborator.status === 'active' ? 'default' : 'secondary'}>
                            {collaborator.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCollaborator(collaborator);
                                  setCollaboratorDialogOpen(true);
                                }}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCollaborator(collaborator);
                                  setGoalDialogOpen(true);
                                }}>
                                  <Target className="h-4 w-4 mr-2" />
                                  Definir Meta
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedCollaborator(collaborator);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-4">
            <div className="flex justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar equipes..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {isAdmin && (
                <Button onClick={() => { setSelectedTeam(null); setTeamDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Equipe
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teamsLoading ? (
                <p>Carregando...</p>
              ) : filteredTeams.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma equipe encontrada</p>
              ) : (
                filteredTeams.map((team) => {
                  const teamCollabs = collaborators.filter(c => c.team_id === team.id);
                  return (
                    <Card key={team.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{team.name}</CardTitle>
                            <Badge variant={team.is_active ? 'default' : 'secondary'}>
                              {team.is_active ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                          {isAdmin && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedTeam(team);
                                  setTeamDialogOpen(true);
                                }}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedTeam(team);
                                    setDeleteTeamDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        {team.description && (
                          <CardDescription>{team.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{teamCollabs.length} colaboradores</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4">
                <Select value={String(performanceMonth)} onValueChange={(v) => setPerformanceMonth(Number(v))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={String(performanceYear)} onValueChange={(v) => setPerformanceYear(Number(v))}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={performanceTeamFilter || 'all'} onValueChange={(v) => setPerformanceTeamFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todas as equipes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as equipes</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {goals.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhuma meta definida para {months.find(m => m.value === performanceMonth)?.label} de {performanceYear}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Defina metas através do menu de cada colaborador na aba "Colaboradores"
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {goals
                  .filter(g => !performanceTeamFilter || g.collaborator?.team_id === performanceTeamFilter)
                  .map((goal) => {
                    const perf = getGoalPerformance(goal.collaborator_id);
                    return (
                      <GoalsTrackingCard
                        key={goal.id}
                        goal={{
                          id: goal.id,
                          collaborator: {
                            id: goal.collaborator_id,
                            name: goal.collaborator?.name || 'Colaborador',
                            team: goal.collaborator?.team,
                          },
                          target_sales_value: goal.target_sales_value,
                          target_profit: goal.target_profit,
                          target_deals_count: goal.target_deals_count,
                          month: goal.month,
                          year: goal.year,
                        }}
                        currentSales={perf.currentSales}
                        currentProfit={perf.currentProfit}
                        currentDeals={perf.currentDeals}
                        formatCurrency={formatCurrency}
                        onEdit={isAdmin ? () => {
                          const collab = collaborators.find(c => c.id === goal.collaborator_id);
                          if (collab) {
                            setSelectedCollaborator(collab);
                            setGoalDialogOpen(true);
                          }
                        } : undefined}
                        onDelete={isAdmin ? () => {
                          setGoalToDelete(goal);
                          setDeleteGoalDialogOpen(true);
                        } : undefined}
                        onCardClick={() => {
                          const collab = collaborators.find(c => c.id === goal.collaborator_id);
                          if (collab) {
                            setSalesCollaborator(collab);
                            setSalesDialogOpen(true);
                          }
                        }}
                      />
                    );
                  })}
              </div>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <Select value={String(performanceMonth)} onValueChange={(v) => setPerformanceMonth(Number(v))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(performanceYear)} onValueChange={(v) => setPerformanceYear(Number(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={performanceTeamFilter || 'all'} onValueChange={(v) => setPerformanceTeamFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas as equipes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as equipes</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Vendido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(totals.totalSales)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Lucro Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(totals.totalProfit)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Vendas Fechadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{totals.totalDeals}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Comissões Geradas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(totals.totalCommissions)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Team Performance */}
            {teamPerformance.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Performance por Equipe</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {teamPerformance.map((tp) => (
                    <Card key={tp.team.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{tp.team.name}</CardTitle>
                        <CardDescription>{tp.collaboratorsCount} colaboradores</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Vendas</p>
                            <p className="font-semibold">{formatCurrency(tp.totalSales)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Lucro</p>
                            <p className="font-semibold">{formatCurrency(tp.totalProfit)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Negócios</p>
                            <p className="font-semibold">{tp.dealsCount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Conversão</p>
                            <p className="font-semibold">{tp.conversionRate.toFixed(1)}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Ranking */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Ranking de Colaboradores</h3>
              {performanceLoading ? (
                <p>Carregando...</p>
              ) : rankings.bySales.length === 0 ? (
                <p className="text-muted-foreground">Nenhum dado de performance encontrado para este período</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rankings.bySales.slice(0, 6).map((perf, index) => (
                    <PerformanceCard
                      key={perf.collaborator.id}
                      performance={perf}
                      rank={index + 1}
                      formatCurrency={formatCurrency}
                      onCardClick={() => {
                        const collab = collaborators.find(c => c.id === perf.collaborator.id);
                        if (collab) {
                          setSalesCollaborator(collab);
                          setSalesDialogOpen(true);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules" className="space-y-6">
            {isAdmin && (
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => { setSelectedShiftType(null); setShiftTypeDialogOpen(true); }}>
                    <Clock className="h-4 w-4 mr-2" />
                    Novo Tipo de Plantão
                  </Button>
                  <Button variant="outline" onClick={() => handleAddTimeOff()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Férias/Folga
                  </Button>
                </div>
              </div>
            )}

            {/* Shift Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tipos de Plantão</CardTitle>
                <CardDescription>Configure os turnos disponíveis para escalas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {shiftTypes.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum tipo de plantão cadastrado</p>
                  ) : (
                    shiftTypes.map((st) => (
                      <Badge
                        key={st.id}
                        variant="outline"
                        className={isAdmin ? "cursor-pointer px-3 py-1.5" : "px-3 py-1.5"}
                        style={{ borderColor: st.color, color: st.color }}
                        onClick={isAdmin ? () => { setSelectedShiftType(st); setShiftTypeDialogOpen(true); } : undefined}
                      >
                        {st.name} ({st.start_time?.slice(0, 5)} - {st.end_time?.slice(0, 5)})
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Time Off List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Férias e Folgas</CardTitle>
              </CardHeader>
              <CardContent>
                {timeOffs.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma férias/folga cadastrada</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeOffs.map((to) => (
                        <TableRow key={to.id}>
                          <TableCell>{to.collaborator?.name}</TableCell>
                          <TableCell><Badge variant="outline">{timeOffTypeLabels[to.type]}</Badge></TableCell>
                          <TableCell>{to.start_date} - {to.end_date}</TableCell>
                          <TableCell><Badge variant={to.status === 'approved' ? 'default' : to.status === 'rejected' ? 'destructive' : 'secondary'}>{timeOffStatusLabels[to.status]}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{to.reason || '-'}</TableCell>
                          <TableCell>
                            {isAdmin && (
                              to.status === 'pending' ? (
                                <Button size="sm" onClick={() => handleApproveTimeOff(to)}>
                                  Aprovar
                                </Button>
                              ) : to.status === 'approved' ? (
                                <Button size="sm" variant="outline" onClick={() => handleRejectTimeOff(to)}>
                                  Cancelar
                                </Button>
                              ) : null
                            )}
                          </TableCell>
                          <TableCell>
                            {isAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedTimeOff(to); setTimeOffDialogOpen(true); }}>
                                    <Pencil className="h-4 w-4 mr-2" />Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedTimeOff(to); setDeleteTimeOffDialogOpen(true); }}>
                                    <Trash2 className="h-4 w-4 mr-2" />Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Schedule Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Calendário de Escalas</CardTitle>
              </CardHeader>
              <CardContent>
                <ScheduleCalendar
                  schedules={schedules}
                  timeOffs={timeOffs}
                  collaborators={collaborators}
                  shiftTypes={shiftTypes}
                  onAddSchedule={isAdmin ? handleAddSchedule : undefined}
                  onEditSchedule={isAdmin ? handleEditSchedule : undefined}
                  onEditTimeOff={isAdmin ? handleEditTimeOff : undefined}
                  onAddTimeOff={isAdmin ? handleAddTimeOff : undefined}
                  canEdit={isAdmin}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
      <TeamDialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen} team={selectedTeam} onSave={handleSaveTeam} isLoading={isCreatingTeam || isUpdatingTeam} />
      <CollaboratorDialog open={collaboratorDialogOpen} onOpenChange={setCollaboratorDialogOpen} collaborator={selectedCollaborator} teams={teams} onSave={handleSaveCollaborator} isLoading={isCreating || isUpdating} />
      <GoalDialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen} collaborator={selectedCollaborator} onSave={handleSaveGoal} isLoading={isUpserting} />
      <ShiftTypeDialog open={shiftTypeDialogOpen} onOpenChange={setShiftTypeDialogOpen} shiftType={selectedShiftType} onSave={handleSaveShiftType} isLoading={isCreatingShift || isUpdatingShift} />
      <ScheduleDialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen} schedule={selectedSchedule} collaborators={collaborators} shiftTypes={shiftTypes} onSave={handleSaveSchedule} onSaveBulk={handleSaveBulkSchedule} onDelete={handleDeleteSchedule} onBulkDelete={handleBulkDeleteSchedule} similarCount={getSimilarSchedulesCount(selectedSchedule)} isLoading={isCreatingSchedule || isBulkCreating || isBulkDeleting} preselectedDate={preselectedDate} preselectedCollaboratorId={preselectedCollaboratorId} />
      <TimeOffDialog open={timeOffDialogOpen} onOpenChange={setTimeOffDialogOpen} timeOff={selectedTimeOff} collaborators={collaborators} onSave={handleSaveTimeOff} onDelete={(id) => { deleteTimeOffRecord(id); setTimeOffDialogOpen(false); setSelectedTimeOff(null); }} isLoading={isCreatingTimeOff || isUpdatingTimeOff} preselectedCollaboratorId={preselectedCollaboratorId} />
      <CollaboratorSalesDialog open={salesDialogOpen} onOpenChange={setSalesDialogOpen} collaborator={salesCollaborator} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Colaborador</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir o colaborador "{selectedCollaborator?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCollaborator} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTeamDialogOpen} onOpenChange={setDeleteTeamDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Equipe</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir a equipe "{selectedTeam?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeam} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteGoalDialogOpen} onOpenChange={setDeleteGoalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Meta</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta meta?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoal} className="bg-destructive text-destructive-foreground">{isDeletingGoal ? 'Excluindo...' : 'Excluir'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteShiftTypeDialogOpen} onOpenChange={setDeleteShiftTypeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tipo de Plantão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir o tipo "{selectedShiftType?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteShiftType} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTimeOffDialogOpen} onOpenChange={setDeleteTimeOffDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Férias/Folga</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este registro?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTimeOff} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
