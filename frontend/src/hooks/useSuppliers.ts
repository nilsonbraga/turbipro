import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

export interface Supplier {
  id: string;
  agency_id: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierInput {
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export function useSuppliers() {
  const { toast } = useToast();
  const { user, profile, isSuperAdmin } = useAuth();
  const agencyId = profile?.agency_id;
  const queryClient = useQueryClient();

  const mapBackendToFront = (s: any): Supplier => ({
    id: s.id,
    agency_id: s.agencyId,
    name: s.name,
    document: s.cnpj,
    email: s.email,
    phone: s.phone,
    address: s.address,
    notes: s.notes,
    is_active: s.isActive,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  });

  const mapFrontToBackend = (input: SupplierInput, targetAgencyId?: string) => {
    const payload: Record<string, unknown> = {
      name: input.name,
      cnpj: input.document ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
      isActive: input.is_active ?? true,
    };
    if (targetAgencyId) {
      payload.agencyId = targetAgencyId;
    }
    return payload;
  };

  const { data: suppliers = [], isLoading, error } = useQuery({
    queryKey: ["suppliers", user?.id],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (!isSuperAdmin && agencyId) {
        where.agencyId = agencyId;
      }

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        orderBy: JSON.stringify({ name: "asc" }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/supplier?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (input: SupplierInput & { agency_id?: string }) => {
      const targetAgencyId = input.agency_id || agencyId;
      if (!targetAgencyId) throw new Error("Agência não encontrada");

      const created = await apiFetch<any>(`/api/supplier`, {
        method: "POST",
        body: JSON.stringify(mapFrontToBackend(input, targetAgencyId)),
      });

      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Fornecedor criado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar fornecedor", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: SupplierInput & { id: string }) => {
      const updated = await apiFetch<any>(`/api/supplier/${id}`, {
        method: "PUT",
        body: JSON.stringify(mapFrontToBackend(input)),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Fornecedor atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar fornecedor", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/supplier/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Fornecedor excluído com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir fornecedor", description: error.message, variant: "destructive" });
    },
  });

  return {
    suppliers,
    isLoading,
    error,
    createSupplier: createMutation.mutate,
    updateSupplier: updateMutation.mutate,
    deleteSupplier: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
