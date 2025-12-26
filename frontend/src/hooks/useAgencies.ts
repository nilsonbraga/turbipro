import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface Agency {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgencyInput {
  name: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo_url?: string;
  is_active?: boolean;
}

export interface CreateAgencyWithUserInput extends AgencyInput {
  adminUser?: {
    name: string;
    email: string;
    password: string;
  };
}

const mapBackendToFront = (agency: any): Agency => ({
  id: agency.id,
  name: agency.name,
  cnpj: agency.cnpj,
  phone: agency.phone,
  email: agency.email,
  address: agency.address,
  logo_url: agency.logoUrl,
  is_active: agency.isActive,
  created_at: agency.createdAt,
  updated_at: agency.updatedAt,
});

export function useAgencies() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const params = new URLSearchParams({
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });
      const { data } = await apiFetch<{ data: any[] }>(`/api/agency?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: isSuperAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateAgencyWithUserInput) => {
      const { adminUser, ...agencyData } = input;

      const created = await apiFetch<any>(`/api/agency`, {
        method: 'POST',
        body: JSON.stringify({
          name: agencyData.name,
          cnpj: agencyData.cnpj ?? null,
          phone: agencyData.phone ?? null,
          email: agencyData.email ?? null,
          address: agencyData.address ?? null,
          logoUrl: agencyData.logo_url ?? null,
          isActive: agencyData.is_active ?? true,
        }),
      });

      // Admin user creation flow is backend-specific; skipped here.
      if (adminUser && adminUser.email) {
        console.warn('Admin user creation not implemented in backend API flow. Create manually if needed.');
      }

      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      toast({ title: 'Agência criada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar agência', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: AgencyInput & { id: string }) => {
      const updated = await apiFetch<any>(`/api/agency/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: input.name,
          cnpj: input.cnpj,
          phone: input.phone,
          email: input.email,
          address: input.address,
          logoUrl: input.logo_url,
          isActive: input.is_active,
          updatedAt: new Date().toISOString(),
        }),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      toast({ title: 'Agência atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar agência', description: error.message, variant: 'destructive' });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/agency/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: false, updatedAt: new Date().toISOString() }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      toast({ title: 'Agência desativada com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao desativar agência', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/agency/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      toast({ title: 'Agência excluída permanentemente!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir agência', description: error.message, variant: 'destructive' });
    },
  });

  return {
    agencies: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createAgency: createMutation.mutate,
    updateAgency: updateMutation.mutate,
    deactivateAgency: deactivateMutation.mutate,
    deleteAgency: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
