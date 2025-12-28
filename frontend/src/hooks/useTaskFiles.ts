import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface TaskFile {
  id: string;
  task_id: string;
  url: string;
  caption: string | null;
  created_at: string;
}

export function useTaskFiles(taskId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mapBackendToFront = (file: any): TaskFile => ({
    id: file.id,
    task_id: file.taskId,
    url: file.url,
    caption: file.caption ?? null,
    created_at: file.createdAt,
  });

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

  const query = useQuery({
    queryKey: ['task-files', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const params = new URLSearchParams({
        where: JSON.stringify({ taskId }),
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });
      const { data } = await apiFetch<{ data: any[] }>(`/api/taskFile?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!taskId,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }) => {
      if (!taskId) throw new Error('Task ID é obrigatório');
      const base64 = await fileToBase64(file);
      const created = await apiFetch<any>('/api/taskFile', {
        method: 'POST',
        headers: user?.id ? { 'x-user-id': user.id } : undefined,
        body: JSON.stringify({
          taskId,
          url: base64,
          caption: caption || file.name,
        }),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-files', taskId] });
      toast({ title: 'Arquivo enviado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao enviar arquivo', description: (error as Error).message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/taskFile/${id}`, {
        method: 'DELETE',
        headers: user?.id ? { 'x-user-id': user.id } : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-files', taskId] });
      toast({ title: 'Arquivo removido!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao remover arquivo', description: (error as Error).message, variant: 'destructive' });
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
