import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Team } from './useTeams';
import { apiFetch } from '@/lib/api';

export type EmploymentType = 'clt' | 'pj' | 'freela';
export type CollaboratorLevel = 'junior' | 'pleno' | 'senior';
export type CommissionBase = 'sale_value' | 'profit';

export interface Collaborator {
  id: string;
  agency_id: string;
  team_id: string | null;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  status: string;
  employment_type: EmploymentType;
  position: string | null;
  level: CollaboratorLevel | null;
  commission_percentage: number;
  commission_base: CommissionBase;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  team?: Team;
}

export interface CollaboratorInput {
  team_id?: string | null;
  user_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  cpf?: string | null;
  status?: string;
  employment_type?: EmploymentType;
  position?: string | null;
  level?: CollaboratorLevel | null;
  commission_percentage?: number;
  commission_base?: CommissionBase;
}

export function useCollaborators(filters?: { teamId?: string; status?: string }, agencyOverride?: string | null) {
  const { user, profile, isSuperAdmin } = useAuth();
  const agencyId = agencyOverride ?? profile?.agency_id;
  const queryClient = useQueryClient();

  const mapBackendToFront = (c: any): Collaborator => ({
    id: c.id,
    agency_id: c.agencyId,
    team_id: c.teamId,
    user_id: c.userId,
    name: c.name,
    email: c.email,
    phone: c.phone,
    cpf: c.cpf,
    status: c.status,
    employment_type: c.employmentType,
    position: c.position,
    level: c.level,
    commission_percentage: c.commissionPercentage,
    commission_base: c.commissionBase,
    avatar_url: c.avatarUrl ?? c.avatar_url ?? null,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
    team: c.team
      ? {
          id: c.team.id,
          agency_id: c.team.agencyId,
          name: c.team.name,
          description: c.team.description,
          is_active: c.team.isActive,
          created_at: c.team.createdAt,
          updated_at: c.team.updatedAt,
        }
      : undefined,
  });

  const { data: collaborators = [], isLoading, error } = useQuery({
    queryKey: ['collaborators', agencyId, filters],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (agencyId && (!isSuperAdmin || agencyOverride)) {
        where.agencyId = agencyId;
      }
      if (filters?.teamId) where.teamId = filters.teamId;
      if (filters?.status) where.status = filters.status;

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        include: JSON.stringify({ team: true }),
        orderBy: JSON.stringify({ name: 'asc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/collaborator?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CollaboratorInput) => {
      if (!agencyId) throw new Error('Agency ID is required');

      const created = await apiFetch<any>(`/api/collaborator`, {
        method: 'POST',
        body: JSON.stringify({
          agencyId,
          teamId: input.team_id || null,
          userId: input.user_id || null,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          cpf: input.cpf || null,
          status: input.status || 'active',
          employmentType: input.employment_type || 'clt',
          position: input.position || null,
          level: input.level || null,
          commissionPercentage: input.commission_percentage || 0,
          commissionBase: input.commission_base || 'sale_value',
        }),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators'] });
      toast.success('Colaborador criado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar colaborador: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: CollaboratorInput & { id: string }) => {
      const updated = await apiFetch<any>(`/api/collaborator/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          teamId: input.team_id,
          userId: input.user_id,
          name: input.name,
          email: input.email,
          phone: input.phone,
          cpf: input.cpf,
          status: input.status,
          employmentType: input.employment_type,
          position: input.position,
          level: input.level,
          commissionPercentage: input.commission_percentage,
          commissionBase: input.commission_base,
        }),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators'] });
      toast.success('Colaborador atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar colaborador: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/collaborator/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators'] });
      toast.success('Colaborador excluído com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir colaborador: ${error.message}`);
    },
  });

  return {
    collaborators,
    isLoading,
    error,
    createCollaborator: createMutation.mutate,
    updateCollaborator: updateMutation.mutate,
    deleteCollaborator: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
