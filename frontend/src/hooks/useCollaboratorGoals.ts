import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Collaborator } from './useCollaborators';
import { apiFetch } from '@/lib/api';

export interface CollaboratorGoal {
  id: string;
  collaborator_id: string;
  agency_id: string;
  month: number;
  year: number;
  target_sales_value: number;
  target_profit: number;
  target_deals_count: number;
  created_at: string;
  updated_at: string;
  collaborator?: Collaborator;
}

export interface GoalInput {
  collaborator_id: string;
  month: number;
  year: number;
  target_sales_value: number;
  target_profit: number;
  target_deals_count: number;
}

export function useCollaboratorGoals(filters?: {
  collaboratorId?: string;
  month?: number;
  year?: number;
}) {
  const { user, profile, isSuperAdmin } = useAuth();
  const agencyId = profile?.agency_id;
  const queryClient = useQueryClient();

  const mapBackendToFront = (goal: any): CollaboratorGoal => ({
    id: goal.id,
    collaborator_id: goal.collaboratorId,
    agency_id: goal.agencyId,
    month: goal.month,
    year: goal.year,
    target_sales_value: Number(goal.targetSalesValue || 0),
    target_profit: Number(goal.targetProfit || 0),
    target_deals_count: goal.targetDealsCount,
    created_at: goal.createdAt,
    updated_at: goal.updatedAt,
    collaborator: goal.collaborator
      ? {
          id: goal.collaborator.id,
          agency_id: goal.collaborator.agencyId,
          team_id: goal.collaborator.teamId,
          user_id: goal.collaborator.userId,
          name: goal.collaborator.name,
          email: goal.collaborator.email,
          phone: goal.collaborator.phone,
          cpf: goal.collaborator.cpf,
          status: goal.collaborator.status,
          employment_type: goal.collaborator.employmentType,
          position: goal.collaborator.position,
          level: goal.collaborator.level,
          commission_percentage: goal.collaborator.commissionPercentage,
          commission_base: goal.collaborator.commissionBase,
          created_at: goal.collaborator.createdAt,
          updated_at: goal.collaborator.updatedAt,
          team: goal.collaborator.team
            ? {
                id: goal.collaborator.team.id,
                agency_id: goal.collaborator.team.agencyId,
                name: goal.collaborator.team.name,
                description: goal.collaborator.team.description,
                is_active: goal.collaborator.team.isActive,
                created_at: goal.collaborator.team.createdAt,
                updated_at: goal.collaborator.team.updatedAt,
              }
            : undefined,
        }
      : undefined,
  });

  const { data: goals = [], isLoading, error } = useQuery({
    queryKey: ['collaborator-goals', agencyId, filters],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (agencyId && !isSuperAdmin) {
        where.agencyId = agencyId;
      }

      if (filters?.collaboratorId) {
        where.collaboratorId = filters.collaboratorId;
      }

      if (filters?.month) {
        where.month = filters.month;
      }

      if (filters?.year) {
        where.year = filters.year;
      }

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        include: JSON.stringify({
          collaborator: {
            include: {
              team: true,
            },
          },
        }),
        orderBy: JSON.stringify([{ year: 'desc' }, { month: 'desc' }]),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/collaboratorGoal?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!user,
  });

  const upsertMutation = useMutation({
    mutationFn: async (input: GoalInput) => {
      if (!agencyId) throw new Error('Agency ID is required');
      
      const searchParams = new URLSearchParams({
        where: JSON.stringify({
          collaboratorId: input.collaborator_id,
          month: input.month,
          year: input.year,
        }),
        take: '1',
      });

      const { data: existingList } = await apiFetch<{ data: any[] }>(`/api/collaboratorGoal?${searchParams.toString()}`);
      const existing = existingList?.[0];

      if (existing) {
        const updated = await apiFetch<any>(`/api/collaboratorGoal/${existing.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            targetSalesValue: input.target_sales_value,
            targetProfit: input.target_profit,
            targetDealsCount: input.target_deals_count,
          }),
        });
        return mapBackendToFront(updated);
      }

      const created = await apiFetch<any>(`/api/collaboratorGoal`, {
        method: 'POST',
        body: JSON.stringify({
          agencyId,
          collaboratorId: input.collaborator_id,
          month: input.month,
          year: input.year,
          targetSalesValue: input.target_sales_value,
          targetProfit: input.target_profit,
          targetDealsCount: input.target_deals_count,
        }),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-goals'] });
      toast.success('Meta salva com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar meta: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/collaboratorGoal/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-goals'] });
      toast.success('Meta excluída com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir meta: ${error.message}`);
    },
  });

  return {
    goals,
    isLoading,
    error,
    upsertGoal: upsertMutation.mutate,
    deleteGoal: deleteMutation.mutate,
    isUpserting: upsertMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
