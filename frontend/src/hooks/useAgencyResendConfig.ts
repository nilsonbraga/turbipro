import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface ResendConfig {
  id: string;
  agency_id: string;
  api_key_encrypted: string | null;
  from_email: string | null;
  from_name: string | null;
  is_configured: boolean | null;
}

export interface ResendConfigInput {
  api_key?: string;
  from_email?: string;
  from_name?: string;
}

export function useAgencyResendConfig() {
  const { agency } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['agency-resend-config', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return null;

      const params = new URLSearchParams({
        where: JSON.stringify({ agencyId: agency.id }),
        take: '1',
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/agencyResendConfig?${params.toString()}`);
      const item = data?.[0];
      if (!item) return null;
      return {
        id: item.id,
        agency_id: item.agencyId,
        api_key_encrypted: item.apiKeyEncrypted ?? null,
        from_email: item.fromEmail ?? null,
        from_name: item.fromName ?? null,
        is_configured: item.isConfigured ?? false,
      } as ResendConfig;
    },
    enabled: !!agency?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: ResendConfigInput) => {
      if (!agency?.id) throw new Error('No agency');

      const baseData = {
        fromEmail: input.from_email || null,
        fromName: input.from_name || null,
        isConfigured: !!(input.api_key || config?.api_key_encrypted) && !!input.from_email,
      };

      const params = new URLSearchParams({
        where: JSON.stringify({ agencyId: agency.id }),
        take: '1',
      });
      const { data: existingList } = await apiFetch<{ data: any[] }>(`/api/agencyResendConfig?${params.toString()}`);
      const existing = existingList?.[0];

      if (existing) {
        const updateData = input.api_key ? { ...baseData, apiKeyEncrypted: input.api_key } : baseData;
        return apiFetch(`/api/agencyResendConfig/${existing.id}`, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
      }

      const insertData = {
        agencyId: agency.id,
        ...baseData,
        ...(input.api_key ? { apiKeyEncrypted: input.api_key } : {}),
      };

      return apiFetch(`/api/agencyResendConfig`, {
        method: 'POST',
        body: JSON.stringify(insertData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-resend-config'] });
      toast({
        title: 'Configuração salva',
        description: 'Configuração do Resend atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    config,
    isLoading,
    error,
    saveConfig: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}
