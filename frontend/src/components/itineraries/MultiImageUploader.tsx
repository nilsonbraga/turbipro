import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, X, Loader2, Image as ImageIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface MultiImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  bucket?: string;
  folder?: string;
  aspectRatio?: 'video' | 'square' | 'wide';
  maxImages?: number;
  maxFileSizeMB?: number;
}

export function MultiImageUploader({
  value = [],
  onChange,
  label = 'Imagens',
  bucket = 'itinerary-images',
  folder = 'days',
  aspectRatio = 'video',
  maxImages = 10,
  maxFileSizeMB = 5,
}: MultiImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]',
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - value.length;
    if (remainingSlots <= 0) {
      toast({ title: `Máximo de ${maxImages} imagens permitido`, variant: 'destructive' });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    try {
      setIsUploading(true);
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        // Validate file type
        const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        const fileExtLower = file.name.toLowerCase().split('.').pop();
        
        if (fileExtLower === 'heic' || fileExtLower === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
          toast({ 
            title: 'Formato não suportado', 
            description: `${file.name}: HEIC/HEIF não é suportado. Use JPG ou PNG.`,
            variant: 'destructive' 
          });
          continue;
        }

        if (!file.type.startsWith('image/') || !supportedFormats.includes(file.type)) {
          toast({ 
            title: 'Formato não suportado', 
            description: `${file.name}: Use JPG, PNG, GIF ou WebP.`,
            variant: 'destructive' 
          });
          continue;
        }

        const maxBytes = maxFileSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
          toast({ title: `${file.name}: Máximo ${maxFileSizeMB}MB`, variant: 'destructive' });
          continue;
        }

        const base64 = await fileToBase64(file);
        uploadedUrls.push(base64);
      }

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);
        toast({ title: `${uploadedUrls.length} imagem(ns) enviada(s)!` });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Erro ao enviar imagens', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      if (value.length >= maxImages) {
        toast({ title: `Máximo de ${maxImages} imagens permitido`, variant: 'destructive' });
        return;
      }
      onChange([...value, urlInput.trim()]);
      setUrlInput('');
    }
  };

  const handleRemove = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  const renderImages = () => {
    if (value.length === 0) return null;

    // Grid layouts based on number of images
    if (value.length === 1) {
      return (
        <div className="relative group">
          <div className={`relative ${aspectClasses[aspectRatio]} overflow-hidden rounded-xl border-2 border-border bg-muted`}>
            <img
              src={value[0]}
              alt="Imagem 1"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=60';
              }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleRemove(0)}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Remover
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (value.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-border bg-muted">
                <img
                  src={url}
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=60';
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (value.length === 3) {
      return (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-border bg-muted">
                <img
                  src={url}
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=60';
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (value.length === 4) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-video overflow-hidden rounded-xl border-2 border-border bg-muted">
                <img
                  src={url}
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=60';
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 5+ images: use carousel/slider
    return (
      <Carousel className="w-full">
        <CarouselContent>
          {value.map((url, index) => (
            <CarouselItem key={index} className="basis-1/2 md:basis-1/3">
              <div className="relative group p-1">
                <div className="relative aspect-square overflow-hidden rounded-xl border-2 border-border bg-muted">
                  <img
                    src={url}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=60';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={() => handleRemove(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="absolute top-3 left-3 bg-background/80 rounded-full px-2 py-0.5 text-xs font-medium">
                  {index + 1}/{value.length}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4" />
        <CarouselNext className="-right-4" />
      </Carousel>
    );
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          {value.length > 0 && (
            <span className="text-xs text-muted-foreground">{value.length} de {maxImages} imagens</span>
          )}
        </div>
      )}
      
      {renderImages()}

      {value.length < maxImages && (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <Link className="w-4 h-4" />
              URL
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Enviando...</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Clique para adicionar fotos</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG até 5MB cada (múltiplas)</p>
                  </div>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </TabsContent>
          
          <TabsContent value="url" className="mt-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Cole a URL da imagem..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <Button 
                type="button"
                onClick={handleUrlSubmit} 
                disabled={!urlInput.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
