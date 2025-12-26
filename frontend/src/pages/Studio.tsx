import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Instagram, 
  MessageCircle, 
  Package, 
  Plane, 
  Hotel,
  ArrowLeft,
  Palette,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudioTemplateSelector, TemplateColors } from '@/components/studio/StudioTemplateSelector';
import { StudioEditor } from '@/components/studio/StudioEditor';
import { SavedTemplates } from '@/components/studio/SavedTemplates';
import { useStudioTemplates, SavedTemplate } from '@/hooks/useStudioTemplates';
import { toast } from 'sonner';

export type FormatType = 'instagram-post' | 'instagram-stories' | 'whatsapp-post';
export type ArtType = 'pacote' | 'voo' | 'hospedagem';

interface FormatOption {
  id: FormatType;
  name: string;
  icon: typeof Instagram;
  dimensions: string;
  width: number;
  height: number;
}

interface ArtTypeOption {
  id: ArtType;
  name: string;
  icon: typeof Package;
  description: string;
}

const formatOptions: FormatOption[] = [
  { id: 'instagram-post', name: 'Instagram Post', icon: Instagram, dimensions: '1080x1440', width: 1080, height: 1440 },
  { id: 'instagram-stories', name: 'Stories', icon: Instagram, dimensions: '1080x1920', width: 1080, height: 1920 },
  { id: 'whatsapp-post', name: 'Quadrado', icon: MessageCircle, dimensions: '1080x1080', width: 1080, height: 1080 },
];

const artTypeOptions: ArtTypeOption[] = [
  { id: 'pacote', name: 'Pacote', icon: Package, description: 'Pacotes de viagem completos' },
  { id: 'voo', name: 'Voo', icon: Plane, description: 'Passagens aéreas' },
  { id: 'hospedagem', name: 'Hospedagem', icon: Hotel, description: 'Hotéis e hospedagens' },
];

export default function Studio() {
  const { isSuperAdmin, agency } = useAuth();
  const {
    savedTemplates,
    getTemplate,
    deleteTemplate,
    toggleFavorite,
    saveTemplate,
    isSaving,
    isLoading,
  } = useStudioTemplates();
  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');
  const [step, setStep] = useState<'format' | 'type' | 'template' | 'editor'>('format');
  const [selectedFormat, setSelectedFormat] = useState<FormatOption | null>(null);
  const [selectedArtType, setSelectedArtType] = useState<ArtTypeOption | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedTemplateColors, setSelectedTemplateColors] = useState<TemplateColors | null>(null);
  const [loadedTemplate, setLoadedTemplate] = useState<SavedTemplate | null>(null);

  const handleFormatSelect = (format: FormatOption) => {
    setSelectedFormat(format);
    setStep('type');
  };

  const handleArtTypeSelect = (artType: ArtTypeOption) => {
    setSelectedArtType(artType);
    setStep('template');
  };

  const handleTemplateSelect = (templateId: number, colors: TemplateColors) => {
    setSelectedTemplate(templateId);
    setSelectedTemplateColors(colors);
    setStep('editor');
  };

  const handleBack = () => {
    if (step === 'type') {
      setStep('format');
      setSelectedFormat(null);
    } else if (step === 'template') {
      setStep('type');
      setSelectedArtType(null);
    } else if (step === 'editor') {
      setStep('template');
      setSelectedTemplate(null);
      setSelectedTemplateColors(null);
      setLoadedTemplate(null);
    }
  };

  const handleReset = () => {
    setStep('format');
    setSelectedFormat(null);
    setSelectedArtType(null);
    setSelectedTemplate(null);
    setSelectedTemplateColors(null);
    setLoadedTemplate(null);
  };

  const handleLoadTemplate = async (template: SavedTemplate) => {
    // Busca o template mais atualizado da API (garante cores/imagens/dados)
    const fresh = await getTemplate(template.id).catch(() => template);
    const format = formatOptions.find(f => f.id === fresh.formatId) || formatOptions[0];
    const artType = artTypeOptions.find(a => a.id === fresh.artTypeId) || artTypeOptions[0];

    setSelectedFormat(format);
    setSelectedArtType(artType);
    setSelectedTemplate(fresh.templateId);
    setLoadedTemplate(fresh);
    setStep('editor');
    setActiveTab('create');
    toast.success('Modelo carregado!');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {step !== 'format' && activeTab === 'create' && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Palette className="h-8 w-8 text-primary" />
              Studio
            </h1>
            <p className="text-muted-foreground">
              Crie artes profissionais para suas redes sociais
            </p>
          </div>
        </div>
        {step !== 'format' && activeTab === 'create' && (
          <div className="flex items-center gap-2">
            {selectedFormat && (
              <Badge variant="secondary" className="text-sm">
                {selectedFormat.name}
              </Badge>
            )}
            {selectedArtType && (
              <Badge variant="secondary" className="text-sm">
                {selectedArtType.name}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'create' | 'saved')}>
        <TabsList>
          <TabsTrigger value="create">
            <Palette className="h-4 w-4 mr-2" />
            Criar Arte
          </TabsTrigger>
          <TabsTrigger value="saved">
            <FolderOpen className="h-4 w-4 mr-2" />
            Meus Modelos {savedTemplates.length > 0 && `(${savedTemplates.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          {/* Step: Format Selection */}
          {step === 'format' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Escolha o formato</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {formatOptions.map((format) => (
                  <Card 
                    key={format.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg hover:border-primary/50",
                      "group"
                    )}
                    onClick={() => handleFormatSelect(format)}
                  >
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <format.icon className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{format.name}</h3>
                        <p className="text-sm text-muted-foreground">{format.dimensions}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step: Art Type Selection */}
          {step === 'type' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Escolha o tipo de arte</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {artTypeOptions.map((artType) => (
                  <Card 
                    key={artType.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg hover:border-primary/50",
                      "group"
                    )}
                    onClick={() => handleArtTypeSelect(artType)}
                  >
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <artType.icon className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{artType.name}</h3>
                        <p className="text-sm text-muted-foreground">{artType.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step: Template Selection */}
          {step === 'template' && selectedFormat && selectedArtType && (
            <StudioTemplateSelector
              format={selectedFormat}
              artType={selectedArtType}
              onSelect={handleTemplateSelect}
            />
          )}

          {/* Step: Editor */}
          {step === 'editor' && selectedFormat && selectedArtType && selectedTemplate !== null && (
            <StudioEditor
              format={selectedFormat}
              artType={selectedArtType}
              templateId={selectedTemplate}
              templateColors={selectedTemplateColors}
              onReset={handleReset}
              loadedTemplate={loadedTemplate}
              saveTemplate={saveTemplate}
              isSaving={isSaving}
            />
          )}
        </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <SavedTemplates
              onLoad={handleLoadTemplate}
              savedTemplates={savedTemplates}
              deleteTemplate={deleteTemplate}
              toggleFavorite={toggleFavorite}
              isLoading={isLoading}
            />
          </TabsContent>
      </Tabs>
    </div>
  );
}
