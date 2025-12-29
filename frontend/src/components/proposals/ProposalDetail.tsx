import { useState, useRef } from 'react';
import { Proposal, useProposals } from '@/hooks/useProposals';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Mail, 
  FileText, 
  MessageSquare, 
  Activity, 
  Plane, 
  Hotel, 
  Car, 
  Package, 
  Map,
  Calendar,
  DollarSign,
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
  ChevronRight,
  Upload,
  Eye,
  ArrowRight,
  RefreshCw,
  FileUp,
  StickyNote,
  FolderOpen,
  Link,
  Copy,
  Check
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
    const date =
      value.length <= 10
        ? parse(value, 'yyyy-MM-dd', new Date())
        : parseISO(value);
    return formatDateFns(date, 'dd MMM yyyy');
  } catch {
    return value;
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  try {
    const date =
      value.length <= 10
        ? parse(value, 'yyyy-MM-dd', new Date())
        : parseISO(value);
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

function ServiceCard({ 
  service, 
  onEdit, 
  onDelete 
}: { 
  service: ProposalService; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = serviceIcons[service.type] || Package;
  const value = service.value || 0;
  const serviceCommission = service.commission_type === 'percentage'
    ? (value * (service.commission_value || 0)) / 100
    : (service.commission_value || 0);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {serviceLabels[service.type] || service.type}
              </Badge>
              {service.partners?.name && (
                <span className="text-xs text-muted-foreground">{service.partners.name}</span>
              )}
            </div>
            <p className="font-medium mt-1">{service.description || 'Sem descrição'}</p>
            {(service.origin || service.destination) && (
              <p className="text-sm text-muted-foreground mt-1">
                {service.origin} {service.origin && service.destination && '→'} {service.destination}
              </p>
            )}
            {(service.start_date || service.end_date) && (
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>
                  {service.start_date && formatDate(service.start_date)}
                  {service.start_time ? ` ${service.start_time}` : ''}
                </span>
                {service.end_date && service.start_date !== service.end_date && (
                  <>
                    <span>→</span>
                    <span>
                      {formatDate(service.end_date)}
                      {service.end_time ? ` ${service.end_time}` : ''}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatCurrency(value)}</p>
            {serviceCommission > 0 && (
              <p className="text-xs text-primary">Comissão: {formatCurrency(serviceCommission)}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
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
        {log.description && (
          <p className="text-sm text-muted-foreground mb-1">{log.description}</p>
        )}
        {log.old_value && log.new_value && typeof log.old_value === 'string' && typeof log.new_value === 'string' && (
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
  const { services, createService, updateService, deleteService, isCreating, isUpdating, isDeleting } = useProposalServices(proposal.id);
  const { history, addHistory } = useProposalHistory(proposal.id);
  const { tags: proposalTags, addTag, removeTag } = useProposalTags(proposal.id);
  const { files, uploadFile, deleteFile, isUploading } = useProposalFiles(proposal.id);
  const { links: publicLinks, createLink, isCreating: isCreatingLink } = usePublicProposalLinks(proposal.id);
  const { stages } = usePipelineStages();
  const { partners } = usePartners();
  const { tags: availableTags } = useTags();
  
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ProposalService | null>(null);
  const [deleteServiceDialog, setDeleteServiceDialog] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ProposalService | null>(null);
  const [note, setNote] = useState('');
  const [deleteFileDialog, setDeleteFileDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentStageId, setCurrentStageId] = useState(proposal.stage_id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const client = proposal.clients;
  const currentStage = stages.find(s => s.id === currentStageId) || proposal.pipeline_stages;

  // Calculate totals from services
  const totalServices = services.reduce((sum, s) => sum + (s.value || 0), 0);
  
  // Calculate commission from services (sum of all service commissions)
  const totalCommission = services.reduce((sum, s) => {
    const serviceValue = s.value || 0;
    const serviceComm = s.commission_type === 'percentage'
      ? (serviceValue * (s.commission_value || 0)) / 100
      : (s.commission_value || 0);
    return sum + serviceComm;
  }, 0);
  
  // Calculate commission percentage based on total value
  const commissionPercentage = totalServices > 0 ? ((totalCommission / totalServices) * 100).toFixed(1) : '0';
  
  const discountValue = (totalServices * (proposal.discount || 0)) / 100;
  const finalValue = totalServices - discountValue;

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleStageChange = (newStageId: string) => {
    if (newStageId === currentStageId) return;
    
    const oldStage = stages.find(s => s.id === currentStageId);
    const newStage = stages.find(s => s.id === newStageId);
    
    // Update local state immediately for UI
    setCurrentStageId(newStageId);
    
    updateProposalStage({ id: proposal.id, stage_id: newStageId });
    
    addHistory({
      proposal_id: proposal.id,
      action: 'Etapa alterada',
      description: `Proposta movida para ${newStage?.name}`,
      old_value: oldStage?.name,
      new_value: newStage?.name,
    });
  };

  const handleAddService = () => {
    setEditingService(null);
    setServiceDialogOpen(true);
  };

  const handleEditService = (service: ProposalService) => {
    setEditingService(service);
    setServiceDialogOpen(true);
  };

  const handleDeleteService = (service: ProposalService) => {
    setServiceToDelete(service);
    setDeleteServiceDialog(true);
  };

  const confirmDeleteService = () => {
    if (serviceToDelete) {
      deleteService(serviceToDelete.id);
      addHistory({
        proposal_id: proposal.id,
        action: 'Serviço removido',
        description: `${serviceLabels[serviceToDelete.type] || serviceToDelete.type}: ${serviceToDelete.description || 'Sem descrição'}`,
      });
      setDeleteServiceDialog(false);
      setServiceToDelete(null);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = (file: any) => {
    setFileToDelete(file);
    setDeleteFileDialog(true);
  };

  const handleOpenFile = async (url: string) => {
    try {
      // Converte em blob e abre via object URL para evitar bloqueios/about:blank
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
      // fallback simples
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const confirmDeleteFile = () => {
    if (fileToDelete) {
      deleteFile(fileToDelete.id);
      setDeleteFileDialog(false);
      setFileToDelete(null);
    }
  };

  const handleExportPDF = () => {
    // Use the logged-in user's email for contact, falling back to agency email
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

  const handleGenerateLink = async () => {
    try {
      const link = await createLink({ expiresInDays: 30 });
      const publicUrl = `${window.location.origin}/p/${link.token}`;
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      toast({ title: 'Link copiado!', description: 'O link da proposta foi copiado para a área de transferência.' });
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (error) {
      console.error('Error generating link:', error);
    }
  };

  const handleCopyLink = async (token: string) => {
    const publicUrl = `${window.location.origin}/p/${token}`;
    await navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    toast({ title: 'Link copiado!' });
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleAddTag = (tagId: string) => {
    const tag = availableTags.find(t => t.id === tagId);
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
    const tag = proposalTags.find(pt => pt.tag_id === tagId);
    removeTag(tagId);
    if (tag?.tags) {
      addHistory({
        proposal_id: proposal.id,
        action: 'Tag removida',
        description: tag.tags.name,
      });
    }
  };

  const usedTagIds = proposalTags.map(t => t.tag_id);
  const availableTagsToAdd = availableTags.filter(t => !usedTagIds.includes(t.id));

  return (
    <div className="space-y-6">
      {/* Header com estágios clicáveis */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-2 h-16 rounded-full" 
            style={{ backgroundColor: currentStage?.color || '#ccc' }} 
          />
          <div>
            <div className="flex items-center gap-1 mb-2 flex-wrap">
              {stages.map((s, index) => (
                <div key={s.id} className="flex items-center">
                  <Badge 
                    variant={s.id === currentStageId ? "default" : "outline"}
                    className={cn(
                      "text-xs cursor-pointer transition-all hover:scale-105",
                      s.id === currentStageId && "text-primary-foreground"
                    )}
                    style={s.id === currentStageId ? { backgroundColor: s.color } : {}}
                    onClick={() => handleStageChange(s.id)}
                  >
                    {s.name}
                  </Badge>
                  {index < stages.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
                  )}
                </div>
              ))}
            </div>
            <h2 className="text-xl font-bold">{proposal.title}</h2>
            <p className="text-muted-foreground">Proposta #{proposal.number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="col-span-2 space-y-6">
          {/* Tabs */}
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
                <Button size="sm" onClick={handleAddService}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              
              {services.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Nenhum serviço adicionado</p>
                    <Button variant="outline" onClick={handleAddService}>
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
                  history.map((log) => (
                    <TimelineItem key={log.id} log={log} />
                  ))
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
                  .filter(h => h.action === 'Nota adicionada')
                  .map((log) => (
                    <TimelineItem key={log.id} log={log} />
                  ))}
                {history.filter(h => h.action === 'Nota adicionada').length === 0 && (
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
                  <Button 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
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
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
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
                          <p className="text-xs text-muted-foreground">
                            {formatDate(file.created_at)}
                          </p>
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

        {/* Right Column - Summary */}
        <div className="space-y-4">
          {/* Client Info */}
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
                    <div>
                      <p className="font-medium">{client.name}</p>
                      {client.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    {client.phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telefone</span>
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.cpf && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CPF</span>
                        <span>{client.cpf}</span>
                      </div>
                    )}
                    {client.passport && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Passaporte</span>
                        <span>{client.passport}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum cliente vinculado</p>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
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
                <span className="text-muted-foreground">
                  Comissão ({commissionPercentage}%)
                </span>
                <span className="text-green-600 font-medium">{formatCurrency(totalCommission)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
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
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: tag.color }} 
                          />
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
                      <button 
                        onClick={() => handleRemoveTag(pt.tag_id)}
                        className="ml-1 hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
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

      {/* Service Dialog */}
      <ServiceDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        proposalId={proposal.id}
        service={editingService}
        partners={partners.map(p => ({ id: p.id, name: p.name }))}
        onSubmit={handleServiceSubmit}
        isLoading={isCreating || isUpdating}
      />

      {/* Delete Service Confirmation */}
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
            <AlertDialogAction onClick={confirmDeleteService} className="bg-destructive text-destructive-foreground">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete File Confirmation */}
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
            <AlertDialogAction onClick={confirmDeleteFile} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
