import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { usePublicItinerary, usePublicItineraryFeedback, ItineraryDay, ItineraryItem, ItineraryItemFeedback, ItineraryDayFeedback } from '@/hooks/useCustomItineraries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Loader2, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Hotel,
  Plane,
  Car,
  Ticket,
  Utensils,
  Camera,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  Lock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Reply,
  User,
  Send,
  Building2,
  Eye,
  EyeOff,
  Link2,
  ExternalLink,
  Instagram,
  ZoomIn,
  X,
  Mail,
  Phone,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ITEM_ICONS: Record<string, any> = {
  activity: Camera,
  hotel: Hotel,
  flight: Plane,
  transport: Car,
  transfer: Car,
  ticket: Ticket,
  meal: Utensils,
  other: MoreHorizontal,
};

interface FeedbackItemProps {
  feedback: ItineraryItemFeedback | ItineraryDayFeedback;
  onReply: () => void;
  agencyName?: string | null;
}

function FeedbackItem({ feedback, onReply, agencyName }: FeedbackItemProps) {
  const isApproved = feedback.is_approved;
  const isAgency = feedback.client_name === 'Agência';
  const displayName = isAgency ? (agencyName || 'Agência') : (feedback.client_name || 'Cliente');
  
  return (
    <div className={`rounded-lg p-3 space-y-2 ${
      isAgency 
        ? 'bg-primary/5 ml-4' 
        : 'bg-muted/50'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isAgency ? 'bg-primary/20' : 'bg-primary/10'
          }`}>
            {isAgency ? (
              <Building2 className="w-4 h-4 text-primary" />
            ) : (
              <User className="w-4 h-4 text-primary" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm">
              {displayName}
              {isAgency && <span className="text-xs text-muted-foreground ml-1">(resposta)</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(feedback.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        {isApproved !== null && (
          <Badge className={isApproved ? "bg-green-100 text-green-800 border-green-200" : "bg-amber-100 text-amber-800 border-amber-200"}>
            {isApproved ? (
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
      {!isAgency && (
        <div className="pl-10">
          <Button variant="ghost" size="sm" onClick={onReply} className="text-xs h-7 px-2">
            <Reply className="w-3 h-3 mr-1" />
            Responder
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PublicItinerary() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get('access');
  
  const { data, isLoading, error, refetch } = usePublicItinerary(token || null, accessToken);
  const { submitItemFeedback, submitDayFeedback, isSubmitting } = usePublicItineraryFeedback();

  const [accessInput, setAccessInput] = useState('');
  const [accessError, setAccessError] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [feedbackDialog, setFeedbackDialog] = useState<{
    type: 'item' | 'day';
    id: string;
    title: string;
    replyTo?: ItineraryItemFeedback | ItineraryDayFeedback;
  } | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    isApproved: true,
    observation: '',
    clientName: '',
  });
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [lightboxState, setLightboxState] = useState<{ images: string[]; index: number } | null>(null);

  // Auto-expand first day
  useEffect(() => {
    if (data?.itinerary?.days?.length) {
      setExpandedDays(new Set([data.itinerary.days[0].id]));
    }
  }, [data?.itinerary?.days]);

  // Count total comments
  const totalComments = data?.itinerary?.days?.reduce((acc, day: any) => {
    const dayFeedbacks = day.feedbacks?.length || 0;
    const itemFeedbacks = day.items?.reduce((itemAcc: number, item: any) => 
      itemAcc + (item.feedbacks?.length || 0), 0) || 0;
    return acc + dayFeedbacks + itemFeedbacks;
  }, 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
        <Card className="max-w-md w-full shadow-2xl">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Roteiro não encontrado</h2>
            <p className="text-muted-foreground">
              Este link não é válido ou o roteiro foi desativado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Token required screen
  if (data.requiresToken) {
    const handleAccessSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (accessInput) {
        window.location.href = `${window.location.pathname}?access=${encodeURIComponent(accessInput)}`;
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
        <Card className="max-w-md w-full shadow-2xl">
          <CardContent className="pt-8 text-center">
            <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Roteiro Protegido</h2>
            <p className="text-muted-foreground mb-6">
              Este roteiro requer uma senha de acesso.
            </p>
            <form onSubmit={handleAccessSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Digite a senha"
                value={accessInput}
                onChange={(e) => setAccessInput(e.target.value)}
                className={accessError ? 'border-destructive' : ''}
              />
              {accessError && (
                <p className="text-sm text-destructive">Senha incorreta</p>
              )}
              <Button type="submit" className="w-full">
                Acessar Roteiro
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { itinerary, agency } = data;
  if (!itinerary) return null;

  const parseDateOnly = (value?: string | null) => {
    if (!value) return null;
    const [yyyy, mm, dd] = value.split('T')[0].split('-').map(Number);
    if (!yyyy || !mm || !dd) return null;
    return new Date(yyyy, mm - 1, dd);
  };

  const formatDateOnly = (value?: string | null, pattern = "dd 'de' MMMM, yyyy") => {
    const date = parseDateOnly(value);
    if (!date) return value || '';
    return format(date, pattern, { locale: ptBR });
  };

  const formatDateRange = (start?: string | null, end?: string | null) => {
    const startLabel = formatDateOnly(start);
    const endLabel = formatDateOnly(end);
    if (startLabel && endLabel) return `${startLabel} - ${endLabel}`;
    return startLabel || endLabel || '';
  };

  const getDurationDays = () => {
    const start = parseDateOnly(itinerary.start_date);
    const end = parseDateOnly(itinerary.end_date);
    if (start && end && end >= start) {
      const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
      return diff;
    }
    return itinerary.days?.length || 0;
  };

  const hasCoverImage = Boolean(itinerary.cover_image_url);
  const heroLogoUrl = itinerary.logo_url || agency?.logo_url || agency?.logoUrl || '';
  const durationDays = getDurationDays();
  const dateRangeLabel = formatDateRange(itinerary.start_date, itinerary.end_date);
  const whatsappRaw = (agency?.phone || '').replace(/\D/g, '');
  const whatsappNumber =
    whatsappRaw && !whatsappRaw.startsWith('55') ? `55${whatsappRaw}` : whatsappRaw;
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : '';
  const footerImageUrl = itinerary.cover_image_url || '';
  const instagramHandle = (agency?.instagram_handle || agency?.instagramHandle || '').trim();
  const instagramSlug = instagramHandle.replace(/^@+/, '').trim();
  const instagramUrl = instagramSlug ? `https://instagram.com/${instagramSlug}` : '';

  const openLightbox = (images: string[], index: number) => {
    if (!images.length) return;
    setLightboxState({ images, index });
  };

  const toggleDay = (dayId: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayId)) {
      newExpanded.delete(dayId);
    } else {
      newExpanded.add(dayId);
    }
    setExpandedDays(newExpanded);
  };

  const handleOpenFeedback = (type: 'item' | 'day', id: string, title: string, replyTo?: ItineraryItemFeedback | ItineraryDayFeedback) => {
    setFeedbackForm({ isApproved: true, observation: '', clientName: '' });
    setFeedbackDialog({ type, id, title, replyTo });
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackDialog) return;

    if (feedbackDialog.type === 'item') {
      await submitItemFeedback({
        itemId: feedbackDialog.id,
        isApproved: feedbackForm.isApproved,
        observation: feedbackForm.observation || undefined,
        clientName: feedbackForm.clientName || undefined,
      });
    } else {
      await submitDayFeedback({
        dayId: feedbackDialog.id,
        isApproved: feedbackForm.isApproved,
        observation: feedbackForm.observation || undefined,
        clientName: feedbackForm.clientName || undefined,
      });
    }
    
    setFeedbackDialog(null);
    refetch();
  };

  const getItemIcon = (type: string) => ITEM_ICONS[type] || MoreHorizontal;

  const ItemFeedbackBadge = ({ feedback }: { feedback?: ItineraryItemFeedback | null }) => {
    if (!feedback) return null;
    return feedback.is_approved ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Aprovado
      </Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <MessageSquare className="w-3 h-3 mr-1" />
        Com observação
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      {hasCoverImage ? (
        <div className="p-3 md:p-4">
          <section className="relative h-[calc(100dvh-1.5rem)] md:h-[calc(100dvh-2rem)] min-h-[640px] overflow-hidden rounded-3xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${itinerary.cover_image_url})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/70" />
            <div className="relative z-10 flex h-full flex-col px-4 pb-10 pt-16 md:pb-14 md:pt-24">
              {heroLogoUrl && (
                <div className="max-w-6xl w-full mx-auto lg:mx-0 lg:pl-20">
                  <img
                    src={heroLogoUrl}
                    alt={agency?.name}
                    className="h-9 md:h-11 object-contain drop-shadow-2xl animate-in fade-in slide-in-from-top-2 duration-800"
                  />
                </div>
              )}
              <div className="flex-1 flex items-center">
                <div className="max-w-6xl w-full mx-auto lg:mx-0 lg:pl-20">
                  <div className="max-w-3xl space-y-6 text-left text-white">
                    <Badge className="w-fit bg-white/15 text-white border-white/30 px-5 py-2 text-sm animate-in fade-in slide-in-from-top-2 duration-800 delay-100 hover:bg-white/15 hover:text-white hover:border-white/30">
                      <MapPin className="w-4 h-4 mr-2" />
                      Roteiro Personalizado
                    </Badge>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold drop-shadow-2xl leading-tight animate-in fade-in slide-in-from-top-2 duration-800 delay-150">
                      {itinerary.title}
                    </h1>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        asChild
                        size="lg"
                        className="w-fit rounded-full px-8 text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-800 delay-200 group"
                      >
                        <a href="#roteiro" className="inline-flex items-center gap-3">
                          Ver roteiro completo
                          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="max-w-6xl w-full mx-auto lg:mx-0 lg:pl-20">
                <div className="flex flex-wrap gap-8 text-white/95 animate-in fade-in slide-in-from-bottom-2 duration-800 delay-300">
                  {dateRangeLabel && (
                    <div className="flex items-center gap-2 text-base font-medium">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                        <Calendar className="w-5 h-5" />
                      </span>
                      {dateRangeLabel}
                    </div>
                  )}
                  {durationDays > 0 && (
                    <div className="flex items-center gap-2 text-base font-medium">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                        <Clock className="w-5 h-5" />
                      </span>
                      {durationDays} {durationDays === 1 ? 'dia' : 'dias'}
                    </div>
                  )}
                  {itinerary.destination && (
                    <div className="flex items-center gap-2 text-base font-medium">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                        <MapPin className="w-5 h-5" />
                      </span>
                      {itinerary.destination}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-24">
          <div className="relative max-w-5xl mx-auto px-4 text-center text-white">
            {heroLogoUrl && (
              <img
                src={heroLogoUrl}
                alt={agency?.name}
                className="h-10 mx-auto mb-8 object-contain brightness-0 invert"
              />
            )}
            <Badge className="mb-6 bg-white/20 text-white border-white/30 px-5 py-2">
              <MapPin className="w-4 h-4 mr-2" />
              Roteiro Personalizado
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">{itinerary.title}</h1>
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/90">
              {dateRangeLabel && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{dateRangeLabel}</span>
                </div>
              )}
              {durationDays > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{durationDays} {durationDays === 1 ? 'dia' : 'dias'}</span>
                </div>
              )}
              {itinerary.destination && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{itinerary.destination}</span>
                </div>
              )}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="rounded-full px-8 group">
                <a href="#roteiro" className="inline-flex items-center gap-3">
                  Ver roteiro completo
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </Button>
              {totalComments > 0 && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 bg-white/10 text-white border-white/30 hover:bg-white/20"
                >
                  <a href="#comentarios">Ver comentários</a>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-12 pt-16 md:pt-20 pb-20 md:pb-24 space-y-16">
        {/* Description */}
        {itinerary.description && (
          <section className="rounded-3xl bg-white/90 border border-slate-100/80 shadow-xl p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.32em] text-primary/60">Sobre o roteiro</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900">
              {itinerary.destination ? `Roteiro em ${itinerary.destination}` : 'Detalhes do roteiro'}
            </h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              {itinerary.description}
            </p>
          </section>
        )}

        {/* Comments Toggle */}
        {totalComments > 0 && (
          <section
            id="comentarios"
            className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-3xl bg-white/90 border border-slate-100/80 p-6 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">{totalComments} comentário{totalComments !== 1 ? 's' : ''}</p>
                <p className="text-sm text-muted-foreground">
                  {showComments ? 'Exibindo comentários' : 'Comentários ocultos'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showComments ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <Switch
                checked={showComments}
                onCheckedChange={setShowComments}
              />
            </div>
          </section>
        )}

        {/* Days */}
        <section className="space-y-6" id="roteiro">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Programação</h2>
            <Badge className="rounded-full bg-primary/10 text-primary border-transparent px-4 py-2 text-sm">
              {itinerary.days?.length || 0} {itinerary.days?.length === 1 ? 'dia' : 'dias'}
            </Badge>
          </div>

          {itinerary.days?.map(
            (day: ItineraryDay & { feedback?: ItineraryDayFeedback | null; feedbacks?: ItineraryDayFeedback[] }) => {
              const dayLinks = day.links || [];

              return (
                <Card key={day.id} className="overflow-hidden rounded-3xl border-0 shadow-lg bg-white/90">
                  <button
                    className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors"
                    onClick={() => toggleDay(day.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex flex-col items-center justify-center font-bold">
                        <span className="text-xs uppercase">Dia</span>
                        <span className="text-2xl">{day.day_number}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{day.title || `Dia ${day.day_number}`}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {day.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {day.location}
                            </span>
                          )}
                          {day.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDateOnly(day.date, 'dd/MM/yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {day.feedback && (
                        <Badge
                          className={day.feedback.is_approved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {day.feedback.is_approved ? 'Aprovado' : 'Com observação'}
                        </Badge>
                      )}
                      {showComments && (day.feedbacks?.length || 0) > 0 && (
                        <Badge variant="secondary">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {day.feedbacks?.length}
                        </Badge>
                      )}
                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${
                          expandedDays.has(day.id) ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {expandedDays.has(day.id) && (
                    <CardContent className="pt-0 pb-8">
                  {/* Day Images - support for multiple images */}
                  {((day as any).images?.length > 0 || day.cover_image_url) && (
                    <div className="mb-6 max-w-xl mx-auto">
                      {(() => {
                        const dayImages = (day as any).images?.length > 0 
                          ? (day as any).images 
                          : (day.cover_image_url ? [day.cover_image_url] : []);
                        
                        if (dayImages.length === 1) {
                          return (
                            <button
                              type="button"
                              className="group w-full transition-transform duration-500 ease-out hover:-translate-y-1"
                              onClick={() => openLightbox(dayImages, 0)}
                            >
                              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-sm bg-slate-100">
                                <img 
                                  src={dayImages[0]} 
                                  alt={day.title || `Dia ${day.day_number}`}
                                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-center justify-center">
                                  <ZoomIn className="w-6 h-6 text-white transition-transform duration-500 group-hover:scale-110" />
                                </div>
                              </div>
                            </button>
                          );
                        }
                        
                        if (dayImages.length === 2) {
                          return (
                            <div className="grid grid-cols-2 gap-2">
                              {dayImages.map((img: string, idx: number) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="group w-full transition-transform duration-500 ease-out hover:-translate-y-1"
                                  onClick={() => openLightbox(dayImages, idx)}
                                >
                                  <div className="relative aspect-square rounded-2xl overflow-hidden shadow-sm bg-slate-100">
                                    <img 
                                      src={img} 
                                      alt={`${day.title || `Dia ${day.day_number}`} - ${idx + 1}`}
                                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-center justify-center">
                                      <ZoomIn className="w-5 h-5 text-white transition-transform duration-500 group-hover:scale-110" />
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          );
                        }
                        
                        if (dayImages.length === 3) {
                          return (
                            <div className="grid grid-cols-3 gap-2">
                              {dayImages.map((img: string, idx: number) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="group w-full transition-transform duration-500 ease-out hover:-translate-y-1"
                                  onClick={() => openLightbox(dayImages, idx)}
                                >
                                  <div className="relative aspect-square rounded-2xl overflow-hidden shadow-sm bg-slate-100">
                                    <img 
                                      src={img} 
                                      alt={`${day.title || `Dia ${day.day_number}`} - ${idx + 1}`}
                                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-center justify-center">
                                      <ZoomIn className="w-5 h-5 text-white transition-transform duration-500 group-hover:scale-110" />
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          );
                        }
                        
                        if (dayImages.length === 4) {
                          return (
                            <div className="grid grid-cols-2 gap-2">
                              {dayImages.map((img: string, idx: number) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="group w-full transition-transform duration-500 ease-out hover:-translate-y-1"
                                  onClick={() => openLightbox(dayImages, idx)}
                                >
                                  <div className="relative aspect-square rounded-2xl overflow-hidden shadow-sm bg-slate-100">
                                    <img 
                                      src={img} 
                                      alt={`${day.title || `Dia ${day.day_number}`} - ${idx + 1}`}
                                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-center justify-center">
                                      <ZoomIn className="w-5 h-5 text-white transition-transform duration-500 group-hover:scale-110" />
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          );
                        }
                        
                        // 5+ images: use carousel
                        return (
                          <Carousel className="w-full">
                            <CarouselContent>
                              {dayImages.map((img: string, idx: number) => (
                                <CarouselItem key={idx} className="basis-1/2 md:basis-1/3">
                                  <button
                                    type="button"
                                    className="group w-full transition-transform duration-500 ease-out hover:-translate-y-1"
                                    onClick={() => openLightbox(dayImages, idx)}
                                  >
                                    <div className="relative aspect-square rounded-2xl overflow-hidden shadow-sm bg-slate-100">
                                      <img 
                                        src={img} 
                                        alt={`${day.title || `Dia ${day.day_number}`} - ${idx + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                      />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-center justify-center">
                                        <ZoomIn className="w-5 h-5 text-white transition-transform duration-500 group-hover:scale-110" />
                                      </div>
                                    </div>
                                  </button>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious className="-left-4" />
                            <CarouselNext className="-right-4" />
                          </Carousel>
                        );
                      })()}
                    </div>
                  )}

                  {day.description && (
                    <p className="text-slate-600 mb-6 text-base">{day.description}</p>
                  )}

                  {dayLinks.length > 0 && (
                    <div className="mb-6 space-y-3 rounded-2xl border border-slate-100/80 bg-white/80 p-4">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Links do dia
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {dayLinks.map((link, idx) => (
                            <a
                              key={`${link.url}-${idx}`}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-primary/40 hover:text-primary"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                              {link.label}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="space-y-4">
                    {(day.items as (ItineraryItem & { feedback?: ItineraryItemFeedback | null; feedbacks?: ItineraryItemFeedback[] })[])?.map((item) => {
                      const Icon = getItemIcon(item.type);
                      const itemFeedbacks = item.feedbacks || (item.feedback ? [item.feedback] : []);
                      const itemImages = item.images || [];
                      const itemLinks = item.links || [];
                      
                      return (
                        <div key={item.id} className="flex gap-4 p-4 rounded-2xl border border-slate-100/80 bg-slate-50/80 shadow-sm">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold">{item.title}</h4>
                              <ItemFeedbackBadge feedback={item.feedback} />
                            </div>
                            {item.start_time && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                                <Clock className="w-3 h-3" />
                                {item.start_time.slice(0, 5)}
                                {item.end_time && ` - ${item.end_time.slice(0, 5)}`}
                              </p>
                            )}
                            {item.location && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                                <MapPin className="w-3 h-3" />
                                {item.location}
                              </p>
                            )}
                            {item.description && (
                              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                {item.description}
                              </p>
                            )}
                            {itemLinks.length > 0 && (
                              <div className="mt-3 space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  {itemLinks.map((link, idx) => (
                                    <a
                                      key={`${link.url}-${idx}`}
                                      href={link.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-primary/40 hover:text-primary"
                                    >
                                      <Link2 className="w-3.5 h-3.5" />
                                      {link.label}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            {itemImages.length > 0 && (
                              <div className="mt-3 max-w-lg">
                                {itemImages.length <= 4 ? (
                                  <div className={`grid gap-2 ${
                                    itemImages.length === 1 ? 'grid-cols-1' :
                                    itemImages.length === 2 ? 'grid-cols-2' :
                                    itemImages.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
                                  }`}>
                                    {itemImages.map((img, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        className="group w-full transition-transform duration-500 ease-out hover:-translate-y-1"
                                        onClick={() => openLightbox(itemImages, idx)}
                                      >
                                        <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 shadow-sm">
                                          <img 
                                            src={img}
                                            alt=""
                                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                          />
                                          <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-center justify-center">
                                            <ZoomIn className="w-5 h-5 text-white transition-transform duration-500 group-hover:scale-110" />
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <Carousel className="w-full">
                                    <CarouselContent>
                                      {itemImages.map((img, idx) => (
                                        <CarouselItem key={idx} className="basis-1/2 md:basis-1/4">
                                          <button
                                            type="button"
                                            className="group w-full transition-transform duration-500 ease-out hover:-translate-y-1"
                                            onClick={() => openLightbox(itemImages, idx)}
                                          >
                                            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 shadow-sm">
                                              <img 
                                                src={img}
                                                alt=""
                                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                              />
                                              <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-center justify-center">
                                                <ZoomIn className="w-4 h-4 text-white transition-transform duration-500 group-hover:scale-110" />
                                              </div>
                                            </div>
                                          </button>
                                        </CarouselItem>
                                      ))}
                                    </CarouselContent>
                                    <CarouselPrevious className="-left-3" />
                                    <CarouselNext className="-right-3" />
                                  </Carousel>
                                )}
                              </div>
                            )}

                            {/* Existing Feedbacks */}
                            {showComments && itemFeedbacks.length > 0 && (
                              <div className="mt-4 space-y-2 rounded-2xl bg-white/80 border border-slate-100/80 p-3">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                  Comentários ({itemFeedbacks.length})
                                </p>
                                {itemFeedbacks.map((fb) => (
                                  <FeedbackItem 
                                    key={fb.id} 
                                    feedback={fb}
                                    agencyName={agency?.name}
                                    onReply={() => handleOpenFeedback('item', item.id, item.title, fb)}
                                  />
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2 mt-3">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleOpenFeedback('item', item.id, item.title)}
                              >
                                <MessageSquare className="w-4 h-4 mr-1" />
                                {itemFeedbacks.length > 0 ? 'Adicionar Comentário' : 'Feedback'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Day Feedbacks */}
                  {showComments && ((day.feedbacks?.length || 0) > 0 || day.feedback) && (
                    <div className="mt-6 p-4 bg-slate-50/80 border border-slate-100/80 rounded-2xl space-y-3">
                      <p className="text-sm font-medium flex items-center gap-2 text-slate-700">
                        <MessageSquare className="w-4 h-4" />
                        Comentários do Dia
                      </p>
                      {(day.feedbacks || (day.feedback ? [day.feedback] : [])).map((fb) => (
                        <FeedbackItem 
                          key={fb.id}
                          feedback={fb}
                          agencyName={agency?.name}
                          onReply={() => handleOpenFeedback('day', day.id, day.title || `Dia ${day.day_number}`, fb)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Day Feedback Button */}
                  <div className="flex justify-center mt-6">
                    <Button 
                      variant="outline"
                      className="rounded-full px-6"
                      onClick={() => handleOpenFeedback('day', day.id, day.title || `Dia ${day.day_number}`)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Adicionar feedback ao dia
                    </Button>
                  </div>
                </CardContent>
                  )}
                </Card>
              );
            },
          )}
        </section>
      </div>

      {/* Footer */}
      {agency && (
        <footer className="relative mt-0 min-h-[320px] overflow-hidden w-screen left-1/2 -translate-x-1/2">
          {footerImageUrl && (
            <div className="absolute inset-0">
              <img
                src={footerImageUrl}
                alt=""
                className="h-full w-full object-cover object-center"
                style={{
                  WebkitMaskImage:
                    'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 80%)',
                  maskImage:
                    'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 80%)',
                }}
              />
            </div>
          )}
          <div className="relative h-full w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pt-16 pb-10 md:flex-row md:items-center md:justify-between md:px-8 lg:px-12">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Organizado por</p>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{agency.name}</p>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-3 text-slate-700">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Entre em contato</p>
                <div className="flex flex-wrap items-center gap-3">
                  {agency.email && (
                    <a
                      href={`mailto:${agency.email}`}
                      aria-label="Enviar email"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-600 shadow-sm transition hover:text-slate-900"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {agency.phone && (
                    whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        aria-label="Falar no WhatsApp"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-600 shadow-sm transition hover:text-slate-900"
                      >
                        <svg
                          viewBox="0 0 32 32"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path
                            fill="currentColor"
                            d="M16.001 2.003c-7.732 0-14 6.268-14 14 0 2.465.656 4.878 1.902 7.002L2 30l7.144-1.875A13.93 13.93 0 0 0 16.001 30c7.732 0 14-6.268 14-14s-6.268-13.997-14-13.997zm0 25.997a11.93 11.93 0 0 1-6.095-1.688l-.436-.26-4.242 1.114 1.132-4.136-.283-.424A11.926 11.926 0 0 1 4.002 16c0-6.627 5.372-12 11.999-12 6.628 0 12 5.373 12 12 0 6.628-5.372 12-11.999 12zm6.557-8.65c-.358-.179-2.122-1.045-2.452-1.165-.329-.12-.569-.179-.808.179-.239.358-.928 1.165-1.137 1.404-.209.239-.418.269-.776.09-.358-.179-1.513-.557-2.882-1.777-1.065-.95-1.785-2.122-1.994-2.48-.209-.358-.022-.552.157-.732.161-.16.358-.418.537-.627.179-.209.239-.358.358-.597.12-.239.06-.448-.03-.627-.09-.179-.808-1.956-1.107-2.687-.293-.703-.59-.607-.808-.616-.209-.009-.448-.011-.687-.011-.239 0-.627.09-.956.448-.329.358-1.256 1.227-1.256 2.986s1.286 3.459 1.465 3.698c.179.239 2.531 3.87 6.137 5.423.858.37 1.527.59 2.049.756.86.274 1.642.236 2.26.143.69-.103 2.122-.867 2.42-1.704.299-.836.299-1.554.209-1.704-.09-.149-.329-.239-.687-.418z"
                          />
                        </svg>
                      </a>
                    ) : (
                      <a
                        href={`tel:${agency.phone}`}
                        aria-label="Ligar"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-600 shadow-sm transition hover:text-slate-900"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )
                  )}
                  {instagramSlug && (
                    <a
                      href={instagramUrl}
                      aria-label="Instagram"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-600 shadow-sm transition hover:text-slate-900"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}

      {lightboxState && (
        <Dialog
          open={lightboxState !== null}
          onOpenChange={(open) => {
            if (!open) setLightboxState(null);
          }}
        >
          <DialogContent className="max-w-5xl w-[95vw] bg-transparent border-0 shadow-none p-0">
            {lightboxState && (
              <div className="relative overflow-hidden rounded-[28px] bg-black">
                <img
                  src={lightboxState.images[lightboxState.index]}
                  alt="Foto do roteiro"
                  className="w-full max-h-[82vh] object-contain bg-black"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-4 bg-white/80 hover:bg-white"
                  onClick={() => setLightboxState(null)}
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </Button>
                {lightboxState.images.length > 1 && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                      onClick={() =>
                        setLightboxState((prev) =>
                          prev
                            ? {
                                ...prev,
                                index: (prev.index - 1 + prev.images.length) % prev.images.length,
                              }
                            : prev,
                        )
                      }
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                      onClick={() =>
                        setLightboxState((prev) =>
                          prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : prev,
                        )
                      }
                      aria-label="Próxima imagem"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Feedback Dialog */}
      <Dialog open={!!feedbackDialog} onOpenChange={() => setFeedbackDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {feedbackDialog?.replyTo ? 'Responder Comentário' : `Feedback: ${feedbackDialog?.title}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Show original comment if replying */}
            {feedbackDialog?.replyTo && (
              <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-primary">
                <p className="text-xs text-muted-foreground mb-1">
                  Respondendo a {feedbackDialog.replyTo.client_name || 'Cliente'}:
                </p>
                <p className="text-sm">{feedbackDialog.replyTo.observation || '(sem mensagem)'}</p>
              </div>
            )}

            <div>
              <Label>Seu nome</Label>
              <Input
                value={feedbackForm.clientName}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, clientName: e.target.value })}
                placeholder="Como você gostaria de ser chamado?"
              />
            </div>

            <div>
              <Label className="mb-3 block">O que você achou?</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={feedbackForm.isApproved ? 'default' : 'outline'}
                  className={`h-auto py-4 flex-col gap-2 ${feedbackForm.isApproved ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  onClick={() => setFeedbackForm({ ...feedbackForm, isApproved: true })}
                >
                  <ThumbsUp className="w-6 h-6" />
                  Aprovado
                </Button>
                <Button
                  type="button"
                  variant={!feedbackForm.isApproved ? 'default' : 'outline'}
                  className={`h-auto py-4 flex-col gap-2 ${!feedbackForm.isApproved ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                  onClick={() => setFeedbackForm({ ...feedbackForm, isApproved: false })}
                >
                  <ThumbsDown className="w-6 h-6" />
                  Precisa ajustes
                </Button>
              </div>
            </div>

            <div>
              <Label>Observação</Label>
              <Textarea
                value={feedbackForm.observation}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, observation: e.target.value })}
                placeholder="Conte-nos mais detalhes..."
                rows={4}
              />
            </div>

            <Button 
              onClick={handleSubmitFeedback} 
              className="w-full gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Enviar Feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
