import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface AgencyUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  agency_id: string | null;
  created_at: string | null;
  role: 'super_admin' | 'admin' | 'agent';
}

export interface CreateAgencyUserInput {
  email: string;
  password: string;
  name: string;
  role: 'super_admin' | 'admin' | 'agent';
  agency_id?: string; // Optional for super_admin
}

export function useSuperAdminAgencyUsers(agencyId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['agency-users', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];

      const params = new URLSearchParams({
        where: JSON.stringify({ agencyId }),
        include: JSON.stringify({ user: { include: { roles: true } } }),
        orderBy: JSON.stringify({ createdAt: 'asc' }),
      });
      const { data } = await apiFetch<{ data: any[] }>(`/api/profile?${params.toString()}`);
      return (data || []).map((p) => {
        const roleRecord = p.user?.roles?.[0];
        return {
          id: p.id,
          name: p.name,
          email: p.email || p.user?.email || null,
          phone: p.phone || p.user?.phone || null,
          agency_id: p.agencyId,
          created_at: p.createdAt,
          role: (roleRecord?.role as AgencyUser['role']) ?? 'agent',
        } as AgencyUser;
      });
    },
    enabled: !!agencyId,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateAgencyUserInput) => {
      if (!agencyId) throw new Error('Agência não informada');
      const created = await apiFetch<any>(`/auth/users`, {
        method: 'POST',
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          name: input.name,
          role: input.role,
          agencyId: agencyId,
        }),
      });
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-users', agencyId] });
      toast({ title: 'Usuário criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar usuário', description: error.message, variant: 'destructive' });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'super_admin' | 'admin' | 'agent' }) => {
      await apiFetch(`/auth/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-users', agencyId] });
      toast({ title: 'Perfil atualizado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar perfil', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiFetch(`/auth/users/${userId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-users', agencyId] });
      toast({ title: 'Usuário removido!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover usuário', description: error.message, variant: 'destructive' });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      await apiFetch(`/auth/users/${userId}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      });
    },
    onSuccess: () => {
      toast({ title: 'Senha atualizada!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar senha', description: error.message, variant: 'destructive' });
    },
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createUser: createMutation.mutateAsync,
    updateRole: updateRoleMutation.mutate,
    deleteUser: deleteMutation.mutate,
    updatePassword: updatePasswordMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdatingRole: updateRoleMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingPassword: updatePasswordMutation.isPending,
  };
}
