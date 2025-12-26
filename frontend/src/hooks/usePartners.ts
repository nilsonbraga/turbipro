import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface Partner {
  id: string;
  agency_id: string;
  name: string;
  type: string | null;
  email: string | null;
  phone: string | null;
  commission_rate: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartnerInput {
  name: string;
  type?: string;
  email?: string;
  phone?: string;
  notes?: string;
  commission_rate?: number | null;
}

const mapBackendToFront = (p: any): Partner => ({
  id: p.id,
  agency_id: p.agencyId,
  name: p.name,
  type: p.type,
  email: p.email,
  phone: p.phone,
  commission_rate: p.commissionRate,
  notes: p.notes,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
});

const mapFrontToBackend = (input: PartnerInput, agencyId?: string) => {
  const payload: Record<string, unknown> = {
    name: input.name,
    type: input.type ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    commissionRate: input.commission_rate ?? null,
    notes: input.notes ?? null,
  };
  if (agencyId) {
    payload.agencyId = agencyId;
  }
  return payload;
};

export function usePartners() {
  const { agency, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['partners', agency?.id, isSuperAdmin],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (!isSuperAdmin && agency?.id) {
        where.agencyId = agency.id;
      }

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/partner?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!agency?.id || isSuperAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (input: PartnerInput) => {
      const targetAgencyId = agency?.id;
      if (!targetAgencyId) throw new Error('Agência não encontrada');

      const created = await apiFetch<any>(`/api/partner`, {
        method: 'POST',
        body: JSON.stringify(mapFrontToBackend(input, targetAgencyId)),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      toast({ title: 'Parceiro criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar parceiro', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: PartnerInput & { id: string }) => {
      const updated = await apiFetch<any>(`/api/partner/${id}`, {
        method: 'PUT',
        body: JSON.stringify(mapFrontToBackend(input, agency?.id)),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      toast({ title: 'Parceiro atualizado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar parceiro', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/partner/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      toast({ title: 'Parceiro excluído com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir parceiro', description: error.message, variant: 'destructive' });
    },
  });

  return {
    partners: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createPartner: createMutation.mutate,
    updatePartner: updateMutation.mutate,
    deletePartner: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
