import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  max_proposals: number | null;
  max_clients: number | null;
  max_users: number | null;
  trial_days: number | null;
  is_active: boolean;
  modules: string[];
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlanInput {
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
  max_proposals?: number | null;
  max_clients?: number | null;
  max_users?: number | null;
  trial_days?: number | null;
  is_active?: boolean;
  modules?: string[];
}

type BackendSubscriptionPlan = {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: number | null;
  priceYearly: number | null;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  maxProposals: number | null;
  maxClients: number | null;
  maxUsers: number | null;
  trialDays: number | null;
  isActive: boolean;
  modules: string[];
  createdAt: string;
  updatedAt: string;
};

const mapBackendToFront = (plan: BackendSubscriptionPlan): SubscriptionPlan => ({
  id: plan.id,
  name: plan.name,
  description: plan.description,
  price_monthly: plan.priceMonthly || 0,
  price_yearly: plan.priceYearly || 0,
  stripe_price_id_monthly: plan.stripePriceIdMonthly,
  stripe_price_id_yearly: plan.stripePriceIdYearly,
  max_proposals: plan.maxProposals,
  max_clients: plan.maxClients,
  max_users: plan.maxUsers,
  trial_days: plan.trialDays,
  is_active: plan.isActive,
  modules: plan.modules || [],
  created_at: plan.createdAt,
  updated_at: plan.updatedAt,
});

const mapFrontToBackend = (input: SubscriptionPlanInput) => ({
  name: input.name,
  description: input.description ?? null,
  priceMonthly: input.price_monthly,
  priceYearly: input.price_yearly,
  stripePriceIdMonthly: input.stripe_price_id_monthly ?? null,
  stripePriceIdYearly: input.stripe_price_id_yearly ?? null,
  maxProposals: input.max_proposals ?? null,
  maxClients: input.max_clients ?? null,
  maxUsers: input.max_users ?? null,
  trialDays: input.trial_days ?? 7,
  isActive: input.is_active ?? true,
  modules: input.modules ?? [],
});

export function useSubscriptionPlans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const search = new URLSearchParams({
        orderBy: JSON.stringify({ priceMonthly: 'asc' }),
      });
      const { data } = await apiFetch<{ data: BackendSubscriptionPlan[] }>(`/api/subscriptionPlan?${search.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: SubscriptionPlanInput) => {
      const payload = mapFrontToBackend(input);
      const created = await apiFetch<BackendSubscriptionPlan>(`/api/subscriptionPlan`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({ title: 'Plano criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar plano', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: SubscriptionPlanInput & { id: string }) => {
      const payload = {
        ...mapFrontToBackend(input),
        updatedAt: new Date().toISOString(),
      };
      const updated = await apiFetch<BackendSubscriptionPlan>(`/api/subscriptionPlan/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({ title: 'Plano atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar plano', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/subscriptionPlan/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({ title: 'Plano excluído!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir plano', description: error.message, variant: 'destructive' });
    },
  });

  return {
    plans: query.data ?? [],
    isLoading: query.isLoading,
    createPlan: createMutation.mutate,
    updatePlan: updateMutation.mutate,
    deletePlan: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
