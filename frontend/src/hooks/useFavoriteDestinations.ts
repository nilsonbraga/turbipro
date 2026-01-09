import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

export interface FavoriteDestinationClient {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface FavoriteDestination {
  id: string;
  agency_id: string;
  name: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  clients?: FavoriteDestinationClient[];
}

export interface FavoriteDestinationInput {
  name: string;
  notes?: string | null;
  client_ids?: string[];
}

type FavoriteDestinationOptions = {
  includeClients?: boolean;
  enabled?: boolean;
};

const mapBackendToFront = (destination: any): FavoriteDestination => ({
  id: destination.id,
  agency_id: destination.agencyId,
  name: destination.name,
  notes: destination.notes,
  created_at: destination.createdAt,
  updated_at: destination.updatedAt,
  clients: Array.isArray(destination.clients)
    ? destination.clients.map((client: any) => ({
        id: client.id,
        name: client.name,
        email: client.email ?? null,
        phone: client.phone ?? null,
      }))
    : undefined,
});

const mapFrontToBackend = (
  input: FavoriteDestinationInput,
  options: { agencyId?: string; mode: "create" | "update" },
) => {
  const payload: Record<string, unknown> = {
    name: input.name,
    notes: input.notes ?? null,
  };

  if (options.agencyId) {
    payload.agencyId = options.agencyId;
  }

  if (input.client_ids) {
    const relation = input.client_ids.map((id) => ({ id }));
    payload.clients = options.mode === "create" ? { connect: relation } : { set: relation };
  }

  return payload;
};

export function useFavoriteDestinations(options: FavoriteDestinationOptions = {}) {
  const { agency, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["favorite-destinations", agency?.id, isSuperAdmin, options.includeClients],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (!isSuperAdmin && agency?.id) {
        where.agencyId = agency.id;
      }

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        orderBy: JSON.stringify({ createdAt: "desc" }),
      });

      if (options.includeClients) {
        params.set(
          "include",
          JSON.stringify({
            clients: { select: { id: true, name: true, email: true, phone: true } },
          }),
        );
      }

      const { data } = await apiFetch<{ data: any[] }>(`/api/favoriteDestination?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: (options.enabled ?? true) && (!!agency?.id || isSuperAdmin),
  });

  const createMutation = useMutation({
    mutationFn: async (input: FavoriteDestinationInput) => {
      if (!agency?.id && !isSuperAdmin) {
        throw new Error("Agência não encontrada");
      }

      const created = await apiFetch<any>(`/api/favoriteDestination`, {
        method: "POST",
        body: JSON.stringify(mapFrontToBackend(input, { agencyId: agency?.id, mode: "create" })),
      });

      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-destinations"] });
      toast({ title: "Destino favorito criado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar destino favorito", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: FavoriteDestinationInput & { id: string }) => {
      const updated = await apiFetch<any>(`/api/favoriteDestination/${id}`, {
        method: "PUT",
        body: JSON.stringify(mapFrontToBackend(input, { mode: "update" })),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-destinations"] });
      toast({ title: "Destino favorito atualizado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar destino favorito", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/favoriteDestination/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-destinations"] });
      toast({ title: "Destino favorito removido com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao remover destino favorito", description: error.message, variant: "destructive" });
    },
  });

  return {
    destinations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createDestination: createMutation.mutate,
    updateDestination: updateMutation.mutate,
    deleteDestination: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
