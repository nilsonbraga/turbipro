import { useState, useEffect } from 'react';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Clock } from 'lucide-react';

export function TrialConfigCard() {
  const { settings, updateSetting, isUpdating } = usePlatformSettings();
  
  const [trialEnabled, setTrialEnabled] = useState(settings.trial_enabled === 'true');
  const [trialDays, setTrialDays] = useState(settings.trial_days || '7');
  const [trialMaxUsers, setTrialMaxUsers] = useState(settings.trial_max_users || '2');
  const [trialMaxClients, setTrialMaxClients] = useState(settings.trial_max_clients || '10');
  const [trialMaxProposals, setTrialMaxProposals] = useState(settings.trial_max_proposals || '10');

  useEffect(() => {
    setTrialEnabled(settings.trial_enabled === 'true');
    setTrialDays(settings.trial_days || '7');
    setTrialMaxUsers(settings.trial_max_users || '2');
    setTrialMaxClients(settings.trial_max_clients || '10');
    setTrialMaxProposals(settings.trial_max_proposals || '10');
  }, [settings]);

  const handleSave = () => {
    updateSetting({ key: 'trial_enabled', value: trialEnabled ? 'true' : 'false' });
    updateSetting({ key: 'trial_days', value: trialDays });
    updateSetting({ key: 'trial_max_users', value: trialMaxUsers });
    updateSetting({ key: 'trial_max_clients', value: trialMaxClients });
    updateSetting({ key: 'trial_max_proposals', value: trialMaxProposals });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Período de Teste Grátis
        </CardTitle>
        <CardDescription>
          Configure o período de teste gratuito para novas agências
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="font-medium">Habilitar Teste Grátis</p>
            <p className="text-sm text-muted-foreground">
              Permitir que novas agências testem a plataforma gratuitamente
            </p>
          </div>
          <Switch 
            checked={trialEnabled} 
            onCheckedChange={setTrialEnabled} 
          />
        </div>

        {trialEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trialDays">Dias de Teste</Label>
              <Input
                id="trialDays"
                type="number"
                min="1"
                max="90"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                placeholder="7"
              />
              <p className="text-xs text-muted-foreground">
                Quantos dias dura o período de teste
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trialMaxUsers">Máximo de Usuários</Label>
              <Input
                id="trialMaxUsers"
                type="number"
                min="1"
                value={trialMaxUsers}
                onChange={(e) => setTrialMaxUsers(e.target.value)}
                placeholder="2"
              />
              <p className="text-xs text-muted-foreground">
                Limite de usuários durante o trial
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trialMaxClients">Máximo de Clientes</Label>
              <Input
                id="trialMaxClients"
                type="number"
                min="1"
                value={trialMaxClients}
                onChange={(e) => setTrialMaxClients(e.target.value)}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                Limite de clientes durante o trial
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trialMaxProposals">Máximo de Propostas</Label>
              <Input
                id="trialMaxProposals"
                type="number"
                min="1"
                value={trialMaxProposals}
                onChange={(e) => setTrialMaxProposals(e.target.value)}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                Limite de propostas durante o trial
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
