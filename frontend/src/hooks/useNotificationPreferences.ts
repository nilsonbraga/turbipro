import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreference {
  id?: string;
  user_id: string;
  agency_id: string | null;
  new_lead: boolean;
  proposal_closed: boolean;
  follow_up_reminder: boolean;
  weekly_report: boolean;
}

const mapBackendToFront = (p: any, userId: string, agencyId: string | null): NotificationPreference => ({
  id: p?.id,
  user_id: p?.userId ?? userId,
  agency_id: p?.agencyId ?? agencyId,
  new_lead: p?.newLead ?? true,
  proposal_closed: p?.proposalClosed ?? true,
  follow_up_reminder: p?.followUpReminder ?? true,
  weekly_report: p?.weeklyReport ?? false,
});

const mapFrontToBackend = (p: NotificationPreference) => ({
  userId: p.user_id,
  agencyId: p.agency_id,
  newLead: p.new_lead,
  proposalClosed: p.proposal_closed,
  followUpReminder: p.follow_up_reminder,
  weeklyReport: p.weekly_report,
});

export function useNotificationPreferences() {
  const { user, profile, agency } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const params = new URLSearchParams({
        where: JSON.stringify({ userId: user.id }),
        take: '1',
      });
      const { data } = await apiFetch<{ data: any[] }>(`/api/notificationPreference?${params.toString()}`);
      const pref = data?.[0];
      return mapBackendToFront(pref, user.id, profile?.agency_id ?? agency?.id ?? null);
    },
    enabled: !!user?.id,
  });

  const upsertMutation = useMutation({
    mutationFn: async (input: Partial<NotificationPreference>) => {
      if (!user?.id) throw new Error('Usuário não encontrado');
      const current = data ?? mapBackendToFront(null, user.id, profile?.agency_id ?? agency?.id ?? null);
      const payload = mapFrontToBackend({ ...current, ...input, user_id: user.id, agency_id: profile?.agency_id ?? agency?.id ?? null });

      if (current?.id) {
        const updated = await apiFetch<any>(`/api/notificationPreference/${current.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...payload, updatedAt: new Date().toISOString() }),
        });
        return mapBackendToFront(updated, user.id, profile?.agency_id ?? agency?.id ?? null);
      }

      const created = await apiFetch<any>(`/api/notificationPreference`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return mapBackendToFront(created, user.id, profile?.agency_id ?? agency?.id ?? null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({ title: 'Preferências salvas' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao salvar preferências', description: error.message, variant: 'destructive' });
    },
  });

  return {
    preferences: data,
    isLoading,
    error,
    savePreferences: upsertMutation.mutate,
    isSaving: upsertMutation.isPending,
  };
}
