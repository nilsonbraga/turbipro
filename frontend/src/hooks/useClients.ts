import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface Client {
  id: string;
  agency_id: string;
  name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  passport: string | null;
  birth_date: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  favorite_destinations?: ClientFavoriteDestination[];
}

export interface ClientFavoriteDestination {
  id: string;
  name: string;
}

export interface ClientInput {
  name: string;
  preferred_name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  passport?: string;
  birth_date?: string | Date;
  address?: string;
  notes?: string;
  favorite_destination_ids?: string[];
}

const mapBackendToFront = (c: any): Client => ({
  id: c.id,
  agency_id: c.agencyId,
  name: c.name,
  preferred_name: c.preferredName ?? null,
  email: c.email,
  phone: c.phone,
  cpf: c.cpf,
  passport: c.passport,
  birth_date: c.birthDate ? String(c.birthDate).slice(0, 10) : null,
  address: c.address,
  notes: c.notes,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
  favorite_destinations: Array.isArray(c.favoriteDestinations)
    ? c.favoriteDestinations.map((destination: any) => ({
        id: destination.id,
        name: destination.name,
      }))
    : undefined,
});

const mapFrontToBackend = (input: ClientInput, options?: { agencyId?: string; mode: 'create' | 'update' }) => {
  let birthDate: string | null = null;

  const toIsoMiddayUTC = (dateObj: Date) => {
    // force YYYY-MM-DD at 12:00 UTC to avoid timezone rollback
    const y = dateObj.getUTCFullYear();
    const m = dateObj.getUTCMonth();
    const d = dateObj.getUTCDate();
    const utc = Date.UTC(y, m, d, 12, 0, 0);
    return isNaN(utc) ? null : new Date(utc).toISOString();
  };

  if (input.birth_date instanceof Date) {
    birthDate = toIsoMiddayUTC(input.birth_date);
  } else if (typeof input.birth_date === 'string' && input.birth_date.trim() !== '') {
    // Accept pre-formatted dd/MM/yyyy
    const raw = input.birth_date.trim();
    const [d, m, y] = raw.split('/');
    if (d && m && y && d.length === 2 && m.length === 2 && y.length === 4) {
      const asDate = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 12, 0, 0));
      birthDate = toIsoMiddayUTC(asDate);
    } else {
      const asDate = new Date(raw);
      birthDate = toIsoMiddayUTC(asDate);
    }
  }

  const payload: Record<string, unknown> = {
    name: input.name,
    preferredName: input.preferred_name ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    cpf: input.cpf ?? null,
    passport: input.passport ?? null,
    birthDate,
    address: input.address ?? null,
    notes: input.notes ?? null,
  };

  if (options?.agencyId) {
    payload.agencyId = options.agencyId;
  }

  if (input.favorite_destination_ids) {
    const relation = input.favorite_destination_ids.map((id) => ({ id }));
    payload.favoriteDestinations =
      options?.mode === 'create' ? { connect: relation } : { set: relation };
  }

  return payload;
};

export function useClients() {
  const { agency, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['clients', agency?.id, isSuperAdmin],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (!isSuperAdmin && agency?.id) {
        where.agencyId = agency.id;
      }

      const searchParams = new URLSearchParams({
        where: JSON.stringify(where),
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });
      searchParams.set(
        'include',
        JSON.stringify({ favoriteDestinations: { select: { id: true, name: true } } }),
      );

      const { data } = await apiFetch<{ data: any[] }>(`/api/client?${searchParams.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!agency?.id || isSuperAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (input: ClientInput) => {
      const targetAgencyId = agency?.id;
      if (!targetAgencyId) {
        throw new Error('Agência não encontrada para criar cliente');
      }

      const created = await apiFetch<any>(`/api/client`, {
        method: 'POST',
        body: JSON.stringify(mapFrontToBackend(input, { agencyId: targetAgencyId, mode: 'create' })),
      });

      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Cliente criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar cliente', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: ClientInput & { id: string }) => {
      const payload = mapFrontToBackend(input, { agencyId: agency?.id, mode: 'update' });
      const updated = await apiFetch<any>(`/api/client/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Cliente atualizado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar cliente', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/client/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Cliente excluído com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir cliente', description: error.message, variant: 'destructive' });
    },
  });

  return {
    clients: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createClient: createMutation.mutate,
    updateClient: updateMutation.mutate,
    deleteClient: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
