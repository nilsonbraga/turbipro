import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProposals, Proposal, ProposalInput } from '@/hooks/useProposals';
import { usePipelineStages, PipelineStage } from '@/hooks/usePipelineStages';
import { useClients } from '@/hooks/useClients';
import { useAgencies } from '@/hooks/useAgencies';
import { useTags } from '@/hooks/useTags';
import { useAuth } from '@/contexts/AuthContext';
import { ProposalDialog } from '@/components/proposals/ProposalDialog';
import { ProposalDetail } from '@/components/proposals/ProposalDetail';
import { LeadViewToggle, LeadViewMode } from '@/components/leads/LeadViewToggle';
import { LeadListView } from '@/components/leads/LeadListView';
import { useCollaboratorCommissions } from '@/hooks/useCollaboratorCommissions';
import { useCollaborators } from '@/hooks/useCollaborators';
import { useAgencyUsers } from '@/hooks/useAgencyUsers';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Search, Eye, Edit, Trash2, Calendar as CalendarIcon, MoreHorizontal, Loader2, AlertTriangle, CheckCircle, Filter, Building2, X, DollarSign, ExternalLink, History, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Hook to fetch all proposal tags
function useAllProposalTags() {
  return useQuery({
    queryKey: ['all-proposal-tags'],
    queryFn: async () => {
      const query = new URLSearchParams({
        include: JSON.stringify({ tag: { select: { id: true, name: true, color: true } } }),
      });
      const { data } = await apiFetch<{ data: any[] }>(`/api/proposalTag?${query.toString()}`);
      return data;
    },
  });
}

// Hook to fetch all proposal services totals
function useProposalServicesTotals() {
  return useQuery({
    queryKey: ['proposal-services-totals'],
    queryFn: async () => {
      const { data } = await apiFetch<{ data: any[] }>(`/api/proposalService`);

      // Calculate totals per proposal
      const totals: Record<string, { value: number; commission: number }> = {};
      (data || []).forEach(service => {
        if (!totals[service.proposalId]) {
          totals[service.proposalId] = { value: 0, commission: 0 };
        }
        const serviceValue = Number(service.value || 0);
        const commissionValue = Number(service.commissionValue || 0);
        const serviceCommission = service.commissionType === 'percentage'
          ? (serviceValue * commissionValue) / 100
          : commissionValue;
        
        totals[service.proposalId].value += serviceValue;
        totals[service.proposalId].commission += serviceCommission;
      });
      
      return totals;
    },
  });
}

interface ProposalCardProps {
  proposal: Proposal;
  tags: { name: string; color: string }[];
  serviceTotals: { value: number; commission: number } | undefined;
  lastMovement?: { id: string; name: string; email?: string | null; avatar_url?: string | null } | null;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onCopyLink: () => void;
}

function ProposalCard({
  proposal,
  tags,
  serviceTotals,
  lastMovement,
  onView,
  onEdit,
  onDelete,
  onClose,
  onDragStart,
  onCopyLink,
}: ProposalCardProps) {
  const client = proposal.clients;
  const totalValue = serviceTotals?.value || 0;
  const totalCommission = serviceTotals?.commission || 0;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  const creatorName =
    proposal.created_by?.name ||
    proposal.created_by?.email ||
    proposal.assigned_collaborator?.name ||
    'Responsável não definido';
  const creatorAvatar =
    proposal.created_by?.avatar_url || (proposal.created_by as any)?.avatarUrl || null;
  const lastMovementName = lastMovement?.name || lastMovement?.email || null;
  const lastMovementAvatar = lastMovement?.avatar_url || null;
  const isDifferentMover = lastMovementName
    ? proposal.created_by?.id
      ? proposal.created_by.id !== lastMovement?.id
      : lastMovementName !== creatorName
    : false;

  return (
    <div 
      className="bg-card p-4 rounded-lg border-0 shadow-sm hover:shadow-md transition-shadow cursor-grab group"
      draggable
      onDragStart={onDragStart}
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {client ? getInitials(client.name) : 'CL'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{client?.name || 'Sem cliente'}</p>
            <p className="text-xs text-muted-foreground">{client?.email || ''}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopyLink(); }}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver link
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
            {!proposal.pipeline_stages?.is_closed && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-green-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                Fechar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h4 className="font-medium text-sm mb-2 line-clamp-2">{proposal.title}</h4>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.slice(0, 3).map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs px-2 py-0"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="secondary" className="text-xs px-2 py-0">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Badge variant="outline" className="text-xs">#{proposal.number}</Badge>
        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary gap-1">
          <Avatar className="h-4 w-4">
            {creatorAvatar ? (
              <AvatarImage src={creatorAvatar} alt={creatorName} />
            ) : (
              <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                {getInitials(creatorName)}
              </AvatarFallback>
            )}
          </Avatar>
          {creatorName}
        </Badge>
        {isDifferentMover && lastMovementName && (
          <Badge
            variant="secondary"
            className="text-xs bg-slate-100 text-slate-700 gap-1"
            title="Última movimentação"
          >
            <History className="h-3 w-3" />
            <Avatar className="h-4 w-4">
              {lastMovementAvatar ? (
                <AvatarImage src={lastMovementAvatar} alt={lastMovementName} />
              ) : (
                <AvatarFallback className="text-[9px] bg-slate-300 text-slate-700">
                  {getInitials(lastMovementName)}
                </AvatarFallback>
              )}
            </Avatar>
            {lastMovementName}
          </Badge>
        )}
      </div>
      
      {/* Valor e Lucro */}
      <div className="flex items-center justify-between text-sm mb-2">
        <div>
          <span className="text-muted-foreground text-xs">Valor:</span>
          <span className="font-semibold ml-1">{formatCurrency(totalValue)}</span>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Lucro:</span>
          <span className="font-semibold ml-1 text-green-600">{formatCurrency(totalCommission)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-3 h-3" />
          <span>{new Date(proposal.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
        {proposal.pipeline_stages?.is_closed && (
          <Badge className="text-xs bg-green-500">Fechado</Badge>
        )}
        {proposal.pipeline_stages?.is_lost && (
          <Badge variant="destructive" className="text-xs">Perdido</Badge>
        )}
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  stage: PipelineStage;
  proposals: Proposal[];
  proposalTags: Record<string, { name: string; color: string }[]>;
  serviceTotals: Record<string, { value: number; commission: number }>;
  lastMovements: Record<string, { id: string; name: string; email?: string | null } | null>;
  onProposalView: (proposal: Proposal) => void;
  onProposalEdit: (proposal: Proposal) => void;
  onProposalDelete: (proposal: Proposal) => void;
  onProposalClose: (proposal: Proposal) => void;
  onDrop: (proposalId: string, stageId: string) => void;
  onAddProposal: (stageId: string) => void;
  onEditColumn: (stage: PipelineStage) => void;
  onProposalCopyLink: (proposal: Proposal) => void;
}

function KanbanColumn({ 
  stage, 
  proposals,
  proposalTags,
  serviceTotals,
  lastMovements,
  onProposalView, 
  onProposalEdit, 
  onProposalDelete,
  onProposalClose,
  onDrop,
  onAddProposal,
  onEditColumn,
  onProposalCopyLink,
}: KanbanColumnProps) {
  const totalValue = proposals.reduce((sum, p) => sum + (serviceTotals[p.id]?.value || 0), 0);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const proposalId = e.dataTransfer.getData('proposalId');
    if (proposalId) {
      onDrop(proposalId, stage.id);
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col min-w-[320px] max-w-[320px] rounded-xl border-0 bg-muted/30 transition-colors",
        isDragOver && "bg-accent/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between p-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
          <h3 className="font-semibold text-sm">{stage.name}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {proposals.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddProposal(stage.id)}>
            <Plus className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditColumn(stage)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar coluna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-3 pt-3 pb-2">
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div 
            className="h-full rounded-full transition-all" 
            style={{ 
              backgroundColor: stage.color, 
              width: `${Math.min((totalValue / 500000) * 100, 100)}%` 
            }} 
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{formatCurrency(totalValue)}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-4">
        {proposals.map((proposal) => (
          <ProposalCard 
            key={proposal.id} 
            proposal={proposal}
            tags={proposalTags[proposal.id] || []}
            serviceTotals={serviceTotals[proposal.id]}
            lastMovement={lastMovements[proposal.id] ?? null}
            onView={() => onProposalView(proposal)}
            onEdit={() => onProposalEdit(proposal)}
            onDelete={() => onProposalDelete(proposal)}
            onClose={() => onProposalClose(proposal)}
            onDragStart={(e) => {
              e.dataTransfer.setData('proposalId', proposal.id);
            }}
            onCopyLink={() => onProposalCopyLink(proposal)}
          />
        ))}
      </div>
    </div>
  );
}

interface PrefillLeadData {
  title?: string;
  notes?: string;
}

export default function Leads() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefillLead = (location.state as { prefillLead?: PrefillLeadData })?.prefillLead;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { agency, isSuperAdmin, isAdmin, profile } = useAuth();
  const { proposals, isLoading, createProposalAsync, updateProposal, updateProposalStage, deleteProposal, isCreating, isUpdating, isDeleting } = useProposals();
  const { stages, updateStage, isUpdating: isUpdatingStage } = usePipelineStages();
  const { clients } = useClients();
  const { agencies } = useAgencies();
  const { tags: allTags } = useTags();
  const { data: allProposalTags } = useAllProposalTags();
  const { data: serviceTotals } = useProposalServicesTotals();
  const { collaborators } = useCollaborators();
  const { createCommission, deleteCommission } = useCollaboratorCommissions();
  const { user } = useAuth();
  
  const [view, setView] = useState<LeadViewMode>('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [viewingProposal, setViewingProposal] = useState<Proposal | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null);
  const [defaultStageId, setDefaultStageId] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<PrefillLeadData | null>(null);
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [stageName, setStageName] = useState('');
  const [stageColor, setStageColor] = useState('#3B82F6');
  const [stageIsClosed, setStageIsClosed] = useState(false);
  const [stageIsLost, setStageIsLost] = useState(false);
  
  // Financial confirmation dialogs
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [proposalToClose, setProposalToClose] = useState<Proposal | null>(null);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [proposalToReopen, setProposalToReopen] = useState<{ proposal: Proposal; newStageId: string } | null>(null);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedStageId, setSelectedStageId] = useState<string>('all');
  const [selectedTagId, setSelectedTagId] = useState<string>('all');
  const [selectedSellerId, setSelectedSellerId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const effectiveUsersAgencyId =
    isSuperAdmin && selectedAgencyId !== 'all'
      ? selectedAgencyId
      : profile?.agency_id ?? null;
  const { users: agencyUsers = [] } = useAgencyUsers(effectiveUsersAgencyId);

  const logStageHistory = async (proposal: Proposal, fromStageId: string | null, toStageId: string | null) => {
    try {
      const fromStage = stages.find((s) => s.id === fromStageId);
      const toStage = stages.find((s) => s.id === toStageId);
      await apiFetch('/api/proposalHistory', {
        method: 'POST',
        body: JSON.stringify({
          proposalId: proposal.id,
          userId: user?.id ?? null,
          action: 'Etapa alterada',
          description: `Proposta movida para ${toStage?.name || 'estágio'}`,
          oldValue: fromStage?.name || null,
          newValue: toStage?.name || null,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ['proposal-last-movements'] });
    } catch (error) {
      console.error('Erro ao registrar histórico de etapa:', error);
    }
  };

  const openStageDialog = (stage: PipelineStage) => {
    setEditingStage(stage);
    setStageName(stage.name);
    setStageColor(stage.color || '#3B82F6');
    setStageIsClosed(stage.is_closed);
    setStageIsLost(stage.is_lost);
    setStageDialogOpen(true);
  };

  const handleSaveStage = () => {
    if (!editingStage) return;
    updateStage({
      id: editingStage.id,
      name: stageName.trim() || editingStage.name,
      color: stageColor,
      is_closed: stageIsClosed,
      is_lost: stageIsLost,
    });
    setStageDialogOpen(false);
  };

  // Helpers para refletir serviços no calendário
  const deriveServiceDates = (service: any): { startDate: string | null; endDate: string | null } => {
    const d = service.details || {};
    const type = service.type;

    const toLocalISO = (date?: string | null, time?: string | null, fallbackTime = '12:00') => {
      if (!date) return null;
      // If already has time component, keep it; otherwise append fallbackTime
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

  const syncServicesDatesForCalendar = async (proposalId: string, clear = false) => {
    const params = new URLSearchParams({
      where: JSON.stringify({ proposalId }),
      include: JSON.stringify({ partner: { select: { id: true } } }),
    });
    const { data: services } = await apiFetch<{ data: any[] }>(`/api/proposalService?${params.toString()}`);
    await Promise.all(
      (services || []).map(async (service) => {
        const { startDate, endDate } = clear ? { startDate: null, endDate: null } : deriveServiceDates(service);
        await apiFetch(`/api/proposalService/${service.id}`, {
          method: 'PUT',
          body: JSON.stringify({ startDate, endDate }),
        });
      }),
    );
  };

  // Handle prefill data from navigation state
  useEffect(() => {
    if (prefillLead && stages.length > 0) {
      setPrefillData(prefillLead);
      setDialogOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [prefillLead, stages]);

  // Build a map of proposal ID -> tags
  const proposalTagsMap: Record<string, { name: string; color: string }[]> = {};
  if (allProposalTags) {
    allProposalTags.forEach((pt: any) => {
      if (pt.tag) {
        if (!proposalTagsMap[pt.proposalId]) {
          proposalTagsMap[pt.proposalId] = [];
        }
        proposalTagsMap[pt.proposalId].push({
          name: pt.tag.name,
          color: pt.tag.color,
        });
      }
    });
  }

  // Apply all filters
  const filteredProposals = proposals.filter(proposal => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      proposal.title.toLowerCase().includes(searchLower) ||
      (proposal.clients?.name?.toLowerCase().includes(searchLower));
    
    if (!matchesSearch) return false;
    
    // Agency filter (super admin only)
    if (isSuperAdmin && selectedAgencyId !== 'all') {
      if (proposal.agency_id !== selectedAgencyId) return false;
    }
    
    // Client filter
    if (selectedClientId !== 'all') {
      if (proposal.client_id !== selectedClientId) return false;
    }
    
    // Stage filter
    if (selectedStageId !== 'all') {
      if (proposal.stage_id !== selectedStageId) return false;
    }
    
    // Tag filter
    if (selectedTagId !== 'all') {
      const proposalTagIds = allProposalTags?.filter(pt => pt.proposal_id === proposal.id).map(pt => pt.tag_id) || [];
      if (!proposalTagIds.includes(selectedTagId)) return false;
    }
    
    // Seller filter (responsável)
    if (selectedSellerId !== 'all') {
      const sellerId = proposal.assigned_collaborator?.id || proposal.created_by?.id || null;
      if (sellerId !== selectedSellerId) return false;
    }
    
    // Date range filter
    if (dateRange?.from) {
      const proposalDate = new Date(proposal.created_at);
      if (proposalDate < dateRange.from) return false;
      if (dateRange.to && proposalDate > dateRange.to) return false;
    }
    
    return true;
  });

  const getProposalsByStage = (stageId: string) => {
    return filteredProposals.filter(p => p.stage_id === stageId);
  };
  const proposalIds = useMemo(() => filteredProposals.map((proposal) => proposal.id), [filteredProposals]);
  const { data: lastMovementsByProposal = {} } = useQuery({
    queryKey: ['proposal-last-movements', proposalIds],
    queryFn: async () => {
      if (proposalIds.length === 0) return {};
      const params = new URLSearchParams({
        where: JSON.stringify({ proposalId: { in: proposalIds } }),
        include: JSON.stringify({ user: { select: { id: true, name: true, email: true, avatarUrl: true, profile: { select: { avatarUrl: true } } } } }),
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });
      const { data } = await apiFetch<{ data: any[] }>(`/api/proposalHistory?${params.toString()}`);
      const map: Record<string, { id: string; name: string; email?: string | null; avatar_url?: string | null } | null> = {};
      (data || []).forEach((history) => {
        const proposalId = history.proposalId;
        if (!proposalId || map[proposalId]) return;
        const user = history.user;
        if (!user) return;
        map[proposalId] = {
          id: user.id,
          name: user.name || user.email || 'Usuário',
          email: user.email ?? null,
          avatar_url: user.avatarUrl || user.profile?.avatarUrl || null,
        };
      });
      return map;
    },
    enabled: proposalIds.length > 0,
  });
  const userAvatarById = useMemo(() => {
    const map = new Map<string, string>();
    agencyUsers.forEach((u) => {
      if (u.id && u.avatar_url) map.set(u.id, u.avatar_url);
    });
    return map;
  }, [agencyUsers]);
  const lastMovementsWithAvatars = useMemo(() => {
    const next: Record<string, { id: string; name: string; email?: string | null; avatar_url?: string | null } | null> = {};
    Object.entries(lastMovementsByProposal).forEach(([proposalId, movement]) => {
      if (!movement) {
        next[proposalId] = null;
        return;
      }
      if (movement.avatar_url) {
        next[proposalId] = movement;
        return;
      }
      const fallback = userAvatarById.get(movement.id);
      next[proposalId] = fallback ? { ...movement, avatar_url: fallback } : movement;
    });
    return next;
  }, [lastMovementsByProposal, userAvatarById]);
  const sellerOptions = useMemo(() => {
    const map = new Map<string, string>();
    filteredProposals.forEach((p) => {
      const seller = p.assigned_collaborator || p.created_by;
      if (seller?.id && seller.name) {
        map.set(seller.id, seller.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [filteredProposals]);
  const agencyFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Todas as agências' },
      ...(agencies ?? []).map((agency) => ({ value: agency.id, label: agency.name })),
    ],
    [agencies],
  );
  const clientFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos os clientes' },
      ...(clients ?? []).map((client) => ({ value: client.id, label: client.name })),
    ],
    [clients],
  );
  const stageFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos os estágios' },
      ...(stages ?? []).map((stage) => ({ value: stage.id, label: stage.name })),
    ],
    [stages],
  );
  const tagFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Todas as tags' },
      ...(allTags ?? []).map((tag) => ({ value: tag.id, label: tag.name })),
    ],
    [allTags],
  );
  const sellerFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos os responsáveis' },
      ...sellerOptions.map((seller) => ({ value: seller.id, label: seller.name })),
    ],
    [sellerOptions],
  );

  const handleAddProposal = (stageId?: string) => {
    setEditingProposal(null);
    setDefaultStageId(stageId || null);
    setDialogOpen(true);
  };

  const handleEdit = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setDefaultStageId(null);
    setDialogOpen(true);
  };

  const handleDelete = (proposal: Proposal) => {
    setProposalToDelete(proposal);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (proposalToDelete) {
      deleteProposal(proposalToDelete.id);
      setDeleteDialogOpen(false);
      setProposalToDelete(null);
    }
  };

  const handleSubmit = async (data: ProposalInput & { id?: string }) => {
    if (data.id) {
      const currentProposal = editingProposal ?? proposals.find((proposal) => proposal.id === data.id) ?? null;
      const currentStageId = currentProposal?.stage_id ?? null;
      const nextStageId = data.stage_id ?? currentStageId ?? null;
      const stageChanged = !!currentStageId && !!nextStageId && currentStageId !== nextStageId;

      if (currentProposal && stageChanged) {
        const currentStage = stages.find((stage) => stage.id === currentStageId);
        const targetStage = stages.find((stage) => stage.id === nextStageId);
        const updatedProposal: Proposal = {
          ...currentProposal,
          title: data.title ?? currentProposal.title,
          client_id: data.client_id ?? null,
          assigned_collaborator_id: data.assigned_collaborator_id ?? null,
          notes: data.notes ?? null,
        };

        updateProposal({ ...(data as ProposalInput), id: data.id, stage_id: currentStageId });

        if (currentStage?.is_closed && !targetStage?.is_closed) {
          setProposalToReopen({ proposal: updatedProposal, newStageId: nextStageId });
          setReopenDialogOpen(true);
        } else if (!currentStage?.is_closed && targetStage?.is_closed) {
          setProposalToClose(updatedProposal);
          setCloseDialogOpen(true);
        } else {
          updateProposalStage({ id: data.id, stage_id: nextStageId });
          logStageHistory(updatedProposal, currentStageId, nextStageId);
        }
      } else {
        updateProposal(data as ProposalInput & { id: string });
      }
    } else {
      const submitData = { ...data };
      if (defaultStageId && !submitData.stage_id) {
        submitData.stage_id = defaultStageId;
      }
      try {
        const newProposal = await createProposalAsync(submitData);
        if (newProposal) {
          setViewingProposal(newProposal as Proposal);
        }
      } catch (error) {
        // Error is handled by the mutation
      }
    }
    setEditingProposal(null);
    setDefaultStageId(null);
  };

  const handleCopyProposalLink = async (proposalId: string) => {
    try {
      const params = new URLSearchParams({
        where: JSON.stringify({ proposalId, isActive: true }),
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });
      const { data } = await apiFetch<{ data: any[] }>(`/api/publicProposalLink?${params.toString()}`);
      let token = data?.[0]?.token;
      if (!token) {
        const created = await apiFetch<any>(`/api/publicProposalLink`, {
          method: 'POST',
          body: JSON.stringify({ proposalId, expiresAt: null }),
        });
        token = created.token;
      }
      const publicUrl = `${window.location.origin}/p/${token}`;
      window.open(publicUrl, '_blank');
    } catch (error: any) {
      toast({
        title: 'Erro ao abrir link',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDrop = (proposalId: string, stageId: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const targetStage = stages.find(s => s.id === stageId);
    const currentStage = stages.find(s => s.id === proposal.stage_id);
    
    // If moving FROM closed to non-closed stage, show reopen confirmation
    if (currentStage?.is_closed && !targetStage?.is_closed) {
      setProposalToReopen({ proposal, newStageId: stageId });
      setReopenDialogOpen(true);
      return;
    }
    
    // If moving TO closed stage, show close confirmation
    if (!currentStage?.is_closed && targetStage?.is_closed) {
      setProposalToClose(proposal);
      setCloseDialogOpen(true);
      return;
    }
    
    // Normal move
    updateProposalStage({ id: proposalId, stage_id: stageId });
    logStageHistory(proposal, proposal.stage_id, stageId);
    const targetIsClosed = targetStage?.is_closed;
    const currentIsClosed = currentStage?.is_closed;
    if (!currentIsClosed && targetIsClosed) {
      syncServicesDatesForCalendar(proposal.id);
    }
  };

  const handleCloseProposal = (proposal: Proposal) => {
    setProposalToClose(proposal);
    setCloseDialogOpen(true);
  };

  const confirmCloseWithTransaction = async () => {
    if (!proposalToClose) return;
    
    const closedStage = stages.find(s => s.is_closed);
    if (!closedStage) return;
    
    setIsCreatingTransaction(true);
    
    try {
      // Move to closed stage
      updateProposalStage({ id: proposalToClose.id, stage_id: closedStage.id });
      logStageHistory(proposalToClose, proposalToClose.stage_id, closedStage.id);
      await syncServicesDatesForCalendar(proposalToClose.id);
      
      // Create financial entry (income)
      const totals = serviceTotals?.[proposalToClose.id];
      const totalValue = Number(totals?.value || 0);
      const profitValue = Number(totals?.commission || 0);
      
      if (totalValue > 0) {
        // Get client data if available
        const clientName = proposalToClose.clients?.name || null;
        const clientCpf = proposalToClose.clients?.cpf || null;
        
        await apiFetch('/api/financialTransaction', {
          method: 'POST',
          body: JSON.stringify({
            agencyId: proposalToClose.agency_id,
            type: 'income',
            category: 'Venda',
            description: `Proposta #${proposalToClose.number} - ${proposalToClose.title}`,
            proposalId: proposalToClose.id,
            clientId: proposalToClose.client_id,
            documentNumber: clientName,
            documentName: clientCpf,
            totalValue,
            profitValue,
            status: 'pending',
            launchDate: new Date().toISOString(),
          }),
        });
      }

      // Create commission - use assigned collaborator or find collaborator of logged user
      let collaborator = proposalToClose.assigned_collaborator_id 
        ? collaborators.find(c => c.id === proposalToClose.assigned_collaborator_id)
        : collaborators.find(c => c.user_id === profile?.id);
      
      if (collaborator) {
        const currentDate = new Date();
        const commissionBase = collaborator.commission_base === 'profit' ? profitValue : totalValue;
        const commissionAmount = (commissionBase * collaborator.commission_percentage) / 100;
        
        await createCommission({
          collaborator_id: collaborator.id,
          proposal_id: proposalToClose.id,
          sale_value: totalValue,
          profit_value: profitValue,
          commission_percentage: collaborator.commission_percentage,
          commission_base: collaborator.commission_base,
          commission_amount: commissionAmount,
          period_month: currentDate.getMonth() + 1,
          period_year: currentDate.getFullYear(),
        });
      }
    } catch (error) {
      console.error('Erro ao criar transação financeira:', error);
    } finally {
      setIsCreatingTransaction(false);
      setCloseDialogOpen(false);
      setProposalToClose(null);
    }
  };

  const confirmCloseWithoutTransaction = () => {
    if (!proposalToClose) return;
    
    const closedStage = stages.find(s => s.is_closed);
    if (closedStage) {
      updateProposalStage({ id: proposalToClose.id, stage_id: closedStage.id });
      logStageHistory(proposalToClose, proposalToClose.stage_id, closedStage.id);
      syncServicesDatesForCalendar(proposalToClose.id);
    }
    
    setCloseDialogOpen(false);
    setProposalToClose(null);
  };

  const confirmReopenAndCancelTransaction = async () => {
    if (!proposalToReopen) return;
    
    setIsCreatingTransaction(true);
    
    try {
      // Move to new stage
      updateProposalStage({ id: proposalToReopen.proposal.id, stage_id: proposalToReopen.newStageId });
      logStageHistory(proposalToReopen.proposal, proposalToReopen.proposal.stage_id, proposalToReopen.newStageId);
      await syncServicesDatesForCalendar(proposalToReopen.proposal.id, true);
      
      // Cancel financial transaction linked to this proposal
      const search = new URLSearchParams({
        where: JSON.stringify({ proposalId: proposalToReopen.proposal.id, type: 'income' }),
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

      // Delete commission linked to this proposal
      deleteCommission(proposalToReopen.proposal.id);
    } catch (error) {
      console.error('Erro ao cancelar transação financeira:', error);
    } finally {
      setIsCreatingTransaction(false);
      setReopenDialogOpen(false);
      setProposalToReopen(null);
    }
  };

  const clearFilters = () => {
    setSelectedAgencyId('all');
    setSelectedClientId('all');
    setSelectedStageId('all');
    setSelectedTagId('all');
    setSelectedSellerId('all');
    setDateRange(undefined);
  };

  const hasActiveFilters =
    (isSuperAdmin && selectedAgencyId !== 'all') ||
    selectedClientId !== 'all' ||
    selectedStageId !== 'all' ||
    selectedTagId !== 'all' ||
    selectedSellerId !== 'all' ||
    dateRange;

  // For non-super admin without agency
  if (!isSuperAdmin && !agency) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Você precisa estar vinculado a uma agência para ver os leads.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {/* Agency Selector for Super Admin */}
            {isSuperAdmin && (
              <>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Combobox
                    options={agencyFilterOptions}
                    value={selectedAgencyId}
                    onValueChange={setSelectedAgencyId}
                    placeholder="Todas as agências"
                    searchPlaceholder="Buscar agência..."
                    emptyText="Nenhuma agência encontrada"
                    buttonClassName="w-56 h-9 pl-9"
                    contentClassName="w-56"
                  />
                </div>
                <div className="h-6 w-px bg-border" />
              </>
            )}

            <LeadViewToggle view={view} onViewChange={setView} />

            <div className="h-6 w-px bg-border" />

            <Button
              variant="ghost"
              size="sm"
              className={cn("gap-1.5", hasActiveFilters && "text-primary")}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  !
                </span>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou cliente..."
                className="pl-9 h-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Button size="sm" onClick={() => handleAddProposal()}>
              <Plus className="h-4 w-4 mr-1.5" />
              Nova Proposta
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 px-4 pb-4">
            <Combobox
              options={clientFilterOptions}
              value={selectedClientId}
              onValueChange={setSelectedClientId}
              placeholder="Cliente"
              searchPlaceholder="Buscar cliente..."
              emptyText="Nenhum cliente encontrado"
              buttonClassName="w-44 h-9"
              contentClassName="w-56"
            />

            <Combobox
              options={sellerFilterOptions}
              value={selectedSellerId}
              onValueChange={setSelectedSellerId}
              placeholder="Responsável"
              searchPlaceholder="Buscar responsável..."
              emptyText="Nenhum responsável encontrado"
              buttonClassName="w-60 h-9"
              contentClassName="w-60"
            />

            <Combobox
              options={stageFilterOptions}
              value={selectedStageId}
              onValueChange={setSelectedStageId}
              placeholder="Estágio"
              searchPlaceholder="Buscar estágio..."
              emptyText="Nenhum estágio encontrado"
              buttonClassName="w-44 h-9"
              contentClassName="w-56"
            />

            <Combobox
              options={tagFilterOptions}
              value={selectedTagId}
              onValueChange={setSelectedTagId}
              placeholder="Tag"
              searchPlaceholder="Buscar tag..."
              emptyText="Nenhuma tag encontrada"
              buttonClassName="w-44 h-9"
              contentClassName="w-56"
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 w-52 justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yy", { locale: ptBR })} - {format(dateRange.to, "dd/MM/yy", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    "Período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={ptBR}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {view === 'board' ? (
        <div className="flex-1 overflow-x-auto px-3 py-4 md:px-4 lg:px-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : stages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Nenhum estágio de pipeline configurado.</p>
                <p className="text-sm text-muted-foreground">Configure os estágios em Configurações → Pipeline</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 h-full">
              {stages.map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  proposals={getProposalsByStage(stage.id)}
                  proposalTags={proposalTagsMap}
                  serviceTotals={serviceTotals || {}}
                  lastMovements={lastMovementsWithAvatars}
                  onProposalView={setViewingProposal}
                  onProposalEdit={handleEdit}
                  onProposalDelete={handleDelete}
                  onProposalClose={handleCloseProposal}
                  onDrop={handleDrop}
                  onAddProposal={handleAddProposal}
                  onEditColumn={openStageDialog}
                  onProposalCopyLink={(proposal) => handleCopyProposalLink(proposal.id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : stages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Nenhum estágio de pipeline configurado.</p>
                <p className="text-sm text-muted-foreground">Configure os estágios em Configurações → Pipeline</p>
              </div>
            </div>
          ) : (
            <LeadListView
              stages={stages}
              proposals={filteredProposals}
              proposalTags={proposalTagsMap}
              serviceTotals={serviceTotals || {}}
              onProposalView={setViewingProposal}
              onProposalEdit={handleEdit}
              onProposalDelete={handleDelete}
              onProposalClose={handleCloseProposal}
            />
          )}
        </div>
      )}

      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar coluna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stage-name">Nome da coluna</Label>
              <Input
                id="stage-name"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                placeholder="Nome do estágio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-color">Cor</Label>
              <div className="flex items-center gap-3">
                <input
                  id="stage-color"
                  type="color"
                  value={stageColor}
                  onChange={(e) => setStageColor(e.target.value)}
                  className="h-9 w-12 rounded-md border border-input bg-background p-1"
                />
                <Input
                  value={stageColor}
                  onChange={(e) => setStageColor(e.target.value)}
                  className="h-9 w-28"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="stage-closed">Fechado</Label>
              <Switch
                id="stage-closed"
                checked={stageIsClosed}
                onCheckedChange={setStageIsClosed}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="stage-lost">Perdido</Label>
              <Switch
                id="stage-lost"
                checked={stageIsLost}
                onCheckedChange={setStageIsLost}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setStageDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveStage} disabled={isUpdatingStage}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Proposal Dialog */}
      <ProposalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        proposal={editingProposal}
        clients={clients.map(c => ({ id: c.id, name: c.name }))}
        stages={stages}
        collaborators={collaborators.filter(c => c.status === 'active').map(c => ({ id: c.id, name: c.name }))}
        isAdmin={isAdmin || isSuperAdmin}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
      />

      {/* View Proposal Dialog - Full Detail */}
      <Dialog open={!!viewingProposal} onOpenChange={() => setViewingProposal(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Detalhes da proposta</DialogTitle>
          </DialogHeader>
          {viewingProposal && (
            <ProposalDetail 
              proposal={viewingProposal} 
              onClose={() => setViewingProposal(null)}
              onEdit={() => {
                handleEdit(viewingProposal);
                setViewingProposal(null);
              }}
              onProposalUpdate={(updated) => setViewingProposal(updated)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Proposta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a proposta "{proposalToDelete?.title}"? Esta ação não pode ser desfeita.
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

      {/* Close Proposal Confirmation - Ask about financial entry */}
      <AlertDialog open={closeDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCloseDialogOpen(false);
          setProposalToClose(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Fechar Proposta
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Deseja adicionar esta venda como receita no financeiro?</p>
              {proposalToClose && serviceTotals?.[proposalToClose.id] && (
                <div className="bg-muted p-3 rounded-md space-y-1">
                  <p className="font-medium text-foreground">Proposta #{proposalToClose.number} - {proposalToClose.title}</p>
                  <p>Valor: {formatCurrency(serviceTotals[proposalToClose.id]?.value || 0)}</p>
                  <p>Lucro: {formatCurrency(serviceTotals[proposalToClose.id]?.commission || 0)}</p>
                  {proposalToClose.assigned_collaborator && (
                    <p className="text-primary">Comissão será gerada para: {proposalToClose.assigned_collaborator.name}</p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="outline" onClick={confirmCloseWithoutTransaction}>
              Não adicionar receita
            </Button>
            <AlertDialogAction 
              onClick={confirmCloseWithTransaction} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isCreatingTransaction}
            >
              {isCreatingTransaction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {proposalToClose?.assigned_collaborator ? 'Adicionar receita e comissão' : 'Adicionar receita'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reopen Proposal Confirmation - Cancel financial entry */}
      <AlertDialog open={reopenDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setReopenDialogOpen(false);
          setProposalToReopen(null);
        }
      }}>
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
              {proposalToReopen?.proposal && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-medium text-foreground">Proposta #{proposalToReopen.proposal.number} - {proposalToReopen.proposal.title}</p>
                </div>
              )}
              <p>Deseja continuar?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
    </div>
  );
}
