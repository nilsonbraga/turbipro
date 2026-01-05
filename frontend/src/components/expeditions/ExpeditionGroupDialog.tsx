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
import { Loader2, Upload, X, Image as ImageIcon, Plus, Youtube, Star, HelpCircle, ExternalLink, Calendar as CalendarIcon, Info, DollarSign, Package, MessageSquare, FileText, Pencil, Trash2, Check } from 'lucide-react';
import { ExpeditionGroup, ExpeditionGroupInput, Testimonial, FAQ, ItinerarySummaryImage, NotRecommendedItem, PricingOffer } from '@/hooks/useExpeditionGroups';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { formatCurrencyInput, parseCurrencyInput } from '@/utils/currencyFormat';

type CurrencyCode = 'BRL' | 'USD' | 'EUR';

type PricingOfferInputs = {
  price_cash: string;
  price_installment: string;
  entry_value: string;
  original_price_cash: string;
  original_price_installment: string;
};

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
  const testimonialEditPhotoRef = useRef<HTMLInputElement>(null);
  const descriptionGalleryInputRef = useRef<HTMLInputElement>(null);
  const aboutImageInputRef = useRef<HTMLInputElement>(null);
  const destinationSummaryImageInputRef = useRef<HTMLInputElement>(null);
  const itinerarySummaryImagesInputRef = useRef<HTMLInputElement>(null);
  const transportImagesInputRef = useRef<HTMLInputElement>(null);
  
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
    impact_phrase: '',
    description_image_url: '',
    description_gallery_images: [],
    about_title: '',
    about_description: '',
    about_image_url: '',
    destination_summary_title: '',
    destination_summary_description: '',
    destination_summary_image_url: '',
    itinerary_summary_title: '',
    itinerary_summary_description: '',
    itinerary_summary_images: [],
    transport_title: '',
    transport_text: '',
    transport_images: [],
    not_recommended_items: [],
    price_cash: null,
    price_installment: null,
    installments_count: null,
    currency: 'BRL',
    pricing_offers: [],
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
  const [editingTestimonialIndex, setEditingTestimonialIndex] = useState<number | null>(null);
  const [testimonialDraft, setTestimonialDraft] = useState<Testimonial>({ name: '', text: '', photo: '' });
  const [newFaq, setNewFaq] = useState<FAQ>({ question: '', answer: '' });
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [faqDraft, setFaqDraft] = useState<FAQ>({ question: '', answer: '' });
  const [uploadingTestimonialPhoto, setUploadingTestimonialPhoto] = useState(false);
  const [uploadingTestimonialEditPhoto, setUploadingTestimonialEditPhoto] = useState(false);
  const [priceCashInput, setPriceCashInput] = useState('');
  const [priceInstallmentInput, setPriceInstallmentInput] = useState('');
  const [newNotRecommendedItem, setNewNotRecommendedItem] = useState<NotRecommendedItem>({ title: '', description: '' });
  const [pricingOfferInputs, setPricingOfferInputs] = useState<PricingOfferInputs[]>([]);
  const fileToBase64 = (file: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

  const MAX_IMAGE_DIMENSION = 2000;
  const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

  const loadImage = (file: File): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Falha ao carregar a imagem'));
      };
      img.src = url;
    });

  const optimizeImage = async (file: File): Promise<Blob> => {
    const img = await loadImage(file);
    const maxDimension = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / maxDimension);

    if (scale === 1 && file.size <= MAX_IMAGE_BYTES) {
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const quality = outputType === 'image/jpeg' ? 0.85 : 0.92;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob || file), outputType, quality);
    });
  };

  const emptyOfferInputs: PricingOfferInputs = {
    price_cash: '',
    price_installment: '',
    entry_value: '',
    original_price_cash: '',
    original_price_installment: '',
  };

  const formatOfferValue = (value: number | null | undefined, currency: CurrencyCode) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '';
    const numStr = Number(value).toFixed(2).replace('.', currency === 'BRL' ? ',' : '.');
    return formatCurrencyInput(numStr, currency);
  };

  const buildOfferInputs = (offers: PricingOffer[], currency: CurrencyCode) =>
    offers.map((offer) => ({
      price_cash: formatOfferValue(offer.price_cash, currency),
      price_installment: formatOfferValue(offer.price_installment, currency),
      entry_value: formatOfferValue(offer.entry_value, currency),
      original_price_cash: formatOfferValue(offer.original_price_cash, currency),
      original_price_installment: formatOfferValue(offer.original_price_installment, currency),
    }));

  useEffect(() => {
    const normalizeDateInput = (val?: string | null) => {
      if (!val) return '';
      // handle ISO strings or YYYY-MM-DD
      const date = new Date(val);
      if (Number.isNaN(date.getTime())) return '';
      return date.toISOString().slice(0, 10);
    };

    if (group) {
      const currency = (group.currency || 'BRL') as CurrencyCode;
      const existingOffers = (group.pricing_offers as PricingOffer[]) || [];
      const hasLegacyPricing =
        group.price_cash !== null ||
        group.price_installment !== null ||
        group.installments_count !== null;
      const legacyOffer: PricingOffer[] = !existingOffers.length && hasLegacyPricing
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
              currency: currency,
            },
          ]
        : [];
      const resolvedOffers = existingOffers.length > 0 ? existingOffers : legacyOffer;

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
        impact_phrase: group.impact_phrase || '',
        description_image_url: group.description_image_url || '',
        description_gallery_images:
          (group.description_gallery_images && group.description_gallery_images.length > 0
            ? group.description_gallery_images
            : group.description_image_url
            ? [group.description_image_url]
            : []) || [],
        about_title: group.about_title || '',
        about_description: group.about_description || '',
        about_image_url: group.about_image_url || '',
        destination_summary_title: group.destination_summary_title || '',
        destination_summary_description: group.destination_summary_description || '',
        destination_summary_image_url: group.destination_summary_image_url || '',
        itinerary_summary_title: group.itinerary_summary_title || '',
        itinerary_summary_description: group.itinerary_summary_description || '',
        itinerary_summary_images: (group.itinerary_summary_images as ItinerarySummaryImage[]) || [],
        transport_title: group.transport_title || '',
        transport_text: group.transport_text || '',
        transport_images: group.transport_images || [],
        not_recommended_items: (group.not_recommended_items as NotRecommendedItem[]) || [],
        price_cash: group.price_cash ?? null,
        price_installment: group.price_installment ?? null,
        installments_count: group.installments_count ?? null,
        currency: currency,
        pricing_offers: resolvedOffers,
        show_date_preference: group.show_date_preference ?? false,
        included_items: group.included_items || [],
        excluded_items: group.excluded_items || [],
        youtube_video_url: group.youtube_video_url || '',
        google_reviews_url: group.google_reviews_url || '',
        testimonials: (group.testimonials as Testimonial[]) || [],
        faqs: (group.faqs as FAQ[]) || [],
      });
      setPricingOfferInputs(
        resolvedOffers.length > 0 ? buildOfferInputs(resolvedOffers, currency) : [],
      );
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
        impact_phrase: '',
        description_image_url: '',
        description_gallery_images: [],
        about_title: '',
        about_description: '',
        about_image_url: '',
        destination_summary_title: '',
        destination_summary_description: '',
        destination_summary_image_url: '',
        itinerary_summary_title: '',
        itinerary_summary_description: '',
        itinerary_summary_images: [],
        transport_title: '',
        transport_text: '',
        transport_images: [],
        not_recommended_items: [],
        price_cash: null,
        price_installment: null,
        installments_count: null,
        currency: 'BRL',
        pricing_offers: [],
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
      setPricingOfferInputs([]);
    }
    setNewIncludedItem('');
    setNewExcludedItem('');
    setNewTestimonial({ name: '', text: '', photo: '' });
    setEditingTestimonialIndex(null);
    setTestimonialDraft({ name: '', text: '', photo: '' });
    setNewFaq({ question: '', answer: '' });
    setNewNotRecommendedItem({ title: '', description: '' });
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
  const currencyPlaceholder = currencyCode === 'BRL' ? '0,00' : '0.00';

  useEffect(() => {
    const toNumeric = (value: unknown) => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const direct = Number(value);
        if (Number.isFinite(direct)) return direct;
        const parsed = parseCurrencyInput(value, currencyCode);
        const fallback = Number(parsed);
        return Number.isFinite(fallback) ? fallback : null;
      }
      return null;
    };

    const formatFromValue = (value: unknown) => {
      const numeric = toNumeric(value);
      if (numeric === null) return '';
      const numStr = numeric.toFixed(2).replace('.', currencyCode === 'BRL' ? ',' : '.');
      return formatCurrencyInput(numStr, currencyCode);
    };

    setPriceCashInput(formatFromValue(formData.price_cash));
    setPriceInstallmentInput(formatFromValue(formData.price_installment));
    if (formData.pricing_offers && formData.pricing_offers.length > 0) {
      setPricingOfferInputs(buildOfferInputs(formData.pricing_offers, currencyCode));
    }
  }, [currencyCode]);

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
      const processed = await optimizeImage(file);
      if (processed.size > MAX_IMAGE_BYTES) {
        toast({
          title: 'Imagem muito grande',
          description: 'Reduza o tamanho da imagem antes de enviar.',
          variant: 'destructive',
        });
        return null;
      }
      const base64 = await fileToBase64(processed);
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

  type SingleImageField = 'about_image_url' | 'destination_summary_image_url';

  const handleSingleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: SingleImageField,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const url = await uploadImage(file);
    if (url) {
      setFormData((prev) => ({
        ...prev,
        [field]: url,
      }));
    }
    setIsUploading(false);
    e.target.value = '';
  };

  const handleDescriptionGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const existing = formData.description_gallery_images || [];
    const remainingSlots = Math.max(0, 2 - existing.length);
    if (remainingSlots === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files).slice(0, remainingSlots)) {
      const url = await uploadImage(file);
      if (url) newUrls.push(url);
    }

    setFormData((prev) => ({
      ...prev,
      description_gallery_images: [...(prev.description_gallery_images || []), ...newUrls],
    }));
    setIsUploading(false);
    e.target.value = '';
  };

  const removeDescriptionGalleryImage = (index: number) => {
    const images = [...(formData.description_gallery_images || [])];
    images.splice(index, 1);
    setFormData({ ...formData, description_gallery_images: images });
  };

  const handleItineraryImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages: ItinerarySummaryImage[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadImage(file);
      if (url) {
        newImages.push({ url, title: '', description: '' });
      }
    }
    setFormData((prev) => ({
      ...prev,
      itinerary_summary_images: [...(prev.itinerary_summary_images || []), ...newImages],
    }));
    setIsUploading(false);
    e.target.value = '';
  };

  const updateItineraryImage = (index: number, updates: Partial<ItinerarySummaryImage>) => {
    const images = [...(formData.itinerary_summary_images || [])];
    images[index] = { ...images[index], ...updates };
    setFormData({ ...formData, itinerary_summary_images: images });
  };

  const removeItineraryImage = (index: number) => {
    const images = [...(formData.itinerary_summary_images || [])];
    images.splice(index, 1);
    setFormData({ ...formData, itinerary_summary_images: images });
  };

  const handleTransportImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadImage(file);
      if (url) newUrls.push(url);
    }
    setFormData((prev) => ({
      ...prev,
      transport_images: [...(prev.transport_images || []), ...newUrls],
    }));
    setIsUploading(false);
    e.target.value = '';
  };

  const removeTransportImage = (index: number) => {
    const images = [...(formData.transport_images || [])];
    images.splice(index, 1);
    setFormData({ ...formData, transport_images: images });
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

  const addPricingOffer = () => {
    setFormData((prev) => ({
      ...prev,
      pricing_offers: [
        ...(prev.pricing_offers || []),
        {
          title: '',
          description: '',
          price_cash: null,
          price_installment: null,
          installments_count: null,
          entry_value: null,
          is_offer: false,
          original_price_cash: null,
          original_price_installment: null,
          currency: prev.currency || 'BRL',
        },
      ],
    }));
    setPricingOfferInputs((prev) => [...prev, { ...emptyOfferInputs }]);
  };

  const updatePricingOffer = (index: number, updates: Partial<PricingOffer>) => {
    const offers = [...(formData.pricing_offers || [])];
    offers[index] = { ...offers[index], ...updates };
    setFormData({ ...formData, pricing_offers: offers });
  };

  const removePricingOffer = (index: number) => {
    const offers = [...(formData.pricing_offers || [])];
    offers.splice(index, 1);
    setFormData({ ...formData, pricing_offers: offers });
    setPricingOfferInputs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePricingOfferCurrencyChange = (
    index: number,
    field: keyof PricingOfferInputs,
    rawValue: string,
  ) => {
    const formatted = formatCurrencyInput(rawValue, currencyCode);
    const parsed = parseCurrencyInput(formatted, currencyCode);
    const numeric = parsed ? parseFloat(parsed) : null;

    setPricingOfferInputs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: formatted };
      return next;
    });

    const mappedField: Record<keyof PricingOfferInputs, keyof PricingOffer> = {
      price_cash: 'price_cash',
      price_installment: 'price_installment',
      entry_value: 'entry_value',
      original_price_cash: 'original_price_cash',
      original_price_installment: 'original_price_installment',
    };

    updatePricingOffer(index, { [mappedField[field]]: formatted === '' ? null : numeric } as Partial<PricingOffer>);
  };

  const addNotRecommendedItem = () => {
    if (!newNotRecommendedItem.title.trim() || !newNotRecommendedItem.description.trim()) return;
    setFormData((prev) => ({
      ...prev,
      not_recommended_items: [...(prev.not_recommended_items || []), newNotRecommendedItem],
    }));
    setNewNotRecommendedItem({ title: '', description: '' });
  };

  const updateNotRecommendedItem = (index: number, updates: Partial<NotRecommendedItem>) => {
    const items = [...(formData.not_recommended_items || [])];
    items[index] = { ...items[index], ...updates };
    setFormData({ ...formData, not_recommended_items: items });
  };

  const removeNotRecommendedItem = (index: number) => {
    const items = [...(formData.not_recommended_items || [])];
    items.splice(index, 1);
    setFormData({ ...formData, not_recommended_items: items });
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

  const handleTestimonialEditPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTestimonialEditPhoto(true);
    const url = await uploadImage(file);
    if (url) {
      setTestimonialDraft({ ...testimonialDraft, photo: url });
    }
    setUploadingTestimonialEditPhoto(false);
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
    if (editingTestimonialIndex === index) {
      setEditingTestimonialIndex(null);
      setTestimonialDraft({ name: '', text: '', photo: '' });
    } else if (editingTestimonialIndex !== null && index < editingTestimonialIndex) {
      setEditingTestimonialIndex(editingTestimonialIndex - 1);
    }
  };

  const startTestimonialEdit = (index: number) => {
    const current = (formData.testimonials || [])[index];
    if (!current) return;
    setTestimonialDraft({ ...current });
    setEditingTestimonialIndex(index);
  };

  const cancelTestimonialEdit = () => {
    setEditingTestimonialIndex(null);
    setTestimonialDraft({ name: '', text: '', photo: '' });
  };

  const saveTestimonialEdit = () => {
    if (editingTestimonialIndex === null) return;
    const testimonials = [...(formData.testimonials || [])];
    const trimmed = {
      ...testimonialDraft,
      name: testimonialDraft.name.trim(),
      text: testimonialDraft.text.trim(),
      photo: testimonialDraft.photo?.trim() ? testimonialDraft.photo : '',
    };
    testimonials[editingTestimonialIndex] = trimmed;
    setFormData({ ...formData, testimonials });
    setEditingTestimonialIndex(null);
    setTestimonialDraft({ name: '', text: '', photo: '' });
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
  const startFaqEdit = (index: number) => {
    const current = (formData.faqs || [])[index];
    if (!current) return;
    setFaqDraft({ ...current });
    setEditingFaqIndex(index);
  };

  const cancelFaqEdit = () => {
    setEditingFaqIndex(null);
    setFaqDraft({ question: '', answer: '' });
  };

  const saveFaqEdit = () => {
    if (editingFaqIndex === null) return;
    const faqs = [...(formData.faqs || [])];
    faqs[editingFaqIndex] = { ...faqDraft };
    setFormData({ ...formData, faqs });
    setEditingFaqIndex(null);
    setFaqDraft({ question: '', answer: '' });
  };

  const currencySymbol = {
    BRL: 'R$',
    EUR: '€',
    USD: '$',
  }[formData.currency || 'BRL'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-y-auto focus-visible:outline-none focus-visible:ring-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{group ? 'Editar Grupo' : 'Novo Grupo de Expedição'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
            <TabsTrigger value="basic" className="flex items-center justify-center gap-2 text-xs sm:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
              <Info className="h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center justify-center gap-2 text-xs sm:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
              <DollarSign className="h-4 w-4" />
              Valores
            </TabsTrigger>
            <TabsTrigger value="package" className="flex items-center justify-center gap-2 text-xs sm:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
              <Package className="h-4 w-4" />
              Itens
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center justify-center gap-2 text-xs sm:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
              <ImageIcon className="h-4 w-4" />
              Mídia
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center justify-center gap-2 text-xs sm:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
              <FileText className="h-4 w-4" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center justify-center gap-2 text-xs sm:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
              <MessageSquare className="h-4 w-4" />
              Comentários
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center justify-center gap-2 text-xs sm:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </TabsTrigger>
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

              <div className="space-y-4 rounded-2xl border border-muted/60 p-4">
                <h3 className="text-sm font-semibold text-foreground">Chamada para a expedição</h3>
                <div className="space-y-2">
                  <Label htmlFor="impact_phrase">Frase de efeito</Label>
                  <Input
                    id="impact_phrase"
                    value={formData.impact_phrase || ''}
                    onChange={(e) => setFormData({ ...formData, impact_phrase: e.target.value })}
                    placeholder="Ex: Uma experiência que transforma a sua forma de viajar"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fotos da seção (1 a 2)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(formData.description_gallery_images || []).map((url, index) => (
                      <div key={`${url}-${index}`} className="relative">
                        <img
                          src={url}
                          alt={`Descrição ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-7 w-7"
                          onClick={() => removeDescriptionGalleryImage(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {(formData.description_gallery_images || []).length < 2 && (
                      <div
                        className="border-2 border-dashed rounded-lg h-32 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => descriptionGalleryInputRef.current?.click()}
                      >
                        {isUploading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground text-xs">
                            <Upload className="w-5 h-5" />
                            Adicionar foto
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    ref={descriptionGalleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleDescriptionGalleryUpload}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="landing_text">Texto geral</Label>
                <Textarea
                  id="landing_text"
                  value={formData.landing_text || ''}
                  onChange={(e) => setFormData({ ...formData, landing_text: e.target.value })}
                  placeholder="Texto geral para a landing da expedição..."
                  rows={4}
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
            <TabsContent value="pricing" className="space-y-6 mt-4">
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

              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Ofertas</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPricingOffer}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar oferta
                </Button>
              </div>

              {(formData.pricing_offers || []).length === 0 ? (
                <Card className="border border-dashed">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    Adicione uma ou mais ofertas para exibir os valores na landing page.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {(formData.pricing_offers || []).map((offer, index) => {
                    const inputs = pricingOfferInputs[index] || emptyOfferInputs;
                    return (
                      <Card key={`pricing-offer-${index}`} className="relative border border-muted/60 shadow-none">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removePricingOffer(index)}
                          aria-label="Remover oferta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <CardContent className="space-y-4 p-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Nome da oferta</Label>
                              <Input
                                value={offer.title}
                                onChange={(e) => updatePricingOffer(index, { title: e.target.value })}
                                placeholder="Ex: Quarto individual"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Descrição (opcional)</Label>
                              <Input
                                value={offer.description || ''}
                                onChange={(e) => updatePricingOffer(index, { description: e.target.value })}
                                placeholder="Ex: Valor por pessoa"
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                              <Label>Valor à vista ({currencySymbol})</Label>
                              <Input
                                inputMode="decimal"
                                value={inputs.price_cash}
                                onChange={(e) => handlePricingOfferCurrencyChange(index, 'price_cash', e.target.value)}
                                placeholder={currencyPlaceholder}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Valor parcelado ({currencySymbol})</Label>
                              <Input
                                inputMode="decimal"
                                value={inputs.price_installment}
                                onChange={(e) => handlePricingOfferCurrencyChange(index, 'price_installment', e.target.value)}
                                placeholder={currencyPlaceholder}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Parcelas</Label>
                              <Input
                                type="number"
                                min="1"
                                max="24"
                                value={offer.installments_count ?? ''}
                                onChange={(e) =>
                                  updatePricingOffer(index, {
                                    installments_count: e.target.value ? parseInt(e.target.value) : null,
                                  })
                                }
                                placeholder="Ex: 12"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Entrada (opcional)</Label>
                              <Input
                                inputMode="decimal"
                                value={inputs.entry_value}
                                onChange={(e) => handlePricingOfferCurrencyChange(index, 'entry_value', e.target.value)}
                                placeholder={currencyPlaceholder}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Switch
                              checked={Boolean(offer.is_offer)}
                              onCheckedChange={(checked) => {
                                updatePricingOffer(index, {
                                  is_offer: checked,
                                  ...(checked
                                    ? {}
                                    : {
                                        original_price_cash: null,
                                        original_price_installment: null,
                                      }),
                                });
                                if (!checked) {
                                  setPricingOfferInputs((prev) => {
                                    const next = [...prev];
                                    next[index] = {
                                      ...next[index],
                                      original_price_cash: '',
                                      original_price_installment: '',
                                    };
                                    return next;
                                  });
                                }
                              }}
                            />
                            <Label className="mb-0">Está em oferta</Label>
                          </div>

                          {offer.is_offer && (
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Valor original à vista ({currencySymbol})</Label>
                                <Input
                                  inputMode="decimal"
                                  value={inputs.original_price_cash}
                                  onChange={(e) =>
                                    handlePricingOfferCurrencyChange(index, 'original_price_cash', e.target.value)
                                  }
                                  placeholder={currencyPlaceholder}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Valor original parcelado ({currencySymbol})</Label>
                                <Input
                                  inputMode="decimal"
                                  value={inputs.original_price_installment}
                                  onChange={(e) =>
                                    handlePricingOfferCurrencyChange(index, 'original_price_installment', e.target.value)
                                  }
                                  placeholder={currencyPlaceholder}
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
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
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 mt-4">
              <div className="space-y-4 rounded-2xl border border-muted/60 p-4">
                <h3 className="text-sm font-semibold text-foreground">Quem somos</h3>
                <div className="space-y-2">
                  <Label htmlFor="about_title">Título da seção</Label>
                  <Input
                    id="about_title"
                    value={formData.about_title || ''}
                    onChange={(e) => setFormData({ ...formData, about_title: e.target.value })}
                    placeholder="Ex: Quem somos"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about_description">Descrição</Label>
                  <Textarea
                    id="about_description"
                    value={formData.about_description || ''}
                    onChange={(e) => setFormData({ ...formData, about_description: e.target.value })}
                    placeholder="Conte a história e a proposta da agência"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Foto da seção</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {formData.about_image_url ? (
                      <div className="relative">
                        <img
                          src={formData.about_image_url}
                          alt="Quem somos"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => setFormData({ ...formData, about_image_url: '' })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer py-8"
                        onClick={() => aboutImageInputRef.current?.click()}
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
                      ref={aboutImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleSingleImageUpload(e, 'about_image_url')}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-muted/60 p-4">
                <h3 className="text-sm font-semibold text-foreground">Resumo do destino</h3>
                <div className="space-y-2">
                  <Label htmlFor="destination_summary_title">Título</Label>
                  <Input
                    id="destination_summary_title"
                    value={formData.destination_summary_title || ''}
                    onChange={(e) => setFormData({ ...formData, destination_summary_title: e.target.value })}
                    placeholder="Ex: O que esperar do destino"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination_summary_description">Descrição</Label>
                  <Textarea
                    id="destination_summary_description"
                    value={formData.destination_summary_description || ''}
                    onChange={(e) => setFormData({ ...formData, destination_summary_description: e.target.value })}
                    placeholder="Resumo do destino e principais destaques"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Foto do resumo do destino</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    {formData.destination_summary_image_url ? (
                      <div className="relative">
                        <img
                          src={formData.destination_summary_image_url}
                          alt="Resumo do destino"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => setFormData({ ...formData, destination_summary_image_url: '' })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer py-8"
                        onClick={() => destinationSummaryImageInputRef.current?.click()}
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
                      ref={destinationSummaryImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleSingleImageUpload(e, 'destination_summary_image_url')}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-muted/60 p-4">
                <h3 className="text-sm font-semibold text-foreground">Resumo do roteiro</h3>
                <div className="space-y-2">
                  <Label htmlFor="itinerary_summary_title">Título</Label>
                  <Input
                    id="itinerary_summary_title"
                    value={formData.itinerary_summary_title || ''}
                    onChange={(e) => setFormData({ ...formData, itinerary_summary_title: e.target.value })}
                    placeholder="Ex: Roteiro pensado dia a dia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="itinerary_summary_description">Descrição</Label>
                  <Textarea
                    id="itinerary_summary_description"
                    value={formData.itinerary_summary_description || ''}
                    onChange={(e) => setFormData({ ...formData, itinerary_summary_description: e.target.value })}
                    placeholder="Conte o que o roteiro entrega de especial"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fotos do resumo do roteiro</Label>
                  {(formData.itinerary_summary_images || []).length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2">
                      {(formData.itinerary_summary_images || []).map((image, index) => (
                        <Card key={`${image.url}-${index}`} className="relative">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() => removeItineraryImage(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                          <CardContent className="p-3 space-y-3">
                            <img
                              src={image.url}
                              alt={image.title || `Roteiro ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <Input
                              value={image.title || ''}
                              onChange={(e) => updateItineraryImage(index, { title: e.target.value })}
                              placeholder="Título da foto"
                            />
                            <Textarea
                              value={image.description || ''}
                              onChange={(e) => updateItineraryImage(index, { description: e.target.value })}
                              placeholder="Descrição da foto"
                              rows={2}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  <div
                    className="border-2 border-dashed rounded-lg h-24 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => itinerarySummaryImagesInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <ImageIcon className="w-5 h-5" />
                        Adicionar fotos
                      </div>
                    )}
                  </div>
                  <input
                    ref={itinerarySummaryImagesInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleItineraryImagesUpload}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-muted/60 p-4">
                <h3 className="text-sm font-semibold text-foreground">Transportes</h3>
                <div className="space-y-2">
                  <Label htmlFor="transport_title">Título</Label>
                  <Input
                    id="transport_title"
                    value={formData.transport_title || ''}
                    onChange={(e) => setFormData({ ...formData, transport_title: e.target.value })}
                    placeholder="Ex: Como iremos nos deslocar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transport_text">Texto</Label>
                  <Textarea
                    id="transport_text"
                    value={formData.transport_text || ''}
                    onChange={(e) => setFormData({ ...formData, transport_text: e.target.value })}
                    placeholder="Descreva o transporte, conforto e logística"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fotos dos transportes</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(formData.transport_images || []).map((url, index) => (
                      <div key={`${url}-${index}`} className="relative">
                        <img
                          src={url}
                          alt={`Transporte ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removeTransportImage(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <div
                      className="border-2 border-dashed rounded-lg h-24 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => transportImagesInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <input
                    ref={transportImagesInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleTransportImagesUpload}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-muted/60 p-4">
                <h3 className="text-sm font-semibold text-foreground">Para quem não é indicado</h3>
                <p className="text-xs text-muted-foreground">
                  Adicione itens para orientar melhor o público ideal da expedição.
                </p>
                <Card className="border border-muted/60 shadow-none">
                  <CardContent className="p-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-[1fr,1.2fr]">
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                          value={newNotRecommendedItem.title}
                          onChange={(e) =>
                            setNewNotRecommendedItem({ ...newNotRecommendedItem, title: e.target.value })
                          }
                          placeholder="Ex: Busca viagens muito rápidas"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          value={newNotRecommendedItem.description}
                          onChange={(e) =>
                            setNewNotRecommendedItem({ ...newNotRecommendedItem, description: e.target.value })
                          }
                          placeholder="Explique por que não é indicado"
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" onClick={addNotRecommendedItem}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar item
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                {(formData.not_recommended_items || []).length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {(formData.not_recommended_items || []).map((item, index) => (
                      <Card key={`${item.title}-${index}`} className="relative border border-muted/60 shadow-none">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => removeNotRecommendedItem(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <CardContent className="p-4 space-y-3">
                          <Input
                            value={item.title}
                            onChange={(e) => updateNotRecommendedItem(index, { title: e.target.value })}
                            placeholder="Título"
                          />
                          <Textarea
                            value={item.description}
                            onChange={(e) => updateNotRecommendedItem(index, { description: e.target.value })}
                            placeholder="Descrição"
                            rows={2}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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
                      <Card key={index}>
                        <CardContent className="p-4">
                          {editingTestimonialIndex === index ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-muted-foreground">Editar depoimento</p>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={saveTestimonialEdit}
                                    disabled={!testimonialDraft.name.trim() || !testimonialDraft.text.trim()}
                                    aria-label="Salvar depoimento"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={cancelTestimonialEdit}
                                    aria-label="Cancelar edição"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => removeTestimonial(index)}
                                    aria-label="Excluir depoimento"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                <div className="flex flex-col items-center gap-2">
                                  {testimonialDraft.photo ? (
                                    <div
                                      className="relative cursor-pointer"
                                      onClick={() => testimonialEditPhotoRef.current?.click()}
                                    >
                                      <div className="h-14 w-14 rounded-full overflow-hidden bg-muted/40">
                                        <img
                                          src={testimonialDraft.photo}
                                          alt="Preview"
                                          className="h-full w-full object-cover"
                                        />
                                      </div>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-1 -right-1 h-5 w-5"
                                        onClick={() => setTestimonialDraft({ ...testimonialDraft, photo: '' })}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div
                                      className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/50"
                                      onClick={() => testimonialEditPhotoRef.current?.click()}
                                    >
                                      {uploadingTestimonialEditPhoto ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Upload className="w-4 h-4 text-muted-foreground" />
                                      )}
                                    </div>
                                  )}
                                  <span className="text-xs text-muted-foreground">Foto</span>
                                  <input
                                    ref={testimonialEditPhotoRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleTestimonialEditPhotoUpload}
                                  />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <Input
                                    value={testimonialDraft.name}
                                    onChange={(e) => setTestimonialDraft({ ...testimonialDraft, name: e.target.value })}
                                    placeholder="Nome da pessoa"
                                  />
                                  <Textarea
                                    value={testimonialDraft.text}
                                    onChange={(e) => setTestimonialDraft({ ...testimonialDraft, text: e.target.value })}
                                    placeholder="Depoimento..."
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-4">
                                {testimonial.photo && (
                                  <div className="h-12 w-12 rounded-full overflow-hidden bg-muted/30 shrink-0">
                                    <img
                                      src={testimonial.photo}
                                      alt={testimonial.name}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold">{testimonial.name}</p>
                                  <p className="text-sm text-muted-foreground">{testimonial.text}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => startTestimonialEdit(index)}
                                  aria-label="Editar depoimento"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => removeTestimonial(index)}
                                  aria-label="Excluir depoimento"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
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
                          <div className="h-16 w-16 rounded-full overflow-hidden bg-muted/40">
                            <img 
                              src={newTestimonial.photo} 
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
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
                    {(formData.faqs || []).map((faq, index) => {
                      const isEditing = editingFaqIndex === index;
                      return (
                        <Card key={index}>
                          <CardContent className="space-y-3 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <p className="font-semibold text-primary">{faq.question}</p>
                                <p className="text-sm text-muted-foreground">{faq.answer}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                {!isEditing && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => startFaqEdit(index)}
                                    aria-label="Editar pergunta"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => removeFaq(index)}
                                  aria-label="Excluir pergunta"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {isEditing && (
                              <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-muted-foreground">Editar pergunta</p>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={saveFaqEdit}
                                      disabled={!faqDraft.question.trim() || !faqDraft.answer.trim()}
                                      aria-label="Salvar pergunta"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={cancelFaqEdit}
                                      aria-label="Cancelar edição"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <Input
                                  value={faqDraft.question}
                                  onChange={(e) => setFaqDraft({ ...faqDraft, question: e.target.value })}
                                  placeholder="Pergunta"
                                />
                                <Textarea
                                  value={faqDraft.answer}
                                  onChange={(e) => setFaqDraft({ ...faqDraft, answer: e.target.value })}
                                  placeholder="Resposta"
                                  rows={3}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
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
