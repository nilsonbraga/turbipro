import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface ProposalImage {
  id: string;
  proposal_id: string;
  url: string;
  caption: string | null;
  created_at: string;
}

export function useProposalFiles(proposalId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mapBackendToFront = (img: any): ProposalImage => ({
    id: img.id,
    proposal_id: img.proposalId,
    url: img.url,
    caption: img.caption ?? null,
    created_at: img.createdAt,
  });

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

  const query = useQuery({
    queryKey: ['proposal-files', proposalId],
    queryFn: async () => {
      if (!proposalId) return [];
      
      const params = new URLSearchParams({
        where: JSON.stringify({ proposalId }),
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/proposalImage?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!proposalId,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }) => {
      if (!proposalId) throw new Error('Proposal ID is required');

      const base64 = await fileToBase64(file);

      const created = await apiFetch<any>(`/api/proposalImage`, {
        method: 'POST',
        body: JSON.stringify({
          proposalId,
          url: base64,
          caption: caption || file.name,
        }),
      });

      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-files', proposalId] });
      toast({ title: 'Arquivo enviado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao enviar arquivo', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/proposalImage/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-files', proposalId] });
      toast({ title: 'Arquivo removido!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover arquivo', description: error.message, variant: 'destructive' });
    },
  });

  return {
    files: query.data ?? [],
    isLoading: query.isLoading,
    uploadFile: uploadMutation.mutate,
    deleteFile: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
