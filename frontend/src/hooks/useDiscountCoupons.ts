import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface DiscountCoupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  current_uses: number;
  applicable_plans: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscountCouponInput {
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from?: string | null;
  valid_until?: string | null;
  max_uses?: number | null;
  applicable_plans?: string[] | null;
  is_active?: boolean;
}

const mapBackendToFront = (c: any): DiscountCoupon => ({
  id: c.id,
  code: c.code,
  description: c.description,
  discount_type: c.discountType as 'percentage' | 'fixed',
  discount_value: Number(c.discountValue || 0),
  valid_from: c.validFrom,
  valid_until: c.validUntil,
  max_uses: c.maxUses,
  current_uses: c.currentUses ?? 0,
  applicable_plans: c.applicablePlans || null,
  is_active: c.isActive,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
});

const mapFrontToBackend = (input: DiscountCouponInput) => ({
  code: input.code.toUpperCase(),
  description: input.description ?? null,
  discountType: input.discount_type,
  discountValue: input.discount_value,
  validFrom: input.valid_from ?? null,
  validUntil: input.valid_until ?? null,
  maxUses: input.max_uses ?? null,
  applicablePlans: input.applicable_plans ?? [],
  isActive: input.is_active ?? true,
});

export function useDiscountCoupons() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['discount-coupons'],
    queryFn: async () => {
      const params = new URLSearchParams({
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });
      const { data } = await apiFetch<{ data: any[] }>(`/api/discountCoupon?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: DiscountCouponInput) => {
      const payload = mapFrontToBackend(input);
      const created = await apiFetch<any>(`/api/discountCoupon`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-coupons'] });
      toast({ title: 'Cupom criado com sucesso!' });
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate') || error.message?.includes('Unique constraint')) {
        toast({ title: 'Código de cupom já existe', variant: 'destructive' });
      } else {
        toast({ title: 'Erro ao criar cupom', description: error.message, variant: 'destructive' });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: DiscountCouponInput & { id: string }) => {
      const payload = {
        ...mapFrontToBackend(input),
        updatedAt: new Date().toISOString(),
      };
      const updated = await apiFetch<any>(`/api/discountCoupon/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-coupons'] });
      toast({ title: 'Cupom atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar cupom', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/discountCoupon/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-coupons'] });
      toast({ title: 'Cupom excluído!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir cupom', description: error.message, variant: 'destructive' });
    },
  });

  const validateCoupon = async (code: string, planId?: string): Promise<DiscountCoupon | null> => {
    const params = new URLSearchParams({
      where: JSON.stringify({ code: code.toUpperCase(), isActive: true }),
      take: '1',
    });
    const { data } = await apiFetch<{ data: any[] }>(`/api/discountCoupon?${params.toString()}`);
    const coupon = data?.[0];
    if (!coupon) return null;

    const mapped = mapBackendToFront(coupon);
    const now = new Date();
    const validFrom = mapped.valid_from ? new Date(mapped.valid_from) : null;
    const validUntil = mapped.valid_until ? new Date(mapped.valid_until) : null;

    if (validFrom && now < validFrom) return null;
    if (validUntil && now > validUntil) return null;
    if (mapped.max_uses && mapped.current_uses >= mapped.max_uses) return null;
    if (planId && mapped.applicable_plans && !mapped.applicable_plans.includes(planId)) return null;

    return mapped;
  };

  return {
    coupons: query.data ?? [],
    isLoading: query.isLoading,
    createCoupon: createMutation.mutate,
    updateCoupon: updateMutation.mutate,
    deleteCoupon: deleteMutation.mutate,
    validateCoupon,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
