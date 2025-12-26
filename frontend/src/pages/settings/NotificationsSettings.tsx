import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Loader2 } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

export default function NotificationsSettings() {
  const { preferences, isLoading, savePreferences, isSaving } = useNotificationPreferences();

  const handleToggle = (key: 'new_lead' | 'proposal_closed' | 'follow_up_reminder' | 'weekly_report') => {
    if (!preferences) return;
    savePreferences({ [key]: !preferences[key] } as any);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Notificações
        </h1>
        <p className="text-muted-foreground">Configure como você deseja receber notificações</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preferências de Notificação</CardTitle>
          <CardDescription>
            Escolha quais notificações você deseja receber (requer configuração SMTP em Integrações)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading || !preferences ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando preferências...
            </div>
          ) : (
            <>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Novos Leads</p>
              <p className="text-sm text-muted-foreground">
                Receber notificação quando um novo lead for criado
              </p>
            </div>
            <Switch checked={preferences.new_lead} onCheckedChange={() => handleToggle('new_lead')} disabled={isSaving} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Propostas Fechadas</p>
              <p className="text-sm text-muted-foreground">
                Receber notificação quando uma proposta for fechada
              </p>
            </div>
            <Switch checked={preferences.proposal_closed} onCheckedChange={() => handleToggle('proposal_closed')} disabled={isSaving} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Lembretes de Follow-up</p>
              <p className="text-sm text-muted-foreground">
                Receber lembretes de acompanhamento de leads
              </p>
            </div>
            <Switch checked={preferences.follow_up_reminder} onCheckedChange={() => handleToggle('follow_up_reminder')} disabled={isSaving} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Relatórios Semanais</p>
              <p className="text-sm text-muted-foreground">
                Receber resumo semanal por email
              </p>
            </div>
            <Switch checked={preferences.weekly_report} onCheckedChange={() => handleToggle('weekly_report')} disabled={isSaving} />
          </div>
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
