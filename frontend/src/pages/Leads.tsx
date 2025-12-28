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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Dialog, 
  DialogContent
} from '@/components/ui/dialog';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Search, Eye, Edit, Trash2, Calendar as CalendarIcon, MoreHorizontal, Loader2, AlertTriangle, CheckCircle, Filter, Building2, X, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { apiFetch } from '@/lib/api';

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
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

function ProposalCard({ proposal, tags, serviceTotals, onView, onEdit, onDelete, onClose, onDragStart }: ProposalCardProps) {
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
  const sellerName = proposal.assigned_collaborator?.name || proposal.created_by?.name || 'Responsável não definido';

  return (
    <div 
      className="bg-card p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow cursor-grab group"
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
        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
          {sellerName}
        </Badge>
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
  onProposalView: (proposal: Proposal) => void;
  onProposalEdit: (proposal: Proposal) => void;
  onProposalDelete: (proposal: Proposal) => void;
  onProposalClose: (proposal: Proposal) => void;
  onDrop: (proposalId: string, stageId: string) => void;
  onAddProposal: (stageId: string) => void;
}

function KanbanColumn({ 
  stage, 
  proposals,
  proposalTags,
  serviceTotals,
  onProposalView, 
  onProposalEdit, 
  onProposalDelete,
  onProposalClose,
  onDrop,
  onAddProposal
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
        "flex flex-col min-w-[320px] max-w-[320px] rounded-lg transition-colors",
        isDragOver && "bg-accent/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
          <h3 className="font-semibold text-sm">{stage.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {proposals.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddProposal(stage.id)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="px-1 mb-2">
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

      <div className="flex-1 space-y-3 overflow-y-auto pr-1 pb-4">
        {proposals.map((proposal) => (
          <ProposalCard 
            key={proposal.id} 
            proposal={proposal}
            tags={proposalTags[proposal.id] || []}
            serviceTotals={serviceTotals[proposal.id]}
            onView={() => onProposalView(proposal)}
            onEdit={() => onProposalEdit(proposal)}
            onDelete={() => onProposalDelete(proposal)}
            onClose={() => onProposalClose(proposal)}
            onDragStart={(e) => {
              e.dataTransfer.setData('proposalId', proposal.id);
            }}
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

  const { agency, isSuperAdmin, isAdmin, profile } = useAuth();
  const { proposals, isLoading, createProposalAsync, updateProposal, updateProposalStage, deleteProposal, isCreating, isUpdating, isDeleting } = useProposals();
  const { stages } = usePipelineStages();
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
    } catch (error) {
      console.error('Erro ao registrar histórico de etapa:', error);
    }
  };

  // Helpers para refletir serviços no calendário
  const deriveServiceDates = (service: any): { startDate: string | null; endDate: string | null } => {
    const d = service.details || {};
    const type = service.type;

    const toISO = (val?: string | null) => {
      if (!val) return null;
      const dt = new Date(val);
      return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
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
        startDate: d.checkIn ? `${d.checkIn}T${d.checkInTime || '12:00'}:00Z` : null,
        endDate: d.checkOut ? `${d.checkOut}T${d.checkOutTime || '12:00'}:00Z` : null,
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
        startDate: d.startDate ? `${d.startDate}T00:00:00Z` : null,
        endDate: d.endDate ? `${d.endDate}T23:59:00Z` : null,
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
      updateProposal(data as ProposalInput & { id: string });
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
                <Select
                  value={selectedAgencyId}
                  onValueChange={setSelectedAgencyId}
                >
                  <SelectTrigger className="w-56 h-9">
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Todas as agências" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as agências</SelectItem>
                    {agencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        {agency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
            >
              <SelectTrigger className="w-44 h-9">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedSellerId}
              onValueChange={setSelectedSellerId}
            >
              <SelectTrigger className="w-60 h-9">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {sellerOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedStageId}
              onValueChange={setSelectedStageId}
            >
              <SelectTrigger className="w-44 h-9">
                <SelectValue placeholder="Estágio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estágios</SelectItem>
                {stages?.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      {stage.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedTagId}
              onValueChange={setSelectedTagId}
            >
              <SelectTrigger className="w-44 h-9">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as tags</SelectItem>
                {allTags?.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
        <div className="flex-1 overflow-x-auto p-6">
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
                  onProposalView={setViewingProposal}
                  onProposalEdit={handleEdit}
                  onProposalDelete={handleDelete}
                  onProposalClose={handleCloseProposal}
                  onDrop={handleDrop}
                  onAddProposal={handleAddProposal}
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
