import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Users, 
  Clock, 
  Trash2, 
  ArrowUp, 
  Copy, 
  Check,
  Mail,
  Phone,
  Plus,
  MoreHorizontal,
  UserPlus,
  FileText,
} from 'lucide-react';
import { ExpeditionGroup, ExpeditionRegistration, useExpeditionRegistrations } from '@/hooks/useExpeditionGroups';
import { useToast } from '@/hooks/use-toast';
import { ClientDialog } from '@/components/clients/ClientDialog';
import { ProposalDialog } from '@/components/proposals/ProposalDialog';
import { useClients, ClientInput } from '@/hooks/useClients';
import { useProposals, ProposalInput } from '@/hooks/useProposals';
import { usePipelineStages } from '@/hooks/usePipelineStages';

const STATUS_OPTIONS = [
  { value: 'entrou_na_lista', label: 'Entrou na lista', color: 'bg-muted text-muted-foreground' },
  { value: 'em_captacao', label: 'Em captação', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
];

interface ExpeditionRegistrationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: ExpeditionGroup | null;
}

export function ExpeditionRegistrationsDialog({
  open,
  onOpenChange,
  group,
}: ExpeditionRegistrationsDialogProps) {
  const { toast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<ExpeditionRegistration | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRegistration, setNewRegistration] = useState({ name: '', email: '', phone: '' });
  
  // Client dialog state
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientPrefill, setClientPrefill] = useState<Partial<ClientInput> | null>(null);
  
  // Lead dialog state
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadPrefill, setLeadPrefill] = useState<Partial<ProposalInput> | null>(null);
  
  // Hooks for clients and proposals
  const { clients, createClient, isCreating: isCreatingClient } = useClients();
  const { createProposal, isCreating: isCreatingProposal } = useProposals();
  const { stages } = usePipelineStages();
  
  const {
    confirmed,
    waitlist,
    isLoading,
    deleteRegistration,
    promoteFromWaitlist,
    updateRegistrationStatus,
    isDeleting,
    isPromoting,
    createRegistration,
    isCreating,
  } = useExpeditionRegistrations(group?.id || null);

  const handleCreateClient = (reg: ExpeditionRegistration) => {
    setClientPrefill({
      name: reg.name,
      email: reg.email || '',
      phone: reg.phone || '',
    });
    setClientDialogOpen(true);
  };

  const handleClientSubmit = (data: ClientInput & { id?: string }) => {
    createClient(data);
    setClientPrefill(null);
  };

  const handleCreateLead = (reg: ExpeditionRegistration) => {
    setLeadPrefill({
      title: `${group?.destination} - ${reg.name}`,
      notes: `Inscrito na expedição: ${group?.destination}\nNome: ${reg.name}\nEmail: ${reg.email}${reg.phone ? `\nTelefone: ${reg.phone}` : ''}`,
    });
    setLeadDialogOpen(true);
  };

  const handleLeadSubmit = (data: ProposalInput & { id?: string }) => {
    createProposal(data);
    setLeadPrefill(null);
  };

  const publicUrl = group 
    ? `${window.location.origin}/expeditions/${group.public_token}` 
    : '';

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopiedUrl(true);
    toast({ title: 'URL copiada!' });
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleAddRegistration = async () => {
    if (!group || !newRegistration.name || !newRegistration.email) return;
    
    const isWaitlist = confirmed.length >= group.max_participants;
    createRegistration(
      {
        groupId: group.id,
        name: newRegistration.name,
        email: newRegistration.email,
        phone: newRegistration.phone || '',
        isWaitlist,
        status: isWaitlist ? 'entrou_na_lista' : 'confirmado',
      },
      {
        onSuccess: () => {
          setNewRegistration({ name: '', email: '', phone: '' });
          setShowAddForm(false);
        },
      },
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!group) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Inscritos - {group.destination}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Public URL */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <Label className="text-sm font-medium">Link Público de Inscrição</Label>
              <div className="flex gap-2">
                <Input value={publicUrl} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                  {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-base py-1 px-3">
                <Users className="w-4 h-4 mr-2" />
                {confirmed.length}/{group.max_participants} confirmados
              </Badge>
              {waitlist.length > 0 && (
                <Badge variant="secondary" className="text-base py-1 px-3">
                  <Clock className="w-4 h-4 mr-2" />
                  {waitlist.length} na espera
                </Badge>
              )}
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <h4 className="font-medium">Nova Inscrição Manual</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={newRegistration.name}
                      onChange={(e) => setNewRegistration({ ...newRegistration, name: e.target.value })}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newRegistration.email}
                      onChange={(e) => setNewRegistration({ ...newRegistration, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={newRegistration.phone}
                      onChange={(e) => setNewRegistration({ ...newRegistration, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddRegistration}
                    disabled={isCreating || !newRegistration.name || !newRegistration.email}
                  >
                    {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Adicionar
                  </Button>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="confirmed">
                <TabsList>
                  <TabsTrigger value="confirmed">
                    Confirmados ({confirmed.length})
                  </TabsTrigger>
                  <TabsTrigger value="waitlist">
                    Lista de Espera ({waitlist.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="confirmed" className="mt-4">
                  {confirmed.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum inscrito confirmado
                    </div>
                  ) : (
                    <RegistrationTable 
                      registrations={confirmed} 
                      onDelete={setRegistrationToDelete}
                      onStatusChange={updateRegistrationStatus}
                      onCreateClient={handleCreateClient}
                      onCreateLead={handleCreateLead}
                      formatDate={formatDate}
                    />
                  )}
                </TabsContent>

                <TabsContent value="waitlist" className="mt-4">
                  {waitlist.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Lista de espera vazia
                    </div>
                  ) : (
                    <RegistrationTable 
                      registrations={waitlist} 
                      onDelete={setRegistrationToDelete}
                      onPromote={promoteFromWaitlist}
                      onStatusChange={updateRegistrationStatus}
                      onCreateClient={handleCreateClient}
                      onCreateLead={handleCreateLead}
                      isWaitlist
                      formatDate={formatDate}
                      canPromote={confirmed.length < group.max_participants}
                    />
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!registrationToDelete} onOpenChange={() => setRegistrationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Inscrito</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{registrationToDelete?.name}" da lista?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (registrationToDelete) {
                  deleteRegistration(registrationToDelete.id);
                  setRegistrationToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Client Dialog */}
      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={(open) => {
          setClientDialogOpen(open);
          if (!open) setClientPrefill(null);
        }}
        client={clientPrefill ? {
          id: '',
          agency_id: '',
          name: clientPrefill.name || '',
          email: clientPrefill.email || '',
          phone: clientPrefill.phone || '',
          cpf: '',
          passport: '',
          birth_date: '',
          address: '',
          notes: '',
          created_at: '',
          updated_at: '',
        } as any : null}
        onSubmit={handleClientSubmit}
        isLoading={isCreatingClient}
      />

      {/* Lead/Proposal Dialog */}
      <ProposalDialog
        open={leadDialogOpen}
        onOpenChange={(open) => {
          setLeadDialogOpen(open);
          if (!open) setLeadPrefill(null);
        }}
        proposal={leadPrefill ? {
          id: '',
          agency_id: '',
          number: 0,
          title: leadPrefill.title || '',
          client_id: null,
          stage_id: stages?.[0]?.id || null,
          notes: leadPrefill.notes || '',
          total_value: 0,
          discount: 0,
        } as any : null}
        clients={clients || []}
        stages={stages || []}
        onSubmit={handleLeadSubmit}
        isLoading={isCreatingProposal}
      />
    </>
  );
}

function RegistrationTable({
  registrations,
  onDelete,
  onPromote,
  onStatusChange,
  onCreateClient,
  onCreateLead,
  isWaitlist = false,
  formatDate,
  canPromote = false,
}: {
  registrations: ExpeditionRegistration[];
  onDelete: (r: ExpeditionRegistration) => void;
  onPromote?: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onCreateClient: (r: ExpeditionRegistration) => void;
  onCreateLead: (r: ExpeditionRegistration) => void;
  isWaitlist?: boolean;
  formatDate: (date: string) => string;
  canPromote?: boolean;
}) {
  const getStatusOption = (status: string) => {
    return STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[0];
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {registrations.map((reg, index) => (
          <TableRow key={reg.id}>
            <TableCell className="font-medium">{index + 1}</TableCell>
            <TableCell>{reg.name}</TableCell>
            <TableCell>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  {reg.email}
                </div>
                {reg.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    {reg.phone}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Select
                value={reg.status || 'entrou_na_lista'}
                onValueChange={(value) => onStatusChange(reg.id, value)}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue>
                    <Badge className={`${getStatusOption(reg.status || 'entrou_na_lista').color} text-xs`}>
                      {getStatusOption(reg.status || 'entrou_na_lista').label}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <Badge className={`${opt.color} text-xs`}>{opt.label}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(reg.created_at)}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onCreateClient(reg)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Cadastrar Cliente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCreateLead(reg)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Criar Lead
                  </DropdownMenuItem>
                  {isWaitlist && onPromote && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onPromote(reg.id)}>
                        <ArrowUp className="w-4 h-4 mr-2 text-green-600" />
                        Promover para Confirmado
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(reg)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
