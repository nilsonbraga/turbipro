import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { CommissionBase, Collaborator } from './useCollaborators';

export interface CollaboratorCommission {
  id: string;
  collaborator_id: string;
  proposal_id: string;
  agency_id: string;
  sale_value: number;
  profit_value: number;
  commission_percentage: number;
  commission_base: CommissionBase;
  commission_amount: number;
  period_month: number;
  period_year: number;
  created_at: string;
  collaborator?: Collaborator;
}

export interface CommissionInput {
  collaborator_id: string;
  proposal_id: string;
  sale_value: number;
  profit_value: number;
  commission_percentage: number;
  commission_base: CommissionBase;
  commission_amount: number;
  period_month: number;
  period_year: number;
}

export function useCollaboratorCommissions(filters?: {
  collaboratorId?: string;
  month?: number;
  year?: number;
  teamId?: string;
}) {
  const { user, profile, isSuperAdmin } = useAuth();
  const agencyId = profile?.agency_id;
  const queryClient = useQueryClient();

  const { data: commissions = [], isLoading, error } = useQuery({
    queryKey: ['collaborator-commissions', agencyId, filters],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (agencyId && !isSuperAdmin) {
        where.agencyId = agencyId;
      }
      if (filters?.collaboratorId) where.collaboratorId = filters.collaboratorId;
      if (filters?.month) where.periodMonth = filters.month;
      if (filters?.year) where.periodYear = filters.year;

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        include: JSON.stringify({ collaborator: { include: { team: true } } }),
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/collaboratorCommission?${params.toString()}`);
      let result = (data || []).map((c) => ({
        id: c.id,
        collaborator_id: c.collaboratorId,
        proposal_id: c.proposalId,
        agency_id: c.agencyId,
        sale_value: c.saleValue,
        profit_value: c.profitValue,
        commission_percentage: c.commissionPercentage,
        commission_base: c.commissionBase,
        commission_amount: c.commissionAmount,
        period_month: c.periodMonth,
        period_year: c.periodYear,
        created_at: c.createdAt,
        collaborator: c.collaborator
          ? {
              id: c.collaborator.id,
              agency_id: c.collaborator.agencyId,
              team_id: c.collaborator.teamId,
              user_id: c.collaborator.userId,
              name: c.collaborator.name,
              email: c.collaborator.email,
              phone: c.collaborator.phone,
              cpf: c.collaborator.cpf,
              status: c.collaborator.status,
              employment_type: c.collaborator.employmentType,
              position: c.collaborator.position,
              level: c.collaborator.level,
              commission_percentage: c.collaborator.commissionPercentage,
              commission_base: c.collaborator.commissionBase,
              created_at: c.collaborator.createdAt,
              updated_at: c.collaborator.updatedAt,
              team: c.collaborator.team
                ? {
                    id: c.collaborator.team.id,
                    agency_id: c.collaborator.team.agencyId,
                    name: c.collaborator.team.name,
                    description: c.collaborator.team.description,
                    is_active: c.collaborator.team.isActive,
                    created_at: c.collaborator.team.createdAt,
                    updated_at: c.collaborator.team.updatedAt,
                  }
                : undefined,
            }
          : undefined,
      })) as CollaboratorCommission[];

      if (filters?.teamId) {
        result = result.filter((c) => (c.collaborator as any)?.team_id === filters.teamId);
      }

      return result;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CommissionInput) => {
      if (!agencyId) throw new Error('Agency ID is required');
      
      const created = await apiFetch(`/api/collaboratorCommission`, {
        method: 'POST',
        body: JSON.stringify({
          agencyId,
          collaboratorId: input.collaborator_id,
          proposalId: input.proposal_id,
          saleValue: input.sale_value,
          profitValue: input.profit_value,
          commissionPercentage: input.commission_percentage,
          commissionBase: input.commission_base,
          commissionAmount: input.commission_amount,
          periodMonth: input.period_month,
          periodYear: input.period_year,
        }),
      });
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['team-performance'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar comissão: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const params = new URLSearchParams({
        where: JSON.stringify({ proposalId }),
      });
      const { data: commissionsToDelete } = await apiFetch<{ data: any[] }>(`/api/collaboratorCommission?${params.toString()}`);
      await Promise.all(
        (commissionsToDelete || []).map((c) =>
          apiFetch(`/api/collaboratorCommission/${c.id}`, { method: 'DELETE' }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['team-performance'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover comissão: ${error.message}`);
    },
  });

  // Calculate totals
  const totals = commissions.reduce(
    (acc, c) => ({
      totalSales: acc.totalSales + Number(c.sale_value),
      totalProfit: acc.totalProfit + Number(c.profit_value),
      totalCommissions: acc.totalCommissions + Number(c.commission_amount),
      count: acc.count + 1,
    }),
    { totalSales: 0, totalProfit: 0, totalCommissions: 0, count: 0 }
  );

  return {
    commissions,
    totals,
    isLoading,
    error,
    createCommission: createMutation.mutateAsync,
    deleteCommission: deleteMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
