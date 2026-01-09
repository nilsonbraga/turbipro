import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Trash2, 
  FolderOpen, 
  Package, 
  Plane, 
  Hotel, 
  Instagram, 
  MessageCircle,
  Star,
  Search,
  Play
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { SavedTemplate } from '@/hooks/useStudioTemplates';
import type { FormatType, ArtType } from '@/pages/Studio';
import { cn } from '@/lib/utils';

interface SavedTemplatesProps {
  onLoad: (template: SavedTemplate) => void;
  savedTemplates: SavedTemplate[];
  deleteTemplate: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  isLoading: boolean;
}

const formatIcons: Record<FormatType, typeof Instagram> = {
  'instagram-post': Instagram,
  'instagram-stories': Instagram,
  'whatsapp-post': MessageCircle,
};

const artTypeIcons: Record<ArtType, typeof Package> = {
  'pacote': Package,
  'voo': Plane,
  'hospedagem': Hotel,
};

const formatLabels: Record<FormatType, string> = {
  'instagram-post': 'Instagram Post',
  'instagram-stories': 'Stories',
  'whatsapp-post': 'Quadrado',
};

const artTypeLabels: Record<ArtType, string> = {
  'pacote': 'Pacote',
  'voo': 'Voo',
  'hospedagem': 'Hospedagem',
};

const formatFilters = [
  { label: 'Todos', value: 'all' },
  { label: 'Instagram Post', value: 'instagram-post' },
  { label: 'Stories', value: 'instagram-stories' },
  { label: 'Quadrado', value: 'whatsapp-post' },
];

const artTypeFilters = [
  { label: 'Todos', value: 'all' },
  { label: 'Pacote', value: 'pacote' },
  { label: 'Voo', value: 'voo' },
  { label: 'Hospedagem', value: 'hospedagem' },
];

export function SavedTemplates({ onLoad, savedTemplates, deleteTemplate, toggleFavorite, isLoading }: SavedTemplatesProps) {
  const [search, setSearch] = useState('');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [filterArtType, setFilterArtType] = useState<string>('all');

  // Filter and separate templates
  const { favorites, others } = useMemo(() => {
    let filtered = savedTemplates;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(t => t.name.toLowerCase().includes(searchLower));
    }
    
    // Format filter
    if (filterFormat !== 'all') {
      filtered = filtered.filter(t => t.formatId === filterFormat);
    }
    
    // Art type filter
    if (filterArtType !== 'all') {
      filtered = filtered.filter(t => t.artTypeId === filterArtType);
    }
    
    return {
      favorites: filtered.filter(t => t.isFavorite),
      others: filtered.filter(t => !t.isFavorite),
    };
  }, [savedTemplates, search, filterFormat, filterArtType]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12 text-muted-foreground">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p>Carregando modelos...</p>
        </div>
      </div>
    );
  }

  if (savedTemplates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Nenhum modelo salvo ainda</h3>
        <p className="text-sm">Crie uma arte e clique em "Salvar Modelo" para guardar aqui.</p>
      </div>
    );
  }

  const TemplateCard = ({ template }: { template: SavedTemplate }) => {
    const FormatIcon = formatIcons[template.formatId as FormatType] || Instagram;
    const ArtTypeIcon = artTypeIcons[template.artTypeId as ArtType] || Package;
    const formatLabel = formatLabels[template.formatId as FormatType] || template.formatId || 'Formato';
    const artTypeLabel = artTypeLabels[template.artTypeId as ArtType] || template.artTypeId || 'Arte';

    return (
      <Card className="group rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg transition-colors hover:bg-white">
        <CardContent className="p-0">
          {/* Thumbnail */}
          <div className="relative aspect-video bg-muted overflow-hidden rounded-t-2xl">
            {template.images && template.images.length > 0 ? (
              <img 
                src={template.images[0]} 
                alt={template.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ArtTypeIcon className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
            
            {/* Favorite button overlay */}
            <button
              onClick={() => toggleFavorite(template.id)}
              className={cn(
                "absolute top-2 right-2 p-1.5 rounded-full transition-all",
                template.isFavorite 
                  ? "bg-yellow-500 text-white" 
                  : "bg-black/50 text-white hover:bg-black/70"
              )}
            >
              <Star className={cn("h-4 w-4", template.isFavorite && "fill-current")} />
            </button>
            
            {/* Color preview overlay */}
            <div className="absolute bottom-2 left-2 flex gap-1">
              <div 
                className="w-5 h-5 rounded-full border-2 border-white shadow" 
                style={{ backgroundColor: template.colors.primary }}
              />
              <div 
                className="w-5 h-5 rounded-full border-2 border-white shadow" 
                style={{ backgroundColor: template.colors.secondary }}
              />
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Badges */}
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                <FormatIcon className="h-3 w-3 mr-1" />
                {formatLabel}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <ArtTypeIcon className="h-3 w-3 mr-1" />
                {artTypeLabel}
              </Badge>
            </div>

            {/* Name */}
            <h4 className="font-semibold truncate" title={template.name}>
              {template.name}
            </h4>

            {/* Date */}
            <p className="text-xs text-muted-foreground">
              {format(new Date(template.createdAt), "d 'de' MMM, HH:mm", { locale: ptBR })}
            </p>

            {/* Actions - Always visible */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => onLoad(template)}
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Usar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="px-2.5">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir "{template.name}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteTemplate(template.id)}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar modelos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-white border-slate-200"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {formatFilters.map((option) => {
              const isActive = filterFormat === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilterFormat(option.value)}
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
            {artTypeFilters.map((option) => {
              const isActive = filterArtType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilterArtType(option.value)}
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
      </div>

      {/* Favorites section */}
      {favorites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Favoritos ({favorites.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favorites.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      )}

      {/* Others section */}
      {others.length > 0 && (
        <div className="space-y-3">
          {favorites.length > 0 && (
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Outros modelos ({others.length})
            </h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {others.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {favorites.length === 0 && others.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum modelo encontrado com os filtros selecionados.</p>
        </div>
      )}
    </div>
  );
}
