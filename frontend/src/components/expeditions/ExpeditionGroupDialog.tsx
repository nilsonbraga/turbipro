import { useState, useEffect, useRef } from 'react';
import { format as formatDate } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Upload, X, Image as ImageIcon, Plus, Youtube, Star, HelpCircle, ExternalLink, Calendar as CalendarIcon } from 'lucide-react';
import { ExpeditionGroup, ExpeditionGroupInput, Testimonial, FAQ } from '@/hooks/useExpeditionGroups';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { formatCurrencyInput, parseCurrencyInput } from '@/utils/currencyFormat';

type CurrencyCode = 'BRL' | 'USD' | 'EUR';

const DatePickerField = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);

  const parseDate = (val?: string) => {
    if (!val) return undefined;
    const [y, m, d] = val.split('-').map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(Date.UTC(y, m - 1, d, 12));
  };

  const dateObj = parseDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal h-10',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateObj ? formatDate(dateObj, 'dd/MM/yyyy') : (placeholder || 'Selecionar')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateObj}
          onSelect={(day) => {
            onChange(day ? formatDate(day, 'yyyy-MM-dd') : '');
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

interface ExpeditionGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: ExpeditionGroup | null;
  onSubmit: (data: ExpeditionGroupInput & { id?: string }) => void;
  isLoading?: boolean;
}

export function ExpeditionGroupDialog({
  open,
  onOpenChange,
  group,
  onSubmit,
  isLoading,
}: ExpeditionGroupDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const carouselInputRef = useRef<HTMLInputElement>(null);
  const testimonialPhotoRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ExpeditionGroupInput>({
    destination: '',
    start_date: '',
    duration_days: 1,
    max_participants: 10,
    description: '',
    is_active: true,
    cover_image_url: '',
    carousel_images: [],
    landing_text: '',
    price_cash: null,
    price_installment: null,
    installments_count: null,
    currency: 'BRL',
    show_date_preference: false,
    included_items: [],
    excluded_items: [],
    youtube_video_url: '',
    google_reviews_url: '',
    testimonials: [],
    faqs: [],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [newIncludedItem, setNewIncludedItem] = useState('');
  const [newExcludedItem, setNewExcludedItem] = useState('');
  const [newTestimonial, setNewTestimonial] = useState<Testimonial>({ name: '', text: '', photo: '' });
  const [newFaq, setNewFaq] = useState<FAQ>({ question: '', answer: '' });
  const [uploadingTestimonialPhoto, setUploadingTestimonialPhoto] = useState(false);
  const [priceCashInput, setPriceCashInput] = useState('');
  const [priceInstallmentInput, setPriceInstallmentInput] = useState('');
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    const normalizeDateInput = (val?: string | null) => {
      if (!val) return '';
      // handle ISO strings or YYYY-MM-DD
      const date = new Date(val);
      if (Number.isNaN(date.getTime())) return '';
      return date.toISOString().slice(0, 10);
    };

    if (group) {
      setFormData({
        destination: group.destination,
        start_date: normalizeDateInput(group.start_date),
        duration_days: group.duration_days,
        max_participants: group.max_participants,
        description: group.description || '',
        is_active: group.is_active,
        cover_image_url: group.cover_image_url || '',
        carousel_images: group.carousel_images || [],
        landing_text: group.landing_text || '',
        price_cash: group.price_cash ?? null,
        price_installment: group.price_installment ?? null,
        installments_count: group.installments_count ?? null,
        currency: group.currency || 'BRL',
        show_date_preference: group.show_date_preference ?? false,
        included_items: group.included_items || [],
        excluded_items: group.excluded_items || [],
        youtube_video_url: group.youtube_video_url || '',
        google_reviews_url: group.google_reviews_url || '',
        testimonials: (group.testimonials as Testimonial[]) || [],
        faqs: (group.faqs as FAQ[]) || [],
      });
      const currency = (group.currency || 'BRL') as CurrencyCode;
      const normalizeMoney = (val: any) => {
        if (val === null || val === undefined) return '';
        const num = typeof val === 'number' ? val : Number(val);
        if (!Number.isFinite(num)) return '';
        const numStr = num.toFixed(2).replace('.', currency === 'BRL' ? ',' : '.');
        return formatCurrencyInput(numStr, currency);
      };
      setPriceCashInput(normalizeMoney(group.price_cash));
      setPriceInstallmentInput(normalizeMoney(group.price_installment));
    } else {
      setFormData({
        destination: '',
        start_date: '',
        duration_days: 1,
        max_participants: 10,
        description: '',
        is_active: true,
        cover_image_url: '',
        carousel_images: [],
        landing_text: '',
        price_cash: null,
        price_installment: null,
        installments_count: null,
        currency: 'BRL',
        show_date_preference: false,
        included_items: [],
        excluded_items: [],
        youtube_video_url: '',
        google_reviews_url: '',
        testimonials: [],
        faqs: [],
      });
      setPriceCashInput('');
      setPriceInstallmentInput('');
    }
    setNewIncludedItem('');
    setNewExcludedItem('');
    setNewTestimonial({ name: '', text: '', photo: '' });
    setNewFaq({ question: '', answer: '' });
  }, [group, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (group) {
      onSubmit({ ...formData, id: group.id });
    } else {
      onSubmit(formData);
    }
    onOpenChange(false);
  };

  const currencyCode = (formData.currency || 'BRL') as CurrencyCode;

  const handleCurrencyChange = (
    field: 'price_cash' | 'price_installment',
    rawValue: string,
  ) => {
    const formatted = formatCurrencyInput(rawValue, currencyCode);
    if (field === 'price_cash') setPriceCashInput(formatted);
    if (field === 'price_installment') setPriceInstallmentInput(formatted);

    const parsed = parseCurrencyInput(formatted, currencyCode);
    const numeric = parsed ? parseFloat(parsed) : null;
    setFormData((prev) => ({
      ...prev,
      [field]: formatted === '' ? null : numeric,
    }));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const base64 = await fileToBase64(file);
      return base64;
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer upload',
        description: error?.message || 'Não foi possível processar a imagem',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const url = await uploadImage(file);
    if (url) {
      setFormData({ ...formData, cover_image_url: url });
    }
    setIsUploading(false);
  };

  const handleCarouselUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];
    
    for (const file of Array.from(files)) {
      const url = await uploadImage(file);
      if (url) newUrls.push(url);
    }

    setFormData({ 
      ...formData, 
      carousel_images: [...(formData.carousel_images || []), ...newUrls] 
    });
    setIsUploading(false);
  };

  const removeCarouselImage = (index: number) => {
    const images = [...(formData.carousel_images || [])];
    images.splice(index, 1);
    setFormData({ ...formData, carousel_images: images });
  };

  const addIncludedItem = () => {
    if (newIncludedItem.trim()) {
      setFormData({
        ...formData,
        included_items: [...(formData.included_items || []), newIncludedItem.trim()],
      });
      setNewIncludedItem('');
    }
  };

  const removeIncludedItem = (index: number) => {
    const items = [...(formData.included_items || [])];
    items.splice(index, 1);
    setFormData({ ...formData, included_items: items });
  };

  const addExcludedItem = () => {
    if (newExcludedItem.trim()) {
      setFormData({
        ...formData,
        excluded_items: [...(formData.excluded_items || []), newExcludedItem.trim()],
      });
      setNewExcludedItem('');
    }
  };

  const removeExcludedItem = (index: number) => {
    const items = [...(formData.excluded_items || [])];
    items.splice(index, 1);
    setFormData({ ...formData, excluded_items: items });
  };

  const handleTestimonialPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTestimonialPhoto(true);
    const url = await uploadImage(file);
    if (url) {
      setNewTestimonial({ ...newTestimonial, photo: url });
    }
    setUploadingTestimonialPhoto(false);
  };

  const addTestimonial = () => {
    if (newTestimonial.name.trim() && newTestimonial.text.trim()) {
      setFormData({
        ...formData,
        testimonials: [...(formData.testimonials || []), newTestimonial],
      });
      setNewTestimonial({ name: '', text: '', photo: '' });
    }
  };

  const removeTestimonial = (index: number) => {
    const testimonials = [...(formData.testimonials || [])];
    testimonials.splice(index, 1);
    setFormData({ ...formData, testimonials });
  };

  const addFaq = () => {
    if (newFaq.question.trim() && newFaq.answer.trim()) {
      setFormData({
        ...formData,
        faqs: [...(formData.faqs || []), newFaq],
      });
      setNewFaq({ question: '', answer: '' });
    }
  };

  const removeFaq = (index: number) => {
    const faqs = [...(formData.faqs || [])];
    faqs.splice(index, 1);
    setFormData({ ...formData, faqs });
  };

  const currencySymbol = {
    BRL: 'R$',
    EUR: '€',
    USD: '$',
  }[formData.currency || 'BRL'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto focus-visible:outline-none focus-visible:ring-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{group ? 'Editar Grupo' : 'Novo Grupo de Expedição'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-6 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
            <TabsTrigger value="basic" className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">Básico</TabsTrigger>
            <TabsTrigger value="pricing" className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">Preços</TabsTrigger>
            <TabsTrigger value="package" className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">Pacote</TabsTrigger>
            <TabsTrigger value="media" className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">Mídia</TabsTrigger>
            <TabsTrigger value="social" className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">Social</TabsTrigger>
            <TabsTrigger value="faq" className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">FAQ</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="destination">Destino *</Label>
              <Input
                id="destination"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="Ex: Patagônia, Chile"
                  required
                />
              </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início *</Label>
                <DatePickerField
                  value={formData.start_date}
                  onChange={(date) => setFormData({ ...formData, start_date: date })}
                  placeholder="Selecionar data"
                />
              </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (dias) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_participants">Limite de Pessoas *</Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="1"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do grupo de expedição..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Grupo ativo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show_date_preference">Perguntar preferência de data</Label>
                  <p className="text-xs text-muted-foreground">
                    Exibe campo no formulário perguntando se a data funciona para o inscrito
                  </p>
                </div>
                <Switch
                  id="show_date_preference"
                  checked={formData.show_date_preference}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_date_preference: checked })}
                />
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Moeda</Label>
                <Select
                  value={formData.currency || 'BRL'}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a moeda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real (R$)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="USD">Dólar ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_cash">Valor à Vista ({currencySymbol})</Label>
                <Input
                  id="price_cash"
                  inputMode="decimal"
                  value={priceCashInput}
                  onChange={(e) => handleCurrencyChange('price_cash', e.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_installment">Valor Parcelado ({currencySymbol})</Label>
                  <Input
                    id="price_installment"
                    inputMode="decimal"
                    value={priceInstallmentInput}
                    onChange={(e) => handleCurrencyChange('price_installment', e.target.value)}
                    placeholder="0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installments_count">Quantidade de Parcelas</Label>
                  <Input
                    id="installments_count"
                    type="number"
                    min="1"
                    max="24"
                    value={formData.installments_count ?? ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      installments_count: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    placeholder="Ex: 12"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Package Tab */}
            <TabsContent value="package" className="space-y-6 mt-4">
              {/* Included Items */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-green-600">O que está incluso</Label>
                <div className="flex gap-2">
                  <Input
                    value={newIncludedItem}
                    onChange={(e) => setNewIncludedItem(e.target.value)}
                    placeholder="Ex: Passagem aérea, Hospedagem..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addIncludedItem();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addIncludedItem}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.included_items || []).map((item, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeIncludedItem(index)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Excluded Items */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-red-600">O que não está incluso</Label>
                <div className="flex gap-2">
                  <Input
                    value={newExcludedItem}
                    onChange={(e) => setNewExcludedItem(e.target.value)}
                    placeholder="Ex: Refeições, Seguro viagem..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addExcludedItem();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addExcludedItem}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.excluded_items || []).map((item, index) => (
                    <Badge key={index} variant="secondary" className="bg-red-100 text-red-800 px-3 py-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeExcludedItem(index)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Media Tab (Landing Page) */}
            <TabsContent value="media" className="space-y-4 mt-4">
              {/* YouTube Video */}
              <div className="space-y-2">
                <Label htmlFor="youtube_video_url" className="flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-500" />
                  Vídeo do YouTube
                </Label>
                <Input
                  id="youtube_video_url"
                  value={formData.youtube_video_url || ''}
                  onChange={(e) => setFormData({ ...formData, youtube_video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground">
                  Cole a URL do vídeo do YouTube para exibir na landing page
                </p>
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <Label>Imagem de Capa</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  {formData.cover_image_url ? (
                    <div className="relative">
                      <img 
                        src={formData.cover_image_url} 
                        alt="Capa" 
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData({ ...formData, cover_image_url: '' })}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer py-8"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Clique para fazer upload</p>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                </div>
              </div>

              {/* Carousel Images */}
              <div className="space-y-2">
                <Label>Imagens do Carrossel</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(formData.carousel_images || []).map((url, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={url} 
                        alt={`Carousel ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeCarouselImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <div 
                    className="border-2 border-dashed rounded-lg h-24 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => carouselInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <input
                  ref={carouselInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleCarouselUpload}
                />
              </div>

              {/* Landing Text */}
              <div className="space-y-2">
                <Label htmlFor="landing_text">Texto da Landing Page</Label>
                <Textarea
                  id="landing_text"
                  value={formData.landing_text || ''}
                  onChange={(e) => setFormData({ ...formData, landing_text: e.target.value })}
                  placeholder="Texto descritivo para a página de inscrição pública..."
                  rows={5}
                />
              </div>
            </TabsContent>

            {/* Social/Testimonials Tab */}
            <TabsContent value="social" className="space-y-6 mt-4">
              {/* Google Reviews Link */}
              <div className="space-y-2">
                <Label htmlFor="google_reviews_url" className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Link das Avaliações do Google
                </Label>
                <Input
                  id="google_reviews_url"
                  value={formData.google_reviews_url || ''}
                  onChange={(e) => setFormData({ ...formData, google_reviews_url: e.target.value })}
                  placeholder="https://www.google.com/maps/place/..."
                />
                <p className="text-xs text-muted-foreground">
                  Cole o link das avaliações do Google Maps para exibir na landing page
                </p>
              </div>

              {/* Testimonials */}
              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Depoimentos
                </Label>

                {/* Existing Testimonials */}
                {(formData.testimonials || []).length > 0 && (
                  <div className="space-y-3">
                    {(formData.testimonials || []).map((testimonial, index) => (
                      <Card key={index} className="relative">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => removeTestimonial(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <CardContent className="p-4 flex gap-4">
                          {testimonial.photo && (
                            <img 
                              src={testimonial.photo} 
                              alt={testimonial.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.text}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Add New Testimonial */}
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <p className="text-sm font-medium">Adicionar depoimento</p>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-2">
                      {newTestimonial.photo ? (
                        <div className="relative">
                          <img 
                            src={newTestimonial.photo} 
                            alt="Preview"
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-1 -right-1 h-5 w-5"
                            onClick={() => setNewTestimonial({ ...newTestimonial, photo: '' })}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50"
                          onClick={() => testimonialPhotoRef.current?.click()}
                        >
                          {uploadingTestimonialPhoto ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">Foto</span>
                      <input
                        ref={testimonialPhotoRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleTestimonialPhotoUpload}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={newTestimonial.name}
                        onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                        placeholder="Nome da pessoa"
                      />
                      <Textarea
                        value={newTestimonial.text}
                        onChange={(e) => setNewTestimonial({ ...newTestimonial, text: e.target.value })}
                        placeholder="Depoimento..."
                        rows={2}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={addTestimonial}
                        disabled={!newTestimonial.name.trim() || !newTestimonial.text.trim()}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-4 mt-4">
              <div className="space-y-4">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  Perguntas Frequentes
                </Label>

                {/* Existing FAQs */}
                {(formData.faqs || []).length > 0 && (
                  <div className="space-y-3">
                    {(formData.faqs || []).map((faq, index) => (
                      <Card key={index} className="relative">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => removeFaq(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <CardContent className="p-4">
                          <p className="font-semibold text-primary">{faq.question}</p>
                          <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Add New FAQ */}
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <p className="text-sm font-medium">Adicionar pergunta</p>
                  <Input
                    value={newFaq.question}
                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    placeholder="Qual é a pergunta?"
                  />
                  <Textarea
                    value={newFaq.answer}
                    onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                    placeholder="Resposta..."
                    rows={3}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={addFaq}
                    disabled={!newFaq.question.trim() || !newFaq.answer.trim()}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </TabsContent>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || isUploading}>
                {(isLoading || isUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {group ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
