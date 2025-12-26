import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { AgencySubscription, useAgencySubscription } from '@/hooks/useAgencySubscription';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface AgencySubscriptionTabProps {
  agencyId: string;
  subscription?: AgencySubscription | null;
}

export function AgencySubscriptionTab({ agencyId, subscription }: AgencySubscriptionTabProps) {
  const { plans, isLoading: isLoadingPlans } = useSubscriptionPlans();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createSubscription, updateSubscription } = useAgencySubscription(agencyId);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(subscription?.plan_id || '');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    (subscription?.billing_cycle as 'monthly' | 'yearly') || 'monthly'
  );
  const [status, setStatus] = useState<string>(subscription?.status || 'active');
  const [periodEnd, setPeriodEnd] = useState(
    subscription?.current_period_end 
      ? new Date(subscription.current_period_end).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const handleSave = async () => {
    if (!periodEnd) {
      toast({
        title: 'Data de expiração obrigatória',
        description: 'Preencha a data de expiração da assinatura.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const planIdPayload = selectedPlan === 'none' ? null : selectedPlan || null;
      if (subscription) {
        await updateSubscription.mutateAsync({
          id: subscription.id,
          plan_id: planIdPayload ?? null,
          billing_cycle: billingCycle,
          status,
          current_period_end: new Date(periodEnd).toISOString(),
          current_period_start: subscription.current_period_start || new Date().toISOString(),
          grace_period_days: subscription.grace_period_days ?? 7,
        });
      } else {
        await createSubscription.mutateAsync({
          agency_id: agencyId,
          plan_id: planIdPayload || '',
          billing_cycle: billingCycle,
        });
      }

      toast({ title: 'Assinatura atualizada com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['all-agency-subscriptions'] });
    } catch (error: any) {
      toast({ 
        title: 'Erro ao atualizar assinatura', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Ativa</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pendente</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pt-4">
      {subscription && (
        <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Status Atual
            </h4>
            {getStatusBadge(subscription.status)}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Início:</span>
              <p className="font-medium">{formatDate(subscription.current_period_start)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Fim:</span>
              <p className="font-medium">{formatDate(subscription.current_period_end)}</p>
            </div>
            {subscription.stripe_subscription_id && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Stripe ID:</span>
                <p className="font-mono text-xs">{subscription.stripe_subscription_id}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          <span>Alterações manuais não afetam o Stripe</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Plano</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem plano</SelectItem>
                {plans?.filter(p => p.is_active).map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - R$ {billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ciclo de Cobrança</Label>
            <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="trialing">Trial</SelectItem>
                <SelectItem value="past_due">Pendente</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data de Expiração</Label>
            <Input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {subscription ? 'Atualizar Assinatura' : 'Criar Assinatura'}
        </Button>
      </div>
    </div>
  );
}
