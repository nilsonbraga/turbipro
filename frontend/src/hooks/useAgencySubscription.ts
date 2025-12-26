import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface AgencySubscription {
  id: string;
  agency_id: string;
  plan_id: string | null;
  billing_cycle: 'monthly' | 'yearly';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  grace_period_days: number;
  created_at: string;
  updated_at: string;
}

const mapBackendToFront = (s: any): AgencySubscription => ({
  id: s.id,
  agency_id: s.agencyId,
  plan_id: s.planId,
  billing_cycle: s.billingCycle,
  status: s.status,
  stripe_customer_id: s.stripeCustomerId,
  stripe_subscription_id: s.stripeSubscriptionId,
  current_period_start: s.currentPeriodStart,
  current_period_end: s.currentPeriodEnd,
  grace_period_days: s.gracePeriodDays ?? 0,
  created_at: s.createdAt,
  updated_at: s.updatedAt,
});

export function useAgencySubscription(agencyId?: string) {
  const { agency } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const targetAgencyId = agencyId || agency?.id;

  const query = useQuery({
    queryKey: ['agency-subscription', targetAgencyId],
    queryFn: async () => {
      if (!targetAgencyId) return null;
      
      const params = new URLSearchParams({
        where: JSON.stringify({ agencyId: targetAgencyId }),
        take: '1',
      });
      const { data } = await apiFetch<{ data: any[] }>(`/api/agencySubscription?${params.toString()}`);
      const sub = data?.[0];
      return sub ? mapBackendToFront(sub) : null;
    },
    enabled: !!targetAgencyId,
  });

  const hasActiveSubscription = () => {
    const sub = query.data;
    if (!sub) return false;
    
    if (sub.status === 'active' || sub.status === 'trialing') return true;
    
    if (sub.status === 'past_due' && sub.current_period_end) {
      const endDate = new Date(sub.current_period_end);
      const graceEndDate = new Date(endDate.getTime() + (sub.grace_period_days * 24 * 60 * 60 * 1000));
      return graceEndDate > new Date();
    }
    
    return false;
  };

  const getDaysUntilExpiration = () => {
    const sub = query.data;
    if (!sub || !sub.current_period_end) return null;
    
    const endDate = new Date(sub.current_period_end);
    let finalDate = endDate;
    
    if (sub.status === 'past_due') {
      finalDate = new Date(endDate.getTime() + (sub.grace_period_days * 24 * 60 * 60 * 1000));
    }
    
    const now = new Date();
    const diffTime = finalDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const createSubscriptionMutation = useMutation({
    mutationFn: async (input: { agency_id: string; plan_id: string; billing_cycle: 'monthly' | 'yearly' }) => {
      const { agency_id, plan_id, billing_cycle } = input;
      const created = await apiFetch<any>(`/api/agencySubscription`, {
        method: 'POST',
        body: JSON.stringify({
          agencyId: agency_id,
          planId: plan_id || null,
          billingCycle: billing_cycle,
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + (billing_cycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString(),
          gracePeriodDays: 7,
        }),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-subscription'] });
      toast({ title: 'Assinatura criada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar assinatura', description: error.message, variant: 'destructive' });
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (input: Partial<AgencySubscription> & { id: string }) => {
      const { id, ...updateData } = input;
      const payload: any = {};
      if (updateData.plan_id !== undefined) payload.planId = updateData.plan_id;
      if (updateData.billing_cycle !== undefined) payload.billingCycle = updateData.billing_cycle;
      if (updateData.status !== undefined) payload.status = updateData.status;
      if (updateData.current_period_end !== undefined) payload.currentPeriodEnd = updateData.current_period_end;
      if (updateData.current_period_start !== undefined) payload.currentPeriodStart = updateData.current_period_start;
      if (updateData.grace_period_days !== undefined) payload.gracePeriodDays = updateData.grace_period_days;

      const updated = await apiFetch<any>(`/api/agencySubscription/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...payload, updatedAt: new Date().toISOString() }),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-subscription'] });
      toast({ title: 'Assinatura atualizada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar assinatura', description: error.message, variant: 'destructive' });
    },
  });

  return {
    subscription: query.data,
    isLoading: query.isLoading,
    hasActiveSubscription: hasActiveSubscription(),
    daysUntilExpiration: getDaysUntilExpiration(),
    createSubscription: createSubscriptionMutation,
    updateSubscription: updateSubscriptionMutation,
    isCreating: createSubscriptionMutation.isPending,
    isUpdating: updateSubscriptionMutation.isPending,
  };
}
