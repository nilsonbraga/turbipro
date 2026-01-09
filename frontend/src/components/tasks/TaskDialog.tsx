import { useMemo, useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Combobox } from '@/components/ui/combobox';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Task, TaskChecklist, TaskComment, TaskColumn, TaskInput } from '@/hooks/useTasks';
import { useTaskFiles } from '@/hooks/useTaskFiles';
import { useClients } from '@/hooks/useClients';
import { useProposals } from '@/hooks/useProposals';
import { useAgencyUsers } from '@/hooks/useAgencyUsers';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, MessageSquareOff, Plus, CheckSquare, Trash2, ChevronDown, ChevronUp, X, ArrowLeftRight, History, Slash, PlusCircle, ArrowRight, Clock, Upload, Eye, FileText, Loader2, Paperclip, LayoutGrid, List } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  columns: TaskColumn[];
  defaultColumnId?: string;
  agencyId?: string | null;
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
  agencyId,
  onSave,
  isLoading,
  prefillData,
}: TaskDialogProps) {
  const { clients } = useClients();
  const { proposals } = useProposals();
  const { users } = useAgencyUsers(agencyId ?? null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [histories, setHistories] = useState(task?.histories || []);
  const checklistRef = useRef<HTMLDivElement | null>(null);
  const commentsRef = useRef<HTMLDivElement | null>(null);
  const [showChecklistPanel, setShowChecklistPanel] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [confirmDeleteChecklistId, setConfirmDeleteChecklistId] = useState<string | null>(null);
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showFilesPanel, setShowFilesPanel] = useState(false);
  const [fileView, setFileView] = useState<'grid' | 'list'>('grid');
  const selectedUsers = useMemo(
    () => users.filter((u) => selectedAssignees.includes(u.id)),
    [users, selectedAssignees]
  );
  const clientOptions = useMemo(
    () => [
      { value: 'none', label: 'Nenhum' },
      ...(clients ?? []).map((client) => ({
        value: client.id,
        label: client.name,
      })),
    ],
    [clients]
  );
  const proposalOptions = useMemo(
    () => [
      { value: 'none', label: 'Nenhuma' },
      ...(proposals ?? []).map((proposal) => ({
        value: proposal.id,
        label: `#${proposal.number} - ${proposal.title}`,
      })),
    ],
    [proposals]
  );
  const priorityOptions = useMemo(
    () => [
      { value: 'high', label: 'Alta' },
      { value: 'medium', label: 'Média' },
      { value: 'low', label: 'Baixa' },
    ],
    []
  );

  useEffect(() => {
    if (open) {
      setShowHistoryPanel(false);
    }
  }, [open]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStartDate(task.start_date ? new Date(task.start_date) : new Date(task.created_at));
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setColumnId(task.column_id);
      setClientId(task.client_id || '');
      setProposalId(task.proposal_id || '');
      setPriority(task.priority || 'medium');
      setTags((task.tags || []).join(', '));
      setSelectedAssignees(task.assignees?.map(a => a.user_id) || []);
      const existingChecklists = task.checklists || [];
      const existingComments = task.comments || [];
      setHistories(task.histories || []);
      setChecklists(existingChecklists);
      setComments(existingComments);
      setShowFilesPanel(false);
      setFileView('grid');
      setShowChecklistPanel(existingChecklists.length > 0);
      setShowCommentsPanel(existingComments.length > 0);
      setShowHistoryPanel(false);
      setCommentsExpanded(false);
    } else {
      setTitle(prefillData?.title || '');
      setDescription(prefillData?.description || '');
     setStartDate(new Date());
      setDueDate(undefined);
      setColumnId(defaultColumnId || columns[0]?.id || '');
      setClientId('');
      setProposalId('');
     setPriority('medium');
     setTags('');
     setSelectedAssignees([]);
     setChecklists([]);
     setComments([]);
     setShowFilesPanel(false);
     setHistories([]);
     setShowChecklistPanel(false);
     setShowCommentsPanel(false);
     setShowHistoryPanel(false);
     setCommentsExpanded(false);
   }
  }, [task, defaultColumnId, columns, prefillData]);

  const refreshHistories = async () => {
    if (!task?.id) return;
    try {
      const include = {
        histories: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
      };
      const params = new URLSearchParams({
        include: JSON.stringify(include),
      });
      const latest = await apiFetch<any>(`/api/task/${task.id}?${params.toString()}`);
      setHistories(latest?.histories || []);
    } catch (error) {
      console.error('Erro ao atualizar histórico da tarefa', error);
    }
  };

  useEffect(() => {
    if (showHistoryPanel) {
      refreshHistories();
    }
  }, [showHistoryPanel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !columnId) return;

    onSave({
      id: task?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate?.toISOString() || null,
      start_date: startDate?.toISOString() || new Date().toISOString(),
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

  const handleDeleteComment = async (commentId: string) => {
    setConfirmDeleteCommentId(commentId);
  };

  const performDeleteComment = async (commentId: string) => {
    try {
      await apiFetch(`/api/taskComment/${commentId}`, { method: 'DELETE', headers: user?.id ? { 'x-user-id': user.id } : undefined });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      toast({ title: 'Erro ao excluir comentário', description: error.message, variant: 'destructive' });
    }
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const {
    files,
    uploadFile,
    deleteFile,
    isUploading,
    isDeleting,
  } = useTaskFiles(task?.id ?? null);

  const handleAddChecklist = async () => {
    if (!task || !newChecklistTitle.trim() || !user?.id) return;
    try {
      const order = checklists.length;
      const created = await apiFetch<any>('/api/taskChecklist', {
        method: 'POST',
        headers: user?.id ? { 'x-user-id': user.id } : undefined,
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
      setShowChecklistPanel(true);
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
        headers: user?.id ? { 'x-user-id': user.id } : undefined,
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
      setShowChecklistPanel(true);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      toast({ title: 'Erro ao adicionar item', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleItem = async (itemId: string, isDone: boolean) => {
    try {
      await apiFetch(`/api/taskChecklistItem/${itemId}`, {
        method: 'PUT',
        headers: user?.id ? { 'x-user-id': user.id } : undefined,
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
      await apiFetch(`/api/taskChecklistItem/${itemId}`, { method: 'DELETE', headers: user?.id ? { 'x-user-id': user.id } : undefined });
      setChecklists((prev) =>
        prev.map((c) => ({ ...c, items: c.items.filter((it) => it.id !== itemId) })),
      );
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      toast({ title: 'Erro ao excluir item', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    setConfirmDeleteChecklistId(checklistId);
  };

  const performDeleteChecklist = async (checklistId: string) => {
    try {
      await apiFetch(`/api/taskChecklist/${checklistId}`, { method: 'DELETE', headers: user?.id ? { 'x-user-id': user.id } : undefined });
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
        headers: user?.id ? { 'x-user-id': user.id } : undefined,
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
      setShowCommentsPanel(true);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      toast({ title: 'Erro ao adicionar comentário', description: error.message, variant: 'destructive' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(
      { file, caption: file.name },
      {
        onSuccess: () => {
          if (showHistoryPanel) refreshHistories();
        },
      },
    );
    e.target.value = '';
  };

  const handleOpenFile = (url: string) => {
    // Mesma abordagem das leads/propostas: fetch -> blob -> object URL para evitar about:blank
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.target = '_blank';
        link.rel = 'noreferrer noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
      })
      .catch((err) => {
        console.error('Erro ao abrir arquivo', err);
        window.open(url, '_blank', 'noopener,noreferrer');
      });
  };

  const handleDeleteFile = (id: string) => {
    deleteFile(id, {
      onSuccess: () => {
        if (showHistoryPanel) refreshHistories();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-3">
            <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          </div>
          {task && (
            <div className="flex gap-2 items-center pr-12">
              {comments.length > 0 && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={showCommentsPanel ? 'secondary' : 'outline'}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => {
                          setShowCommentsPanel((prev) => !prev);
                        }}
                      >
                        {showCommentsPanel ? (
                          <MessageSquare className="h-4 w-4" />
                        ) : (
                          <MessageSquareOff className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {showCommentsPanel ? 'Ocultar comentários' : 'Exibir comentários'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {task && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={showHistoryPanel ? 'secondary' : 'outline'}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => {
                          setShowHistoryPanel((prev) => !prev);
                        }}
                      >
                        {showHistoryPanel ? (
                          <span className="relative inline-flex items-center justify-center">
                            <History className="h-4 w-4 text-foreground" />
                            <Slash className="h-4 w-4 text-muted-foreground absolute inset-0 rotate-45" />
                          </span>
                        ) : (
                          <History className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {showHistoryPanel ? 'Ocultar histórico' : 'Exibir histórico'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {task && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={showFilesPanel ? 'secondary' : 'outline'}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setShowFilesPanel((prev) => !prev)}
                      >
                        {showFilesPanel ? (
                          <span className="relative inline-flex items-center justify-center">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <Slash className="h-4 w-4 text-muted-foreground absolute inset-0 rotate-45" />
                          </span>
                        ) : (
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {showFilesPanel ? 'Ocultar anexos' : 'Exibir anexos'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button
                variant="outline"
                size="sm"
                className="shadow-sm gap-2"
                onClick={() => {
                  setShowChecklistPanel(true);
                  scrollToSection(checklistRef);
                }}
              >
                <Plus className="h-4 w-4" />
                Checklist
              </Button>
              {comments.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shadow-sm gap-2"
                  onClick={() => {
                    setShowCommentsPanel(true);
                    scrollToSection(commentsRef);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Comentários
                </Button>
              )}
            </div>
          )}
        </DialogHeader>

        {task && showHistoryPanel ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-base">Histórico</h4>
            </div>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {histories.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem registros ainda.</p>
              )}
              {histories.map((h, idx) => {
                const IconComp =
                  h.action === 'Criação'
                    ? PlusCircle
                    : h.action === 'Comentário'
                      ? MessageSquare
                      : h.action === 'Checklist'
                        ? CheckSquare
                        : h.action === 'Arquivo'
                          ? FileText
                          : h.field === 'Coluna'
                            ? ArrowRight
                            : History;
                const isLast = idx === histories.length - 1;
                const parsedDate = h.created_at ? new Date(h.created_at) : null;
                const dateText =
                  parsedDate && !Number.isNaN(parsedDate.getTime())
                    ? format(parsedDate, 'dd MMM yyyy, HH:mm', { locale: ptBR })
                    : '—';
                return (
                  <div key={h.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <IconComp className="w-4 h-4 text-primary" />
                      </div>
                      {!isLast && <div className="flex-1 w-px bg-border mt-2" />}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{h.action}</span>
                      </div>
                      {h.field && (
                        <div className="text-sm text-muted-foreground mb-1">
                          <div className="font-medium text-foreground">{h.field}</div>
                          {h.oldValue && <div className="line-through">{h.oldValue}</div>}
                          {h.newValue && <div className="font-semibold text-foreground">{h.newValue}</div>}
                        </div>
                      )}
                      {!h.field && h.details && (
                        <p className="text-sm text-muted-foreground mb-1">{h.details}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{dateText}</span>
                        <span>por</span>
                        <span className="font-medium text-foreground">{h.user?.name || 'Sistema'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : task && showFilesPanel ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-base">Arquivos</h4>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={fileView === 'grid' ? 'secondary' : 'outline'}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setFileView('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={fileView === 'list' ? 'secondary' : 'outline'}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setFileView('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Enviar
                  </Button>
                </div>
              </div>
            </div>

            {files.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum arquivo anexado.</p>
            ) : fileView === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {files.map((file) => (
                  <Card key={file.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img src={file.url} alt={file.caption || 'Arquivo'} className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 bg-muted flex items-center justify-center">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="p-3 space-y-1">
                        <p className="text-sm font-medium truncate">{file.caption || 'Arquivo'}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.created_at ? format(new Date(file.created_at), "dd/MM/yyyy", { locale: ptBR }) : ''}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenFile(file.url)}>
                            <Eye className="w-3 h-3 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            disabled={isDeleting}
                            onClick={() => handleDeleteFile(file.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="border rounded-md divide-y">
                <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground px-3 py-2">
                  <span className="col-span-6">Nome</span>
                  <span className="col-span-3">Data</span>
                  <span className="col-span-3 text-right">Ações</span>
                </div>
                {files.map((file) => (
                  <div key={file.id} className="grid grid-cols-12 items-center px-3 py-2 text-sm">
                    <div className="col-span-6 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{file.caption || 'Arquivo'}</span>
                    </div>
                    <div className="col-span-3 text-muted-foreground text-xs">
                      {file.created_at ? format(new Date(file.created_at), "dd/MM/yyyy", { locale: ptBR }) : ''}
                    </div>
                    <div className="col-span-3 flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenFile(file.url)}>
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        disabled={isDeleting}
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className={cn(
              'grid gap-6',
              task && showCommentsPanel
                ? commentsExpanded
                  ? 'md:grid-cols-2'
                  : 'md:grid-cols-[3fr,1.35fr]'
                : '',
            )}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título da tarefa"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 md:col-span-1">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Combobox
                      options={clientOptions}
                      value={clientId || 'none'}
                      onValueChange={(val) => setClientId(val === 'none' ? '' : val)}
                      placeholder="Nenhum"
                      searchPlaceholder="Buscar cliente..."
                      emptyText="Nenhum cliente encontrado"
                      buttonClassName="w-full h-9"
                      contentClassName="w-72"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cotação</Label>
                    <Combobox
                      options={proposalOptions}
                      value={proposalId || 'none'}
                      onValueChange={(val) => setProposalId(val === 'none' ? '' : val)}
                      placeholder="Nenhuma"
                      searchPlaceholder="Buscar cotação..."
                      emptyText="Nenhuma cotação encontrada"
                      buttonClassName="w-full h-9"
                      contentClassName="w-72"
                    />
                  </div>
                </div>
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

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
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
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Combobox
                    options={priorityOptions}
                    value={priority}
                    onValueChange={(val) => setPriority(val as 'low' | 'medium' | 'high')}
                    placeholder="Selecionar prioridade"
                    searchPlaceholder="Buscar prioridade..."
                    emptyText="Nenhuma prioridade encontrada"
                    buttonClassName="w-full h-9"
                    contentClassName="w-48"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (separe por vírgula)</Label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="ex: Financeiro, Urgente, Comercial.."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Responsáveis</Label>
                {users.length > 0 ? (
                  <div className="space-y-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {selectedUsers.length > 0 ? (
                              <>
                                <div className="flex -space-x-1">
                                  {selectedUsers.slice(0, 4).map((user) => (
                                    <Avatar key={user.id} className="h-6 w-6 border border-background">
                                      {user.avatar_url ? (
                                        <AvatarImage src={user.avatar_url} alt={user.name || user.email || 'Usuário'} />
                                      ) : (
                                        <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                          {user.name
                                            ? user.name
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')
                                                .slice(0, 2)
                                                .toUpperCase()
                                            : (user.email || 'U').slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                  ))}
                                  {selectedUsers.length > 4 && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      +{selectedUsers.length - 4}
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm">{selectedUsers.length} selecionado(s)</span>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">Selecionar responsáveis</span>
                            )}
                          </div>
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-2" align="start">
                        <div className="max-h-56 overflow-y-auto space-y-1">
                          {users.map((user) => (
                            <label
                              key={user.id}
                              htmlFor={`user-${user.id}`}
                              className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/60 cursor-pointer"
                            >
                              <Checkbox
                                id={`user-${user.id}`}
                                checked={selectedAssignees.includes(user.id)}
                                onCheckedChange={() => toggleAssignee(user.id)}
                              />
                              <Avatar className="h-7 w-7">
                                {user.avatar_url ? (
                                  <AvatarImage src={user.avatar_url} alt={user.name || user.email || 'Usuário'} />
                                ) : (
                                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                    {user.name
                                      ? user.name
                                          .split(' ')
                                          .map((n) => n[0])
                                          .join('')
                                          .slice(0, 2)
                                          .toUpperCase()
                                      : (user.email || 'U').slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{user.name || 'Usuário'}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum responsável disponível.</p>
                )}
              </div>

              {task && showChecklistPanel && (
                <div ref={checklistRef} className="space-y-3">
                  <Separator />
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

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {checklists.map((checklist) => {
                      const totalItems = checklist.items.length;
                      const doneItems = checklist.items.filter((it) => it.is_done).length;
                      const percent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

                      return (
                        <div key={checklist.id} className="rounded-md border border-border/70 p-3 space-y-3">
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

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{doneItems}/{totalItems || 0} feitos</span>
                              <span>{percent}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            {checklist.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-2">
                                <Checkbox
                                  checked={item.is_done}
                                  onCheckedChange={(checked) => handleToggleItem(item.id, !!checked)}
                                  className="rounded-full"
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
                      );
                    })}
                    {checklists.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhuma checklist adicionada.</p>
                    )}
                  </div>
                </div>
              )}

              {task && showFilesPanel && (
                <div className="space-y-3">
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <h4 className="font-medium">Arquivos</h4>
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        onChange={handleFileUpload}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="gap-2"
                      >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Enviar Arquivo
                      </Button>
                    </div>
                  </div>

                  {files.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum arquivo anexado.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {files.map((file) => (
                        <Card key={file.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            {file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img src={file.url} alt={file.caption || 'Arquivo'} className="w-full h-32 object-cover" />
                            ) : (
                              <div className="w-full h-32 bg-muted flex items-center justify-center">
                                <FileText className="w-10 h-10 text-muted-foreground" />
                              </div>
                            )}
                            <div className="p-3 space-y-1">
                              <p className="text-sm font-medium truncate">{file.caption || 'Arquivo'}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.created_at
                                  ? format(new Date(file.created_at), "dd/MM/yyyy", { locale: ptBR })
                                  : ''}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenFile(file.url)}>
                                  <Eye className="w-3 h-3 mr-1" />
                                  Ver
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive"
                                  disabled={isDeleting}
                                  onClick={() => handleDeleteFile(file.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {task && showCommentsPanel && (
              <div ref={commentsRef} className="space-y-3 md:border-l md:pl-4 lg:pl-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <h4 className="font-medium">Comentários</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground gap-2 px-4"
                      onClick={() => setCommentsExpanded((prev) => !prev)}
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                      {commentsExpanded ? 'Retr. largura' : 'Expandir'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                  {comments.map((comment) => {
                    const commentAvatar =
                      comment.user?.avatarUrl || (comment.user as any)?.avatar_url || null;
                    return (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="h-9 w-9">
                          {commentAvatar ? (
                            <AvatarImage src={commentAvatar} alt={comment.user?.name || ''} />
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
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Adicionar comentário</Label>
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    placeholder="Escreva um comentário"
                  />
                  <div className="flex justify-end">
                    <Button type="button" size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                      Enviar
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>

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
        )}
      </DialogContent>

      {/* Confirm delete checklist */}
      <AlertDialog open={!!confirmDeleteChecklistId} onOpenChange={(open) => !open && setConfirmDeleteChecklistId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir checklist?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteChecklistId) {
                  performDeleteChecklist(confirmDeleteChecklistId);
                  setConfirmDeleteChecklistId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete comment */}
      <AlertDialog open={!!confirmDeleteCommentId} onOpenChange={(open) => !open && setConfirmDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteCommentId) {
                  performDeleteComment(confirmDeleteCommentId);
                  setConfirmDeleteCommentId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
