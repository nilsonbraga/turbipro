import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useItineraryDetails, useCustomItineraries, ItineraryDay, ItineraryItem, ItineraryItemInput, ItineraryDayInput, ItineraryItemFeedback, ItineraryDayFeedback } from '@/hooks/useCustomItineraries';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  MapPin, 
  Calendar,
  Clock,
  Hotel,
  Plane,
  Car,
  Ticket,
  Utensils,
  Camera,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Settings,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Pencil,
  Lock,
  Globe,
  MessageSquare,
  User,
  ThumbsUp,
  ThumbsDown,
  Send,
  Reply
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ImageUploader } from '@/components/itineraries/ImageUploader';
import { MultiImageUploader } from '@/components/itineraries/MultiImageUploader';
import { apiFetch } from '@/lib/api';

const ITEM_TYPES = [
  { value: 'activity', label: 'Atividade', icon: Camera, color: 'bg-violet-500' },
  { value: 'hotel', label: 'Hotel', icon: Hotel, color: 'bg-amber-500' },
  { value: 'flight', label: 'Voo', icon: Plane, color: 'bg-sky-500' },
  { value: 'transport', label: 'Transporte', icon: Car, color: 'bg-emerald-500' },
  { value: 'transfer', label: 'Transfer', icon: Car, color: 'bg-teal-500' },
  { value: 'ticket', label: 'Ingresso', icon: Ticket, color: 'bg-pink-500' },
  { value: 'meal', label: 'Refeição', icon: Utensils, color: 'bg-orange-500' },
  { value: 'other', label: 'Outro', icon: MoreHorizontal, color: 'bg-slate-500' },
];

interface FeedbackReplyProps {
  feedback: ItineraryItemFeedback | ItineraryDayFeedback;
  type: 'item' | 'day';
  onReply: (message: string) => void;
  isReplying: boolean;
}

function FeedbackCard({ feedback, type, onReply, isReplying }: FeedbackReplyProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  
  const handleSendReply = () => {
    if (replyMessage.trim()) {
      onReply(replyMessage);
      setReplyMessage('');
      setShowReply(false);
    }
  };

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{feedback.client_name || 'Cliente'}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(feedback.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        {feedback.is_approved !== null && (
          <Badge className={feedback.is_approved ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
            {feedback.is_approved ? (
              <>
                <ThumbsUp className="w-3 h-3 mr-1" />
                Aprovado
              </>
            ) : (
              <>
                <ThumbsDown className="w-3 h-3 mr-1" />
                Ajustes
              </>
            )}
          </Badge>
        )}
      </div>
      {feedback.observation && (
        <p className="text-sm pl-10">{feedback.observation}</p>
      )}
      
      {!showReply ? (
        <div className="pl-10">
          <Button variant="ghost" size="sm" onClick={() => setShowReply(true)} className="text-xs h-7 px-2">
            <Reply className="w-3 h-3 mr-1" />
            Responder
          </Button>
        </div>
      ) : (
        <div className="pl-10 space-y-2">
          <Textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Digite sua resposta..."
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSendReply} disabled={!replyMessage.trim() || isReplying}>
              <Send className="w-3 h-3 mr-1" />
              Enviar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowReply(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ItineraryEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateItinerary } = useCustomItineraries();
  const { 
    itinerary, 
    isLoading, 
    refetch,
    createDay, 
    updateDay, 
    deleteDay,
    createItem,
    updateItem,
    deleteItem,
  } = useItineraryDetails(id || null);
  const { clients } = useClients();

  const [headerForm, setHeaderForm] = useState({
    title: '',
    description: '',
    destination: '',
    client_id: '',
    start_date: '',
    end_date: '',
    cover_image_url: '',
    requires_token: false,
    access_token: '',
    status: 'draft',
  });

  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbacksOpen, setFeedbacksOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<ItineraryDay | null>(null);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'day' | 'item'; id: string } | null>(null);
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [isReplying, setIsReplying] = useState(false);

  const [dayForm, setDayForm] = useState<Partial<ItineraryDayInput>>({
    day_number: 1,
    title: '',
    date: '',
    location: '',
    description: '',
    cover_image_url: '',
    images: [],
  });

  const [itemForm, setItemForm] = useState<Partial<ItineraryItemInput>>({
    type: 'activity',
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    address: '',
    images: [],
    details: {},
  });

  useEffect(() => {
    if (itinerary) {
      setHeaderForm({
        title: itinerary.title || '',
        description: itinerary.description || '',
        destination: itinerary.destination || '',
        client_id: itinerary.client_id || '',
        start_date: itinerary.start_date ? itinerary.start_date.slice(0, 10) : '',
        end_date: itinerary.end_date ? itinerary.end_date.slice(0, 10) : '',
        cover_image_url: itinerary.cover_image_url || '',
        requires_token: itinerary.requires_token || false,
        access_token: itinerary.access_token || '',
        status: itinerary.status || 'draft',
      });
      // Expand all days by default
      setExpandedDays(itinerary.days?.map(d => d.id) || []);
    }
  }, [itinerary]);

  // Count total feedbacks
  const totalFeedbacks = itinerary?.days?.reduce((acc, day) => {
    const dayFeedbacks = day.feedbacks?.length || 0;
    const itemFeedbacks = day.items?.reduce((itemAcc, item) => itemAcc + (item.feedbacks?.length || 0), 0) || 0;
    return acc + dayFeedbacks + itemFeedbacks;
  }, 0) || 0;

  const toggleDay = (dayId: string) => {
    setExpandedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  const handleSaveHeader = () => {
    if (!id) return;
    updateItinerary({
      id,
      ...headerForm,
      client_id: headerForm.client_id || undefined,
    });
  };

  const handleAddDay = () => {
    const nextDayNumber = (itinerary?.days?.length || 0) + 1;
    setDayForm({
      day_number: nextDayNumber,
      title: `Dia ${nextDayNumber}`,
      date: '',
      location: '',
      description: '',
      cover_image_url: '',
      images: [],
    });
    setEditingDay(null);
    setDayDialogOpen(true);
  };

  const handleEditDay = (day: ItineraryDay) => {
    setDayForm({
      day_number: day.day_number,
      title: day.title || '',
      date: day.date || '',
      location: day.location || '',
      description: day.description || '',
      cover_image_url: day.cover_image_url || '',
      images: day.images || [],
    });
    setEditingDay(day);
    setDayDialogOpen(true);
  };

  const handleSaveDay = async () => {
    if (!id) return;
    
    if (editingDay) {
      updateDay({ id: editingDay.id, ...dayForm });
    } else {
      await createDay({
        itinerary_id: id,
        day_number: dayForm.day_number || 1,
        title: dayForm.title,
        date: dayForm.date,
        location: dayForm.location,
        description: dayForm.description,
        cover_image_url: dayForm.cover_image_url,
        images: dayForm.images,
        sort_order: itinerary?.days?.length || 0,
      });
    }
    setDayDialogOpen(false);
  };

  const handleAddItem = (dayId: string) => {
    setItemForm({
      type: 'activity',
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location: '',
      address: '',
      images: [],
      details: {},
    });
    setEditingItem(null);
    setSelectedDayId(dayId);
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: ItineraryItem) => {
    setItemForm({
      type: item.type,
      title: item.title,
      description: item.description || '',
      start_time: item.start_time || '',
      end_time: item.end_time || '',
      location: item.location || '',
      address: item.address || '',
      images: item.images || [],
      details: item.details || {},
    });
    setEditingItem(item);
    setSelectedDayId(item.day_id);
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!selectedDayId) return;

    if (editingItem) {
      updateItem({ id: editingItem.id, ...itemForm });
    } else {
      const day = itinerary?.days?.find(d => d.id === selectedDayId);
      await createItem({
        day_id: selectedDayId,
        type: itemForm.type || 'activity',
        title: itemForm.title || '',
        description: itemForm.description,
        start_time: itemForm.start_time,
        end_time: itemForm.end_time,
        location: itemForm.location,
        address: itemForm.address,
        images: itemForm.images,
        details: itemForm.details,
        sort_order: day?.items?.length || 0,
      });
    }
    setItemDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'day') {
      deleteDay(deleteConfirm.id);
    } else {
      deleteItem(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  const handleCopyUrl = () => {
    if (!itinerary) return;
    const baseUrl = `${window.location.origin}/roteiro/${itinerary.public_token}`;
    const url = itinerary.requires_token && itinerary.access_token 
      ? `${baseUrl}?access=${itinerary.access_token}` 
      : baseUrl;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado!' });
  };

  const handleReplyToItemFeedback = async (itemId: string, message: string) => {
    setIsReplying(true);
    try {
      await apiFetch('/api/itineraryItemFeedback', {
        method: 'POST',
        body: JSON.stringify({
          itemId,
          observation: message,
          clientName: 'Agência',
          isApproved: null,
        }),
      });
      toast({ title: 'Resposta enviada!' });
      refetch();
    } catch (err: any) {
      toast({ title: 'Erro ao enviar resposta', description: err.message, variant: 'destructive' });
    } finally {
      setIsReplying(false);
    }
  };

  const handleReplyToDayFeedback = async (dayId: string, message: string) => {
    setIsReplying(true);
    try {
      await apiFetch('/api/itineraryDayFeedback', {
        method: 'POST',
        body: JSON.stringify({
          dayId,
          observation: message,
          clientName: 'Agência',
          isApproved: null,
        }),
      });
      toast({ title: 'Resposta enviada!' });
      refetch();
    } catch (err: any) {
      toast({ title: 'Erro ao enviar resposta', description: err.message, variant: 'destructive' });
    } finally {
      setIsReplying(false);
    }
  };

  const getItemType = (type: string) => {
    return ITEM_TYPES.find(t => t.value === type) || ITEM_TYPES[ITEM_TYPES.length - 1];
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
      sent: { label: 'Enviado', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      approved: { label: 'Aprovado', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      revision: { label: 'Em Revisão', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    };
    return configs[status] || configs.draft;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Roteiro não encontrado</h2>
        <Button onClick={() => navigate('/itineraries')} className="mt-4">
          Voltar para Roteiros
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(headerForm.status);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 -mx-6 -mt-6 px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/itineraries')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">{headerForm.title || 'Novo Roteiro'}</h1>
                <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
              </div>
              {headerForm.destination && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {headerForm.destination}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setFeedbacksOpen(true)}
              className="relative"
            >
              <MessageSquare className="w-4 h-4" />
              {totalFeedbacks > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {totalFeedbacks}
                </span>
              )}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={handleCopyUrl}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar Link
            </Button>
            <Button variant="outline" onClick={() => window.open(`/roteiro/${itinerary.public_token}`, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Visualizar
            </Button>
            <Button onClick={handleSaveHeader}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div className="space-y-4">
        <ImageUploader
          value={headerForm.cover_image_url}
          onChange={(url) => setHeaderForm({ ...headerForm, cover_image_url: url })}
          label="Imagem de Capa"
          folder="covers"
          aspectRatio="wide"
        />
      </div>

      {/* Main Info */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Título</Label>
                <Input
                  value={headerForm.title}
                  onChange={(e) => setHeaderForm({ ...headerForm, title: e.target.value })}
                  className="text-lg font-semibold border-0 bg-transparent px-0 focus-visible:ring-0"
                  placeholder="Nome do roteiro..."
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Destino</Label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <Input
                    value={headerForm.destination}
                    onChange={(e) => setHeaderForm({ ...headerForm, destination: e.target.value })}
                    className="border-0 bg-transparent px-0 focus-visible:ring-0"
                    placeholder="Para onde é a viagem?"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Início</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <Input
                      type="date"
                      value={headerForm.start_date}
                      onChange={(e) => setHeaderForm({ ...headerForm, start_date: e.target.value })}
                      className="border-0 bg-transparent px-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Fim</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <Input
                      type="date"
                      value={headerForm.end_date}
                      onChange={(e) => setHeaderForm({ ...headerForm, end_date: e.target.value })}
                      className="border-0 bg-transparent px-0 focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</Label>
                <Textarea
                  value={headerForm.description}
                  onChange={(e) => setHeaderForm({ ...headerForm, description: e.target.value })}
                  className="border-0 bg-transparent px-0 focus-visible:ring-0 resize-none"
                  placeholder="Uma breve descrição da viagem..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Days Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Programação</h2>
          <Button onClick={handleAddDay} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Dia
          </Button>
        </div>

        {itinerary.days?.length === 0 ? (
          <Card className="border-2 border-dashed p-12">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                <Calendar className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Comece a montar o roteiro</h3>
                <p className="text-muted-foreground">Adicione dias e preencha com atividades, hotéis, voos e mais</p>
              </div>
              <Button onClick={handleAddDay} size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Adicionar Primeiro Dia
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {itinerary.days?.map((day, index) => {
              const isExpanded = expandedDays.includes(day.id);
              const dayFeedbackCount = (day.feedbacks?.length || 0) + 
                (day.items?.reduce((acc, item) => acc + (item.feedbacks?.length || 0), 0) || 0);
              
              return (
                <Card key={day.id} className="overflow-hidden">
                  {/* Day Header */}
                  <div 
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => toggleDay(day.id)}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex flex-col items-center justify-center text-primary-foreground flex-shrink-0">
                      <span className="text-[10px] uppercase tracking-wider opacity-80">Dia</span>
                      <span className="text-2xl font-bold">{day.day_number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">
                        {day.title || `Dia ${day.day_number}`}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {day.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(day.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                          </span>
                        )}
                        {day.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {day.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="mr-2">
                      {day.items?.length || 0} itens
                    </Badge>
                    {dayFeedbackCount > 0 && (
                      <Badge variant="outline" className="mr-2">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {dayFeedbackCount}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleEditDay(day); }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'day', id: day.id }); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Day Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      {day.description && (
                        <p className="text-muted-foreground mb-4 pl-20">{day.description}</p>
                      )}

                      {/* Timeline */}
                      <div className="relative pl-20">
                        {/* Timeline line */}
                        {(day.items?.length || 0) > 0 && (
                          <div className="absolute left-[47px] top-0 bottom-8 w-0.5 bg-border" />
                        )}

                        {/* Items */}
                        <div className="space-y-3">
                          {day.items?.map((item, itemIndex) => {
                            const itemType = getItemType(item.type);
                            const Icon = itemType.icon;
                            const itemFeedbackCount = item.feedbacks?.length || 0;
                            
                            return (
                              <div 
                                key={item.id} 
                                className="relative flex gap-4 group"
                              >
                                {/* Timeline dot */}
                                <div className={`absolute -left-[33px] w-8 h-8 rounded-full ${itemType.color} flex items-center justify-center z-10 shadow-lg`}>
                                  <Icon className="w-4 h-4 text-white" />
                                </div>

                                {/* Item content */}
                                <div 
                                  className="flex-1 bg-card border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                                  onClick={() => handleEditItem(item)}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold">{item.title}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {itemType.label}
                                        </Badge>
                                        {item.start_time && (
                                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {item.start_time.slice(0, 5)}
                                            {item.end_time && ` - ${item.end_time.slice(0, 5)}`}
                                          </span>
                                        )}
                                        {itemFeedbackCount > 0 && (
                                          <Badge variant="secondary" className="text-xs">
                                            <MessageSquare className="w-3 h-3 mr-1" />
                                            {itemFeedbackCount}
                                          </Badge>
                                        )}
                                      </div>
                                      {item.description && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                                      )}
                                      {item.location && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                                          <MapPin className="w-3 h-3" />
                                          {item.location}
                                        </p>
                                      )}
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirm({ type: 'item', id: item.id });
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Add item button */}
                        <Button 
                          variant="outline" 
                          className="w-full mt-4 border-dashed gap-2" 
                          onClick={() => handleAddItem(day.id)}
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar Item
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Feedbacks Dialog */}
      <Dialog open={feedbacksOpen} onOpenChange={setFeedbacksOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Feedbacks do Cliente ({totalFeedbacks})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            {totalFeedbacks === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum feedback recebido ainda</p>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {itinerary.days?.map((day) => {
                  const dayFeedbacks = day.feedbacks || [];
                  const hasAnyFeedback = dayFeedbacks.length > 0 || 
                    day.items?.some(item => (item.feedbacks?.length || 0) > 0);
                  
                  if (!hasAnyFeedback) return null;
                  
                  return (
                    <div key={day.id} className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {day.day_number}
                        </div>
                        {day.title || `Dia ${day.day_number}`}
                      </h3>
                      
                      {/* Day feedbacks */}
                      {dayFeedbacks.length > 0 && (
                        <div className="ml-10 space-y-2">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Feedback do Dia</p>
                          {dayFeedbacks.map((fb) => (
                            <FeedbackCard
                              key={fb.id}
                              feedback={fb}
                              type="day"
                              onReply={(msg) => handleReplyToDayFeedback(day.id, msg)}
                              isReplying={isReplying}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Item feedbacks */}
                      {day.items?.map((item) => {
                        const itemFeedbacks = item.feedbacks || [];
                        if (itemFeedbacks.length === 0) return null;
                        
                        return (
                          <div key={item.id} className="ml-10 space-y-2">
                            <p className="text-xs text-muted-foreground">
                              <span className="uppercase tracking-wider">Item:</span> {item.title}
                            </p>
                            {itemFeedbacks.map((fb) => (
                              <FeedbackCard
                                key={fb.id}
                                feedback={fb}
                                type="item"
                                onReply={(msg) => handleReplyToItemFeedback(item.id, msg)}
                                isReplying={isReplying}
                              />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurações do Roteiro</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Cliente</Label>
              <Select
                value={headerForm.client_id || 'none'}
                onValueChange={(v) => setHeaderForm({ ...headerForm, client_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem cliente</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select
                value={headerForm.status}
                onValueChange={(v) => setHeaderForm({ ...headerForm, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="revision">Em Revisão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {headerForm.requires_token ? (
                    <Lock className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Globe className="w-5 h-5 text-green-500" />
                  )}
                  <div>
                    <Label>Acesso protegido por senha</Label>
                    <p className="text-sm text-muted-foreground">
                      {headerForm.requires_token 
                        ? 'Cliente precisa de senha para ver' 
                        : 'Qualquer um com o link pode ver'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={headerForm.requires_token}
                  onCheckedChange={(checked) => setHeaderForm({ ...headerForm, requires_token: checked })}
                />
              </div>

              {headerForm.requires_token && (
                <div>
                  <Label>Senha de Acesso</Label>
                  <Input
                    value={headerForm.access_token}
                    onChange={(e) => setHeaderForm({ ...headerForm, access_token: e.target.value })}
                    placeholder="Digite uma senha..."
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Fechar
              </Button>
              <Button onClick={() => { handleSaveHeader(); setSettingsOpen(false); }}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day Dialog - IMPROVED SCROLL */}
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingDay ? 'Editar Dia' : 'Novo Dia'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            <div className="space-y-6 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número do Dia</Label>
                  <Input
                    type="number"
                    min={1}
                    value={dayForm.day_number}
                    onChange={(e) => setDayForm({ ...dayForm, day_number: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={dayForm.date}
                    onChange={(e) => setDayForm({ ...dayForm, date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Título</Label>
                <Input
                  value={dayForm.title}
                  onChange={(e) => setDayForm({ ...dayForm, title: e.target.value })}
                  placeholder="Ex: Lisboa Clássica & Miradouros"
                />
              </div>
              <div>
                <Label>Localização</Label>
                <Input
                  value={dayForm.location}
                  onChange={(e) => setDayForm({ ...dayForm, location: e.target.value })}
                  placeholder="Ex: Lisboa, Portugal"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={dayForm.description}
                  onChange={(e) => setDayForm({ ...dayForm, description: e.target.value })}
                  rows={3}
                  placeholder="Uma breve descrição do dia..."
                />
              </div>
              <MultiImageUploader
                value={dayForm.images || []}
                onChange={(urls) => setDayForm({ ...dayForm, images: urls })}
                label="Fotos do Dia"
                folder="days"
                maxImages={10}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setDayDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDay}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            <div className="space-y-6 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={itemForm.type}
                    onValueChange={(v) => setItemForm({ ...itemForm, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded ${type.color} flex items-center justify-center`}>
                              <type.icon className="w-3 h-3 text-white" />
                            </div>
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Título *</Label>
                  <Input
                    value={itemForm.title}
                    onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                    placeholder="Ex: Check-in no Hotel"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Horário Início</Label>
                  <Input
                    type="time"
                    value={itemForm.start_time}
                    onChange={(e) => setItemForm({ ...itemForm, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Horário Fim</Label>
                  <Input
                    type="time"
                    value={itemForm.end_time}
                    onChange={(e) => setItemForm({ ...itemForm, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Localização</Label>
                <Input
                  value={itemForm.location}
                  onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                  placeholder="Ex: Palácio da Pena, Sintra"
                />
              </div>
              <div>
                <Label>Endereço</Label>
                <Input
                  value={itemForm.address}
                  onChange={(e) => setItemForm({ ...itemForm, address: e.target.value })}
                  placeholder="Endereço completo..."
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  rows={3}
                  placeholder="Detalhes sobre este item..."
                />
              </div>
              <MultiImageUploader
                value={itemForm.images || []}
                onChange={(urls) => setItemForm({ ...itemForm, images: urls })}
                label="Fotos do Item"
                folder="items"
                maxImages={8}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveItem} disabled={!itemForm.title}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {deleteConfirm?.type === 'day' ? 'dia' : 'item'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'day' 
                ? 'Todos os itens deste dia também serão excluídos.' 
                : 'Esta ação não pode ser desfeita.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
