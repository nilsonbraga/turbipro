import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Collaborator } from './useCollaborators';
import { Team } from './useTeams';
import { apiFetch } from '@/lib/api';

export interface CollaboratorPerformance {
  collaborator: Collaborator;
  totalSales: number;
  totalProfit: number;
  totalCommissions: number;
  dealsCount: number;
  totalProposals: number;
  conversionRate: number;
  goal?: {
    target_sales_value: number;
    target_profit: number;
    target_deals_count: number;
  };
  goalProgress?: {
    salesProgress: number;
    profitProgress: number;
    dealsProgress: number;
  };
}

export interface TeamPerformance {
  team: Team;
  totalSales: number;
  totalProfit: number;
  totalCommissions: number;
  dealsCount: number;
  conversionRate: number;
  collaboratorsCount: number;
  goal?: {
    target_sales_value: number;
    target_profit: number;
    target_deals_count: number;
  };
  goalProgress?: {
    salesProgress: number;
    profitProgress: number;
    dealsProgress: number;
  };
}

export function useTeamPerformance(filters: {
  month: number;
  year: number;
  teamId?: string;
  agencyIdFilter?: string;
}) {
  const { user, profile, isSuperAdmin } = useAuth();
  const agencyId = profile?.agency_id;
  const effectiveAgencyId = filters.agencyIdFilter || agencyId;

  const { data, isLoading, error } = useQuery({
    queryKey: ['team-performance', effectiveAgencyId, filters],
    queryFn: async () => {
      const mapCollaborator = (c: any): Collaborator => ({
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

      const collaboratorWhere: Record<string, unknown> = { status: 'active' };
      if (effectiveAgencyId && !isSuperAdmin) collaboratorWhere.agencyId = effectiveAgencyId;
      else if (effectiveAgencyId) collaboratorWhere.agencyId = effectiveAgencyId;
      if (filters.teamId) collaboratorWhere.teamId = filters.teamId;

      const collaboratorsPromise = apiFetch<{ data: any[] }>(
        `/api/collaborator?${new URLSearchParams({
          where: JSON.stringify(collaboratorWhere),
          include: JSON.stringify({ team: true }),
        }).toString()}`,
      );

      const commissionsWhere: Record<string, unknown> = {
        periodMonth: filters.month,
        periodYear: filters.year,
      };
      if (effectiveAgencyId) commissionsWhere.agencyId = effectiveAgencyId;

      const commissionsPromise = apiFetch<{ data: any[] }>(
        `/api/collaboratorCommission?${new URLSearchParams({
          where: JSON.stringify(commissionsWhere),
        }).toString()}`,
      );

      const goalsWhere: Record<string, unknown> = { month: filters.month, year: filters.year };
      if (effectiveAgencyId) goalsWhere.agencyId = effectiveAgencyId;

      const goalsPromise = apiFetch<{ data: any[] }>(
        `/api/collaboratorGoal?${new URLSearchParams({
          where: JSON.stringify(goalsWhere),
        }).toString()}`,
      );

      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);

      const proposalsWhere: Record<string, unknown> = {
        createdAt: { gte: startDate.toISOString(), lte: endDate.toISOString() },
      };
      if (effectiveAgencyId) proposalsWhere.agencyId = effectiveAgencyId;

      const proposalsPromise = apiFetch<{ data: any[] }>(
        `/api/proposal?${new URLSearchParams({
          where: JSON.stringify(proposalsWhere),
          include: JSON.stringify({ stage: { select: { isClosed: true } } }),
        }).toString()}`,
      );

      const teamsWhere: Record<string, unknown> = { isActive: true };
      if (effectiveAgencyId) teamsWhere.agencyId = effectiveAgencyId;

      const teamsPromise = apiFetch<{ data: any[] }>(
        `/api/team?${new URLSearchParams({
          where: JSON.stringify(teamsWhere),
        }).toString()}`,
      );

      const [{ data: collaborators }, { data: commissions }, { data: goals }, { data: proposals }, { data: teams }] =
        await Promise.all([collaboratorsPromise, commissionsPromise, goalsPromise, proposalsPromise, teamsPromise]);

      // Calculate collaborator performance
      const collaboratorPerformance: CollaboratorPerformance[] = (collaborators || []).map((collab: any) => {
        const mappedCollab = mapCollaborator(collab);
        const collabCommissions = (commissions || []).filter((c) => c.collaboratorId === collab.id);
        const totalSales = collabCommissions.reduce((sum, c) => sum + Number(c.saleValue || 0), 0);
        const totalProfit = collabCommissions.reduce((sum, c) => sum + Number(c.profitValue || 0), 0);
        const totalCommissions = collabCommissions.reduce((sum, c) => sum + Number(c.commissionAmount || 0), 0);
        const dealsCount = collabCommissions.length;

        // Count proposals created by or assigned to this collaborator
        const collabProposals = (proposals || []).filter(
          (p) => p.assignedCollaboratorId === collab.id || (collab.userId && p.userId === collab.userId),
        );
        const closedProposals = collabProposals.filter((p) => p.stage?.isClosed);
        const conversionRate = collabProposals.length > 0 ? (closedProposals.length / collabProposals.length) * 100 : 0;

        const goal = (goals || []).find((g) => g.collaboratorId === collab.id);

        let goalProgress;
        if (goal) {
          goalProgress = {
            salesProgress: Number(goal.targetSalesValue) > 0 ? (totalSales / Number(goal.targetSalesValue)) * 100 : 0,
            profitProgress: Number(goal.targetProfit) > 0 ? (totalProfit / Number(goal.targetProfit)) * 100 : 0,
            dealsProgress: goal.targetDealsCount > 0 ? (dealsCount / goal.targetDealsCount) * 100 : 0,
          };
        }

        return {
          collaborator: mappedCollab,
          totalSales,
          totalProfit,
          totalCommissions,
          dealsCount,
          totalProposals: collabProposals.length,
          conversionRate,
          goal: goal
            ? {
                target_sales_value: Number(goal.targetSalesValue || 0),
                target_profit: Number(goal.targetProfit || 0),
                target_deals_count: goal.targetDealsCount,
              }
            : undefined,
          goalProgress,
        };
      });

      // Calculate team performance
      const teamPerformance: TeamPerformance[] = (teams || []).map((team: any) => {
        const teamCollabs = collaboratorPerformance.filter((cp) => cp.collaborator.team_id === team.id);
        const totalSales = teamCollabs.reduce((sum, c) => sum + c.totalSales, 0);
        const totalProfit = teamCollabs.reduce((sum, c) => sum + c.totalProfit, 0);
        const totalCommissions = teamCollabs.reduce((sum, c) => sum + c.totalCommissions, 0);
        const dealsCount = teamCollabs.reduce((sum, c) => sum + c.dealsCount, 0);
        const totalProposals = teamCollabs.reduce((sum, c) => sum + c.totalProposals, 0);
        const conversionRate = totalProposals > 0 ? (dealsCount / totalProposals) * 100 : 0;

        return {
          team: {
            id: team.id,
            agency_id: team.agencyId,
            name: team.name,
            description: team.description,
            is_active: team.isActive,
            created_at: team.createdAt,
            updated_at: team.updatedAt,
          } as Team,
          totalSales,
          totalProfit,
          totalCommissions,
          dealsCount,
          conversionRate,
          collaboratorsCount: teamCollabs.length,
        };
      });

      // Rankings
      const salesRanking = [...collaboratorPerformance].sort((a, b) => b.totalSales - a.totalSales);
      const profitRanking = [...collaboratorPerformance].sort((a, b) => b.totalProfit - a.totalProfit);
      const dealsRanking = [...collaboratorPerformance].sort((a, b) => b.dealsCount - a.dealsCount);

      return {
        collaboratorPerformance,
        teamPerformance,
        rankings: {
          bySales: salesRanking,
          byProfit: profitRanking,
          byDeals: dealsRanking,
        },
        totals: {
          totalSales: collaboratorPerformance.reduce((sum, c) => sum + c.totalSales, 0),
          totalProfit: collaboratorPerformance.reduce((sum, c) => sum + c.totalProfit, 0),
          totalCommissions: collaboratorPerformance.reduce((sum, c) => sum + c.totalCommissions, 0),
          totalDeals: collaboratorPerformance.reduce((sum, c) => sum + c.dealsCount, 0),
        },
      };
    },
    enabled: !!user,
  });

  return {
    collaboratorPerformance: data?.collaboratorPerformance || [],
    teamPerformance: data?.teamPerformance || [],
    rankings: data?.rankings || { bySales: [], byProfit: [], byDeals: [] },
    totals: data?.totals || { totalSales: 0, totalProfit: 0, totalCommissions: 0, totalDeals: 0 },
    isLoading,
    error,
  };
}
