import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Save,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Upload,
  Image,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function AgencySettings() {
  const { agency, refreshProfile } = useAuth();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [agencyName, setAgencyName] = useState(agency?.name || '');
  const [agencyEmail, setAgencyEmail] = useState(agency?.email || '');
  const [agencyPhone, setAgencyPhone] = useState(agency?.phone || '');
  const [agencyAddress, setAgencyAddress] = useState(agency?.address || '');
  const [agencyLogo, setAgencyLogo] = useState(agency?.logo_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    if (agency) {
      setAgencyName(agency.name || '');
      setAgencyEmail(agency.email || '');
      setAgencyPhone(agency.phone || '');
      setAgencyAddress(agency.address || '');
      setAgencyLogo(agency.logo_url || '');
    }
  }, [agency]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !agency?.id) return;
    
    setIsUploadingLogo(true);
    try {
      // Lê o arquivo como data URL e salva diretamente no backend (logoUrl)
      const toBase64 = () =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const dataUrl = await toBase64();

      await apiFetch(`/api/agency/${agency.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          logoUrl: dataUrl,
          updatedAt: new Date().toISOString(),
        }),
      });

      setAgencyLogo(dataUrl);
      toast({ title: 'Logo atualizada com sucesso!' });
      await refreshProfile();
    } catch (error: any) {
      toast({ title: 'Erro ao enviar logo', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!agency?.id) return;
    
    try {
      await apiFetch(`/api/agency/${agency.id}`, {
        method: 'PUT',
        body: JSON.stringify({ logoUrl: null, updatedAt: new Date().toISOString() }),
      });
      setAgencyLogo('');
      toast({ title: 'Logo removida!' });
      await refreshProfile();
    } catch (error: any) {
      toast({ title: 'Erro ao remover logo', description: error.message, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!agency?.id) return;
    
    setIsSaving(true);
    try {
      await apiFetch(`/api/agency/${agency.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: agencyName,
          email: agencyEmail,
          phone: agencyPhone,
          address: agencyAddress,
          logoUrl: agencyLogo || null,
          updatedAt: new Date().toISOString(),
        }),
      });
      toast({ title: 'Agência atualizada com sucesso!' });
      await refreshProfile();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Agência
        </h1>
        <p className="text-muted-foreground">Atualize os dados da sua agência de viagens</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Agência</CardTitle>
          <CardDescription>
            Dados cadastrais e identidade visual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="agencyName">Nome da Agência</Label>
              <Input
                id="agencyName"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Nome da sua agência"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={agency?.cnpj || ''}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={agencyEmail}
                onChange={(e) => setAgencyEmail(e.target.value)}
                placeholder="contato@agencia.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="w-4 h-4 inline mr-2" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={agencyPhone}
                onChange={(e) => setAgencyPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              <MapPin className="w-4 h-4 inline mr-2" />
              Endereço
            </Label>
            <Input
              id="address"
              value={agencyAddress}
              onChange={(e) => setAgencyAddress(e.target.value)}
              placeholder="Endereço completo"
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Logo da Agência
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                A logo será exibida no PDF das propostas
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {agencyLogo ? (
                <div className="relative">
                  <img 
                    src={agencyLogo} 
                    alt="Logo da agência" 
                    className="h-16 w-auto object-contain rounded border bg-background p-2"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={handleRemoveLogo}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="h-16 w-32 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                  <Image className="w-6 h-6" />
                </div>
              )}
              
              <div>
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  className="hidden"
                  accept="image/*"
                />
                <Button 
                  variant="outline" 
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {agencyLogo ? 'Alterar Logo' : 'Enviar Logo'}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
