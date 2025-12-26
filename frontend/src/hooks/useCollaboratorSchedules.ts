import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

export interface CollaboratorSchedule {
  id: string;
  agency_id: string;
  collaborator_id: string;
  shift_type_id: string | null;
  schedule_date: string;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  collaborator?: {
    id: string;
    name: string;
  };
  shift_type?: {
    id: string;
    name: string;
    color: string;
    start_time: string;
    end_time: string;
  };
}

export interface ScheduleInput {
  collaborator_id: string;
  shift_type_id?: string | null;
  schedule_date: string;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
}

export function useCollaboratorSchedules(agencyId?: string, startDate?: string, endDate?: string) {
  const { profile, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const effectiveAgencyId = agencyId || profile?.agency_id;

  const toDateISO = (value?: string | null) => (value ? new Date(value).toISOString() : null);
  const toDateOnly = (value?: string | null) => (value ? new Date(value).toISOString().split('T')[0] : '');
  const toTimeString = (value?: string | null) => (value ? new Date(value).toISOString().substring(11, 16) : '');
  const toTimeISO = (value?: string | null) => (value ? new Date(`1970-01-01T${value}:00Z`).toISOString() : null);

  const mapBackendToFront = (s: any): CollaboratorSchedule => ({
    id: s.id,
    agency_id: s.agencyId,
    collaborator_id: s.collaboratorId,
    shift_type_id: s.shiftTypeId ?? null,
    schedule_date: toDateOnly(s.scheduleDate),
    start_time: toTimeString(s.startTime),
    end_time: toTimeString(s.endTime),
    notes: s.notes ?? null,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    collaborator: s.collaborator ? { id: s.collaborator.id, name: s.collaborator.name } : undefined,
    shift_type: s.shiftType
      ? {
          id: s.shiftType.id,
          name: s.shiftType.name,
          color: s.shiftType.color,
          start_time: toTimeString(s.shiftType.startTime),
          end_time: toTimeString(s.shiftType.endTime),
        }
      : undefined,
  });

  const { data: schedules = [], isLoading, error } = useQuery({
    queryKey: ['collaborator-schedules', effectiveAgencyId, startDate, endDate],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (effectiveAgencyId && !isSuperAdmin) {
        where.agencyId = effectiveAgencyId;
      }
      if (startDate || endDate) {
        where.scheduleDate = {};
        if (startDate) (where.scheduleDate as any).gte = new Date(startDate).toISOString();
        if (endDate) (where.scheduleDate as any).lte = new Date(endDate).toISOString();
      }

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        include: JSON.stringify({
          collaborator: { select: { id: true, name: true } },
          shiftType: { select: { id: true, name: true, color: true, startTime: true, endTime: true } },
        }),
        orderBy: JSON.stringify({ scheduleDate: 'asc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/collaboratorSchedule?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!profile && (!!effectiveAgencyId || isSuperAdmin),
  });

  const createMutation = useMutation({
    mutationFn: async (input: ScheduleInput) => {
      if (!effectiveAgencyId) throw new Error('Agency ID is required');
      
      const created = await apiFetch<any>(`/api/collaboratorSchedule`, {
        method: 'POST',
        body: JSON.stringify({
          agencyId: effectiveAgencyId,
          collaboratorId: input.collaborator_id,
          shiftTypeId: input.shift_type_id ?? null,
          scheduleDate: toDateISO(input.schedule_date),
          startTime: toTimeISO(input.start_time),
          endTime: toTimeISO(input.end_time),
          notes: input.notes ?? null,
        }),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-schedules'] });
      toast.success('Escala criada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar escala: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: ScheduleInput & { id: string }) => {
      const updated = await apiFetch<any>(`/api/collaboratorSchedule/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          collaboratorId: input.collaborator_id,
          shiftTypeId: input.shift_type_id ?? null,
          scheduleDate: toDateISO(input.schedule_date),
          startTime: toTimeISO(input.start_time),
          endTime: toTimeISO(input.end_time),
          notes: input.notes ?? null,
        }),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-schedules'] });
      toast.success('Escala atualizada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar escala: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/collaboratorSchedule/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-schedules'] });
      toast.success('Escala excluída com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir escala: ' + error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (criteria: { collaborator_id: string; shift_type_id?: string | null; start_time?: string | null; end_time?: string | null }) => {
      const where: Record<string, unknown> = {
        collaboratorId: criteria.collaborator_id,
      };
      if (criteria.shift_type_id) where.shiftTypeId = criteria.shift_type_id;
      if (criteria.start_time) where.startTime = toTimeISO(criteria.start_time);
      if (criteria.end_time) where.endTime = toTimeISO(criteria.end_time);

      const params = new URLSearchParams({
        where: JSON.stringify(where),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/collaboratorSchedule?${params.toString()}`);
      const ids = (data || []).map((s) => s.id);
      await Promise.all(ids.map((id: string) => apiFetch(`/api/collaboratorSchedule/${id}`, { method: 'DELETE' })));
      return ids.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-schedules'] });
      toast.success('Escalas excluídas com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir escalas: ' + error.message);
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (input: ScheduleInput) => {
      if (!effectiveAgencyId) throw new Error('Agency ID is required');

      const body = {
        agencyId: effectiveAgencyId,
        collaboratorId: input.collaborator_id,
        shiftTypeId: input.shift_type_id ?? null,
        scheduleDate: toDateISO(input.schedule_date),
        startTime: toTimeISO(input.start_time),
        endTime: toTimeISO(input.end_time),
        notes: input.notes ?? null,
      };

      const params = new URLSearchParams({
        where: JSON.stringify({
          collaboratorId: input.collaborator_id,
          scheduleDate: toDateISO(input.schedule_date),
        }),
        take: '1',
      });

      const { data: existingList } = await apiFetch<{ data: any[] }>(`/api/collaboratorSchedule?${params.toString()}`);
      const existing = existingList?.[0];

      if (existing) {
        const updated = await apiFetch<any>(`/api/collaboratorSchedule/${existing.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        return mapBackendToFront(updated);
      }

      const created = await apiFetch<any>(`/api/collaboratorSchedule`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-schedules'] });
      toast.success('Escala salva com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao salvar escala: ' + error.message);
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (inputs: ScheduleInput[]) => {
      if (!effectiveAgencyId) throw new Error('Agency ID is required');
      
      const created = await Promise.all(
        inputs.map(async (input) => {
          const scheduleDate = toDateISO(input.schedule_date);
          const body = {
            agencyId: effectiveAgencyId,
            collaboratorId: input.collaborator_id,
            shiftTypeId: input.shift_type_id ?? null,
            scheduleDate,
            startTime: toTimeISO(input.start_time),
            endTime: toTimeISO(input.end_time),
            notes: input.notes ?? null,
          };

          const searchParams = new URLSearchParams({
            where: JSON.stringify({
              collaboratorId: input.collaborator_id,
              scheduleDate,
            }),
            take: '1',
          });

          const { data: existingList } = await apiFetch<{ data: any[] }>(`/api/collaboratorSchedule?${searchParams.toString()}`);
          const existing = existingList?.[0];

          if (existing) {
            return apiFetch<any>(`/api/collaboratorSchedule/${existing.id}`, {
              method: 'PUT',
              body: JSON.stringify(body),
            });
          }

          return apiFetch<any>(`/api/collaboratorSchedule`, {
            method: 'POST',
            body: JSON.stringify(body),
          });
        }),
      );

      return created.map(mapBackendToFront);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collaborator-schedules'] });
      toast.success(`${data?.length || 0} escalas criadas com sucesso`);
    },
    onError: (error) => {
      toast.error('Erro ao criar escalas: ' + error.message);
    },
  });

  return {
    schedules,
    isLoading,
    error,
    createSchedule: createMutation.mutate,
    updateSchedule: updateMutation.mutate,
    deleteSchedule: deleteMutation.mutate,
    bulkDeleteSchedules: bulkDeleteMutation.mutate,
    upsertSchedule: upsertMutation.mutate,
    bulkCreateSchedules: bulkCreateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
    isBulkCreating: bulkCreateMutation.isPending,
  };
}
