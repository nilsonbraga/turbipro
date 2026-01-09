import { useState, useRef } from 'react';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, Image } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export function PlatformIconUpload() {
  const { settings, updateSetting } = usePlatformSettings();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentImageUrl = settings.platform_icon_url;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Por favor, selecione uma imagem', variant: 'destructive' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'O tamanho máximo é 2MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const toBase64 = () =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const dataUrl = await toBase64();
      // Opcional: salvar via endpoint (se quiser armazenar em banco)
      await updateSetting({ key: 'platform_icon_url', value: dataUrl });

      toast({ title: 'Ícone atualizado!' });
    } catch (error: any) {
      toast({ title: 'Erro ao enviar imagem', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    updateSetting({ key: 'platform_icon_url', value: '' });
    toast({ title: 'Ícone removido!' });
  };

  return (
    <div className="space-y-2">
      <Label>Ícone Personalizado (Imagem)</Label>
      <div className="flex items-center gap-4">
        {currentImageUrl ? (
          <div className="relative">
            <img
              src={currentImageUrl}
              alt="Platform icon"
              className="w-16 h-16 object-contain rounded-2xl border border-slate-200 bg-slate-50"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 w-6 h-6"
              onClick={handleRemove}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50">
            <Image className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="h-9"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {currentImageUrl ? 'Trocar Imagem' : 'Enviar Imagem'}
          </Button>
          <p className="text-sm text-muted-foreground mt-1">
            PNG, JPG, SVG ou WebP. Máximo 2MB.
          </p>
        </div>
      </div>
    </div>
  );
}
