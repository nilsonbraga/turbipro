import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, X, RotateCcw, Plane, Luggage, Hotel, Car, Coffee, Bus, Plus, Save, Loader2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { exportArtPng } from '@/utils/exportArtPng';
import { StudioPreview } from './StudioPreview';
import { CurrencyInput } from './CurrencyInput';
import './studioExport.css';
import type { FormatType, ArtType } from '@/pages/Studio';
import type { SavedTemplate } from '@/hooks/useStudioTemplates';

interface FormatOption {
  id: FormatType;
  name: string;
  dimensions: string;
  width: number;
  height: number;
}

interface ArtTypeOption {
  id: ArtType;
  name: string;
  description: string;
}

import type { SavedTemplate } from '@/hooks/useStudioTemplates';
import type { TemplateColors } from './StudioTemplateSelector';

interface StudioEditorProps {
  format: FormatOption;
  artType: ArtTypeOption;
  templateId: number;
  templateColors?: TemplateColors | null;
  onReset: () => void;
  onSave?: () => void;
  loadedTemplate?: SavedTemplate | null;
  saveTemplate: (template: any, existingId?: string) => Promise<SavedTemplate>;
  isSaving: boolean;
}

export type CurrencyType = 'BRL' | 'EUR' | 'USD';

export interface PacoteData {
  destinos: string;
  periodo: string;
  noites: string;
  dias: string;
  preco: string;
  currency: CurrencyType;
  hasDiscount: boolean;
  precoOriginal: string;
  hasInstallment: boolean;
  hasEntrada: boolean;
  entrada: string;
  parcelas: string;
  valorParcela: string;
  incluiItems: string[];
  observacao: string;
  cta: string;
  disclaimer: string;
}

export interface VooData {
  origem: string;
  destino: string;
  datas: string;
  companhia: string;
  numeroVoo: string;
  bagagem: string;
  preco: string;
  currency: CurrencyType;
  hasDiscount: boolean;
  precoOriginal: string;
  hasInstallment: boolean;
  hasEntrada: boolean;
  entrada: string;
  parcelas: string;
  valorParcela: string;
  cta: string;
  disclaimer: string;
}

export interface HospedagemData {
  hotel: string;
  cidade: string;
  checkIn: string;
  checkOut: string;
  diarias: string;
  preco: string;
  currency: CurrencyType;
  hasDiscount: boolean;
  precoOriginal: string;
  hasInstallment: boolean;
  hasEntrada: boolean;
  entrada: string;
  parcelas: string;
  valorParcela: string;
  regime: string;
  cta: string;
  disclaimer: string;
}

export type ArtData = PacoteData | VooData | HospedagemData;

export interface StudioColors {
  primary: string;
  secondary: string;
  // Header card
  headerColor: string;
  headerTextColor: string;
  headerTransparent: boolean;
  headerOpacity: number;
  headerBlur: number;
  headerRadius: number;
  titleFontSize: number;
  titleFontFamily: string;
  titleFontWeight: number;
  titleFontStyle: 'normal' | 'italic';
  headerTopSpacing: number;
  dateTextColor: string;
  // Nights card
  nightsCardColor: string;
  nightsCardOpacity: number;
  nightsCardRadius: number;
  nightsCardBlur: number;
  // General fonts
  fontPrimary: string;
  fontSecondary: string;
  logo: string;
}

export interface IconSelection {
  plane: boolean;
  luggage: boolean;
  hotel: boolean;
  car: boolean;
  breakfast: boolean;
  transfer: boolean;
}

const defaultColors: StudioColors = {
  primary: '#837d24',
  secondary: '#d0c131',
  // Header card
  headerColor: '#344331',
  headerTextColor: '#ffffff',
  headerTransparent: false,
  headerOpacity: 10,
  headerBlur: 3,
  headerRadius: 20,
  titleFontSize: 40,
  titleFontFamily: 'Poppins',
  titleFontWeight: 700,
  titleFontStyle: 'normal',
  headerTopSpacing: 40,
  dateTextColor: '#ffffff',
  // Nights card
  nightsCardColor: '#344331',
  nightsCardOpacity: 100,
  nightsCardRadius: 20,
  nightsCardBlur: 0,
  // General fonts
  fontPrimary: '#ffffff',
  fontSecondary: '#d0c131',
  logo: '',
};

const defaultIcons: IconSelection = {
  plane: false,
  luggage: false,
  hotel: false,
  car: false,
  breakfast: false,
  transfer: false,
};

const defaultDisclaimer = 'Valores sujeitos a reajuste e disponibilidade.';

const defaultPacoteData: PacoteData = {
  destinos: '',
  periodo: '',
  noites: '',
  dias: '',
  preco: '',
  currency: 'BRL',
  hasDiscount: false,
  precoOriginal: '',
  hasInstallment: false,
  hasEntrada: false,
  entrada: '',
  parcelas: '',
  valorParcela: '',
  incluiItems: [],
  observacao: '',
  cta: '',
  disclaimer: defaultDisclaimer
};

const defaultVooData: VooData = {
  origem: '',
  destino: '',
  datas: '',
  companhia: '',
  numeroVoo: '',
  bagagem: '',
  preco: '',
  currency: 'BRL',
  hasDiscount: false,
  precoOriginal: '',
  hasInstallment: false,
  hasEntrada: false,
  entrada: '',
  parcelas: '',
  valorParcela: '',
  cta: '',
  disclaimer: defaultDisclaimer
};

const defaultHospedagemData: HospedagemData = {
  hotel: '',
  cidade: '',
  checkIn: '',
  checkOut: '',
  diarias: '',
  preco: '',
  currency: 'BRL',
  hasDiscount: false,
  precoOriginal: '',
  hasInstallment: false,
  hasEntrada: false,
  entrada: '',
  parcelas: '',
  valorParcela: '',
  regime: '',
  cta: '',
  disclaimer: defaultDisclaimer
};

const iconOptions = [
  { key: 'plane', label: 'Aéreo', icon: Plane },
  { key: 'luggage', label: 'Bagagem', icon: Luggage },
  { key: 'hotel', label: 'Hotel', icon: Hotel },
  { key: 'car', label: 'Carro', icon: Car },
  { key: 'breakfast', label: 'Café da manhã', icon: Coffee },
  { key: 'transfer', label: 'Transfer', icon: Bus },
] as const;

export function StudioEditor({
  format,
  artType,
  templateId,
  templateColors,
  onReset,
  onSave,
  loadedTemplate,
  saveTemplate,
  isSaving,
}: StudioEditorProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Get initial colors based on template colors
  const getInitialColors = (): StudioColors => {
    if (templateColors) {
      return {
        ...defaultColors,
        primary: templateColors.primary,
        secondary: templateColors.secondary,
        headerColor: templateColors.primary,
        nightsCardColor: templateColors.primary,
        fontSecondary: templateColors.secondary,
      };
    }
    return defaultColors;
  };

  const [images, setImages] = useState<string[]>([]);
  const [colors, setColors] = useState<StudioColors>(getInitialColors);
  const [icons, setIcons] = useState<IconSelection>(defaultIcons);
  const [blurLevel, setBlurLevel] = useState(18);
  const [isExporting, setIsExporting] = useState(false);
  const [pacoteData, setPacoteData] = useState<PacoteData>(defaultPacoteData);
  const [vooData, setVooData] = useState<VooData>(defaultVooData);
  const [hospedagemData, setHospedagemData] = useState<HospedagemData>(defaultHospedagemData);

  // Apply template colors when not loading a saved template
  useEffect(() => {
    if (!loadedTemplate && templateColors) {
      setColors(prev => ({
        ...prev,
        primary: templateColors.primary,
        secondary: templateColors.secondary,
        headerColor: templateColors.primary,
        nightsCardColor: templateColors.primary,
        fontSecondary: templateColors.secondary,
      }));
    }
  }, [templateColors, loadedTemplate]);

  // reset hydration when switching template
  useEffect(() => {
    setIsHydrated(false);
    // reset to defaults before applying loaded template
    if (loadedTemplate) {
      setImages([]);
      setColors(defaultColors);
      setIcons(defaultIcons);
      setBlurLevel(24);
      setPacoteData(defaultPacoteData);
      setVooData(defaultVooData);
      setHospedagemData(defaultHospedagemData);
    }
  }, [loadedTemplate?.id]);

  // Hydrate state from loaded template
  useEffect(() => {
    if (!loadedTemplate) return;
    // Ensure we start from defaults
    setColors(defaultColors);
    setIcons(defaultIcons);
    setImages([]);
    setBlurLevel(24);
    setPacoteData(defaultPacoteData);
    setVooData(defaultVooData);
    setHospedagemData(defaultHospedagemData);
    // Store the template ID for updates
    setEditingTemplateId(loadedTemplate.id);
    
    // Set images from storage URLs
    setImages(loadedTemplate.images && loadedTemplate.images.length > 0 ? loadedTemplate.images : []);
    
    // Set colors (including logo URL) with defaults
    setColors((prev) => ({
      ...defaultColors,
      ...prev,
      ...(loadedTemplate.colors || {}),
      logo: loadedTemplate.logoUrl || loadedTemplate.colors?.logo || prev.logo || '',
    }));
    
    // Set icons
    setIcons(loadedTemplate.icons || defaultIcons);
    
    // Set blur level
    setBlurLevel(loadedTemplate.blurLevel !== undefined ? loadedTemplate.blurLevel : 24);
    
    // Set form data based on art type (fallback to pacote)
    const artTypeKey =
      loadedTemplate.artTypeId === 'pacote' || loadedTemplate.artTypeId === 'voo' || loadedTemplate.artTypeId === 'hospedagem'
        ? loadedTemplate.artTypeId
        : 'pacote';

    switch (artTypeKey) {
      case 'pacote':
        setPacoteData({
          ...defaultPacoteData,
          ...(loadedTemplate.data as PacoteData | undefined),
        });
        break;
      case 'voo':
        setVooData({
          ...defaultVooData,
          ...(loadedTemplate.data as VooData | undefined),
        });
        break;
      case 'hospedagem':
        setHospedagemData({
          ...defaultHospedagemData,
          ...(loadedTemplate.data as HospedagemData | undefined),
        });
        break;
    }
    
    setIsHydrated(true);
  }, [loadedTemplate]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 3) {
      toast.error('Máximo de 3 imagens permitidas');
      return;
    }

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [images.length]);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleIcon = (iconKey: keyof IconSelection) => {
    setIcons(prev => ({ ...prev, [iconKey]: !prev[iconKey] }));
  };

  const handleExport = async () => {
    if (!exportRef.current) return;

    setIsExporting(true);
    try {
      await exportArtPng(exportRef.current, {
        filename: `${artType.id}-${format.id}-${Date.now()}.png`,
      });
      toast.success('Arte exportada com sucesso!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar arte');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveTemplate = async () => {
    const data = getData();
    const name = artType.id === 'pacote' 
      ? (data as PacoteData).destinos || 'Modelo sem nome'
      : artType.id === 'voo'
      ? `${(data as VooData).origem} → ${(data as VooData).destino}` || 'Modelo sem nome'
      : (data as HospedagemData).hotel || 'Modelo sem nome';
    
    try {
      const savedTemplate = await saveTemplate({
        name,
        formatId: format.id,
        artTypeId: artType.id,
        templateId,
        data,
        colors,
        icons, // salvar ícones sempre
        blurLevel,
        images,
        logo: colors.logo,
      }, editingTemplateId || undefined);
      
      // Update editing ID to the saved template's ID (for new templates)
      if (!editingTemplateId) {
        setEditingTemplateId(savedTemplate.id);
      }
      
      toast.success(editingTemplateId ? 'Modelo atualizado!' : 'Modelo salvo em "Meus Modelos"!');
      onSave?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar modelo');
    }
  };

  const getData = (): ArtData => {
    switch (artType.id) {
      case 'pacote': return pacoteData;
      case 'voo': return vooData;
      case 'hospedagem': return hospedagemData;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Panel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Personalize sua arte</CardTitle>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Recomeçar
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="content" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="images">Imagens</TabsTrigger>
              <TabsTrigger value="colors">Cores</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <ScrollArea className="h-[400px] pr-4">
                {artType.id === 'pacote' && (
                  <PacoteForm 
                    data={pacoteData} 
                    onChange={setPacoteData} 
                    icons={icons}
                    onToggleIcon={toggleIcon}
                  />
                )}
                {artType.id === 'voo' && (
                  <VooForm data={vooData} onChange={setVooData} />
                )}
                {artType.id === 'hospedagem' && (
                  <HospedagemForm data={hospedagemData} onChange={setHospedagemData} />
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="images" className="space-y-4">
              <div className="space-y-4">
                {/* Logo upload */}
                <div>
                  <Label>Logo da Empresa</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Adicione a logo da sua empresa
                  </p>
                  <div className="flex gap-2 items-center">
                    {colors.logo ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden group border">
                        <img src={colors.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                        <button
                          onClick={() => setColors({ ...colors, logo: '' })}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setColors({ ...colors, logo: event.target.result as string });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
                
                {/* Background images */}
                <div>
                  <Label>Imagens de Fundo (máx. 3)</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    O template se adapta ao número de fotos adicionadas
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {images.map((img, index) => (
                      <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    ))}
                    {images.length < 3 && (
                      <label className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="colors" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={colors.primary}
                      onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.primary}
                      onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={colors.secondary}
                      onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.secondary}
                      onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              {/* ========== CARD DO TÍTULO ========== */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Card do Título</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="headerTransparent"
                      checked={colors.headerTransparent}
                      onCheckedChange={(checked) => setColors({ ...colors, headerTransparent: !!checked })}
                    />
                    <Label htmlFor="headerTransparent" className="text-xs cursor-pointer">
                      Transparente
                    </Label>
                  </div>
                </div>
                
                {/* Cores do card */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Cor do Card</Label>
                    <div className="flex gap-1">
                      <Input
                        type="color"
                        value={colors.headerColor}
                        onChange={(e) => setColors({ ...colors, headerColor: e.target.value })}
                        className="w-10 h-8 p-1 cursor-pointer"
                        disabled={colors.headerTransparent}
                      />
                      <Input
                        value={colors.headerColor}
                        onChange={(e) => setColors({ ...colors, headerColor: e.target.value })}
                        className="flex-1 text-xs"
                        disabled={colors.headerTransparent}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cor do Título</Label>
                    <div className="flex gap-1">
                      <Input
                        type="color"
                        value={colors.headerTextColor}
                        onChange={(e) => setColors({ ...colors, headerTextColor: e.target.value })}
                        className="w-10 h-8 p-1 cursor-pointer"
                      />
                      <Input
                        value={colors.headerTextColor}
                        onChange={(e) => setColors({ ...colors, headerTextColor: e.target.value })}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cor da Data</Label>
                    <div className="flex gap-1">
                      <Input
                        type="color"
                        value={colors.dateTextColor}
                        onChange={(e) => setColors({ ...colors, dateTextColor: e.target.value })}
                        className="w-10 h-8 p-1 cursor-pointer"
                      />
                      <Input
                        value={colors.dateTextColor}
                        onChange={(e) => setColors({ ...colors, dateTextColor: e.target.value })}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Fonte do título */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Fonte do Título</Label>
                      <Select
                        value={colors.titleFontFamily}
                        onValueChange={(value) => setColors({ ...colors, titleFontFamily: value })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                          <SelectItem value="Lato">Lato</SelectItem>
                          <SelectItem value="Roboto Slab">Roboto Slab</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                          <SelectItem value="Source Sans 3">Source Sans 3</SelectItem>
                          <SelectItem value="Raleway">Raleway</SelectItem>
                          <SelectItem value="Oswald">Oswald</SelectItem>
                          <SelectItem value="Roboto Condensed">Roboto Condensed</SelectItem>
                          <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                          <SelectItem value="Libre Franklin">Libre Franklin</SelectItem>
                          <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                          <SelectItem value="Merriweather">Merriweather</SelectItem>
                          <SelectItem value="Titillium Web">Titillium Web</SelectItem>
                          <SelectItem value="Nunito Sans">Nunito Sans</SelectItem>
                          <SelectItem value="Noto Sans">Noto Sans</SelectItem>
                          <SelectItem value="PT Sans">PT Sans</SelectItem>
                          <SelectItem value="Dancing Script">Dancing Script</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Estilo da Fonte</Label>
                      <div className="flex gap-1">
                        <Button
                          variant={colors.titleFontWeight === 400 && colors.titleFontStyle === 'normal' ? 'default' : 'outline'}
                          size="sm"
                          className="h-8 flex-1 text-xs"
                          onClick={() => setColors({ ...colors, titleFontWeight: 400, titleFontStyle: 'normal' })}
                        >
                          Normal
                        </Button>
                        <Button
                          variant={colors.titleFontWeight === 700 && colors.titleFontStyle === 'normal' ? 'default' : 'outline'}
                          size="sm"
                          className="h-8 flex-1 text-xs font-bold"
                          onClick={() => setColors({ ...colors, titleFontWeight: 700, titleFontStyle: 'normal' })}
                        >
                          Negrito
                        </Button>
                        <Button
                          variant={colors.titleFontWeight === 900 && colors.titleFontStyle === 'normal' ? 'default' : 'outline'}
                          size="sm"
                          className="h-8 flex-1 text-xs font-black"
                          onClick={() => setColors({ ...colors, titleFontWeight: 900, titleFontStyle: 'normal' })}
                        >
                          Extra
                        </Button>
                        <Button
                          variant={colors.titleFontStyle === 'italic' ? 'default' : 'outline'}
                          size="sm"
                          className="h-8 flex-1 text-xs italic"
                          onClick={() => setColors({ 
                            ...colors, 
                            titleFontStyle: colors.titleFontStyle === 'italic' ? 'normal' : 'italic' 
                          })}
                        >
                          Itálico
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tamanho ({colors.titleFontSize}px)</Label>
                    <Slider
                      value={[colors.titleFontSize]}
                      onValueChange={(value) => setColors({ ...colors, titleFontSize: value[0] })}
                      min={16}
                      max={60}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
                
                {/* Espaçamento do topo */}
                <div className="space-y-1">
                  <Label className="text-xs">Espaçamento do Topo ({colors.headerTopSpacing}px)</Label>
                  <Slider
                    value={[colors.headerTopSpacing]}
                    onValueChange={(value) => setColors({ ...colors, headerTopSpacing: value[0] })}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                
                {/* Efeitos e tamanhos do card */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Opacidade ({colors.headerOpacity}%)</Label>
                    <Slider
                      value={[colors.headerOpacity]}
                      onValueChange={(value) => setColors({ ...colors, headerOpacity: value[0] })}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                      disabled={colors.headerTransparent}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Blur ({colors.headerBlur}px)</Label>
                    <Slider
                      value={[colors.headerBlur]}
                      onValueChange={(value) => setColors({ ...colors, headerBlur: value[0] })}
                      min={0}
                      max={30}
                      step={1}
                      className="w-full"
                      disabled={colors.headerTransparent}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Arredond. ({colors.headerRadius}px)</Label>
                    <Slider
                      value={[colors.headerRadius]}
                      onValueChange={(value) => setColors({ ...colors, headerRadius: value[0] })}
                      min={0}
                      max={40}
                      step={2}
                      className="w-full"
                      disabled={colors.headerTransparent}
                    />
                  </div>
                </div>
              </div>
              
              {/* ========== CARD DE NOITES ========== */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Card de Noites/Duração</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setColors({ 
                      ...colors, 
                      nightsCardColor: colors.headerColor, 
                      nightsCardOpacity: colors.headerOpacity,
                      nightsCardRadius: colors.headerRadius, 
                      nightsCardBlur: colors.headerBlur 
                    })}
                  >
                    Copiar do título
                  </Button>
                </div>
                
                <div className="flex gap-3 items-end">
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs">Cor do Card</Label>
                    <div className="flex gap-1">
                      <Input
                        type="color"
                        value={colors.nightsCardColor}
                        onChange={(e) => setColors({ ...colors, nightsCardColor: e.target.value })}
                        className="w-10 h-8 p-1 cursor-pointer"
                      />
                      <Input
                        value={colors.nightsCardColor}
                        onChange={(e) => setColors({ ...colors, nightsCardColor: e.target.value })}
                        className="flex-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Opacidade ({colors.nightsCardOpacity}%)</Label>
                    <Slider
                      value={[colors.nightsCardOpacity]}
                      onValueChange={(value) => setColors({ ...colors, nightsCardOpacity: value[0] })}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Blur ({colors.nightsCardBlur}px)</Label>
                    <Slider
                      value={[colors.nightsCardBlur]}
                      onValueChange={(value) => setColors({ ...colors, nightsCardBlur: value[0] })}
                      min={0}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Arredond. ({colors.nightsCardRadius}px)</Label>
                    <Slider
                      value={[colors.nightsCardRadius]}
                      onValueChange={(value) => setColors({ ...colors, nightsCardRadius: value[0] })}
                      min={0}
                      max={40}
                      step={2}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              {/* Font Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor da Fonte Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={colors.fontPrimary}
                      onChange={(e) => setColors({ ...colors, fontPrimary: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.fontPrimary}
                      onChange={(e) => setColors({ ...colors, fontPrimary: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor da Fonte Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={colors.fontSecondary}
                      onChange={(e) => setColors({ ...colors, fontSecondary: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.fontSecondary}
                      onChange={(e) => setColors({ ...colors, fontSecondary: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              {/* Preset colors */}
              <div className="space-y-2">
                <Label>Paletas rápidas</Label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { primary: '#3b82f6', secondary: '#06b6d4', header: '#546c92', fontSec: '#06b6d4' },
                    { primary: '#8b5cf6', secondary: '#ec4899', header: '#8b5cf6', fontSec: '#ec4899' },
                    { primary: '#f97316', secondary: '#eab308', header: '#f97316', fontSec: '#fbbf24' },
                    { primary: '#0d9488', secondary: '#fef3c7', header: '#0d9488', fontSec: '#fef3c7' },
                    { primary: '#ef4444', secondary: '#f97316', header: '#ef4444', fontSec: '#fb923c' },
                    { primary: '#6366f1', secondary: '#8b5cf6', header: '#6366f1', fontSec: '#a78bfa' },
                    { primary: '#0ea5e9', secondary: '#22d3ee', header: '#0ea5e9', fontSec: '#67e8f9' },
                    { primary: '#15803d', secondary: '#fef9c3', header: '#15803d', fontSec: '#fef9c3' },
                    { primary: '#1e40af', secondary: '#000000', header: '#1e40af', fontSec: '#60a5fa' },
                    { primary: '#000000', secondary: '#1e40af', header: '#000000', fontSec: '#3b82f6' },
                  ].map((palette, index) => (
                    <button
                      key={index}
                      onClick={() => setColors({ 
                        ...colors, 
                        primary: palette.primary, 
                        secondary: palette.secondary, 
                        headerColor: palette.header,
                        fontSecondary: palette.fontSec
                      })}
                      className="h-8 rounded-md overflow-hidden flex"
                    >
                      <div className="flex-1" style={{ backgroundColor: palette.primary }} />
                      <div className="flex-1" style={{ backgroundColor: palette.secondary }} />
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Blur level control */}
              <div className="space-y-2">
                <Label>Nível de Blur ({blurLevel}px)</Label>
                <Slider
                  value={[blurLevel]}
                  onValueChange={(value) => setBlurLevel(value[0])}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Ajuste a intensidade do efeito de desfoque
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Preview</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? 'Salvando...' : editingTemplateId ? 'Atualizar Modelo' : 'Salvar Modelo'}
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Exportar PNG'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <StudioPreview
              ref={previewRef}
              format={format}
              artType={artType}
              templateId={templateId}
              data={getData()}
              images={images}
              colors={colors}
              icons={artType.id === 'pacote' ? icons : undefined}
              blurLevel={blurLevel}
              isExportMode={false}
            />
          </div>

          {/* Offscreen full-size render for export */}
          <div style={{ position: 'fixed', left: -100000, top: 0, pointerEvents: 'none' }}>
            <StudioPreview
              ref={exportRef}
              format={format}
              artType={artType}
              templateId={templateId}
              data={getData()}
              images={images}
              colors={colors}
              icons={artType.id === 'pacote' ? icons : undefined}
              blurLevel={blurLevel}
              isExportMode={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Form Components
interface PacoteFormProps {
  data: PacoteData;
  onChange: (data: PacoteData) => void;
  icons: IconSelection;
  onToggleIcon: (key: keyof IconSelection) => void;
}

function PacoteForm({ data, onChange, icons, onToggleIcon }: PacoteFormProps) {
  const [newItem, setNewItem] = useState('');

  const incluiItems = data.incluiItems || [];

  const addIncluiItem = () => {
    if (newItem.trim()) {
      onChange({ ...data, incluiItems: [...incluiItems, newItem.trim()] });
      setNewItem('');
    }
  };

  const removeIncluiItem = (index: number) => {
    onChange({ ...data, incluiItems: incluiItems.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Destino(s)</Label>
        <Input
          value={data.destinos}
          onChange={(e) => onChange({ ...data, destinos: e.target.value })}
          placeholder="Ex: Maldivas, Dubai"
          maxLength={50}
        />
      </div>
      <div className="space-y-2">
        <Label>Período/Datas</Label>
        <Input
          value={data.periodo}
          onChange={(e) => onChange({ ...data, periodo: e.target.value })}
          placeholder="Ex: 15 a 22 de Janeiro"
          maxLength={30}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Noites</Label>
          <Input
            value={data.noites}
            onChange={(e) => onChange({ ...data, noites: e.target.value })}
            placeholder="Ex: 7"
            maxLength={5}
          />
        </div>
        <div className="space-y-2">
          <Label>Dias</Label>
          <Input
            value={data.dias}
            onChange={(e) => onChange({ ...data, dias: e.target.value })}
            placeholder="Ex: 8"
            maxLength={5}
          />
        </div>
      </div>
      {/* Price with currency */}
      <div className="space-y-2">
        <Label>A partir de (preço)</Label>
        <div className="flex gap-2">
          <Select
            value={data.currency}
            onValueChange={(value: CurrencyType) => onChange({ ...data, currency: value })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">R$</SelectItem>
              <SelectItem value="EUR">€</SelectItem>
              <SelectItem value="USD">$</SelectItem>
            </SelectContent>
          </Select>
          <CurrencyInput
            value={data.preco}
            onChange={(value) => onChange({ ...data, preco: value })}
            currency={data.currency}
            placeholder="4.990"
            className="flex-1"
          />
        </div>
      </div>
      
      {/* Discount option */}
      <div className="space-y-3 p-3 border rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            id="hasDiscount"
            checked={data.hasDiscount}
            onCheckedChange={(checked) => onChange({ ...data, hasDiscount: !!checked })}
          />
          <Label htmlFor="hasDiscount" className="cursor-pointer">Mostrar desconto</Label>
        </div>
        {data.hasDiscount && (
          <div className="space-y-2">
            <Label>Preço original (de)</Label>
            <CurrencyInput
              value={data.precoOriginal}
              onChange={(value) => onChange({ ...data, precoOriginal: value })}
              currency={data.currency}
              placeholder="5.990"
            />
            <p className="text-xs text-muted-foreground">O valor "a partir de" será usado como preço com desconto</p>
          </div>
        )}
      </div>
      
      {/* Installment option */}
      <div className="space-y-3 p-3 border rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            id="hasInstallment"
            checked={data.hasInstallment}
            onCheckedChange={(checked) => onChange({ ...data, hasInstallment: !!checked })}
          />
          <Label htmlFor="hasInstallment" className="cursor-pointer">Mostrar parcelamento</Label>
        </div>
        {data.hasInstallment && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasEntrada"
                checked={data.hasEntrada}
                onCheckedChange={(checked) => onChange({ ...data, hasEntrada: !!checked })}
              />
              <Label htmlFor="hasEntrada" className="cursor-pointer text-sm">Com entrada</Label>
            </div>
            {data.hasEntrada && (
              <div className="space-y-2">
                <Label>Valor da entrada</Label>
                <CurrencyInput
                  value={data.entrada}
                  onChange={(value) => onChange({ ...data, entrada: value })}
                  currency={data.currency}
                  placeholder="1.000"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número de parcelas</Label>
                <Input
                  value={data.parcelas}
                  onChange={(e) => onChange({ ...data, parcelas: e.target.value })}
                  placeholder="Ex: 10"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor da parcela</Label>
                <CurrencyInput
                  value={data.valorParcela}
                  onChange={(value) => onChange({ ...data, valorParcela: value })}
                  currency={data.currency}
                  placeholder="499"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Icon Selection */}
      <div className="space-y-2">
        <Label>Ícones do pacote</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Selecione o que está incluído no pacote
        </p>
        <div className="flex flex-wrap gap-3">
          {iconOptions.map(({ key, label, icon: Icon }) => (
            <label 
              key={key} 
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                icons[key] 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              )}
            >
              <Checkbox
                checked={icons[key]}
                onCheckedChange={() => onToggleIcon(key)}
              />
              <Icon className="w-4 h-4" />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Inclui Items as Badges */}
      <div className="space-y-2">
        <Label>Inclui (itens)</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Adicione itens que serão exibidos como badges
        </p>
        <div className="flex gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Ex: Seguro viagem"
            maxLength={25}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addIncluiItem();
              }
            }}
          />
          <Button type="button" size="sm" onClick={addIncluiItem}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {incluiItems.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {incluiItems.map((item, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="cursor-pointer hover:bg-destructive/10 hover:border-destructive"
                onClick={() => removeIncluiItem(index)}
              >
                {item} <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label>Observação curta</Label>
        <Input
          value={data.observacao}
          onChange={(e) => onChange({ ...data, observacao: e.target.value })}
          placeholder="Ex: Vagas limitadas!"
          maxLength={40}
        />
      </div>
      <div className="space-y-2">
        <Label>CTA (WhatsApp)</Label>
        <Input
          value={data.cta}
          onChange={(e) => onChange({ ...data, cta: e.target.value })}
          placeholder="Ex: (85) 99999-9999"
          maxLength={20}
        />
      </div>
      <div className="space-y-2">
        <Label>Texto do rodapé</Label>
        <Input
          value={data.disclaimer || ''}
          onChange={(e) => onChange({ ...data, disclaimer: e.target.value })}
          placeholder="Valores sujeitos a reajuste e disponibilidade."
          maxLength={60}
        />
      </div>
    </div>
  );
}

function VooForm({ data, onChange }: { data: VooData; onChange: (data: VooData) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Origem</Label>
        <Input
          value={data.origem}
          onChange={(e) => onChange({ ...data, origem: e.target.value })}
          placeholder="Ex: São Paulo (GRU)"
          maxLength={30}
        />
      </div>
      <div className="space-y-2">
        <Label>Destino</Label>
        <Input
          value={data.destino}
          onChange={(e) => onChange({ ...data, destino: e.target.value })}
          placeholder="Ex: Lisboa (LIS)"
          maxLength={30}
        />
      </div>
      <div className="space-y-2">
        <Label>Datas</Label>
        <Input
          value={data.datas}
          onChange={(e) => onChange({ ...data, datas: e.target.value })}
          placeholder="Ex: 15 Jan - 22 Jan"
          maxLength={30}
        />
      </div>
      <div className="space-y-2">
        <Label>Companhia</Label>
        <Input
          value={data.companhia}
          onChange={(e) => onChange({ ...data, companhia: e.target.value })}
          placeholder="Ex: TAP Portugal"
          maxLength={30}
        />
      </div>
      <div className="space-y-2">
        <Label>Número do Voo (opcional)</Label>
        <Input
          value={data.numeroVoo}
          onChange={(e) => onChange({ ...data, numeroVoo: e.target.value })}
          placeholder="Ex: TP 1234"
          maxLength={15}
        />
      </div>
      <div className="space-y-2">
        <Label>Bagagem (opcional)</Label>
        <Input
          value={data.bagagem}
          onChange={(e) => onChange({ ...data, bagagem: e.target.value })}
          placeholder="Ex: 23kg despachada + 10kg mão"
          maxLength={40}
        />
      </div>
      
      {/* Price with currency */}
      <div className="space-y-2">
        <Label>A partir de (preço)</Label>
        <div className="flex gap-2">
          <Select
            value={data.currency}
            onValueChange={(value: CurrencyType) => onChange({ ...data, currency: value })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">R$</SelectItem>
              <SelectItem value="EUR">€</SelectItem>
              <SelectItem value="USD">$</SelectItem>
            </SelectContent>
          </Select>
          <CurrencyInput
            value={data.preco}
            onChange={(value) => onChange({ ...data, preco: value })}
            currency={data.currency}
            placeholder="1.500"
            className="flex-1"
          />
        </div>
      </div>
      
      {/* Discount option */}
      <div className="space-y-3 p-3 border rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            id="vooHasDiscount"
            checked={data.hasDiscount}
            onCheckedChange={(checked) => onChange({ ...data, hasDiscount: !!checked })}
          />
          <Label htmlFor="vooHasDiscount" className="cursor-pointer">Mostrar desconto</Label>
        </div>
        {data.hasDiscount && (
          <div className="space-y-2">
            <Label>Preço original (de)</Label>
            <CurrencyInput
              value={data.precoOriginal}
              onChange={(value) => onChange({ ...data, precoOriginal: value })}
              currency={data.currency}
              placeholder="2.500"
            />
            <p className="text-xs text-muted-foreground">O valor "a partir de" será usado como preço com desconto</p>
          </div>
        )}
      </div>
      
      {/* Installment option */}
      <div className="space-y-3 p-3 border rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            id="vooHasInstallment"
            checked={data.hasInstallment}
            onCheckedChange={(checked) => onChange({ ...data, hasInstallment: !!checked })}
          />
          <Label htmlFor="vooHasInstallment" className="cursor-pointer">Mostrar parcelamento</Label>
        </div>
        {data.hasInstallment && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="vooHasEntrada"
                checked={data.hasEntrada}
                onCheckedChange={(checked) => onChange({ ...data, hasEntrada: !!checked })}
              />
              <Label htmlFor="vooHasEntrada" className="cursor-pointer text-sm">Com entrada</Label>
            </div>
            {data.hasEntrada && (
              <div className="space-y-2">
                <Label>Valor da entrada</Label>
                <CurrencyInput
                  value={data.entrada}
                  onChange={(value) => onChange({ ...data, entrada: value })}
                  currency={data.currency}
                  placeholder="500"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número de parcelas</Label>
                <Input
                  value={data.parcelas}
                  onChange={(e) => onChange({ ...data, parcelas: e.target.value })}
                  placeholder="Ex: 10"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor da parcela</Label>
                <CurrencyInput
                  value={data.valorParcela}
                  onChange={(value) => onChange({ ...data, valorParcela: value })}
                  currency={data.currency}
                  placeholder="150"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label>CTA (WhatsApp)</Label>
        <Input
          value={data.cta}
          onChange={(e) => onChange({ ...data, cta: e.target.value })}
          placeholder="Ex: (85) 99999-9999"
          maxLength={20}
        />
      </div>
      <div className="space-y-2">
        <Label>Texto do rodapé</Label>
        <Input
          value={data.disclaimer || ''}
          onChange={(e) => onChange({ ...data, disclaimer: e.target.value })}
          placeholder="Valores sujeitos a reajuste e disponibilidade."
          maxLength={60}
        />
      </div>
    </div>
  );
}

function HospedagemForm({ data, onChange }: { data: HospedagemData; onChange: (data: HospedagemData) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Hotel</Label>
        <Input
          value={data.hotel}
          onChange={(e) => onChange({ ...data, hotel: e.target.value })}
          placeholder="Ex: Grand Hyatt"
          maxLength={40}
        />
      </div>
      <div className="space-y-2">
        <Label>Cidade</Label>
        <Input
          value={data.cidade}
          onChange={(e) => onChange({ ...data, cidade: e.target.value })}
          placeholder="Ex: Paris, França"
          maxLength={30}
        />
      </div>
      <div className="space-y-2">
        <Label>Check-in</Label>
        <Input
          value={data.checkIn}
          onChange={(e) => onChange({ ...data, checkIn: e.target.value })}
          placeholder="Ex: 15/01"
          maxLength={15}
        />
      </div>
      <div className="space-y-2">
        <Label>Check-out</Label>
        <Input
          value={data.checkOut}
          onChange={(e) => onChange({ ...data, checkOut: e.target.value })}
          placeholder="Ex: 22/01"
          maxLength={15}
        />
      </div>
      <div className="space-y-2">
        <Label>Diárias</Label>
        <Input
          value={data.diarias}
          onChange={(e) => onChange({ ...data, diarias: e.target.value })}
          placeholder="Ex: 7"
          maxLength={5}
        />
      </div>
      
      {/* Price with currency */}
      <div className="space-y-2">
        <Label>A partir de (preço)</Label>
        <div className="flex gap-2">
          <Select
            value={data.currency}
            onValueChange={(value: CurrencyType) => onChange({ ...data, currency: value })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">R$</SelectItem>
              <SelectItem value="EUR">€</SelectItem>
              <SelectItem value="USD">$</SelectItem>
            </SelectContent>
          </Select>
          <CurrencyInput
            value={data.preco}
            onChange={(value) => onChange({ ...data, preco: value })}
            currency={data.currency}
            placeholder="2.500"
            className="flex-1"
          />
        </div>
      </div>
      
      {/* Discount option */}
      <div className="space-y-3 p-3 border rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            id="hospHasDiscount"
            checked={data.hasDiscount}
            onCheckedChange={(checked) => onChange({ ...data, hasDiscount: !!checked })}
          />
          <Label htmlFor="hospHasDiscount" className="cursor-pointer">Mostrar desconto</Label>
        </div>
        {data.hasDiscount && (
          <div className="space-y-2">
            <Label>Preço original (de)</Label>
            <CurrencyInput
              value={data.precoOriginal}
              onChange={(value) => onChange({ ...data, precoOriginal: value })}
              currency={data.currency}
              placeholder="3.500"
            />
            <p className="text-xs text-muted-foreground">O valor "a partir de" será usado como preço com desconto</p>
          </div>
        )}
      </div>
      
      {/* Installment option */}
      <div className="space-y-3 p-3 border rounded-lg">
        <div className="flex items-center gap-2">
          <Checkbox
            id="hospHasInstallment"
            checked={data.hasInstallment}
            onCheckedChange={(checked) => onChange({ ...data, hasInstallment: !!checked })}
          />
          <Label htmlFor="hospHasInstallment" className="cursor-pointer">Mostrar parcelamento</Label>
        </div>
        {data.hasInstallment && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hospHasEntrada"
                checked={data.hasEntrada}
                onCheckedChange={(checked) => onChange({ ...data, hasEntrada: !!checked })}
              />
              <Label htmlFor="hospHasEntrada" className="cursor-pointer text-sm">Com entrada</Label>
            </div>
            {data.hasEntrada && (
              <div className="space-y-2">
                <Label>Valor da entrada</Label>
                <CurrencyInput
                  value={data.entrada}
                  onChange={(value) => onChange({ ...data, entrada: value })}
                  currency={data.currency}
                  placeholder="800"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número de parcelas</Label>
                <Input
                  value={data.parcelas}
                  onChange={(e) => onChange({ ...data, parcelas: e.target.value })}
                  placeholder="Ex: 10"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor da parcela</Label>
                <CurrencyInput
                  value={data.valorParcela}
                  onChange={(value) => onChange({ ...data, valorParcela: value })}
                  currency={data.currency}
                  placeholder="250"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label>Regime</Label>
        <Input
          value={data.regime}
          onChange={(e) => onChange({ ...data, regime: e.target.value })}
          placeholder="Ex: Café da manhã"
          maxLength={25}
        />
      </div>
      <div className="space-y-2">
        <Label>CTA (WhatsApp)</Label>
        <Input
          value={data.cta}
          onChange={(e) => onChange({ ...data, cta: e.target.value })}
          placeholder="Ex: (85) 99999-9999"
          maxLength={20}
        />
      </div>
      <div className="space-y-2">
        <Label>Texto do rodapé</Label>
        <Input
          value={data.disclaimer || ''}
          onChange={(e) => onChange({ ...data, disclaimer: e.target.value })}
          placeholder="Valores sujeitos a reajuste e disponibilidade."
          maxLength={60}
        />
      </div>
    </div>
  );
}
