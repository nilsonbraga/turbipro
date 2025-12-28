import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Task, TaskChecklist, TaskComment, TaskColumn, TaskInput } from '@/hooks/useTasks';
import { useClients } from '@/hooks/useClients';
import { useProposals } from '@/hooks/useProposals';
import { useAgencyUsers } from '@/hooks/useAgencyUsers';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Checkbox as ShadCheckbox } from '@/components/ui/checkbox';
import { MessageSquare, Plus, CheckSquare, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  columns: TaskColumn[];
  defaultColumnId?: string;
  onSave: (data: TaskInput & { id?: string }) => void;
  isLoading?: boolean;
  prefillData?: { title?: string; description?: string } | null;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  columns,
  defaultColumnId,
  onSave,
  isLoading,
  prefillData,
}: TaskDialogProps) {
  const { clients } = useClients();
  const { proposals } = useProposals();
  const { users } = useAgencyUsers();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [columnId, setColumnId] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [proposalId, setProposalId] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tags, setTags] = useState<string>('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [checklists, setChecklists] = useState<TaskChecklist[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newItems, setNewItems] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setColumnId(task.column_id);
      setClientId(task.client_id || '');
      setProposalId(task.proposal_id || '');
      setPriority(task.priority || 'medium');
      setTags((task.tags || []).join(', '));
      setSelectedAssignees(task.assignees?.map(a => a.user_id) || []);
      setChecklists(task.checklists || []);
      setComments(task.comments || []);
    } else {
      setTitle(prefillData?.title || '');
      setDescription(prefillData?.description || '');
      setDueDate(undefined);
      setColumnId(defaultColumnId || columns[0]?.id || '');
      setClientId('');
      setProposalId('');
      setPriority('medium');
      setTags('');
      setSelectedAssignees([]);
      setChecklists([]);
      setComments([]);
    }
  }, [task, defaultColumnId, columns, prefillData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !columnId) return;

    onSave({
      id: task?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate?.toISOString() || null,
      column_id: columnId,
      client_id: clientId || null,
      proposal_id: proposalId || null,
      assignee_ids: selectedAssignees,
      priority,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddChecklist = async () => {
    if (!task || !newChecklistTitle.trim() || !user?.id) return;
    try {
      const order = checklists.length;
      const created = await apiFetch<any>('/api/taskChecklist', {
        method: 'POST',
        body: JSON.stringify({
          taskId: task.id,
          title: newChecklistTitle.trim(),
          order,
          createdBy: user.id,
        }),
      });
      setChecklists((prev) => [...prev, {
        id: created.id,
        task_id: created.taskId,
        title: created.title,
        order: created.order,
        created_by: created.createdBy,
        items: [],
      }]);
      setNewChecklistTitle('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      toast({ title: 'Erro ao adicionar checklist', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddItem = async (checklistId: string) => {
    const content = (newItems[checklistId] || '').trim();
    if (!content) return;
    try {
      const checklist = checklists.find((c) => c.id === checklistId);
      const order = checklist ? checklist.items.length : 0;
      const created = await apiFetch<any>('/api/taskChecklistItem', {
        method: 'POST',
        body: JSON.stringify({ checklistId, content, order }),
      });
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? {
                ...c,
                items: [
                  ...c.items,
                  {
                    id: created.id,
                    checklist_id: created.checklistId,
                    content: created.content,
                    is_done: created.isDone,
                    order: created.order,
                  },
                ],
              }
            : c,
        ),
      );
      setNewItems((prev) => ({ ...prev, [checklistId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      toast({ title: 'Erro ao adicionar item', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleItem = async (itemId: string, isDone: boolean) => {
    try {
      await apiFetch(`/api/taskChecklistItem/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ isDone }),
      });
      setChecklists((prev) =>
        prev.map((c) => ({
          ...c,
          items: c.items.map((it) => (it.id === itemId ? { ...it, is_done: isDone } : it)),
        })),
      );
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar item', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await apiFetch(`/api/taskChecklistItem/${itemId}`, { method: 'DELETE' });
      setChecklists((prev) =>
        prev.map((c) => ({ ...c, items: c.items.filter((it) => it.id !== itemId) })),
      );
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      toast({ title: 'Erro ao excluir item', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    try {
      await apiFetch(`/api/taskChecklist/${checklistId}`, { method: 'DELETE' });
      setChecklists((prev) => prev.filter((c) => c.id !== checklistId));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      toast({ title: 'Erro ao excluir checklist', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddComment = async () => {
    if (!task || !user?.id || !newComment.trim()) return;
    try {
      const created = await apiFetch<any>('/api/taskComment', {
        method: 'POST',
        body: JSON.stringify({
          taskId: task.id,
          userId: user.id,
          content: newComment.trim(),
        }),
      });
      setComments((prev) => [
        ...prev,
        {
          id: created.id,
          task_id: created.taskId,
          user_id: created.userId,
          content: created.content,
          created_at: created.createdAt,
          user: { id: user.id, name: user.name || '', email: user.email || '', avatarUrl: user.avatarUrl },
        },
      ]);
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      toast({ title: 'Erro ao adicionar comentário', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da tarefa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição da tarefa"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Coluna *</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: col.color }}
                        />
                        {col.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val as 'low' | 'medium' | 'high')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags (separe por vírgula)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ex: UI, Financeiro, Urgente"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={clientId || "none"} onValueChange={(val) => setClientId(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cotação</Label>
              <Select value={proposalId || "none"} onValueChange={(val) => setProposalId(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {proposals?.map((proposal) => (
                    <SelectItem key={proposal.id} value={proposal.id}>
                      #{proposal.number} - {proposal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {users && users.length > 0 && (
            <div className="space-y-2">
              <Label>Responsáveis</Label>
              <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedAssignees.includes(user.id)}
                      onCheckedChange={() => toggleAssignee(user.id)}
                    />
                    <label
                      htmlFor={`user-${user.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {user.name} ({user.email})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {task && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">Checklists</h4>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nova checklist"
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      className="h-9"
                    />
                    <Button type="button" size="sm" onClick={handleAddChecklist} disabled={!newChecklistTitle.trim()}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {checklists.map((checklist) => (
                    <div key={checklist.id} className="rounded-md border border-border/70 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{checklist.title}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => handleDeleteChecklist(checklist.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {checklist.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <ShadCheckbox
                              checked={item.is_done}
                              onCheckedChange={(checked) => handleToggleItem(item.id, !!checked)}
                            />
                            <span className={cn('text-sm flex-1', item.is_done && 'line-through text-muted-foreground')}>
                              {item.content}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Nova subtarefa"
                            value={newItems[checklist.id] || ''}
                            onChange={(e) =>
                              setNewItems((prev) => ({
                                ...prev,
                                [checklist.id]: e.target.value,
                              }))
                            }
                            className="h-9"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAddItem(checklist.id)}
                            disabled={!newItems[checklist.id]?.trim()}
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {checklists.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma checklist adicionada.</p>
                  )}
                </div>
              </div>

              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Comentários</h4>
                </div>
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="h-9 w-9">
                        {comment.user?.avatarUrl ? (
                          <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name || ''} />
                        ) : (
                          <AvatarFallback>
                            {(comment.user?.name || 'U')
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{comment.user?.name || 'Usuário'}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {format(new Date(comment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-1 whitespace-pre-line">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Adicionar comentário</Label>
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    placeholder="Escreva um comentário"
                  />
                  <div className="flex justify-end">
                    <Button type="button" size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                      Enviar
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? 'Salvando...' : task ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
