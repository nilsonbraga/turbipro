import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  bucket?: string;
  folder?: string;
  aspectRatio?: 'video' | 'square' | 'wide';
}

export function ImageUploader({
  value,
  onChange,
  label = 'Imagem',
  bucket = 'itinerary-images',
  folder = 'covers',
  aspectRatio = 'video',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');
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
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - only allow browser-supported formats
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const fileExtLower = file.name.toLowerCase().split('.').pop();
    
    // Check for HEIC/HEIF which browsers don't support
    if (fileExtLower === 'heic' || fileExtLower === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
      toast({ 
        title: 'Formato não suportado', 
        description: 'Arquivos HEIC/HEIF não são suportados em navegadores. Por favor, converta para JPG ou PNG.',
        variant: 'destructive' 
      });
      return;
    }

    if (!file.type.startsWith('image/') || !supportedFormats.includes(file.type)) {
      toast({ 
        title: 'Formato não suportado', 
        description: 'Use imagens nos formatos: JPG, PNG, GIF ou WebP.',
        variant: 'destructive' 
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'A imagem deve ter no máximo 5MB', variant: 'destructive' });
      return;
    }

    try {
      setIsUploading(true);
      const base64 = await fileToBase64(file);
      onChange(base64);
      setUrlInput(base64);
      toast({ title: 'Imagem enviada com sucesso!' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Erro ao enviar imagem', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      {value ? (
        <div className="relative group">
          <div className={`relative ${aspectClasses[aspectRatio]} overflow-hidden rounded-xl border-2 border-border bg-muted`}>
            <img
              src={value}
              alt="Preview"
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
                onClick={handleClear}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Remover
              </Button>
            </div>
          </div>
        </div>
      ) : (
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
              className={`${aspectClasses[aspectRatio]} border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Enviando...</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Clique para fazer upload</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG até 5MB</p>
                  </div>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </TabsContent>
          
          <TabsContent value="url" className="mt-4 space-y-3">
            <div className={`${aspectClasses[aspectRatio]} border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-4 p-6`}>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Link className="w-8 h-8 text-primary" />
              </div>
              <div className="w-full max-w-md space-y-3">
                <Input
                  placeholder="Cole a URL da imagem..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="text-center"
                />
                <Button 
                  type="button"
                  onClick={handleUrlSubmit} 
                  className="w-full"
                  disabled={!urlInput.trim()}
                >
                  Usar esta imagem
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
