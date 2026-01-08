import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomItineraries } from '@/hooks/useCustomItineraries';
import { useAgencies } from '@/hooks/useAgencies';
import { useAuth } from '@/contexts/AuthContext';
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
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Map,
  Calendar,
  MapPin,
  CheckCircle,
  FileEdit,
  Send,
  MoreHorizontal,
  Users,
  Building2,
  Check,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ItineraryDialog from '@/components/itineraries/ItineraryDialog';

export default function Itineraries() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [agencyFilter, setAgencyFilter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'approved' | 'revision'>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'month' | 'year'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itineraryToDelete, setItineraryToDelete] = useState<any | null>(null);

  const { agencies } = useAgencies();
  const { itineraries, isLoading, deleteItinerary, isDeleting } = useCustomItineraries(agencyFilter, {
    includeFeedbacks: true,
  });
  const now = new Date();

  const filteredItineraries = itineraries.filter((itinerary) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      itinerary.title.toLowerCase().includes(searchLower) ||
      itinerary.destination?.toLowerCase().includes(searchLower) ||
      itinerary.client?.name?.toLowerCase().includes(searchLower);

    const statusValue = itinerary.status || 'draft';
    const matchesStatus = statusFilter === 'all' || statusValue === statusFilter;

    const startDate = itinerary.start_date ? new Date(itinerary.start_date) : null;
    const matchesPeriod =
      periodFilter === 'all' ||
      (periodFilter === 'year' &&
        startDate &&
        startDate.getFullYear() === now.getFullYear()) ||
      (periodFilter === 'month' &&
        startDate &&
        startDate.getFullYear() === now.getFullYear() &&
        startDate.getMonth() === now.getMonth());

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const buildPublicUrl = (itinerary: any) => {
    const baseUrl = `${window.location.origin}/roteiro/${itinerary.public_token}`;
    return itinerary.requires_token && itinerary.access_token
      ? `${baseUrl}?access=${itinerary.access_token}`
      : baseUrl;
  };

  const handleCopyUrl = async (itinerary: any) => {
    const url = buildPublicUrl(itinerary);
    await navigator.clipboard.writeText(url);
    setCopiedId(itinerary.id);
    toast({ title: 'Link copiado!' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleViewPublicPage = (itinerary: any) => {
    const url = buildPublicUrl(itinerary);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEdit = (itinerary: any) => {
    navigate(`/itineraries/${itinerary.id}`);
  };

  const handleDelete = () => {
    if (itineraryToDelete) {
      deleteItinerary(itineraryToDelete.id);
      setDeleteDialogOpen(false);
      setItineraryToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
      sent: { label: 'Enviado', className: 'bg-blue-100 text-blue-800' },
      approved: { label: 'Aprovado', className: 'bg-green-100 text-green-800' },
      revision: { label: 'Em Revisão', className: 'bg-yellow-100 text-yellow-800' },
    };
    const variant = variants[status] || variants.draft;
    return (
      <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${variant.className}`}>
        {variant.label}
      </Badge>
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    const [yyyy, mm, dd] = date.split('T')[0].split('-').map(Number);
    if (!yyyy || !mm || !dd) return date;
    return new Date(yyyy, mm - 1, dd).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isAgencySender = (name?: string | null) => {
    if (!name) return false;
    const normalized = name.trim().toLowerCase();
    return normalized === 'agência' || normalized === 'agencia';
  };

  const getMessageSummary = (itinerary: any) => {
    const days = itinerary.days || [];
    let total = 0;
    let latestClientAt = 0;
    let latestAgencyAt = 0;

    const registerFeedback = (feedback: any) => {
      if (!feedback) return;
      total += 1;
      const ts = feedback.createdAt ? new Date(feedback.createdAt).getTime() : 0;
      const isAgencyFeedback =
        feedback.isApproved === null ||
        (feedback.isApproved === undefined && isAgencySender(feedback.clientName));
      if (!ts) return;
      if (isAgencyFeedback) {
        latestAgencyAt = Math.max(latestAgencyAt, ts);
        return;
      }
      latestClientAt = Math.max(latestClientAt, ts);
    };

    days.forEach((day: any) => {
      (day.feedbacks || []).forEach(registerFeedback);
      (day.items || []).forEach((item: any) => {
        (item.feedbacks || []).forEach(registerFeedback);
      });
    });

    return {
      total,
      hasPending: total > 0 && latestClientAt > latestAgencyAt,
    };
  };

  // Stats
  const totalItineraries = itineraries.length;
  const approvedCount = itineraries.filter(i => i.status === 'approved').length;
  const sentCount = itineraries.filter(i => i.status === 'sent').length;
  const agencyOptions = useMemo(
    () => [
      { value: 'all', label: 'Todas as agências' },
      ...(agencies ?? []).map((agency) => ({ value: agency.id, label: agency.name })),
    ],
    [agencies],
  );

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Roteiros Personalizados</h1>
          <p className="text-sm text-muted-foreground">
            Crie roteiros detalhados dia a dia para seus clientes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por roteiro, destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-white"
            />
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Roteiro
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'Aprovado', value: 'approved' },
            { label: 'Enviado', value: 'sent' },
            { label: 'Em Revisão', value: 'revision' },
            { label: 'Rascunho', value: 'draft' },
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total de roteiros</p>
                <p className="text-2xl font-semibold">{totalItineraries}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Map className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Enviados</p>
                <p className="text-2xl font-semibold text-blue-600">{sentCount}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Send className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-semibold text-emerald-600">{approvedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Rascunhos</p>
                <p className="text-2xl font-semibold text-slate-500">
                  {itineraries.filter(i => i.status === 'draft').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center">
                <FileEdit className="w-6 h-6" />
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
        ) : filteredItineraries.length === 0 ? (
          <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
            <CardContent className="p-10 text-center text-muted-foreground">
              Nenhum roteiro encontrado
            </CardContent>
          </Card>
        ) : (
          filteredItineraries.map((itinerary) => {
            const hasCover = Boolean(itinerary.cover_image_url);
            const messageSummary = getMessageSummary(itinerary);
            return (
              <Card
                key={itinerary.id}
                className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg overflow-hidden cursor-pointer"
                onClick={(event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('[data-card-action]')) {
                    return;
                  }
                  handleEdit(itinerary);
                }}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col gap-1 lg:flex-row lg:items-stretch">
                    {hasCover && (
                      <div className="w-full lg:w-1/6">
                        <img
                          src={itinerary.cover_image_url}
                          alt={`Capa ${itinerary.title}`}
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
                              <Map className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold">{itinerary.title}</p>
                            </div>
                            {(itinerary.destination || itinerary.client?.name) && (
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                {itinerary.destination && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {itinerary.destination}
                                  </span>
                                )}
                                {itinerary.client?.name && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {itinerary.client.name}
                                  </span>
                                )}
                              </div>
                            )}
                            {itinerary.description && (
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                {itinerary.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(itinerary.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" data-card-action>
                              <DropdownMenuItem onClick={() => handleViewPublicPage(itinerary)}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyUrl(itinerary)}>
                                {copiedId === itinerary.id ? (
                                  <Check className="w-4 h-4 mr-2" />
                                ) : (
                                  <Copy className="w-4 h-4 mr-2" />
                                )}
                                Copiar Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(itinerary)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setItineraryToDelete(itinerary);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center gap-5 text-sm text-muted-foreground sm:justify-end">
                        {messageSummary.total > 0 && (
                          <div
                            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                              messageSummary.hasPending
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>
                              {messageSummary.total} mensagem{messageSummary.total === 1 ? '' : 's'}
                            </span>
                          </div>
                        )}
                        {itinerary.start_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDate(itinerary.start_date)}
                              {itinerary.end_date ? ` - ${formatDate(itinerary.end_date)}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Dialog */}
      <ItineraryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setItineraryToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir roteiro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o roteiro "{itineraryToDelete?.title}"?
              Todos os dias e itens do roteiro serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
