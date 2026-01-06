import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicExpeditionGroup, usePublicRegistration, Testimonial, FAQ, PricingOffer, ExpeditionItineraryDay } from '@/hooks/useExpeditionGroups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Loader2, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Check,
  X,
  DollarSign,
  CreditCard,
  Star,
  ExternalLink,
  Play,
  HelpCircle,
  Mail,
  Instagram,
  Quote,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Ticket
} from 'lucide-react';

export default function PublicExpedition() {
  const { token } = useParams<{ token: string }>();
  const { data: group, isLoading, error } = usePublicExpeditionGroup(token || null);
  const registerMutation = usePublicRegistration();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    datePreference: '',
    selectedOfferIndex: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isWaitlist, setIsWaitlist] = useState(false);
  const [lightboxState, setLightboxState] = useState<{
    images: Array<{ url: string; title?: string; description?: string }>;
    index: number;
  } | null>(null);
  const [itineraryDrawerOpen, setItineraryDrawerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        <Card className="max-w-md w-full shadow-2xl">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Grupo não encontrado</h2>
            <p className="text-muted-foreground">
              Este link de inscrição não é válido ou o grupo foi desativado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const spotsLeft = group.max_participants - (group.registrations_count || 0);
  const isFull = spotsLeft <= 0;
  const endDate = new Date(group.start_date);
  endDate.setDate(endDate.getDate() + group.duration_days - 1);

  const hasCoverImage = !!group.cover_image_url;
  const carouselImages = (group.carousel_images || []).filter(Boolean) as string[];
  const hasCarousel = carouselImages.length > 0;
  const hasLandingText = !!group.landing_text;
  const hasImpactPhrase = !!group.impact_phrase;
  const descriptionGallery = (group.description_gallery_images || []).filter(Boolean);
  const descriptionImages =
    descriptionGallery.length > 0
      ? descriptionGallery
      : group.description_image_url
      ? [group.description_image_url]
      : [];
  const hasDescriptionImages = descriptionImages.length > 0;
  const showIntroSideImage = descriptionImages.length > 0;
  const introSideImage = descriptionImages.length > 1 ? descriptionImages[1] : descriptionImages[0];
  const hasAboutSection = !!group.about_title || !!group.about_description || !!group.about_image_url;
  const hasDestinationSummary =
    !!group.destination_summary_title ||
    !!group.destination_summary_description ||
    !!group.destination_summary_image_url;
  const itineraryDays = (group.itinerary_days || []) as ExpeditionItineraryDay[];
  const hasItineraryDays = itineraryDays.length > 0;
  const hasItinerarySummary =
    !!group.itinerary_summary_title ||
    !!group.itinerary_summary_description ||
    (group.itinerary_summary_images && group.itinerary_summary_images.length > 0) ||
    hasItineraryDays;
  const hasTransportSection =
    !!group.transport_title || !!group.transport_text || (group.transport_images && group.transport_images.length > 0);
  const hasNotRecommended =
    group.not_recommended_items && group.not_recommended_items.length > 0;
  const introHeading = group.impact_phrase || group.destination;
  const introDescription = group.description || null;
  const hasIncludedItems = group.included_items && group.included_items.length > 0;
  const hasExcludedItems = group.excluded_items && group.excluded_items.length > 0;
  const pricingOffers = (group.pricing_offers as PricingOffer[] | undefined) || [];
  const legacyOffer: PricingOffer[] =
    (group.price_cash || group.price_installment || group.installments_count)
      ? [
          {
            title: 'Pacote principal',
            description: '',
            price_cash: group.price_cash ?? null,
            price_installment: group.price_installment ?? null,
            installments_count: group.installments_count ?? null,
            entry_value: null,
            is_offer: false,
            original_price_cash: null,
            original_price_installment: null,
            currency: group.currency || 'BRL',
          },
        ]
      : [];
  const resolvedOffers = pricingOffers.length > 0 ? pricingOffers : legacyOffer;
  const hasPricing = resolvedOffers.length > 0;
  const hasYouTube = !!group.youtube_video_url;
  const hasTestimonials = group.testimonials && (group.testimonials as Testimonial[]).length > 0;
  const hasFaqs = group.faqs && (group.faqs as FAQ[]).length > 0;
  const hasGoogleReviews = !!group.google_reviews_url;
  const itineraryImages = (group.itinerary_summary_images || []) as Array<{
    url: string;
    title?: string;
    description?: string;
  }>;
  const transportImages = (group.transport_images || []) as string[];
  const agency = group.agency as any | undefined;
  const agencyLogoUrl =
    agency?.logo_url ||
    agency?.logoUrl ||
    agency?.logo_minimal_url ||
    agency?.logoMinimalUrl ||
    '';
  const expeditionLogoUrl = group.logo_url || '';
  const heroLogoUrl = expeditionLogoUrl || agencyLogoUrl;
  const instagramHandle =
    (agency?.instagram_handle || agency?.instagramHandle || '').trim();
  const instagramSlug = instagramHandle.replace(/^@+/, '').trim();
  const instagramUrl = instagramSlug ? `https://instagram.com/${instagramSlug}` : '';
  const whatsappRaw = (agency?.phone || '').replace(/\D/g, '');
  const whatsappNumber =
    whatsappRaw && !whatsappRaw.startsWith('55') ? `55${whatsappRaw}` : whatsappRaw;
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : '';
  const footerImageUrl = group.footer_image_url || group.cover_image_url || '';

  const testimonials = (group.testimonials as Testimonial[]) || [];
  const faqs = (group.faqs as FAQ[]) || [];

  const currencySymbol = {
    BRL: 'R$',
    EUR: '€',
    USD: '$',
  }[group.currency || 'BRL'];

  const getCurrencySymbol = (code?: string | null) =>
    ({
      BRL: 'R$',
      EUR: '€',
      USD: '$',
    } as Record<string, string>)[code || group.currency || 'BRL'] || 'R$';

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '';
    return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getPhotoGridCols = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    return 'grid-cols-3';
  };

  const getPhotoHeight = (count: number, variant: 'day' | 'item') => {
    if (variant === 'day') {
      if (count <= 1) return 'h-24';
      if (count === 2) return 'h-20';
      return 'h-16';
    }
    if (count <= 1) return 'h-20';
    if (count === 2) return 'h-16';
    return 'h-14';
  };

  const getOfferLabel = (offer: PricingOffer, index: number) =>
    offer.title?.trim() ? offer.title.trim() : `Pacote ${index + 1}`;

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const willBeWaitlist = isFull;
    setIsWaitlist(willBeWaitlist);

    const selectedOffer =
      formData.selectedOfferIndex !== ''
        ? resolvedOffers[Number(formData.selectedOfferIndex)]
        : null;
    const selectedOfferTitle = selectedOffer
      ? getOfferLabel(selectedOffer, Number(formData.selectedOfferIndex))
      : undefined;

    await registerMutation.mutateAsync({
      groupId: group.id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      isWaitlist: willBeWaitlist,
      datePreference: formData.datePreference || undefined,
      selectedOfferTitle,
    });
    
    setSubmitted(true);
  };

  const handleSelectOffer = (offerIndex: number) => {
    setFormData((prev) => ({ ...prev, selectedOfferIndex: String(offerIndex) }));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatHeroRange = (start: string, end: Date) => {
    const startDate = new Date(start);
    const startDay = startDate.getDate();
    const endDay = end.getDate();
    const startMonth = startDate.toLocaleDateString('pt-BR', { month: 'long' });
    const endMonth = end.toLocaleDateString('pt-BR', { month: 'long' });
    const startYear = startDate.getFullYear();
    const endYear = end.getFullYear();

    if (startYear === endYear && startDate.getMonth() === end.getMonth()) {
      return `${startDay} a ${endDay} de ${startMonth} / ${startYear}`;
    }

    return `${startDay} ${startMonth} / ${startYear} a ${endDay} ${endMonth} / ${endYear}`;
  };

  const renderParagraphs = (text?: string | null, className = '') => {
    if (!text) return null;
    const paragraphs = text
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    return (
      <div className={`space-y-4 text-justify ${className}`.trim()}>
        {paragraphs.map((paragraph, index) => (
          <p key={`${index}-${paragraph.slice(0, 16)}`}>{paragraph}</p>
        ))}
      </div>
    );
  };

  if (submitted) {
    const selectedOffer =
      formData.selectedOfferIndex !== ''
        ? resolvedOffers[Number(formData.selectedOfferIndex)]
        : null;
    const selectedOfferLabel = selectedOffer
      ? getOfferLabel(selectedOffer, Number(formData.selectedOfferIndex))
      : null;
    const confirmationImage =
      descriptionImages[0] ||
      group.destination_summary_image_url ||
      group.cover_image_url ||
      null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="p-3 md:p-4">
          <section className="relative min-h-[calc(100dvh-2rem)] overflow-hidden rounded-3xl flex items-center justify-center">
            {confirmationImage ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${confirmationImage})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-primary/10" />
            )}
            <div
              className={`absolute inset-0 ${
                confirmationImage
                  ? 'bg-gradient-to-b from-black/60 via-black/40 to-black/75'
                  : 'bg-gradient-to-br from-white/70 via-white/90 to-white'
              }`}
            />

            <div className="relative z-10 w-full px-4 py-12 md:px-10">
              <div className="mx-auto w-full max-w-6xl">
                <div className="flex flex-col items-center gap-8 text-center">
                  <div className="space-y-6 text-white text-center flex flex-col items-center max-w-4xl">
                    <div className="space-y-2 text-center">
                      <h1 className="text-3xl md:text-5xl font-semibold leading-tight inline-flex items-center justify-center gap-3">
                        <CheckCircle className="h-7 w-7 text-white" />
                        {isWaitlist ? 'Você está na lista de espera' : 'Inscrição confirmada'}
                      </h1>
                      <p className="text-white/80 text-base md:text-lg">
                        {isWaitlist
                          ? 'Entraremos em contato assim que uma vaga for liberada.'
                          : 'Enviaremos as próximas informações para o seu email.'}
                      </p>
                    </div>

                    <div className="flex flex-nowrap justify-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-white">
                        <MapPin className="h-4 w-4" />
                        {group.destination}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-white">
                        <Calendar className="h-4 w-4" />
                        {formatHeroRange(group.start_date, endDate)}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-white">
                        <Clock className="h-4 w-4" />
                        {group.duration_days} dias
                      </span>
                      {selectedOfferLabel && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-white">
                          <Ticket className="h-4 w-4" />
                          {selectedOfferLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-2xl w-full max-w-2xl">
                    <CardContent className="p-6 space-y-4 text-slate-900">
                      <p className="text-xs uppercase tracking-[0.32em] text-primary/60">
                        Resumo da expedição
                      </p>
                      <h2 className="text-2xl font-semibold">{group.destination}</h2>
                      <p className="text-sm text-slate-600">
                        {formatDate(group.start_date)} • {group.duration_days} dias
                      </p>
                      {selectedOfferLabel && (
                        <div className="rounded-2xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                          Pacote selecionado: {selectedOfferLabel}
                        </div>
                      )}
                      <p className="text-sm text-slate-500 font-light">
                        {isWaitlist
                          ? 'Você será avisado por email quando houver disponibilidade.'
                          : 'Fique atento ao email para os próximos passos da sua viagem.'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      {hasCoverImage ? (
        <div className="p-3 md:p-4">
          <section className="relative h-[calc(100dvh-1.5rem)] md:h-[calc(100dvh-2rem)] min-h-[640px] overflow-hidden rounded-3xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${group.cover_image_url})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
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
                      Expedição Exclusiva
                    </Badge>
                    <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold drop-shadow-2xl leading-tight animate-in fade-in slide-in-from-top-2 duration-800 delay-150">
                      {group.destination}
                    </h1>
                    <Button
                      asChild
                      size="lg"
                      className="w-fit rounded-full px-8 text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-800 delay-200 group"
                    >
                      <a href="#inscricao" className="inline-flex items-center gap-3">
                        Garantir minha vaga
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="max-w-6xl w-full mx-auto lg:mx-0 lg:pl-20">
                <div className="flex flex-wrap gap-10 text-white/95 animate-in fade-in slide-in-from-bottom-2 duration-800 delay-300">
                  <div className="flex items-center gap-2 text-base font-medium">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                      <Calendar className="w-5 h-5" />
                    </span>
                    {formatHeroRange(group.start_date, endDate)}
                  </div>
                  <div className="flex items-center gap-2 text-base font-medium">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                      <Clock className="w-5 h-5" />
                    </span>
                    {group.duration_days} dias
                  </div>
                  <div className="flex items-center gap-2 text-base font-medium">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                      <Users className="w-5 h-5" />
                    </span>
                    {isFull ? 'Lotado' : `${spotsLeft} vagas`}
                  </div>
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
              Expedição Exclusiva
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">{group.destination}</h1>
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{formatHeroRange(group.start_date, endDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{group.duration_days} dias</span>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="rounded-full px-8">
                <a href="#inscricao">Quero garantir minha vaga</a>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 bg-white/10 text-white border-white/30 hover:bg-white/20">
                <a href="#detalhes">Ver detalhes</a>
              </Button>
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-6 md:px-8 lg:px-12 pt-16 md:pt-20 pb-20 md:pb-24 space-y-24" id="detalhes">
        {/* Description & Landing Text */}
        {(group.description || hasLandingText || hasImpactPhrase || hasDescriptionImages) && (
          <section className="relative bg-white">
            <div
              className={`grid gap-12 lg:gap-10 ${
                showIntroSideImage ? 'lg:grid-cols-5' : ''
              }`}
            >
              <div
                className={
                  showIntroSideImage
                    ? 'lg:col-span-3 space-y-6'
                    : 'space-y-6'
                }
              >
                <p className="text-xs uppercase tracking-[0.32em] text-primary/60">
                  Expedição
                </p>
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
                  {introHeading}
                </h2>
                {introDescription && (
                  renderParagraphs(
                    introDescription,
                    'text-base md:text-lg text-slate-600 leading-relaxed',
                  )
                )}
                {hasLandingText && (
                  renderParagraphs(
                    group.landing_text,
                    'text-base md:text-lg text-slate-600 leading-relaxed pb-4',
                  )
                )}
                {hasDescriptionImages && (
                  <div className="relative mt-16 overflow-hidden rounded-[32px] rounded-l-none shadow-xl lg:-ml-[calc((100vw-1280px)/2+3rem)] lg:w-[calc(100%+((100vw-1280px)/2+3rem))]">
                    <img
                      src={descriptionImages[0]}
                      alt="Descrição da expedição"
                      className="w-full h-72 md:h-[30rem] object-cover"
                    />
                  </div>
                )}
              </div>
              {showIntroSideImage && (
                <div className="lg:col-span-2 lg:pt-6">
                  <div className="relative h-80 rounded-[28px] overflow-hidden shadow-xl">
                    <img
                      src={introSideImage}
                      alt="Expedição em destaque"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/35" />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {hasAboutSection && (
          <section className="grid gap-8 lg:grid-cols-12 items-start">
            <div className="lg:col-span-5 space-y-5">
              <p className="text-xs uppercase tracking-[0.32em] text-primary/60">
                Quem somos
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                {group.about_title || 'Quem somos'}
              </h2>
              {group.about_description &&
                renderParagraphs(
                  group.about_description,
                  'text-lg text-slate-600 leading-relaxed',
                )}
            </div>
            {group.about_image_url && (
              <div className="lg:col-span-7">
                <div className="relative overflow-hidden rounded-[32px] shadow-xl">
                  <img
                    src={group.about_image_url}
                    alt={group.about_title || 'Quem somos'}
                    className="w-full h-[20rem] md:h-[26rem] lg:h-[30rem] object-cover"
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {hasDestinationSummary && (
          <section className="grid gap-12 lg:grid-cols-5 items-center">
            {group.destination_summary_image_url && (
              <div className="lg:col-span-3">
                <div className="relative overflow-hidden rounded-[32px] rounded-l-none shadow-xl lg:-ml-[calc((100vw-1280px)/2+3rem)] lg:w-[calc(100%+((100vw-1280px)/2+3rem))]">
                  <img
                    src={group.destination_summary_image_url}
                    alt={group.destination_summary_title || 'Resumo do destino'}
                    className="w-full h-80 md:h-[32rem] object-cover"
                  />
                </div>
              </div>
            )}
            <div className="lg:col-span-2 space-y-5">
              <p className="text-xs uppercase tracking-[0.32em] text-primary/60">
                Resumo do destino
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                {group.destination_summary_title || 'Resumo do destino'}
              </h2>
              {group.destination_summary_description &&
                renderParagraphs(
                  group.destination_summary_description,
                  'text-lg text-slate-600 leading-relaxed',
                )}
            </div>
          </section>
        )}

        {hasItinerarySummary && (
          <section className="space-y-8">
            <div className="space-y-4 max-w-3xl">
              <p className="text-xs uppercase tracking-[0.32em] text-primary/60">
                Resumo do roteiro
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                {group.itinerary_summary_title || 'Resumo do roteiro'}
              </h2>
              {group.itinerary_summary_description &&
                renderParagraphs(
                  group.itinerary_summary_description,
                  'text-lg text-slate-600 leading-relaxed',
                )}
              {hasItineraryDays && (
                <Button
                  type="button"
                  variant="default"
                  className="mt-2 w-fit rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md focus-visible:ring-2 focus-visible:ring-slate-300 group"
                  onClick={() => setItineraryDrawerOpen(true)}
                >
                  Veja o roteiro completo
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              )}
            </div>
            {(group.itinerary_summary_images || []).length > 0 && (
              <div className="grid gap-6 md:grid-cols-3">
                {itineraryImages.map((image, index) => (
                    <button
                      type="button"
                      key={`${image.url}-${index}`}
                    onClick={() => setLightboxState({ images: itineraryImages, index })}
                      className={
                      index === 0
                        ? 'group bg-transparent text-left focus:outline-none md:col-span-2 md:row-span-2 overflow-hidden rounded-[28px] shadow-xl transition-transform duration-500 ease-out hover:-translate-y-1'
                        : 'group bg-transparent text-left focus:outline-none overflow-hidden rounded-[28px] shadow-lg transition-transform duration-500 ease-out hover:-translate-y-1'
                    }
                    aria-label={`Abrir foto do roteiro ${index + 1}`}
                  >
                    <div className="relative h-full">
                      <img
                        src={image.url}
                        alt={image.title || `Roteiro ${index + 1}`}
                        className={
                          index === 0
                            ? 'h-72 md:h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]'
                            : 'h-56 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]'
                        }
                      />
                      <span className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                        <ZoomIn className="h-5 w-5 transition-transform duration-500 group-hover:scale-110" />
                      </span>
                      {(image.title || image.description) && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5 text-white">
                          {image.title && (
                            <h3 className="text-lg font-semibold">{image.title}</h3>
                          )}
                          {image.description &&
                            renderParagraphs(
                              image.description,
                              'space-y-2 text-sm text-white/80 leading-relaxed',
                            )}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {hasTransportSection && (
          <section className="grid gap-10 lg:grid-cols-5 items-start">
            <div className="lg:col-span-2 space-y-4">
              <p className="text-xs uppercase tracking-[0.32em] text-primary/60">
                Transportes
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                {group.transport_title || 'Transportes'}
              </h2>
              {group.transport_text &&
                renderParagraphs(
                  group.transport_text,
                  'text-lg text-slate-600 leading-relaxed',
                )}
            </div>
            {transportImages.length > 0 && (
              <div className="lg:col-span-3">
                {transportImages.length === 1 && (
                  <div className="overflow-hidden rounded-[32px] shadow-xl">
                    <img
                      src={transportImages[0]}
                      alt="Transporte"
                      className="w-full h-80 md:h-[30rem] object-cover"
                    />
                  </div>
                )}
                {transportImages.length === 2 && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {transportImages.map((imageUrl, index) => (
                      <div key={`${imageUrl}-${index}`} className="overflow-hidden rounded-[28px] shadow-lg">
                        <img
                          src={imageUrl}
                          alt={`Transporte ${index + 1}`}
                          className="w-full h-72 md:h-[24rem] object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                {transportImages.length > 2 && (
                  <div className="grid gap-6 md:grid-cols-3">
                    {transportImages.map((imageUrl, index) => (
                      <div key={`${imageUrl}-${index}`} className="overflow-hidden rounded-[28px] shadow-lg">
                        <img
                          src={imageUrl}
                          alt={`Transporte ${index + 1}`}
                          className="w-full h-56 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {hasNotRecommended && (
          <section className="rounded-[32px] bg-slate-50 p-8 md:p-12 space-y-10">
            <div className="space-y-4 max-w-3xl">
              <p className="text-xs uppercase tracking-[0.32em] text-primary/60">
                Para quem não é indicado
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Para quem não é indicado esta viagem?
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Avalie se essa expedição combina com o seu estilo antes de garantir a vaga.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {(group.not_recommended_items || []).map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="relative rounded-bl-[6px] rounded-br-[20px] rounded-tl-[20px] rounded-tr-[6px] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                >
                  <span className="pointer-events-none absolute right-5 top-4 text-3xl font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div className="space-y-2 relative z-10 pr-12">
                    <h3 className="text-base md:text-lg font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    {renderParagraphs(
                      item.description,
                      'space-y-2 text-sm text-slate-600 leading-relaxed',
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* YouTube Video */}
        {hasYouTube && getYouTubeEmbedUrl(group.youtube_video_url!) && (
          <section className="relative">
            <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black">
              <iframe
                src={getYouTubeEmbedUrl(group.youtube_video_url!)!}
                title="Video do Destino"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </section>
        )}

        {/* Carousel Section */}
        {hasCarousel && (
          <section className="relative">
            <Carousel className="w-full">
              <CarouselContent>
                {carouselImages.map((imageUrl, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="group relative aspect-[4/5] overflow-hidden rounded-[28px] bg-white shadow-lg">
                      <img
                        src={imageUrl}
                        alt={`${group.destination} - Imagem ${index + 1}`}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 h-12 w-12 rounded-full border border-slate-200 bg-white/90 shadow-lg backdrop-blur hover:bg-white" />
              <CarouselNext className="right-4 h-12 w-12 rounded-full border border-slate-200 bg-white/90 shadow-lg backdrop-blur hover:bg-white" />
            </Carousel>
          </section>
        )}

        {/* Package Inclusions/Exclusions */}
        {(hasIncludedItems || hasExcludedItems) && (
          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-white via-slate-50 to-slate-100 px-6 py-16 md:px-10 lg:px-14">
            <div className="relative z-10 mx-auto w-full max-w-[78.5rem] space-y-12">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-5">
                  <p className="text-xs uppercase tracking-[0.32em] text-primary/60">
                    tudo feito para voce
                  </p>
                  <h2 className="max-w-2xl text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
                    O que está incluso?
                  </h2>
                </div>
              </div>
              <div className="h-px w-full bg-slate-200/80" />
              {hasIncludedItems && (
                <div className="space-y-6">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">
                    Incluso no pacote
                  </p>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {group.included_items?.map((item, index) => (
                      <div
                        key={index}
                        className="space-y-4 rounded-bl-[6px] rounded-br-[20px] rounded-tl-[20px] rounded-tr-[6px] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <Check className="h-5 w-5" />
                          </div>
                          <h3 className="text-base md:text-lg font-semibold text-slate-900 leading-snug">
                            {item}
                          </h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {hasExcludedItems && (
                <div className="space-y-6 pt-4">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">
                    Nao incluso
                  </p>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {group.excluded_items?.map((item, index) => (
                      <div
                        key={index}
                        className="space-y-4 rounded-bl-[6px] rounded-br-[20px] rounded-tl-[20px] rounded-tr-[6px] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                            <X className="h-5 w-5" />
                          </div>
                          <h3 className="text-base md:text-lg font-semibold text-slate-900 leading-snug">
                            {item}
                          </h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {hasFaqs && (
          <section className="mx-auto w-full max-w-6xl px-4 md:px-0">
              <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-4 md:sticky md:top-28 md:max-w-sm">
                  <p className="text-xs uppercase tracking-[0.32em] text-primary/60">
                    Dúvidas
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                    Perguntas e respostas mais frequentes
                  </h2>
                </div>
                <div className="w-full max-w-2xl">
                  <Accordion type="single" collapsible>
                    {faqs.map((faq, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`faq-${index}`}
                        className="group border-t border-slate-200 py-2 first:border-t"
                      >
                        <AccordionTrigger className="text-left text-sm md:text-base font-medium text-slate-900 hover:no-underline py-3 [&>svg]:text-slate-400">
                          <div className="flex items-center gap-6">
                            <span className="text-lg font-semibold text-primary">
                              {String(index + 1).padStart(2, '0')}.
                            </span>
                            <span className="text-left text-slate-900">{faq.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-600 pb-4 pl-12 md:pl-14 text-sm md:text-base leading-relaxed text-justify">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
          </section>
        )}

        {/* Testimonials Section */}
        {hasTestimonials && (
          <section className="rounded-[32px] bg-white p-10 md:p-12">
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-[0.32em] text-primary/60">
                Depoimentos
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">O que dizem nossos viajantes</h2>
              {hasGoogleReviews && (
                <a 
                  href={group.google_reviews_url!} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                >
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  Ver todas as avaliações no Google
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border border-slate-100 shadow-sm bg-white overflow-hidden rounded-[24px]">
                  <CardContent className="p-6">
                    <Quote className="w-10 h-10 text-primary/20 mb-4" />
                    <p className="text-muted-foreground mb-6 italic leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-4">
                      {testimonial.photo ? (
                        <img 
                          src={testimonial.photo} 
                          alt={testimonial.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xl font-bold text-primary">
                            {testimonial.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(star => (
                            <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Pricing Cards - Now after all content */}
        {hasPricing && (
          <section>
            <div className="text-center mb-10">
              <p className="text-xs uppercase tracking-[0.32em] text-primary/60">Valores</p>
              <h2 className="text-3xl md:text-4xl font-bold mt-3">E quanto vai custar?</h2>
            </div>
            <div
              className={
                resolvedOffers.length === 1
                  ? 'grid gap-8 md:grid-cols-1 max-w-3xl mx-auto'
                  : resolvedOffers.length === 2
                  ? 'grid gap-8 md:grid-cols-2'
                  : 'grid gap-8 md:grid-cols-2 lg:grid-cols-3'
              }
            >
              {resolvedOffers.map((offer, index) => {
                const symbol = getCurrencySymbol(offer.currency);
                const hasCash = offer.price_cash != null;
                const hasInstallment = offer.price_installment != null;
                const hasInstallmentCount =
                  typeof offer.installments_count === 'number' && offer.installments_count > 0;
                const installmentPer =
                  hasInstallment && hasInstallmentCount
                    ? offer.price_installment! / offer.installments_count!
                    : null;
                const showInstallmentPrimary = hasInstallment;
                const originalValue = hasCash
                  ? offer.original_price_cash
                  : offer.original_price_installment;
                const showOriginalValue = Boolean(offer.is_offer && originalValue != null);
                const savingsCash =
                  offer.is_offer && offer.original_price_cash != null && offer.price_cash != null
                    ? offer.original_price_cash - offer.price_cash
                    : null;
                const showSavings = savingsCash != null && savingsCash > 0;
                const installmentValue = hasInstallment
                  ? installmentPer ?? offer.price_installment!
                  : null;

                return (
                  <Card
                    key={`${offer.title}-${index}`}
                    className="w-full border border-slate-100 shadow-sm bg-white overflow-hidden rounded-[24px]"
                  >
                    <CardContent className="p-6 flex flex-col gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.32em] text-primary/60">
                            {offer.is_offer ? 'Oferta' : 'Pacote'}
                          </p>
                          {offer.is_offer && (
                            showSavings ? (
                              <Badge className="rounded-full bg-primary/10 text-primary gap-2 text-xs font-semibold whitespace-nowrap">
                                <Ticket className="w-3.5 h-3.5" />
                                Economize {symbol} {formatCurrency(savingsCash!)}
                              </Badge>
                            ) : (
                              <Badge className="rounded-full bg-primary/10 text-primary text-xs font-semibold whitespace-nowrap">
                                Oferta
                              </Badge>
                            )
                          )}
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          {offer.title || `Pacote ${index + 1}`}
                        </h3>
                        {offer.description && (
                          <p className="text-sm text-muted-foreground">{offer.description}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        {showOriginalValue && (
                          <div className="text-sm font-medium text-rose-500 line-through">
                            {symbol} {formatCurrency(originalValue!)}
                          </div>
                        )}

                        {showInstallmentPrimary ? (
                          <div className="space-y-1">
                            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                              Por apenas
                            </p>
                            <div className="text-3xl font-semibold text-slate-900">
                              {hasInstallmentCount ? (
                                <span className="flex flex-wrap items-baseline gap-3">
                                  <span className="text-2xl font-semibold text-slate-700">
                                    {offer.installments_count}x
                                  </span>
                                  <span className="text-3xl font-bold text-slate-900">
                                    {symbol} {formatCurrency(installmentValue!)}
                                  </span>
                                  {offer.entry_value != null && (
                                    <span className="text-sm font-medium text-slate-600">
                                      Com entrada de {symbol} {formatCurrency(offer.entry_value)}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="flex flex-wrap items-baseline gap-3">
                                  {symbol} {formatCurrency(installmentValue!)}
                                  {offer.entry_value != null && (
                                    <span className="text-sm font-medium text-slate-600">
                                      Com entrada de {symbol} {formatCurrency(offer.entry_value)}
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          hasCash && (
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase tracking-[0.26em] text-slate-500">
                                Valor por pessoa
                              </p>
                              <div className="text-3xl font-semibold text-slate-900">
                                {symbol} {formatCurrency(offer.price_cash!)}
                              </div>
                            </div>
                          )
                        )}

                        {showInstallmentPrimary && hasCash && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="text-slate-400 uppercase tracking-wide text-[11px]">OU</span>
                            <span className="font-semibold text-slate-800">
                              {symbol} {formatCurrency(offer.price_cash!)}
                            </span>
                            <span className="text-slate-500 text-xs uppercase tracking-wide">à vista</span>
                          </div>
                        )}

                        {!showInstallmentPrimary && offer.entry_value != null && (
                          <div className="text-sm font-medium text-slate-600">
                            Com entrada de {symbol} {formatCurrency(offer.entry_value)}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 mt-auto flex justify-end">
                        <Button
                          asChild
                          variant="outline"
                          className="rounded-full border-primary/40 text-primary hover:bg-primary/10 group px-5"
                        >
                          <a
                            href="#form-inscricao"
                            onClick={() => handleSelectOffer(index)}
                            className="inline-flex items-center gap-2"
                          >
                            {isFull ? 'Entrar na lista' : 'Garantir minha vaga'}
                            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Registration Form - Last */}
        <section
          id="inscricao"
          className={hasCarousel ? 'relative lg:-mr-[calc((100vw-1280px)/2+3rem)]' : 'relative'}
        >
          <div
            className={
              hasCarousel
                ? 'relative mx-auto w-full max-w-none rounded-[32px] bg-gradient-to-r from-white via-slate-50 to-transparent px-6 py-12 md:px-10 lg:pl-2 lg:pr-0'
                : 'relative max-w-3xl mx-auto rounded-[32px] bg-gradient-to-r from-white via-slate-50 to-transparent px-6 py-12 md:px-10'
            }
          >
            <div className={hasCarousel ? 'grid gap-8 lg:grid-cols-[0.85fr_1.15fr] items-stretch' : 'space-y-8'}>
              <div className="space-y-8 lg:pr-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.32em] text-primary/60">Inscrição</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                    {isFull ? 'Lista de Espera' : 'Garanta sua vaga'}
                  </h2>
                  <p className="text-slate-600 text-base">
                    {isFull
                      ? 'O grupo está lotado, mas você pode entrar na lista de espera.'
                      : `Apenas ${spotsLeft} ${spotsLeft === 1 ? 'vaga restante' : 'vagas restantes'}!`}
                  </p>
                </div>

                <form id="form-inscricao" onSubmit={handleSubmit} className="grid gap-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Nome completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Seu nome completo"
                        required
                        className="h-12 rounded-2xl bg-white/80 border-slate-200/80 text-sm focus-visible:border-primary/60 focus-visible:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seu@email.com"
                        required
                        className="h-12 rounded-2xl bg-white/80 border-slate-200/80 text-sm focus-visible:border-primary/60 focus-visible:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Telefone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="h-12 rounded-2xl bg-white/80 border-slate-200/80 text-sm focus-visible:border-primary/60 focus-visible:ring-primary/20"
                      />
                    </div>

                    {resolvedOffers.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="package" className="text-sm font-medium">
                          Pacote (opcional)
                        </Label>
                        <Select
                          value={formData.selectedOfferIndex || undefined}
                          onValueChange={(value) =>
                            setFormData({ ...formData, selectedOfferIndex: value })
                          }
                        >
                          <SelectTrigger className="h-12 rounded-2xl bg-white/80 border-slate-200/80 text-sm focus-visible:border-primary/60 focus-visible:ring-primary/20">
                            <SelectValue placeholder="Selecione um pacote (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {resolvedOffers.map((offer, index) => (
                              <SelectItem key={`offer-${index}`} value={String(index)}>
                                {getOfferLabel(offer, index)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                {group.show_date_preference && (
                  <div className="space-y-2">
                    <Label htmlFor="datePreference" className="text-sm font-medium">
                      Essa data funciona para você?
                    </Label>
                    <Select
                      value={formData.datePreference}
                      onValueChange={(value) => setFormData({ ...formData, datePreference: value })}
                    >
                      <SelectTrigger className="h-12 rounded-2xl bg-white/80 border-slate-200/80 text-sm focus-visible:border-primary/60 focus-visible:ring-primary/20">
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Essa data funciona para mim</SelectItem>
                        <SelectItem value="nao">Essa data não funciona para mim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                  <Button
                    type="submit"
                    className="h-14 rounded-2xl text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    size="lg"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                    {isFull ? 'Entrar na lista de espera' : 'Confirmar minha inscrição'}
                  </Button>
                </form>
              </div>

              {hasCarousel && carouselImages[0] && (
                <div className="relative h-full min-h-[320px] overflow-hidden rounded-[28px] lg:rounded-l-[32px] lg:rounded-r-none">
                  <img
                    src={carouselImages[0]}
                    alt={`${group.destination} - Foto de capa`}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {hasItineraryDays && (
        <Drawer
          open={itineraryDrawerOpen}
          onOpenChange={setItineraryDrawerOpen}
          direction="right"
        >
          <DrawerContent className="left-auto right-0 inset-y-0 mt-0 h-full w-full max-w-[520px] rounded-none rounded-l-3xl border-l border-border/50">
            <DrawerHeader className="flex flex-row items-center justify-between gap-4 border-b px-6 py-5">
              <div>
                <DrawerTitle className="text-xl font-semibold text-slate-900">
                  Roteiro completo
                </DrawerTitle>
                <p className="text-sm text-slate-500">Dia a dia da expedição</p>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </DrawerClose>
            </DrawerHeader>
            <ScrollArea className="flex-1">
              <div className="space-y-6 px-6 py-6">
                {itineraryDays.map((day, dayIndex) => (
                  <div
                    key={day.id || `day-${dayIndex}`}
                    className="rounded-2xl bg-slate-50/90 p-5"
                  >
                    {(() => {
                      const dayPhotos = day.photos || [];
                      const dayPhotoCount = dayPhotos.length;
                      const dayPhotoGrid = getPhotoGridCols(dayPhotoCount);
                      const dayPhotoHeight = getPhotoHeight(dayPhotoCount, 'day');
                      return (
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                          <Calendar className="h-4 w-4" />
                          <span>Dia {dayIndex + 1}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {day.title?.trim() || `Dia ${dayIndex + 1}`}
                        </h3>
                        {day.locations && day.locations.length > 0 && (
                          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                            {day.locations.map((location, idx) => (
                              <span
                                key={`${day.id}-loc-${idx}`}
                                className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                              >
                                {location}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {dayPhotoCount > 0 && (
                        <div className={`grid ${dayPhotoGrid} gap-2`}>
                          {dayPhotos.slice(0, 3).map((photo, idx) => (
                                    <HoverCard key={`${day.id}-photo-${idx}`} openDelay={0}>
                              <HoverCardTrigger asChild>
                                <div className="cursor-pointer">
                                  <img
                                    src={photo}
                                    alt={`Dia ${dayIndex + 1} foto ${idx + 1}`}
                                    className={`w-full ${dayPhotoHeight} rounded-xl object-cover`}
                                  />
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent side="left" align="end" className="w-64 p-2">
                                <img
                                  src={photo}
                                  alt={`Dia ${dayIndex + 1} foto ${idx + 1}`}
                                  className="max-h-64 w-full rounded-lg bg-slate-100 object-contain"
                                />
                              </HoverCardContent>
                                    </HoverCard>
                          ))}
                        </div>
                      )}
                    </div>
                      );
                    })()}
                    {day.description &&
                      renderParagraphs(
                        day.description,
                        'mt-3 text-sm text-slate-600 leading-relaxed',
                      )}
                    {day.items && day.items.length > 0 && (
                      <div className="mt-5 space-y-3">
                        {day.items.map((item, itemIndex) => {
                          const itemPhotos = item.photos || [];
                          const itemPhotoCount = itemPhotos.length;
                          const itemPhotoGrid = getPhotoGridCols(itemPhotoCount);
                          const itemPhotoHeight = getPhotoHeight(itemPhotoCount, 'item');
                          return (
                            <div
                              key={item.id || `${day.id}-item-${itemIndex}`}
                              className="rounded-xl bg-white/90 p-4"
                            >
                              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-900">
                                {(item.start_time || item.end_time) && (
                                  <span className="inline-flex items-center gap-2 font-medium">
                                    <Clock className="h-4 w-4 text-slate-500" />
                                    <span>
                                      {item.start_time || ''}
                                      {item.end_time ? ` – ${item.end_time}` : ''}
                                    </span>
                                  </span>
                                )}
                                {item.location && (
                                  <span className="inline-flex h-4 items-center gap-2 text-xs font-medium text-slate-600 leading-none">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                    <span>{item.location}</span>
                                  </span>
                                )}
                              </div>
                              {item.description &&
                                renderParagraphs(
                                  item.description,
                                  'mt-2 text-sm text-slate-600 leading-relaxed',
                                )}
                              {itemPhotoCount > 0 && (
                                <div className={`mt-3 grid ${itemPhotoGrid} gap-2`}>
                                  {itemPhotos.slice(0, 3).map((photo, idx) => (
                                    <HoverCard key={`${item.id}-photo-${idx}`} openDelay={0}>
                                      <HoverCardTrigger asChild>
                                        <div className="cursor-pointer">
                                          <img
                                            src={photo}
                                            alt="Programação"
                                            className={`w-full ${itemPhotoHeight} rounded-lg object-cover`}
                                          />
                                        </div>
                                      </HoverCardTrigger>
                                      <HoverCardContent side="left" align="end" className="w-60 p-2">
                                        <img
                                          src={photo}
                                          alt="Programação"
                                          className="max-h-60 w-full rounded-lg bg-slate-100 object-contain"
                                        />
                                      </HoverCardContent>
                                    </HoverCard>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      )}

      {/* Agency Footer */}
      {group.agency && (
        <footer className="relative mt-0 min-h-[380px] md:min-h-[440px] overflow-hidden w-screen left-1/2 -translate-x-1/2">
          {footerImageUrl && (
            <div className="absolute inset-0">
              <img
                src={footerImageUrl}
                alt=""
                className="h-full w-full object-cover object-bottom"
                style={{
                  WebkitMaskImage:
                    'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 25%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.4) 52%, rgba(0,0,0,0.22) 62%, rgba(0,0,0,0.12) 70%, rgba(0,0,0,0.06) 76%, rgba(0,0,0,0.02) 82%, rgba(0,0,0,0) 88%, rgba(0,0,0,0) 100%)',
                  maskImage:
                    'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 25%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.4) 52%, rgba(0,0,0,0.22) 62%, rgba(0,0,0,0.12) 70%, rgba(0,0,0,0.06) 76%, rgba(0,0,0,0.02) 82%, rgba(0,0,0,0) 88%, rgba(0,0,0,0) 100%)',
                }}
              />
            </div>
          )}
          <div className="relative h-full w-full">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pt-16 pb-0 md:flex-row md:items-center md:justify-between md:px-8 md:pt-20 lg:px-12">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Organizado por</p>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{agency?.name}</p>
                  {agency?.cnpj && (
                    <p className="text-sm text-slate-500">CNPJ {agency?.cnpj}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 text-slate-700">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Entre em contato</p>
                <div className="flex flex-wrap items-center justify-end gap-5">
                  {agency?.email && (
                    <a
                      href={`mailto:${agency?.email}`}
                      aria-label="Enviar email"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-600 shadow-sm transition hover:text-slate-900"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {agency?.phone && (
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
                        href={`tel:${agency?.phone}`}
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
                  src={lightboxState.images[lightboxState.index].url}
                  alt={lightboxState.images[lightboxState.index].title || 'Imagem'}
                  className="w-full max-h-[82vh] object-contain bg-black"
                />
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
                          prev
                            ? { ...prev, index: (prev.index + 1) % prev.images.length }
                            : prev,
                        )
                      }
                      aria-label="Próxima imagem"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
                {(lightboxState.images[lightboxState.index].title ||
                  lightboxState.images[lightboxState.index].description) && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 text-white">
                    {lightboxState.images[lightboxState.index].title && (
                      <h3 className="text-lg font-semibold">
                        {lightboxState.images[lightboxState.index].title}
                      </h3>
                    )}
                    {lightboxState.images[lightboxState.index].description &&
                      renderParagraphs(
                        lightboxState.images[lightboxState.index].description,
                        'space-y-2 text-sm text-white/80 leading-relaxed',
                      )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
