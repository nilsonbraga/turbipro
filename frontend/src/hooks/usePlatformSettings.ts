import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface PlatformSetting {
  id: string;
  settingKey: string;
  settingValue: string | null;
}

export function usePlatformSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data } = await apiFetch<{ data: PlatformSetting[] }>('/api/platformSetting');
      return data;
    },
  });

  const settingsMap = useMemo(() => {
    const settings: Record<string, string> = {};
    (query.data || []).forEach((setting) => {
      settings[setting.settingKey] = setting.settingValue || '';
    });
    return settings;
  }, [query.data]);

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const settings = queryClient.getQueryData<PlatformSetting[]>(['platform-settings']);
      const setting = settings?.find((s) => s.settingKey === key);
      const payload = { settingKey: key, settingValue: value, updatedAt: new Date().toISOString() };

      if (setting) {
        const updated = await apiFetch<PlatformSetting>(`/api/platformSetting/${setting.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        return updated;
      }

      const created = await apiFetch<PlatformSetting>(`/api/platformSetting`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast({ title: 'Configuração salva!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    },
  });

  return {
    settings: settingsMap ?? { 
      platform_name: 'Tourbine', 
      platform_icon: 'plane',
      platform_icon_url: '',
      stripe_secret_key: '',
    },
    isLoading: query.isLoading,
    updateSetting: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
