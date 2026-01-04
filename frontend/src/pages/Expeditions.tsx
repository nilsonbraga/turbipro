import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Loader2,
  Copy,
  Check,
  Building2,
  ClipboardList,
  FileText,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  // Task and Lead dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskPrefill, setTaskPrefill] = useState<{ title: string; description: string } | null>(null);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadPrefill, setLeadPrefill] = useState<{ title: string; notes: string } | null>(null);

  const filteredGroups = groups.filter(group => {
    const searchLower = searchTerm.toLowerCase();
    return (
      group.destination.toLowerCase().includes(searchLower) ||
      (group.description?.toLowerCase().includes(searchLower))
    );
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Grupos de Expedição</h1>
          <p className="text-muted-foreground">Gerencie seus grupos e inscrições</p>
        </div>
        <Button onClick={() => { setEditingGroup(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Grupo
        </Button>
      </div>

      {/* Super Admin Agency Filter */}
      {isSuperAdmin && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrar por agência:</span>
          </div>
          <Select
            value={agencyFilter || 'all'}
            onValueChange={(value) => setAgencyFilter(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Todas as agências" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as agências</SelectItem>
              {agencies?.map((ag) => (
                <SelectItem key={ag.id} value={ag.id}>
                  {ag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{groups.length}</p>
                <p className="text-sm text-muted-foreground">Total de Grupos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingGroups.length}</p>
                <p className="text-sm text-muted-foreground">Próximos Grupos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalParticipants}</p>
                <p className="text-sm text-muted-foreground">Inscritos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalWaitlist}</p>
                <p className="text-sm text-muted-foreground">Na Lista de Espera</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por destino..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destino</TableHead>
                {isSuperAdmin && <TableHead>Agência</TableHead>}
                <TableHead>Data</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Vagas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} className="text-center text-muted-foreground py-8">
                    Nenhum grupo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{group.destination}</p>
                          {group.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <Badge variant="outline">
                          {(group as ExpeditionGroupWithAgency).agency_name || 'N/A'}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(group.start_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {group.duration_days} {group.duration_days === 1 ? 'dia' : 'dias'}
                    </TableCell>
                    <TableCell>
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleViewRegistrations(group)}
                      >
                        <Users className="w-4 h-4" />
                        <span className="font-medium">
                          {group.registrations_count}/{group.max_participants}
                        </span>
                        {(group.waitlist_count || 0) > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            +{group.waitlist_count} espera
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={group.is_active ? 'default' : 'secondary'}>
                        {group.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

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
