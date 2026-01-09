import { useState, useRef } from 'react';
import { Proposal, useProposals } from '@/hooks/useProposals';
import { useCollaborators } from '@/hooks/useCollaborators';
import { useCollaboratorCommissions } from '@/hooks/useCollaboratorCommissions';
import { useProposalServices, ProposalService, ServiceInput } from '@/hooks/useProposalServices';
import { useProposalHistory } from '@/hooks/useProposalHistory';
import { useProposalTags } from '@/hooks/useProposalTags';
import { useProposalFiles } from '@/hooks/useProposalFiles';
import { usePublicProposalLinks } from '@/hooks/usePublicProposalLinks';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { usePartners } from '@/hooks/usePartners';
import { useTags } from '@/hooks/useTags';
import { useAuth } from '@/contexts/AuthContext';
import { ServiceDialog } from './ServiceDialog';
import { generateProposalPDF } from '@/utils/pdfExport';
import { apiFetch } from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

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
  Activity,
  Plane,
  Hotel,
  Car,
  Package,
  Map,
  Calendar,
  Download,
  Edit,
  Clock,
  Plus,
  MoreHorizontal,
  Trash2,
  Tag,
  X,
  Ship,
  Shield,
  Bus,
  Loader2,
  Upload,
  Eye,
  ArrowRight,
  FileText,
  Copy,
  StickyNote,
  FolderOpen,
  FileUp,
  Check,
  ChevronDown,
  Link,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { format as formatDateFns, parseISO, parse } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ProposalDetailProps {
  proposal: Proposal;
  onClose: () => void;
  onEdit: () => void;
  onProposalUpdate?: (proposal: Proposal) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (value?: string | null) => {
  if (!value) return '';
  try {
    const date = value.length <= 10 ? parse(value, 'yyyy-MM-dd', new Date()) : parseISO(value);
    return formatDateFns(date, 'dd MMM yyyy');
  } catch {
    return value;
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  try {
    const date = value.length <= 10 ? parse(value, 'yyyy-MM-dd', new Date()) : parseISO(value);
    return formatDateFns(date, 'dd MMM yyyy, HH:mm');
  } catch {
    return value;
  }
};

const serviceIcons: Record<string, typeof Plane> = {
  flight: Plane,
  hotel: Hotel,
  car: Car,
  package: Package,
  tour: Map,
  cruise: Ship,
  insurance: Shield,
  transfer: Bus,
  other: Package,
};

const serviceLabels: Record<string, string> = {
  flight: 'Voo',
  hotel: 'Hotel',
  car: 'Carro',
  package: 'Pacote',
  tour: 'Roteiro',
  cruise: 'Cruzeiro',
  insurance: 'Seguro',
  transfer: 'Transfer',
  other: 'Outro',
};

const actionIcons: Record<string, typeof Activity> = {
  'Proposta criada': Plus,
  'Serviço adicionado': Plus,
  'Serviço atualizado': Edit,
  'Serviço removido': Trash2,
  'Etapa alterada': ArrowRight,
  'Nota adicionada': StickyNote,
  'Arquivo anexado': FileUp,
  'Tag adicionada': Tag,
  'Tag removida': X,
};

function StageSwitcher({
  stages,
  currentStageId,
  onChange,
}: {
  stages: Array<{ id: string; name: string; color?: string | null }>;
  currentStageId: string;
  onChange: (id: string) => void;
}) {
  const current = stages.find((s) => s.id === currentStageId);
  const currentIndex = Math.max(0, stages.findIndex((s) => s.id === currentStageId));
  const progress = stages.length <= 1 ? 100 : Math.round((currentIndex / (stages.length - 1)) * 100);

  return (
    <div className="relative w-full rounded-none border-none bg-background/60 pb-2">
      <div className="flex justify-between gap-2 min-w-0">
        <Badge
          className="text-xs rounded-md h-7\8 text-primary-foreground shrink-0"
          style={{ backgroundColor: current?.color || '#64748b' }}
        >
          {current?.name || 'Etapa'}
        </Badge>

<span className='flex gap-2 items-center'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs shrink-0">
              Alterar etapa
              <ChevronDown className="w-4 h-4 ml-1.5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-72">
            <div className="px-2 py-1.5 text-xs text-muted-foreground">Selecione a etapa:</div>
            {stages.map((s) => {
              const isCurrent = s.id === currentStageId;
              return (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => onChange(s.id)}
                  className="flex items-center gap-2"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: s.color || '#94a3b8' }}
                  />
                  <span className="flex-1 truncate">{s.name}</span>
                  {isCurrent ? <Check className="w-4 h-4" /> : null}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-xs text-muted-foreground shrink-0">
          {currentIndex + 1}/{stages.length}
        </span>
        </span>
      </div>

      {/* Barra de progresso embutida (sem “quebrar” o header em mais uma linha visual) */}
      <div className="absolute left-0 bottom-0 h-1 w-full bg-muted overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${progress}%`, backgroundColor: current?.color || '#64748b' }}
        />
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
  onView,
}: {
  service: ProposalService;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const Icon = serviceIcons[service.type] || Package;
  const value = service.value || 0;
  const serviceCommission =
    service.commission_type === 'percentage'
      ? (value * (service.commission_value || 0)) / 100
      : service.commission_value || 0;

  return (
    <Card onClick={onView} className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {serviceLabels[service.type] || service.type}
              </Badge>
              {service.partners?.name && (
                <span className="text-xs text-muted-foreground truncate">{service.partners.name}</span>
              )}
            </div>

            <p className="font-medium mt-1 truncate">{service.description || 'Sem descrição'}</p>

            {(service.origin || service.destination) && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {service.origin} {service.origin && service.destination && '→'} {service.destination}
              </p>
            )}

            {(service.start_date || service.end_date) && (
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <Calendar className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {service.start_date && formatDate(service.start_date)}
                  {service.start_time ? ` ${service.start_time}` : ''}
                  {service.end_date && service.start_date !== service.end_date
                    ? ` → ${formatDate(service.end_date)}${service.end_time ? ` ${service.end_time}` : ''}`
                    : ''}
                </span>
              </div>
            )}
          </div>

          <div className="text-right shrink-0">
            <p className="font-semibold">{formatCurrency(value)}</p>
            {serviceCommission > 0 && (
              <p className="text-xs text-primary">Comissão: {formatCurrency(serviceCommission)}</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineItem({ log }: { log: any }) {
  const Icon = actionIcons[log.action] || Activity;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 w-px bg-border mt-2" />
      </div>

      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{log.action}</span>
        </div>

        {log.description && <p className="text-sm text-muted-foreground mb-1">{log.description}</p>}

        {log.old_value &&
          log.new_value &&
          typeof log.old_value === 'string' &&
          typeof log.new_value === 'string' && (
            <p className="text-sm text-muted-foreground mb-1">
              <span className="line-through">{log.old_value}</span>
              {' → '}
              <span className="font-medium">{log.new_value}</span>
            </p>
          )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{formatDateTime(log.created_at)}</span>
          <span>por</span>
          <span className="font-medium">{log.user_name || 'Sistema'}</span>
        </div>
      </div>
    </div>
  );
}

export function ProposalDetail({ proposal, onClose, onEdit, onProposalUpdate }: ProposalDetailProps) {
  const { agency, profile } = useAuth();
  const { toast } = useToast();

  const { updateProposalStage } = useProposals();
  const { collaborators } = useCollaborators();
  const { createCommission, deleteCommission } = useCollaboratorCommissions();
  const { services, createService, updateService, deleteService, isCreating, isUpdating, isDeleting } =
    useProposalServices(proposal.id);
  const { history, addHistory } = useProposalHistory(proposal.id);
  const { tags: proposalTags, addTag, removeTag } = useProposalTags(proposal.id);
  const { files, uploadFile, deleteFile, isUploading } = useProposalFiles(proposal.id);
  const { links: publicLinks, createLink, isCreating: isCreatingLink } = usePublicProposalLinks(proposal.id);
  const { stages } = usePipelineStages();
  const { partners } = usePartners();
  const { tags: availableTags } = useTags();

  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ProposalService | null>(null);
  const [pendingServiceType, setPendingServiceType] = useState<string>('flight');
  const [serviceDialogMode, setServiceDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [deleteServiceDialog, setDeleteServiceDialog] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ProposalService | null>(null);

  const [note, setNote] = useState('');
  const [deleteFileDialog, setDeleteFileDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [currentStageId, setCurrentStageId] = useState(proposal.stage_id);
  const [pendingStageId, setPendingStageId] = useState<string | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const client = proposal.clients;
  const totalServices = services.reduce((sum, s) => sum + (s.value || 0), 0);

  const totalCommission = services.reduce((sum, s) => {
    const serviceValue = s.value || 0;
    const serviceComm =
      s.commission_type === 'percentage'
        ? (serviceValue * (s.commission_value || 0)) / 100
        : s.commission_value || 0;
    return sum + serviceComm;
  }, 0);

  const commissionPercentage =
    totalServices > 0 ? ((totalCommission / totalServices) * 100).toFixed(1) : '0';

  const discountValue = (totalServices * (proposal.discount || 0)) / 100;
  const finalValue = totalServices - discountValue;

  const deriveServiceDates = (service: any): { startDate: string | null; endDate: string | null } => {
    const d = service.details || {};
    const type = service.type;

    const toLocalISO = (date?: string | null, time?: string | null, fallbackTime = '12:00') => {
      if (!date) return null;
      const hasTime = date.includes('T');
      const base = hasTime ? date : `${date}T${time || fallbackTime}`;
      const dt = new Date(base);
      return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
    };

    const toISO = (val?: string | null, time?: string | null) => {
      if (!val) return null;
      if (val.includes('T')) {
        const dt = new Date(val);
        return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
      }
      return toLocalISO(val, time);
    };

    if (type === 'flight') {
      const segments = Array.isArray(d.segments) ? d.segments : [];
      const first = segments[0];
      const last = segments[segments.length - 1];
      return {
        startDate: toISO(first?.departureAt) ?? toISO(service.startDate),
        endDate: toISO(last?.arrivalAt) ?? toISO(service.endDate),
      };
    }
    if (type === 'hotel') {
      return {
        startDate: toISO(d.checkIn, d.checkInTime),
        endDate: toISO(d.checkOut, d.checkOutTime),
      };
    }
    if (type === 'car') {
      return {
        startDate: toISO(d.pickupAt),
        endDate: toISO(d.dropoffAt),
      };
    }
    if (type === 'transfer') {
      return {
        startDate: toISO(d.pickupAt),
        endDate: toISO(d.pickupAt),
      };
    }
    if (type === 'package' || type === 'tour') {
      return {
        startDate: toLocalISO(d.startDate, '00:00'),
        endDate: toLocalISO(d.endDate, '23:59'),
      };
    }
    return { startDate: toISO(service.startDate), endDate: toISO(service.endDate) };
  };

  const syncServicesDatesForCalendar = async (clear = false) => {
    const params = new URLSearchParams({
      where: JSON.stringify({ proposalId: proposal.id }),
      include: JSON.stringify({ partner: { select: { id: true } } }),
    });
    const { data } = await apiFetch<{ data: any[] }>(`/api/proposalService?${params.toString()}`);
    await Promise.all(
      (data || []).map(async (service) => {
        const { startDate, endDate } = clear ? { startDate: null, endDate: null } : deriveServiceDates(service);
        await apiFetch(`/api/proposalService/${service.id}`, {
          method: 'PUT',
          body: JSON.stringify({ startDate, endDate }),
        });
      }),
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleStageChange = (newStageId: string) => {
    if (newStageId === currentStageId) return;

    const oldStage = stages.find((s) => s.id === currentStageId);
    const newStage = stages.find((s) => s.id === newStageId);

    if (oldStage?.is_closed && !newStage?.is_closed) {
      setPendingStageId(newStageId);
      setReopenDialogOpen(true);
      return;
    }

    if (!oldStage?.is_closed && newStage?.is_closed) {
      setPendingStageId(newStageId);
      setCloseDialogOpen(true);
      return;
    }

    setCurrentStageId(newStageId);
    updateProposalStage({ id: proposal.id, stage_id: newStageId });

    addHistory({
      proposal_id: proposal.id,
      action: 'Etapa alterada',
      description: `Proposta movida para ${newStage?.name}`,
      old_value: oldStage?.name,
      new_value: newStage?.name,
    });
    onProposalUpdate?.({ ...proposal, stage_id: newStageId });
  };

  const confirmCloseWithTransaction = async () => {
    if (!pendingStageId) return;
    setIsCreatingTransaction(true);

    const oldStage = stages.find((s) => s.id === currentStageId);
    const newStage = stages.find((s) => s.id === pendingStageId);

    try {
      updateProposalStage({ id: proposal.id, stage_id: pendingStageId });
      setCurrentStageId(pendingStageId);
      addHistory({
        proposal_id: proposal.id,
        action: 'Etapa alterada',
        description: `Proposta movida para ${newStage?.name}`,
        old_value: oldStage?.name,
        new_value: newStage?.name,
      });
      onProposalUpdate?.({ ...proposal, stage_id: pendingStageId });

      await syncServicesDatesForCalendar();

      const totalValue = Number(totalServices || 0);
      const profitValue = Number(totalCommission || 0);

      if (totalValue > 0) {
        const clientName = proposal.clients?.name || null;
        const clientCpf = proposal.clients?.cpf || null;

        await apiFetch('/api/financialTransaction', {
          method: 'POST',
          body: JSON.stringify({
            agencyId: proposal.agency_id,
            type: 'income',
            category: 'Venda',
            description: `Proposta #${proposal.number} - ${proposal.title}`,
            proposalId: proposal.id,
            clientId: proposal.client_id,
            documentNumber: clientName,
            documentName: clientCpf,
            totalValue,
            profitValue,
            status: 'pending',
            launchDate: new Date().toISOString(),
          }),
        });
      }

      const collaborator = proposal.assigned_collaborator_id
        ? collaborators.find((c) => c.id === proposal.assigned_collaborator_id)
        : collaborators.find((c) => c.user_id === profile?.id);

      if (collaborator) {
        const currentDate = new Date();
        const commissionBase =
          collaborator.commission_base === 'profit' ? profitValue : totalValue;
        const commissionAmount = (commissionBase * collaborator.commission_percentage) / 100;

        await createCommission({
          collaborator_id: collaborator.id,
          proposal_id: proposal.id,
          sale_value: totalValue,
          profit_value: profitValue,
          commission_percentage: collaborator.commission_percentage,
          commission_base: collaborator.commission_base,
          commission_amount: commissionAmount,
          period_month: currentDate.getMonth() + 1,
          period_year: currentDate.getFullYear(),
        });
      }
    } catch (error: any) {
      toast({ title: 'Erro ao criar transação financeira', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreatingTransaction(false);
      setCloseDialogOpen(false);
      setPendingStageId(null);
    }
  };

  const confirmCloseWithoutTransaction = async () => {
    if (!pendingStageId) return;
    setIsCreatingTransaction(true);

    const oldStage = stages.find((s) => s.id === currentStageId);
    const newStage = stages.find((s) => s.id === pendingStageId);

    try {
      updateProposalStage({ id: proposal.id, stage_id: pendingStageId });
      setCurrentStageId(pendingStageId);
      addHistory({
        proposal_id: proposal.id,
        action: 'Etapa alterada',
        description: `Proposta movida para ${newStage?.name}`,
        old_value: oldStage?.name,
        new_value: newStage?.name,
      });
      onProposalUpdate?.({ ...proposal, stage_id: pendingStageId });

      await syncServicesDatesForCalendar();
    } catch (error: any) {
      toast({ title: 'Erro ao fechar proposta', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreatingTransaction(false);
      setCloseDialogOpen(false);
      setPendingStageId(null);
    }
  };

  const confirmReopenAndCancelTransaction = async () => {
    if (!pendingStageId) return;
    setIsCreatingTransaction(true);

    const oldStage = stages.find((s) => s.id === currentStageId);
    const newStage = stages.find((s) => s.id === pendingStageId);

    try {
      updateProposalStage({ id: proposal.id, stage_id: pendingStageId });
      setCurrentStageId(pendingStageId);
      addHistory({
        proposal_id: proposal.id,
        action: 'Etapa alterada',
        description: `Proposta movida para ${newStage?.name}`,
        old_value: oldStage?.name,
        new_value: newStage?.name,
      });
      onProposalUpdate?.({ ...proposal, stage_id: pendingStageId });

      await syncServicesDatesForCalendar(true);

      const search = new URLSearchParams({
        where: JSON.stringify({ proposalId: proposal.id, type: 'income' }),
      });
      const { data: transactions } = await apiFetch<{ data: any[] }>(`/api/financialTransaction?${search.toString()}`);
      await Promise.all(
        (transactions || []).map((tx) =>
          apiFetch(`/api/financialTransaction/${tx.id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'cancelled' }),
          }),
        ),
      );

      deleteCommission(proposal.id);
    } catch (error: any) {
      toast({ title: 'Erro ao cancelar transação financeira', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreatingTransaction(false);
      setReopenDialogOpen(false);
      setPendingStageId(null);
    }
  };

  const handleAddService = (type: string) => {
    setPendingServiceType(type);
    setEditingService(null);
    setServiceDialogMode('create');
    setServiceDialogOpen(true);
  };

  const handleEditService = (service: ProposalService) => {
    setEditingService(service);
    setPendingServiceType(service.type);
    setServiceDialogMode('edit');
    setServiceDialogOpen(true);
  };

  const handleViewService = (service: ProposalService) => {
    setEditingService(service);
    setPendingServiceType(service.type);
    setServiceDialogMode('view');
    setServiceDialogOpen(true);
  };

  const handleDeleteService = (service: ProposalService) => {
    setServiceToDelete(service);
    setDeleteServiceDialog(true);
  };

  const confirmDeleteService = () => {
    if (!serviceToDelete) return;

    deleteService(serviceToDelete.id);
    addHistory({
      proposal_id: proposal.id,
      action: 'Serviço removido',
      description: `${serviceLabels[serviceToDelete.type] || serviceToDelete.type}: ${
        serviceToDelete.description || 'Sem descrição'
      }`,
    });

    setDeleteServiceDialog(false);
    setServiceToDelete(null);
  };

  const handleServiceDialogOpenChange = (open: boolean) => {
    setServiceDialogOpen(open);
    if (!open) {
      setEditingService(null);
      setServiceDialogMode('create');
    }
  };

  const handleServiceSubmit = (data: ServiceInput & { id?: string }) => {
    if (data.id) {
      updateService(data as ServiceInput & { id: string });
      addHistory({
        proposal_id: proposal.id,
        action: 'Serviço atualizado',
        description: `${serviceLabels[data.type] || data.type}: ${data.description || 'Sem descrição'}`,
      });
    } else {
      createService(data);
      addHistory({
        proposal_id: proposal.id,
        action: 'Serviço adicionado',
        description: `${serviceLabels[data.type] || data.type}: ${data.description || 'Sem descrição'}`,
      });
    }
  };

  const handleAddNote = () => {
    if (!note.trim()) return;

    addHistory({
      proposal_id: proposal.id,
      action: 'Nota adicionada',
      description: note,
    });

    setNote('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile({ file });
      addHistory({
        proposal_id: proposal.id,
        action: 'Arquivo anexado',
        description: file.name,
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteFile = (file: any) => {
    setFileToDelete(file);
    setDeleteFileDialog(true);
  };

  const handleOpenFile = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.target = '_blank';
      link.rel = 'noreferrer noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch (error) {
      console.error('Erro ao abrir arquivo', error);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const confirmDeleteFile = () => {
    if (!fileToDelete) return;
    deleteFile(fileToDelete.id);
    setDeleteFileDialog(false);
    setFileToDelete(null);
  };

  const handleExportPDF = () => {
    const contactEmail = profile?.email || agency?.email;

    generateProposalPDF(
      proposal,
      services,
      agency?.name,
      agency?.logo_url,
      contactEmail,
      agency?.phone,
      agency?.address
    );
  };

  const getOrCreatePublicUrl = async () => {
    const token = publicLinks?.[0]?.token;
    if (token) return `${window.location.origin}/p/${token}`;
    const link = await createLink({ expiresInDays: 30 });
    return `${window.location.origin}/p/${link.token}`;
  };

  const handleCopyLink = async (token?: string) => {
    const publicUrl = token ? `${window.location.origin}/p/${token}` : await getOrCreatePublicUrl();
    await navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    toast({ title: 'Link copiado!' });
    setTimeout(() => setCopiedLink(false), 3000);
    return publicUrl;
  };

  const handleCopyTemplate = async (content: string) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: 'Template copiado!' });
    } catch (error) {
      toast({ title: 'Não foi possível copiar', variant: 'destructive' });
    }
  };

  const handleAddTag = (tagId: string) => {
    const tag = availableTags.find((t) => t.id === tagId);
    addTag(tagId);
    if (tag) {
      addHistory({
        proposal_id: proposal.id,
        action: 'Tag adicionada',
        description: tag.name,
      });
    }
  };

  const handleRemoveTag = (tagId: string) => {
    const tag = proposalTags.find((pt) => pt.tag_id === tagId);
    removeTag(tagId);
    if (tag?.tags) {
      addHistory({
        proposal_id: proposal.id,
        action: 'Tag removida',
        description: tag.tags.name,
      });
    }
  };

  const usedTagIds = proposalTags.map((t) => t.tag_id);
  const availableTagsToAdd = availableTags.filter((t) => !usedTagIds.includes(t.id));
  const selectedStage = stages.find((stage) => stage.id === currentStageId) || null;
  const stageTemplates =
    selectedStage?.templates && Array.isArray(selectedStage.templates) ? selectedStage.templates : [];

  return (
    <div className="space-y-6">
      {/* HEADER (menos linhas / tipografia melhor) */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          {/* Linha 1: etapa + progresso (compacto) */}
          <div className="max-w-[680px] min-w-0 flex-1">
            <StageSwitcher stages={stages} currentStageId={currentStageId} onChange={handleStageChange} />
          </div>

          <div className="flex flex-wrap justify-end gap-2 pr-12">
            <Button variant="outline" size="sm" onClick={() => handleCopyLink()} disabled={isCreatingLink}>
              <Link className="w-4 h-4 mr-2" />
              Copiar link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTemplatesOpen(true)}
              disabled={!selectedStage}
            >
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
            <Button size="sm" onClick={onEdit} aria-label="Editar">
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Linha 2: título + número (mesma linha) */}
        <div className="flex items-baseline gap-3 min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight truncate">{proposal.title}</h2>
          <span className="text-sm text-muted-foreground whitespace-nowrap">Proposta #{proposal.number}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-2 space-y-6">
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="services">Serviços ({services.length})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline ({history.length})</TabsTrigger>
              <TabsTrigger value="notes">Notas</TabsTrigger>
              <TabsTrigger value="files">Arquivos ({files.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Serviços</h3>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {Object.entries(serviceLabels).map(([type, label]) => {
                      const Icon = serviceIcons[type] || Package;
                      return (
                        <DropdownMenuItem key={type} onClick={() => handleAddService(type)}>
                          <Icon className="w-4 h-4 mr-2" />
                          {label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {services.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Nenhum serviço adicionado</p>
                    <Button variant="outline" onClick={() => handleAddService('flight')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Serviço
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onEdit={() => handleEditService(service)}
                    onDelete={() => handleDeleteService(service)}
                    onView={() => handleViewService(service)}
                  />
                ))
              )}

              {services.length > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Serviços</p>
                        <p className="font-semibold text-lg">{formatCurrency(totalServices)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Comissão Total</p>
                        <p className="font-semibold text-lg text-primary">{formatCurrency(totalCommission)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <div className="space-y-0">
                {history.length > 0 ? (
                  history.map((log) => <TimelineItem key={log.id} log={log} />)
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma atividade registrada</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Adicionar uma nota..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleAddNote} disabled={!note.trim()}>
                  Adicionar Nota
                </Button>
              </div>

              <Separator />

              <div className="space-y-0">
                {history
                  .filter((h) => h.action === 'Nota adicionada')
                  .map((log) => (
                    <TimelineItem key={log.id} log={log} />
                  ))}

                {history.filter((h) => h.action === 'Nota adicionada').length === 0 && (
                  <div className="text-center py-8">
                    <StickyNote className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma nota adicionada</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Arquivos</h3>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Enviar Arquivo
                  </Button>
                </div>
              </div>

              {files.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Nenhum arquivo anexado</p>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Arquivo
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {files.map((file) => (
                    <Card key={file.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        {file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={file.url}
                            alt={file.caption || 'Arquivo'}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 bg-muted flex items-center justify-center">
                            <FileText className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}

                        <div className="p-3">
                          <p className="text-sm font-medium truncate">{file.caption}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(file.created_at)}</p>

                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleOpenFile(file.url)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDeleteFile(file)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Summary (mantido) */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {client ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{client.name}</p>
                      {client.email && <p className="text-sm text-muted-foreground truncate">{client.email}</p>}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-1 text-sm">
                    {client.phone && (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Telefone</span>
                        <span className="truncate">{client.phone}</span>
                      </div>
                    )}
                    {client.cpf && (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">CPF</span>
                        <span className="truncate">{client.cpf}</span>
                      </div>
                    )}
                    {client.passport && (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Passaporte</span>
                        <span className="truncate">{client.passport}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum cliente vinculado</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Serviços</span>
                <span className="font-medium">{formatCurrency(totalServices)}</span>
              </div>

              {(proposal.discount || 0) > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Desconto ({proposal.discount}%)</span>
                  <span>-{formatCurrency(discountValue)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Valor Final</span>
                <span>{formatCurrency(finalValue)}</span>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="text-muted-foreground">Comissão ({commissionPercentage}%)</span>
                <span className="text-green-600 font-medium">{formatCurrency(totalCommission)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tags</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {availableTagsToAdd.length === 0 ? (
                      <DropdownMenuItem disabled>Nenhuma tag disponível</DropdownMenuItem>
                    ) : (
                      availableTagsToAdd.map((tag) => (
                        <DropdownMenuItem key={tag.id} onClick={() => handleAddTag(tag.id)}>
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: tag.color }} />
                          {tag.name}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {proposalTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma tag</p>
                ) : (
                  proposalTags.map((pt) => (
                    <Badge
                      key={pt.tag_id}
                      variant="secondary"
                      className="flex items-center gap-1"
                      style={{ backgroundColor: `${pt.tags?.color}20`, color: pt.tags?.color }}
                    >
                      {pt.tags?.name}
                      <button onClick={() => handleRemoveTag(pt.tag_id)} className="ml-1 hover:opacity-70">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{formatDate(proposal.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Atualizado em</span>
                <span>{formatDate(proposal.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Drawer open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <DrawerContent className="fixed right-0 top-0 left-auto bottom-0 h-full w-[420px] max-w-[92vw] rounded-none border-l bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right">
          <div className="flex h-full flex-col">
            <DrawerHeader className="border-b border-slate-100 px-6 py-4 text-left">
              <DrawerTitle>Templates da etapa</DrawerTitle>
              <DrawerDescription>
                {selectedStage ? selectedStage.name : 'Selecione uma etapa para visualizar'}
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {stageTemplates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-muted-foreground">
                  Nenhum template cadastrado para esta etapa.
                </div>
              ) : (
                stageTemplates.map((template) => (
                  <div key={template.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">{template.title || 'Template'}</p>
                        <p className="text-xs text-slate-500">Clique para copiar a mensagem</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => handleCopyTemplate(template.content)}
                        disabled={!template.content}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                    <div className="whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                      {template.content || 'Sem conteúdo definido.'}
                    </div>
                  </div>
                ))
              )}
            </div>
            <DrawerFooter className="border-t border-slate-100 px-6">
              <Button variant="outline" onClick={() => setTemplatesOpen(false)}>
                Fechar
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <ServiceDialog
        open={serviceDialogOpen}
        onOpenChange={handleServiceDialogOpenChange}
        proposalId={proposal.id}
        service={editingService}
        partners={partners.map((p) => ({ id: p.id, name: p.name }))}
        onSubmit={handleServiceSubmit}
        isLoading={isCreating || isUpdating}
        initialType={editingService?.type || pendingServiceType}
        mode={serviceDialogMode}
      />

      <AlertDialog
        open={closeDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCloseDialogOpen(false);
            setPendingStageId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Fechar Proposta
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Deseja adicionar esta venda como receita no financeiro?</p>
              <div className="bg-muted p-3 rounded-md space-y-1">
                <p className="font-medium text-foreground">Proposta #{proposal.number} - {proposal.title}</p>
                <p>Valor: {formatCurrency(totalServices || 0)}</p>
                <p>Lucro: {formatCurrency(totalCommission || 0)}</p>
                {proposal.assigned_collaborator && (
                  <p className="text-primary">Comissão será gerada para: {proposal.assigned_collaborator.name}</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={isCreatingTransaction}>Cancelar</AlertDialogCancel>
            <Button variant="outline" onClick={confirmCloseWithoutTransaction} disabled={isCreatingTransaction}>
              Não adicionar receita
            </Button>
            <AlertDialogAction
              onClick={confirmCloseWithTransaction}
              className="bg-green-600 hover:bg-green-700"
              disabled={isCreatingTransaction}
            >
              {isCreatingTransaction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {proposal.assigned_collaborator ? 'Adicionar receita e comissão' : 'Adicionar receita'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={reopenDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setReopenDialogOpen(false);
            setPendingStageId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Reabrir Proposta
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Esta proposta está fechada. Ao movê-la para outro estágio:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>A receita associada será <strong>cancelada</strong> no financeiro</li>
                <li>A comissão do vendedor será <strong>removida</strong></li>
              </ul>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium text-foreground">Proposta #{proposal.number} - {proposal.title}</p>
              </div>
              <p>Deseja continuar?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreatingTransaction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReopenAndCancelTransaction}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={isCreatingTransaction}
            >
              {isCreatingTransaction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reabrir e cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteServiceDialog} onOpenChange={setDeleteServiceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteService}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteFileDialog} onOpenChange={setDeleteFileDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Arquivo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este arquivo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFile}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
