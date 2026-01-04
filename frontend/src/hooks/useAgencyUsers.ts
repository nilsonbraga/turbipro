import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface AgencyUser {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  agency_id: string | null;
  created_at: string;
  role: 'admin' | 'agent' | 'super_admin';
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'agent' | 'super_admin';
  collaborator_id?: string | null;
}

export function useAgencyUsers(agencyFilterId?: string | null) {
  const { agency, role, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['agency-users', agency?.id, agencyFilterId],
    queryFn: async () => {
      const effectiveAgencyId = isSuperAdmin ? agencyFilterId ?? agency?.id ?? undefined : agency?.id;
      if (!effectiveAgencyId && !isSuperAdmin) return [];
      
      const searchParams = new URLSearchParams({
        include: JSON.stringify({
          user: { include: { roles: true } },
          agency: { select: { id: true, name: true } },
        }),
        orderBy: JSON.stringify({ createdAt: 'asc' }),
      });
      if (effectiveAgencyId) {
        searchParams.append('where', JSON.stringify({ agencyId: effectiveAgencyId }));
      }

      const { data } = await apiFetch<{ data: any[] }>(`/api/profile?${searchParams.toString()}`);
      return (data || [])
        .map((profile) => {
          const roleRecord = profile.user?.roles?.[0];
          return {
            id: profile.id,
            name: profile.name,
            email: profile.email || profile.user?.email || null,
            avatar_url: profile.avatarUrl || profile.avatar_url || profile.user?.avatarUrl || null,
            phone: profile.phone || profile.user?.phone || null,
            agency_id: profile.agencyId,
            created_at: profile.createdAt,
            role: (roleRecord?.role as AgencyUser['role']) ?? 'agent',
          } as AgencyUser;
        });
    },
    enabled: !!agency?.id || isSuperAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateUserInput) => {
      if (!agency?.id) throw new Error('Agência não encontrada');

      const created = await apiFetch<any>(`/auth/users`, {
        method: 'POST',
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          name: input.name,
          role: input.role,
          agencyId: agency.id,
          collaboratorId: input.collaborator_id ?? null,
        }),
      });
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-users'] });
      toast({ title: 'Usuário criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar usuário', description: error.message, variant: 'destructive' });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AgencyUser['role'] }) => {
      await apiFetch(`/auth/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-users'] });
      toast({ title: 'Papel do usuário atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar papel', description: error.message, variant: 'destructive' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiFetch(`/auth/users/${userId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-users'] });
      toast({ title: 'Usuário removido!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover usuário', description: error.message, variant: 'destructive' });
    },
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createUser: createMutation.mutateAsync,
    updateUserRole: updateRoleMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateRoleMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
  };
}
