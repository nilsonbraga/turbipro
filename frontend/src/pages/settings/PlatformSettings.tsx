import { useState, useEffect } from 'react';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Globe, 
  Save, 
  Loader2,
  Plane,
  Building2,
  Calendar,
  Handshake,
  Tags,
  KanbanSquare,
  LayoutDashboard,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { PlatformIconUpload } from '@/components/settings/PlatformIconUpload';

const availableIcons = [
  { value: 'plane', label: 'Avião', icon: Plane },
  { value: 'building2', label: 'Prédio', icon: Building2 },
  { value: 'calendar', label: 'Calendário', icon: Calendar },
  { value: 'handshake', label: 'Parceria', icon: Handshake },
  { value: 'tags', label: 'Tags', icon: Tags },
  { value: 'kanbansquare', label: 'Kanban', icon: KanbanSquare },
  { value: 'layoutdashboard', label: 'Dashboard', icon: LayoutDashboard },
  { value: 'mail', label: 'Email', icon: Mail },
  { value: 'messagesquare', label: 'Chat', icon: MessageSquare },
  { value: 'globe', label: 'Globo', icon: Globe },
];

export default function PlatformSettings() {
  const { settings: platformSettings, updateSetting, isUpdating } = usePlatformSettings();
  
  const [platformName, setPlatformName] = useState(platformSettings.platform_name || 'Tourbine');
  const [platformIcon, setPlatformIcon] = useState(platformSettings.platform_icon || 'plane');

  useEffect(() => {
    setPlatformName(platformSettings.platform_name || 'Tourbine');
    setPlatformIcon(platformSettings.platform_icon || 'plane');
  }, [platformSettings]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Globe className="w-6 h-6" />
          Plataforma
        </h1>
        <p className="text-muted-foreground">Configurações globais da plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identidade Visual da Plataforma</CardTitle>
          <CardDescription>
            Personalize o nome e ícone da plataforma para todas as agências
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="platformName">Nome da Plataforma</Label>
              <Input
                id="platformName"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                placeholder="Tourbine"
              />
              <p className="text-sm text-muted-foreground">
                Este nome será exibido na barra lateral de todas as agências
              </p>
            </div>
            <div className="space-y-2">
              <Label>Ícone Pré-definido</Label>
              <Select value={platformIcon} onValueChange={setPlatformIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ícone" />
                </SelectTrigger>
                <SelectContent>
                  {availableIcons.map((iconOption) => (
                    <SelectItem key={iconOption.value} value={iconOption.value}>
                      <div className="flex items-center gap-2">
                        <iconOption.icon className="w-4 h-4" />
                        <span>{iconOption.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Usado se não houver imagem personalizada
              </p>
            </div>
          </div>

          <Separator />

          <PlatformIconUpload />

          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            {platformSettings.platform_icon_url ? (
              <img 
                src={platformSettings.platform_icon_url} 
                alt="Platform icon" 
                className="w-10 h-10 object-contain"
              />
            ) : (
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
                {(() => {
                  const IconComponent = availableIcons.find(i => i.value === platformIcon)?.icon || Plane;
                  return <IconComponent className="w-6 h-6 text-primary-foreground" />;
                })()}
              </div>
            )}
            <div>
              <h3 className="font-bold">{platformName || 'Tourbine'}</h3>
              <p className="text-sm text-muted-foreground">Prévia da barra lateral</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                setPlatformName(platformSettings.platform_name || 'Tourbine');
                setPlatformIcon(platformSettings.platform_icon || 'plane');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                updateSetting({ key: 'platform_name', value: platformName });
                updateSetting({ key: 'platform_icon', value: platformIcon });
              }}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
