import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

export interface ShiftType {
  id: string;
  agency_id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShiftTypeInput {
  name: string;
  start_time: string;
  end_time: string;
  color?: string;
  is_active?: boolean;
}

export function useShiftTypes(agencyId?: string) {
  const { profile, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const effectiveAgencyId = agencyId || profile?.agency_id;

  const toTimeString = (value?: string | null) =>
    value ? new Date(value).toISOString().substring(11, 16) : '';

  const toTimeISO = (value?: string | null) =>
    value ? new Date(`1970-01-01T${value}:00Z`).toISOString() : null;

  const mapBackendToFront = (s: any): ShiftType => ({
    id: s.id,
    agency_id: s.agencyId,
    name: s.name,
    start_time: toTimeString(s.startTime),
    end_time: toTimeString(s.endTime),
    color: s.color ?? '#3B82F6',
    is_active: s.isActive,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  });

  const { data: shiftTypes = [], isLoading, error } = useQuery({
    queryKey: ['shift-types', effectiveAgencyId],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (effectiveAgencyId && !isSuperAdmin) {
        where.agencyId = effectiveAgencyId;
      }

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        orderBy: JSON.stringify({ name: 'asc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/shiftType?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!profile && (!!effectiveAgencyId || isSuperAdmin),
  });

  const createMutation = useMutation({
    mutationFn: async (input: ShiftTypeInput) => {
      if (!effectiveAgencyId) throw new Error('Agency ID is required');
      
      const created = await apiFetch<any>(`/api/shiftType`, {
        method: 'POST',
        body: JSON.stringify({
          agencyId: effectiveAgencyId,
          name: input.name,
          startTime: toTimeISO(input.start_time),
          endTime: toTimeISO(input.end_time),
          color: input.color ?? '#3B82F6',
          isActive: input.is_active ?? true,
        }),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-types'] });
      toast.success('Tipo de plantão criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar tipo de plantão: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: ShiftTypeInput & { id: string }) => {
      const updated = await apiFetch<any>(`/api/shiftType/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: input.name,
          startTime: toTimeISO(input.start_time),
          endTime: toTimeISO(input.end_time),
          color: input.color,
          isActive: input.is_active,
        }),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-types'] });
      toast.success('Tipo de plantão atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar tipo de plantão: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/shiftType/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-types'] });
      toast.success('Tipo de plantão excluído com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir tipo de plantão: ' + error.message);
    },
  });

  return {
    shiftTypes,
    isLoading,
    error,
    createShiftType: createMutation.mutate,
    updateShiftType: updateMutation.mutate,
    deleteShiftType: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
