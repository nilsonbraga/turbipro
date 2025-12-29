import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface TaskColumn {
  id: string;
  agency_id: string;
  name: string;
  color: string;
  order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignee {
  id: string;
  task_id: string;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Task {
  id: string;
  agency_id: string;
  column_id: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  title: string;
  description: string | null;
  start_date: string | null;
  due_date: string | null;
  client_id: string | null;
  proposal_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  histories?: TaskHistory[];
  checklists?: TaskChecklist[];
  comments?: TaskComment[];
  files?: {
    id: string;
    task_id: string;
    url: string;
    caption: string | null;
    created_at: string;
  }[];
  client?: {
    id: string;
    name: string;
  } | null;
  proposal?: {
    id: string;
    title: string;
    number: number;
  } | null;
  assignees?: TaskAssignee[];
}

export interface TaskChecklistItem {
  id: string;
  checklist_id: string;
  content: string;
  is_done: boolean;
  order: number;
}

export interface TaskChecklist {
  id: string;
  task_id: string;
  title: string;
  order: number;
  items: TaskChecklistItem[];
  created_by: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl?: string | null;
  };
}

export interface TaskHistory {
  id: string;
  task_id: string;
  user_id: string | null;
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  details?: string | null;
  created_at: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl?: string | null;
  };
}

export interface TaskInput {
  title: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  description?: string;
  start_date?: string | null;
  due_date?: string | null;
  client_id?: string | null;
  proposal_id?: string | null;
  column_id: string;
  assignee_ids?: string[];
}

export function useTaskColumns(agencyIdOverride?: string) {
  const { agency, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sempre usa agência específica para evitar colunas duplicadas de múltiplas agências
  const targetAgencyId = agencyIdOverride || agency?.id;

  const mapBackendColumn = (c: any): TaskColumn => ({
    id: c.id,
    agency_id: c.agencyId,
    name: c.name,
    color: c.color,
    order: c.order,
    is_default: c.isDefault,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  });

  const { data: columns = [], isLoading, error } = useQuery({
    queryKey: ['task-columns', targetAgencyId],
    queryFn: async () => {
      if (!targetAgencyId) return [];

      const params = new URLSearchParams({
        where: JSON.stringify({ agencyId: targetAgencyId }),
        orderBy: JSON.stringify({ order: 'asc' }),
      });
      const { data } = await apiFetch<{ data: any[] }>(`/api/taskColumn?${params.toString()}`);
      return (data || []).map(mapBackendColumn);
    },
    enabled: !!targetAgencyId,
  });

  const createColumn = useMutation({
    mutationFn: async (input: { name: string; color: string; agency_id?: string }) => {
      const agencyId = input.agency_id || targetAgencyId;
      if (!agencyId) throw new Error('Agência não encontrada');

      const maxOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order)) + 1 : 0;

      const created = await apiFetch<any>(`/api/taskColumn`, {
        method: 'POST',
        body: JSON.stringify({
          agencyId,
          name: input.name,
          color: input.color,
          order: maxOrder,
        }),
      });
      return mapBackendColumn(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-columns'] });
      toast({ title: 'Coluna criada com sucesso' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar coluna', description: error.message, variant: 'destructive' });
    },
  });

  const updateColumn = useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; color?: string; order?: number }) => {
      const updated = await apiFetch<any>(`/api/taskColumn/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: input.name,
          color: input.color,
          order: input.order,
        }),
      });
      return mapBackendColumn(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-columns'] });
      toast({ title: 'Coluna atualizada com sucesso' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar coluna', description: error.message, variant: 'destructive' });
    },
  });

  const deleteColumn = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/taskColumn/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-columns'] });
      toast({ title: 'Coluna excluída com sucesso' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir coluna', description: error.message, variant: 'destructive' });
    },
  });

  const reorderColumns = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        apiFetch(`/api/taskColumn/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ order: index }),
        }),
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-columns'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao reordenar colunas', description: error.message, variant: 'destructive' });
    },
  });

  const initializeDefaultColumns = useMutation({
    mutationFn: async (agencyIdParam?: string) => {
      const agencyId = agencyIdParam || targetAgencyId;
      if (!agencyId) throw new Error('Agência não encontrada');

      const defaults = [
        { name: 'A fazer', color: '#3B82F6', order: 0, isDefault: true },
        { name: 'Fazendo', color: '#F59E0B', order: 1, isDefault: false },
        { name: 'Feito', color: '#10B981', order: 2, isDefault: false },
      ];

      await Promise.all(
        defaults.map((col) =>
          apiFetch('/api/taskColumn', {
            method: 'POST',
            body: JSON.stringify({ agencyId, ...col }),
          }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-columns'] });
    },
  });

  return {
    columns,
    isLoading,
    error,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    initializeDefaultColumns,
  };
}

export function useTasks(filters?: {
  columnId?: string;
  clientId?: string;
  assigneeId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'overdue' | 'due_soon' | 'on_time' | 'no_date';
  agencyId?: string;
}) {
  const { agency, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const invalidateTasksAndCalendar = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
  };

  // Sempre usa agência específica para evitar tarefas duplicadas
  const targetAgencyId = filters?.agencyId || agency?.id;

  const mapBackendTask = (t: any): Task => ({
    id: t.id,
    agency_id: t.agencyId,
    column_id: t.columnId,
    priority: (t.priority as 'low' | 'medium' | 'high') ?? 'medium',
    tags: Array.isArray(t.tags) ? t.tags : [],
    proposal_id: t.proposalId ?? null,
    client_id: t.clientId ?? null,
    created_by: t.createdById ?? null,
    title: t.title,
    description: t.description ?? null,
    start_date: t.startDate ?? null,
    due_date: t.dueDate ?? null,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    client: t.client ? { id: t.client.id, name: t.client.name } : null,
    proposal: t.proposal
      ? { id: t.proposal.id, title: t.proposal.title, number: t.proposal.number }
      : null,
    assignees: (t.assignees || []).map((a: any) => ({
      id: a.id,
      task_id: a.taskId,
      user_id: a.userId,
      created_at: a.createdAt,
      user: a.user ? { id: a.user.id, name: a.user.name, email: a.user.email } : undefined,
    })),
    checklists: (t.checklists || []).map((c: any) => ({
      id: c.id,
      task_id: c.taskId,
      title: c.title,
      order: c.order,
      created_by: c.createdBy,
      items: (c.items || []).map((it: any) => ({
        id: it.id,
        checklist_id: it.checklistId,
        content: it.content,
        is_done: it.isDone,
        order: it.order,
      })),
    })),
    comments: (t.comments || []).map((c: any) => ({
      id: c.id,
      task_id: c.taskId,
      user_id: c.userId,
      content: c.content,
      created_at: c.createdAt,
      user: c.user
        ? { id: c.user.id, name: c.user.name, email: c.user.email, avatarUrl: c.user.avatarUrl }
        : undefined,
    })),
    histories: (t.histories || []).map((h: any) => ({
      id: h.id,
      task_id: h.taskId,
      user_id: h.userId,
      action: h.action,
      field: h.field ?? null,
      oldValue: h.oldValue ?? null,
      newValue: h.newValue ?? null,
      details: h.details ?? null,
      created_at: h.createdAt,
      user: h.user
        ? { id: h.user.id, name: h.user.name, email: h.user.email, avatarUrl: h.user.avatarUrl }
        : undefined,
    })),
    files: (t.files || []).map((f: any) => ({
      id: f.id,
      task_id: f.taskId,
      url: f.url,
      caption: f.caption ?? null,
      created_at: f.createdAt,
    })),
  });

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', targetAgencyId, filters],
    queryFn: async () => {
      if (!targetAgencyId) return [];

      const where: Record<string, any> = { agencyId: targetAgencyId };
      if (filters?.columnId) where.columnId = filters.columnId;
      if (filters?.clientId) where.clientId = filters.clientId;

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        include: JSON.stringify({
          client: { select: { id: true, name: true } },
          proposal: { select: { id: true, title: true, number: true } },
          assignees: { include: { user: { select: { id: true, name: true, email: true } } } },
          checklists: { include: { items: true } },
          comments: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
          histories: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } }, orderBy: { createdAt: 'desc' } },
          files: true,
        }),
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/task?${params.toString()}`);
      const mapped = (data || []).map(mapBackendTask);

      // Apply additional filters
      let filteredTasks = mapped;

      if (filters?.startDate) {
        const start = new Date(filters.startDate);
        filteredTasks = filteredTasks.filter(task => {
          if (!task.due_date) return false;
          return new Date(task.due_date) >= start;
        });
      }

      if (filters?.endDate) {
        const end = new Date(filters.endDate);
        filteredTasks = filteredTasks.filter(task => {
          if (!task.due_date) return false;
          return new Date(task.due_date) <= end;
        });
      }

      if (filters?.status) {
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        filteredTasks = filteredTasks.filter(task => {
          if (filters.status === 'no_date') {
            return !task.due_date;
          }
          if (!task.due_date) return false;
          
          const dueDate = new Date(task.due_date);
          
          if (filters.status === 'overdue') {
            return dueDate < now;
          }
          if (filters.status === 'due_soon') {
            return dueDate >= now && dueDate <= threeDaysFromNow;
          }
          if (filters.status === 'on_time') {
            return dueDate > threeDaysFromNow;
          }
          return true;
        });
      }

      return filteredTasks as Task[];
    },
    enabled: !!targetAgencyId,
  });

  const createTask = useMutation({
    mutationFn: async (input: TaskInput & { agency_id?: string }) => {
      const agencyId = input.agency_id || targetAgencyId;
      if (!agencyId) throw new Error('Agência não encontrada');

      const payload = {
        agencyId,
        columnId: input.column_id,
        priority: input.priority ?? 'medium',
        tags: input.tags ?? [],
        proposalId: input.proposal_id ?? null,
        clientId: input.client_id ?? null,
        createdById: user?.id,
        title: input.title,
        description: input.description ?? null,
        startDate: input.start_date ?? new Date().toISOString(),
        dueDate: input.due_date ?? null,
        assignees: input.assignee_ids && input.assignee_ids.length > 0 ? {
          create: input.assignee_ids.map((userId) => ({ userId })),
        } : undefined,
      };

      const created = await apiFetch<any>('/api/task', {
        method: 'POST',
        headers: user?.id ? { 'x-user-id': user.id } : undefined,
        body: JSON.stringify(payload),
      });

      return mapBackendTask(created);
    },
    onSuccess: () => {
      invalidateTasksAndCalendar();
      toast({ title: 'Tarefa criada com sucesso' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao criar tarefa', description: error.message, variant: 'destructive' });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, assignee_ids, ...input }: { id: string; assignee_ids?: string[] } & Partial<TaskInput>) => {
      const payload: Record<string, any> = {
        title: input.title,
        priority: input.priority ?? 'medium',
        tags: input.tags ?? [],
        description: input.description,
        startDate: input.start_date,
        dueDate: input.due_date,
        clientId: input.client_id ?? null,
        proposalId: input.proposal_id ?? null,
        columnId: input.column_id,
      };

      if (assignee_ids) {
        payload.assignees = {
          deleteMany: {},
          create: assignee_ids.map((userId) => ({ userId })),
        };
      }

      await apiFetch(`/api/task/${id}`, {
        method: 'PUT',
        headers: user?.id ? { 'x-user-id': user.id } : undefined,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      invalidateTasksAndCalendar();
      toast({ title: 'Tarefa atualizada com sucesso' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar tarefa', description: error.message, variant: 'destructive' });
    },
  });

  const moveTask = useMutation({
    mutationFn: async ({ taskId, columnId }: { taskId: string; columnId: string }) => {
      await apiFetch(`/api/task/${taskId}`, {
        method: 'PUT',
        headers: user?.id ? { 'x-user-id': user.id } : undefined,
        body: JSON.stringify({ columnId }),
      });
    },
    onSuccess: () => {
      invalidateTasksAndCalendar();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao mover tarefa', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/task/${id}`, { method: 'DELETE', headers: user?.id ? { 'x-user-id': user.id } : undefined });
    },
    onSuccess: () => {
      invalidateTasksAndCalendar();
      toast({ title: 'Tarefa excluída com sucesso' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir tarefa', description: error.message, variant: 'destructive' });
    },
  });

  const addChecklist = useMutation({
    mutationFn: async ({ taskId, title, order }: { taskId: string; title: string; order: number }) => {
      if (!user?.id) throw new Error('Usuário não encontrado');
      return apiFetch('/api/taskChecklist', {
        method: 'POST',
        headers: { 'x-user-id': user.id },
        body: JSON.stringify({
          taskId,
          title,
          order,
          createdBy: user.id,
        }),
      });
    },
    onSuccess: () => {
      invalidateTasksAndCalendar();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao adicionar checklist', description: error.message, variant: 'destructive' });
    },
  });

  const deleteChecklist = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/taskChecklist/${id}`, { method: 'DELETE', headers: user?.id ? { 'x-user-id': user.id } : undefined });
    },
    onSuccess: () => {
      invalidateTasksAndCalendar();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir checklist', description: error.message, variant: 'destructive' });
    },
  });

  const addChecklistItem = useMutation({
    mutationFn: async ({ checklistId, content, order }: { checklistId: string; content: string; order: number }) => {
      return apiFetch('/api/taskChecklistItem', {
        method: 'POST',
        headers: user?.id ? { 'x-user-id': user.id } : undefined,
        body: JSON.stringify({
          checklistId,
          content,
          order,
        }),
      });
    },
    onSuccess: () => {
      invalidateTasksAndCalendar();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao adicionar item', description: error.message, variant: 'destructive' });
    },
  });

  const updateChecklistItem = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ content: string; isDone: boolean; order: number }> }) => {
      return apiFetch(`/api/taskChecklistItem/${id}`, {
        method: 'PUT',
        headers: user?.id ? { 'x-user-id': user.id } : undefined,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      invalidateTasksAndCalendar();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao atualizar item', description: error.message, variant: 'destructive' });
    },
  });

  const deleteChecklistItem = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/taskChecklistItem/${id}`, { method: 'DELETE', headers: user?.id ? { 'x-user-id': user.id } : undefined });
    },
    onSuccess: () => {
      invalidateTasksAndCalendar();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir item', description: error.message, variant: 'destructive' });
    },
  });

  const addComment = useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      if (!user?.id) throw new Error('Usuário não encontrado');
      return apiFetch('/api/taskComment', {
        method: 'POST',
        headers: { 'x-user-id': user.id },
        body: JSON.stringify({
          taskId,
          userId: user.id,
          content,
        }),
      });
    },
    onSuccess: () => {
      invalidateTasksAndCalendar();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao adicionar comentário', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    addChecklist,
    deleteChecklist,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    addComment,
  };
}
