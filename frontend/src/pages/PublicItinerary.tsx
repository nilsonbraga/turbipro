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
  Reply,
  User,
  Send,
  Building2,
  Eye,
  EyeOff
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
}

function FeedbackItem({ feedback, onReply }: FeedbackItemProps) {
  const isApproved = feedback.is_approved;
  const isAgency = feedback.client_name === 'Agência';
  
  return (
    <div className={`rounded-lg p-3 space-y-2 ${
      isAgency 
        ? 'bg-primary/5 border-l-4 border-primary ml-4' 
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
              {feedback.client_name || 'Cliente'}
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

  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM, yyyy", { locale: ptBR });
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
      {/* Hero */}
      {itinerary.cover_image_url ? (
        <div 
          className="relative h-[50vh] min-h-[400px] bg-cover bg-center"
          style={{ backgroundImage: `url(${itinerary.cover_image_url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-background" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            {agency?.logo_url && (
              <img 
                src={agency.logo_url} 
                alt={agency.name}
                className="h-14 mb-6 object-contain drop-shadow-2xl"
              />
            )}
            <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl mb-4 max-w-4xl">
              {itinerary.title}
            </h1>
            {itinerary.destination && (
              <div className="flex items-center gap-2 text-white/90 mb-4">
                <MapPin className="w-5 h-5" />
                <span className="text-lg">{itinerary.destination}</span>
              </div>
            )}
            {(itinerary.start_date || itinerary.end_date) && (
              <div className="flex items-center gap-2 text-white/90">
                <Calendar className="w-5 h-5" />
                <span>
                  {itinerary.start_date && formatDate(itinerary.start_date)}
                  {itinerary.end_date && ` - ${formatDate(itinerary.end_date)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            {agency?.logo_url && (
              <img 
                src={agency.logo_url} 
                alt={agency.name}
                className="h-12 mx-auto mb-6 object-contain brightness-0 invert"
              />
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {itinerary.title}
            </h1>
            {itinerary.destination && (
              <div className="flex items-center justify-center gap-2 text-white/90 mb-4">
                <MapPin className="w-5 h-5" />
                <span className="text-lg">{itinerary.destination}</span>
              </div>
            )}
            {(itinerary.start_date || itinerary.end_date) && (
              <div className="flex items-center justify-center gap-2 text-white/90">
                <Calendar className="w-5 h-5" />
                <span>
                  {itinerary.start_date && formatDate(itinerary.start_date)}
                  {itinerary.end_date && ` - ${formatDate(itinerary.end_date)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Description */}
        {itinerary.description && (
          <div className="text-center mb-12">
            <p className="text-xl text-muted-foreground leading-relaxed">
              {itinerary.description}
            </p>
          </div>
        )}

        {/* Comments Toggle */}
        {totalComments > 0 && (
          <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-xl border">
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
          </div>
        )}

        {/* Days */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Programação</h2>

          {itinerary.days?.map((day: ItineraryDay & { feedback?: ItineraryDayFeedback | null; feedbacks?: ItineraryDayFeedback[] }) => (
            <Card key={day.id} className="overflow-hidden">
              <button
                className="w-full p-6 flex items-center justify-between text-left hover:bg-accent/50 transition-colors"
                onClick={() => toggleDay(day.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex flex-col items-center justify-center font-bold">
                    <span className="text-xs uppercase">Dia</span>
                    <span className="text-2xl">{day.day_number}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{day.title || `Dia ${day.day_number}`}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {day.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {day.location}
                        </span>
                      )}
                      {day.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(day.date), "dd/MM/yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {day.feedback && (
                    <Badge className={day.feedback.is_approved 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                    }>
                      {day.feedback.is_approved ? 'Aprovado' : 'Com observação'}
                    </Badge>
                  )}
                  {showComments && (day.feedbacks?.length || 0) > 0 && (
                    <Badge variant="secondary">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {day.feedbacks?.length}
                    </Badge>
                  )}
                  <ChevronDown className={`w-5 h-5 transition-transform ${
                    expandedDays.has(day.id) ? 'rotate-180' : ''
                  }`} />
                </div>
              </button>

              {expandedDays.has(day.id) && (
                <CardContent className="pt-0 pb-6">
                  {/* Day Images - support for multiple images */}
                  {((day as any).images?.length > 0 || day.cover_image_url) && (
                    <div className="mb-6">
                      {(() => {
                        const dayImages = (day as any).images?.length > 0 
                          ? (day as any).images 
                          : (day.cover_image_url ? [day.cover_image_url] : []);
                        
                        if (dayImages.length === 1) {
                          return (
                            <div className="rounded-xl overflow-hidden">
                              <img 
                                src={dayImages[0]} 
                                alt={day.title || `Dia ${day.day_number}`}
                                className="w-full h-48 object-cover"
                              />
                            </div>
                          );
                        }
                        
                        if (dayImages.length === 2) {
                          return (
                            <div className="grid grid-cols-2 gap-2">
                              {dayImages.map((img: string, idx: number) => (
                                <div key={idx} className="rounded-xl overflow-hidden">
                                  <img 
                                    src={img} 
                                    alt={`${day.title || `Dia ${day.day_number}`} - ${idx + 1}`}
                                    className="w-full h-40 object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          );
                        }
                        
                        if (dayImages.length === 3) {
                          return (
                            <div className="grid grid-cols-3 gap-2">
                              {dayImages.map((img: string, idx: number) => (
                                <div key={idx} className="rounded-xl overflow-hidden">
                                  <img 
                                    src={img} 
                                    alt={`${day.title || `Dia ${day.day_number}`} - ${idx + 1}`}
                                    className="w-full h-32 object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          );
                        }
                        
                        if (dayImages.length === 4) {
                          return (
                            <div className="grid grid-cols-2 gap-2">
                              {dayImages.map((img: string, idx: number) => (
                                <div key={idx} className="rounded-xl overflow-hidden">
                                  <img 
                                    src={img} 
                                    alt={`${day.title || `Dia ${day.day_number}`} - ${idx + 1}`}
                                    className="w-full h-32 object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          );
                        }
                        
                        // 5+ images: use carousel
                        return (
                          <Carousel className="w-full">
                            <CarouselContent>
                              {dayImages.map((img: string, idx: number) => (
                                <CarouselItem key={idx} className="basis-2/3 md:basis-1/2">
                                  <div className="rounded-xl overflow-hidden">
                                    <img 
                                      src={img} 
                                      alt={`${day.title || `Dia ${day.day_number}`} - ${idx + 1}`}
                                      className="w-full h-48 object-cover"
                                    />
                                  </div>
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
                    <p className="text-muted-foreground mb-6">{day.description}</p>
                  )}

                  {/* Items */}
                  <div className="space-y-4">
                    {(day.items as (ItineraryItem & { feedback?: ItineraryItemFeedback | null; feedbacks?: ItineraryItemFeedback[] })[])?.map((item) => {
                      const Icon = getItemIcon(item.type);
                      const itemFeedbacks = item.feedbacks || (item.feedback ? [item.feedback] : []);
                      
                      return (
                        <div key={item.id} className="flex gap-4 p-4 rounded-xl border bg-card">
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
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {item.description}
                              </p>
                            )}
                            {item.images && item.images.length > 0 && (
                              <div className="mt-3">
                                {item.images.length <= 4 ? (
                                  <div className={`grid gap-2 ${
                                    item.images.length === 1 ? 'grid-cols-1' :
                                    item.images.length === 2 ? 'grid-cols-2' :
                                    item.images.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
                                  }`}>
                                    {item.images.map((img, idx) => (
                                      <img 
                                        key={idx}
                                        src={img}
                                        alt=""
                                        className={`rounded-lg object-cover w-full ${
                                          item.images!.length === 1 ? 'h-40' : 'h-24'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <Carousel className="w-full">
                                    <CarouselContent>
                                      {item.images.map((img, idx) => (
                                        <CarouselItem key={idx} className="basis-1/3">
                                          <img 
                                            src={img}
                                            alt=""
                                            className="w-full h-24 rounded-lg object-cover"
                                          />
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
                              <div className="mt-4 space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Comentários ({itemFeedbacks.length})
                                </p>
                                {itemFeedbacks.map((fb) => (
                                  <FeedbackItem 
                                    key={fb.id} 
                                    feedback={fb}
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
                    <div className="mt-6 p-4 bg-muted/30 rounded-xl space-y-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Comentários do Dia
                      </p>
                      {(day.feedbacks || (day.feedback ? [day.feedback] : [])).map((fb) => (
                        <FeedbackItem 
                          key={fb.id}
                          feedback={fb}
                          onReply={() => handleOpenFeedback('day', day.id, day.title || `Dia ${day.day_number}`, fb)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Day Feedback Button */}
                  <div className="flex justify-center mt-6">
                    <Button 
                      variant="outline"
                      onClick={() => handleOpenFeedback('day', day.id, day.title || `Dia ${day.day_number}`)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Adicionar feedback ao dia
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Agency Footer */}
      {agency && (
        <div className="border-t py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            {agency.logo_url && (
              <img 
                src={agency.logo_url} 
                alt={agency.name}
                className="h-10 mx-auto mb-4 object-contain"
              />
            )}
            <p className="text-muted-foreground">{agency.name}</p>
            {agency.email && (
              <p className="text-sm text-muted-foreground">{agency.email}</p>
            )}
          </div>
        </div>
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
