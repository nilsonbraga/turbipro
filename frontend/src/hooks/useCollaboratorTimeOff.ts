import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

export type TimeOffType = 'vacation' | 'day_off' | 'sick_leave' | 'other';
export type TimeOffStatus = 'pending' | 'approved' | 'rejected';

export interface CollaboratorTimeOff {
  id: string;
  agency_id: string;
  collaborator_id: string;
  type: TimeOffType;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: TimeOffStatus;
  created_at: string;
  updated_at: string;
  collaborator?: {
    id: string;
    name: string;
  };
}

export interface TimeOffInput {
  collaborator_id: string;
  type: TimeOffType;
  start_date: string;
  end_date: string;
  reason?: string | null;
  status?: TimeOffStatus;
}

export function useCollaboratorTimeOff(agencyId?: string, startDate?: string, endDate?: string) {
  const { profile, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const effectiveAgencyId = agencyId || profile?.agency_id;

  const toDateISO = (value?: string | null) => (value ? new Date(value).toISOString() : null);
  const toDateOnly = (value?: string | null) => (value ? new Date(value).toISOString().split('T')[0] : '');

  const mapBackendToFront = (t: any): CollaboratorTimeOff => ({
    id: t.id,
    agency_id: t.agencyId,
    collaborator_id: t.collaboratorId,
    type: t.type,
    start_date: toDateOnly(t.startDate),
    end_date: toDateOnly(t.endDate),
    reason: t.reason ?? null,
    status: t.status,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    collaborator: t.collaborator ? { id: t.collaborator.id, name: t.collaborator.name } : undefined,
  });

  const { data: timeOffs = [], isLoading, error } = useQuery({
    queryKey: ['collaborator-time-off', effectiveAgencyId, startDate, endDate],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (effectiveAgencyId && !isSuperAdmin) {
        where.agencyId = effectiveAgencyId;
      }

      if (startDate && endDate) {
        where.AND = [
          { startDate: { lte: toDateISO(endDate) } },
          { endDate: { gte: toDateISO(startDate) } },
        ];
      }

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        include: JSON.stringify({
          collaborator: { select: { id: true, name: true } },
        }),
        orderBy: JSON.stringify({ startDate: 'asc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/collaboratorTimeOff?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!profile && (!!effectiveAgencyId || isSuperAdmin),
  });

  const createMutation = useMutation({
    mutationFn: async (input: TimeOffInput) => {
      if (!effectiveAgencyId) throw new Error('Agency ID is required');
      
      const created = await apiFetch<any>(`/api/collaboratorTimeOff`, {
        method: 'POST',
        body: JSON.stringify({
          agencyId: effectiveAgencyId,
          collaboratorId: input.collaborator_id,
          type: input.type,
          startDate: toDateISO(input.start_date),
          endDate: toDateISO(input.end_date),
          reason: input.reason ?? null,
          status: input.status ?? 'approved',
        }),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-time-off'] });
      toast.success('Registro criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar registro: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: TimeOffInput & { id: string }) => {
      const updated = await apiFetch<any>(`/api/collaboratorTimeOff/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          collaboratorId: input.collaborator_id,
          type: input.type,
          startDate: toDateISO(input.start_date),
          endDate: toDateISO(input.end_date),
          reason: input.reason ?? null,
          status: input.status ?? 'approved',
        }),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-time-off'] });
      toast.success('Registro atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar registro: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/collaboratorTimeOff/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-time-off'] });
      toast.success('Registro excluído com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir registro: ' + error.message);
    },
  });

  return {
    timeOffs,
    isLoading,
    error,
    createTimeOff: createMutation.mutate,
    updateTimeOff: updateMutation.mutate,
    deleteTimeOff: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export const timeOffTypeLabels: Record<TimeOffType, string> = {
  vacation: 'Férias',
  day_off: 'Folga',
  sick_leave: 'Atestado Médico',
  other: 'Outro',
};

export const timeOffStatusLabels: Record<TimeOffStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};
