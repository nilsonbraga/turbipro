import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicExpeditionGroup, usePublicRegistration, Testimonial, FAQ } from '@/hooks/useExpeditionGroups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Check,
  X,
  DollarSign,
  CreditCard,
  Star,
  ExternalLink,
  Play,
  HelpCircle,
  Quote
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
  });
  const [submitted, setSubmitted] = useState(false);
  const [isWaitlist, setIsWaitlist] = useState(false);

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
  const hasCarousel = group.carousel_images && group.carousel_images.length > 0;
  const hasLandingText = !!group.landing_text;
  const hasIncludedItems = group.included_items && group.included_items.length > 0;
  const hasExcludedItems = group.excluded_items && group.excluded_items.length > 0;
  const hasPricing = group.price_cash || group.price_installment;
  const hasYouTube = !!group.youtube_video_url;
  const hasTestimonials = group.testimonials && (group.testimonials as Testimonial[]).length > 0;
  const hasFaqs = group.faqs && (group.faqs as FAQ[]).length > 0;
  const hasGoogleReviews = !!group.google_reviews_url;

  const testimonials = (group.testimonials as Testimonial[]) || [];
  const faqs = (group.faqs as FAQ[]) || [];

  const currencySymbol = {
    BRL: 'R$',
    EUR: '€',
    USD: '$',
  }[group.currency || 'BRL'];

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '';
    return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const willBeWaitlist = isFull;
    setIsWaitlist(willBeWaitlist);
    
    await registerMutation.mutateAsync({
      groupId: group.id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      isWaitlist: willBeWaitlist,
      datePreference: formData.datePreference || undefined,
    });
    
    setSubmitted(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (submitted) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: hasCoverImage ? `url(${group.cover_image_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className={hasCoverImage ? 'absolute inset-0 bg-background/80 backdrop-blur-sm' : 'absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10'} />
        <Card className="max-w-md w-full relative z-10 shadow-2xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {isWaitlist ? 'Inscrito na Lista de Espera!' : 'Inscrição Confirmada!'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isWaitlist 
                ? 'Você está na lista de espera. Entraremos em contato caso uma vaga seja liberada.'
                : 'Sua inscrição foi confirmada. Você receberá mais informações por email.'}
            </p>
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-5 text-left">
              <p className="font-semibold text-lg">{group.destination}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(group.start_date)} • {group.duration_days} dias
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      {hasCoverImage ? (
        <div 
          className="relative h-[70vh] min-h-[600px] bg-cover bg-center"
          style={{ backgroundImage: `url(${group.cover_image_url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            {group.agency && (group.agency as any).logo_url && (
              <img 
                src={(group.agency as any).logo_url} 
                alt={(group.agency as any).name}
                className="h-16 mb-8 object-contain drop-shadow-2xl"
              />
            )}
            <Badge className="mb-6 bg-white/20 backdrop-blur-md text-white border-white/30 px-5 py-2 text-sm shadow-lg">
              <MapPin className="w-4 h-4 mr-2" />
              Expedição Exclusiva
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-2xl mb-6 max-w-4xl leading-tight">
              {group.destination}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4 text-white/95">
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-5 py-2.5 rounded-full">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">{formatDate(group.start_date)}</span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-5 py-2.5 rounded-full">
                <Clock className="w-5 h-5" />
                <span className="font-medium">{group.duration_days} dias</span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-5 py-2.5 rounded-full">
                <Users className="w-5 h-5" />
                <span className="font-medium">{isFull ? 'Lotado' : `${spotsLeft} vagas`}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            {group.agency && (group.agency as any).logo_url && (
              <img 
                src={(group.agency as any).logo_url} 
                alt={(group.agency as any).name}
                className="h-14 mx-auto mb-8 object-contain brightness-0 invert"
              />
            )}
            <Badge className="mb-6 bg-white/20 text-white border-white/30 px-5 py-2">
              <MapPin className="w-4 h-4 mr-2" />
              Expedição Exclusiva
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              {group.destination}
            </h1>
            <div className="flex items-center justify-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{formatDate(group.start_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{group.duration_days} dias</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-20">
        {/* Description & Landing Text */}
        {(group.description || hasLandingText) && (
          <section className="text-center max-w-4xl mx-auto">
            {group.description && (
              <p className="text-2xl text-muted-foreground leading-relaxed mb-8">
                {group.description}
              </p>
            )}
            {hasLandingText && (
              <div className="prose prose-lg max-w-none text-foreground">
                <div className="whitespace-pre-wrap text-left bg-white rounded-3xl p-10 shadow-xl border">
                  {group.landing_text}
                </div>
              </div>
            )}
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
                {group.carousel_images?.map((imageUrl, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                      <img 
                        src={imageUrl} 
                        alt={`${group.destination} - Imagem ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-white/90 hover:bg-white shadow-lg h-12 w-12" />
              <CarouselNext className="right-4 bg-white/90 hover:bg-white shadow-lg h-12 w-12" />
            </Carousel>
          </section>
        )}

        {/* Package Inclusions/Exclusions */}
        {(hasIncludedItems || hasExcludedItems) && (
          <section>
            <h2 className="text-3xl font-bold text-center mb-10">O que está incluso</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {hasIncludedItems && (
                <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-green-50 to-white">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-5">
                    <h3 className="font-bold text-xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Check className="w-6 h-6" />
                      </div>
                      Incluso no pacote
                    </h3>
                  </div>
                  <CardContent className="p-8">
                    <ul className="space-y-4">
                      {group.included_items?.map((item, index) => (
                        <li key={index} className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-lg">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {hasExcludedItems && (
                <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-red-50 to-white">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-5">
                    <h3 className="font-bold text-xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <X className="w-6 h-6" />
                      </div>
                      Não incluso
                    </h3>
                  </div>
                  <CardContent className="p-8">
                    <ul className="space-y-4">
                      {group.excluded_items?.map((item, index) => (
                        <li key={index} className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <X className="w-4 h-4 text-red-600" />
                          </div>
                          <span className="text-lg">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Testimonials Section */}
        {hasTestimonials && (
          <section className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 -mx-4 px-4 py-16 rounded-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">O que dizem nossos viajantes</h2>
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
                <Card key={index} className="border-0 shadow-lg bg-white overflow-hidden">
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

        {/* FAQ Section */}
        {hasFaqs && (
          <section className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10 flex items-center justify-center gap-3">
              <HelpCircle className="w-8 h-8 text-primary" />
              Perguntas Frequentes
            </h2>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="border rounded-2xl px-6 shadow-md bg-white overflow-hidden"
                >
                  <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* Pricing Cards - Now after all content */}
        {hasPricing && (
          <section>
            <h2 className="text-3xl font-bold text-center mb-10">Investimento</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {group.price_cash != null && (
                <Card className="border-0 shadow-2xl bg-white overflow-hidden hover:shadow-3xl transition-shadow">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-xl">À Vista</span>
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg text-muted-foreground">{currencySymbol}</span>
                      <span className="text-5xl font-bold text-green-600">{formatCurrency(group.price_cash)}</span>
                    </div>
                    <p className="text-muted-foreground mt-3">Pagamento único com desconto</p>
                  </CardContent>
                </Card>
              )}
              {group.price_installment != null && group.installments_count && (
                <Card className="border-0 shadow-2xl bg-white overflow-hidden hover:shadow-3xl transition-shadow">
                  <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-xl">Parcelado</span>
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">{group.installments_count}x</span>
                      <span className="text-lg text-muted-foreground ml-1">de {currencySymbol}</span>
                      <span className="text-4xl font-bold text-primary">
                        {formatCurrency(group.price_installment / group.installments_count)}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-3">
                      Total: {currencySymbol} {formatCurrency(group.price_installment)}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Registration Form - Last */}
        <section id="inscricao">
          <Card className="border-0 shadow-2xl overflow-hidden max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-8 text-center">
              <h2 className="text-3xl font-bold mb-2">
                {isFull ? 'Entrar na Lista de Espera' : 'Garanta sua Vaga Agora'}
              </h2>
              <p className="text-white/80 text-lg">
                {isFull 
                  ? 'O grupo está lotado, mas você pode entrar na lista de espera.'
                  : `Apenas ${spotsLeft} ${spotsLeft === 1 ? 'vaga restante' : 'vagas restantes'}!`
                }
              </p>
            </div>
            <CardContent className="p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Seu nome completo"
                    required
                    className="h-14 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu@email.com"
                    required
                    className="h-14 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base font-medium">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="h-14 text-lg"
                  />
                </div>

                {group.show_date_preference && (
                  <div className="space-y-2">
                    <Label htmlFor="datePreference" className="text-base font-medium">Essa data funciona para você?</Label>
                    <Select
                      value={formData.datePreference}
                      onValueChange={(value) => setFormData({ ...formData, datePreference: value })}
                    >
                      <SelectTrigger className="h-14 text-lg">
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
                  className="w-full h-16 text-xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]" 
                  size="lg"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending && <Loader2 className="w-6 h-6 mr-2 animate-spin" />}
                  {isFull ? 'Entrar na Lista de Espera' : 'Confirmar Minha Inscrição'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Agency Footer */}
        {group.agency && (
          <footer className="text-center text-muted-foreground pt-12 border-t">
            <p className="text-lg">Organizado por <span className="font-semibold text-foreground">{(group.agency as any).name}</span></p>
          </footer>
        )}
      </div>
    </div>
  );
}
