import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarDays,
  UserRound,
  CheckCircle,
  FileText,
  MessageSquare,
  Paperclip,
  CheckSquare,
  Tag,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Task, TaskColumn } from '@/hooks/useTasks';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TaskTodoListViewProps {
  tasks: Task[];
  completedTasks: Task[];
  columns: TaskColumn[];
  completedColumnId?: string;
  completedColumnName?: string;
  completingTaskId?: string | null;
  onEditTask: (task: Task) => void;
  onCompleteTask: (taskId: string) => void;
  solidCards?: boolean;
  alignHeaderTop?: boolean;
}

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export function TaskTodoListView({
  tasks,
  completedTasks,
  columns,
  completedColumnId,
  completedColumnName,
  completingTaskId,
  onEditTask,
  onCompleteTask,
  solidCards = false,
  alignHeaderTop = false,
}: TaskTodoListViewProps) {
  const columnById = useMemo(() => new Map(columns.map((column) => [column.id, column])), [columns]);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const getDueStatus = (dueDate: string | null) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (date < now && diffDays < 0) {
      return {
        label: 'Vencida',
        color: 'text-destructive',
        bg: 'bg-destructive/10',
        icon: AlertCircle,
      };
    }
    if (diffDays <= 3) {
      return {
        label: diffDays <= 0 ? 'Hoje' : `Em ${diffDays}d`,
        color: 'text-warning',
        bg: 'bg-warning/10',
        icon: Clock,
      };
    }
    return {
      label: format(date, 'dd/MM', { locale: ptBR }),
      color: 'text-success',
      bg: 'bg-success/10',
      icon: CheckCircle,
    };
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aDue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const bDue = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return aDue - bDue;
    });
  }, [tasks]);

  const completedWithTimestamp = useMemo(() => {
    const completedName = completedColumnName ? normalizeText(completedColumnName) : null;

    return [...completedTasks]
      .map((task) => {
        const match = (task.histories || []).find(
          (history) =>
            history.field === 'Coluna' &&
            completedName &&
            normalizeText(history.newValue || '') === completedName,
        );

        const completedAt = match?.created_at ?? task.updated_at;
        return { task, completedAt };
      })
      .sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      );
  }, [completedTasks, completedColumnName]);

  const renderCompletedSection = () => {
    if (completedWithTimestamp.length === 0) return null;

    return (
      <div className="mt-6 border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="h-4 w-4 text-success" />
          <p className="text-sm font-semibold">Concluídas</p>
          <Badge variant="secondary" className="text-xs h-5">
            {completedWithTimestamp.length}
          </Badge>
        </div>

        <div className="space-y-2">
          {completedWithTimestamp.map(({ task, completedAt }) => {
            const column = columnById.get(task.column_id);
            const totalChecklistItems =
              task.checklists?.reduce((sum, c) => sum + (c.items?.length || 0), 0) ?? 0;
            const doneChecklistItems =
              task.checklists?.reduce(
                (sum, c) => sum + (c.items?.filter((it) => it.is_done).length || 0),
                0,
              ) ?? 0;

            return (
              <button
                key={task.id}
                type="button"
                className="w-full text-left"
                onClick={() => onEditTask(task)}
              >
                <div
                  className={`flex items-center gap-3 rounded-lg border px-3 py-3 hover:border-primary/40 transition-colors ${
                    solidCards ? 'bg-white' : 'bg-muted/40'
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-foreground line-clamp-1">
                        {task.title}
                      </p>
                      <Badge variant="outline" className="text-xs gap-2 border-border/70">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: column?.color ?? '#94a3b8' }}
                        />
                        {column?.name ?? 'Concluída'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Concluída em {format(new Date(completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-2">
                        {task.client && (
                          <Badge variant="outline" className="text-[11px] gap-1 border-border/70">
                            <UserRound className="h-3 w-3" />
                            <span className="line-clamp-1">{task.client.name}</span>
                          </Badge>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <Badge variant="ghost" className="text-[11px] gap-1 px-1.5 py-0 bg-muted/60">
                            <Tag className="h-3 w-3" />
                            <span className="line-clamp-1">
                              {task.tags.slice(0, 2).join(', ')}
                              {task.tags.length > 2 ? ` +${task.tags.length - 2}` : ''}
                            </span>
                          </Badge>
                        )}
                        {task.due_date && (
                          <div className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>{format(new Date(task.due_date), 'dd/MM/yy', { locale: ptBR })}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {totalChecklistItems > 0 && (
                          <Badge variant="secondary" className="text-[11px] gap-1 bg-muted/70">
                            <CheckSquare className="h-3 w-3" />
                            {doneChecklistItems}/{totalChecklistItems}
                          </Badge>
                        )}
                        {task.comments && task.comments.length > 0 && (
                          <Badge variant="secondary" className="text-[11px] gap-1 bg-muted/70">
                            <MessageSquare className="h-3 w-3" />
                            {task.comments.length}
                          </Badge>
                        )}
                        {task.files && task.files.length > 0 && (
                          <Badge variant="secondary" className="text-[11px] gap-1 bg-muted/70">
                            <Paperclip className="h-3 w-3" />
                            {task.files.length}
                          </Badge>
                        )}

                        {task.assignees && task.assignees.length > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="flex -space-x-1">
                              {task.assignees.slice(0, 3).map((assignee) => (
                                <Avatar key={assignee.id} className="h-6 w-6 border border-background">
                                  {assignee.user?.avatarUrl ? (
                                    <img src={assignee.user.avatarUrl} alt={assignee.user.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                      {assignee.user?.name ? getInitials(assignee.user.name) : '?'}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                              ))}
                            </div>
                            {task.assignees.length > 3 && (
                              <span className="ml-1 text-[11px] text-muted-foreground">
                                +{task.assignees.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (sortedTasks.length === 0) {
    return (
      <div className="p-6 flex-1">
        <div className="flex items-center justify-center text-muted-foreground">
          Nenhuma tarefa pendente
        </div>
        {renderCompletedSection()}
      </div>
    );
  }

  return (
    <div className="p-6">
      {!completedColumnId && (
        <div className="mb-3 text-xs text-muted-foreground bg-muted/60 border border-border rounded-lg px-3 py-2">
          Crie uma coluna de concluídas (ex.: Feito) para enviar as tarefas pelo check.
        </div>
      )}

      <div className="space-y-2 max-w-5xl">
        {sortedTasks.map((task) => {
          const column = columnById.get(task.column_id);
          const dueStatus = getDueStatus(task.due_date);
          const totalChecklistItems =
            task.checklists?.reduce((sum, c) => sum + (c.items?.length || 0), 0) ?? 0;
          const doneChecklistItems =
            task.checklists?.reduce(
              (sum, c) => sum + (c.items?.filter((it) => it.is_done).length || 0),
              0,
            ) ?? 0;

          return (
            <div
              key={task.id}
              className={`flex items-start gap-3 rounded-lg border px-3 py-3 shadow-sm hover:border-primary/40 transition-colors ${
                solidCards ? 'bg-white' : 'bg-card/80'
              }`}
            >
              <Checkbox
                checked={completingTaskId === task.id}
                disabled={!completedColumnId || completingTaskId === task.id}
                onCheckedChange={(checked) => {
                  if (checked) onCompleteTask(task.id);
                }}
                aria-label={`Marcar ${task.title} como concluída`}
              />

              <div className="flex-1 min-w-0 space-y-2">
                <button
                  type="button"
                  className="text-left w-full"
                  onClick={() => onEditTask(task)}
                >
                  <div className={`flex justify-between gap-2 ${alignHeaderTop ? 'items-start' : 'items-center'}`}>
                    <p
                      data-task-title
                      className={`font-semibold text-sm text-foreground line-clamp-1 ${
                        alignHeaderTop ? 'leading-none relative -top-1' : ''
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className={`flex items-center gap-2 ${alignHeaderTop ? 'pt-0' : ''}`}>
                      {dueStatus && (
                        <Badge variant="secondary" className={`text-[11px] gap-1 ${dueStatus.bg} ${dueStatus.color}`}>
                          <dueStatus.icon className="h-3 w-3" />
                          {dueStatus.label}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[11px] gap-2 border-border/70">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: column?.color ?? '#94a3b8' }}
                        />
                        {column?.name ?? 'Sem status'}
                      </Badge>
                    </div>
                  </div>
                </button>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-[11px] font-semibold px-2 py-0.5 bg-muted text-foreground">
                      {task.priority === 'high' ? 'Alta' : task.priority === 'low' ? 'Baixa' : 'Média'}
                    </Badge>
                    {task.client && (
                      <Badge variant="outline" className="text-[11px] gap-1 border-border/70">
                        <UserRound className="h-3 w-3" />
                        <span className="line-clamp-1">{task.client.name}</span>
                      </Badge>
                    )}
                    {task.proposal && (
                      <Badge variant="outline" className="text-[11px] gap-1 border-primary/40 text-primary">
                        <FileText className="h-3 w-3" />
                        Cotação #{task.proposal.number}
                      </Badge>
                    )}
                    {task.tags && task.tags.length > 0 && (
                      <Badge variant="ghost" className="text-[11px] gap-1 px-1.5 py-0 bg-muted/60">
                        <Tag className="h-3 w-3" />
                        <span className="line-clamp-1">
                          {task.tags.slice(0, 2).join(', ')}
                          {task.tags.length > 2 ? ` +${task.tags.length - 2}` : ''}
                        </span>
                      </Badge>
                    )}
                    {task.due_date && (
                      <div className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{format(new Date(task.due_date), 'dd/MM/yy', { locale: ptBR })}</span>
                      </div>
                    )}
                    {!task.due_date && !task.client && !task.proposal && (!task.tags || task.tags.length === 0) && (
                      <span className="text-[11px] text-muted-foreground/80">Sem detalhes adicionais</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {totalChecklistItems > 0 && (
                      <Badge variant="secondary" className="text-[11px] gap-1 bg-muted/80">
                        <CheckSquare className="h-3 w-3" />
                        {doneChecklistItems}/{totalChecklistItems}
                      </Badge>
                    )}
                    {task.comments && task.comments.length > 0 && (
                      <Badge variant="secondary" className="text-[11px] gap-1 bg-muted/80">
                        <MessageSquare className="h-3 w-3" />
                        {task.comments.length}
                      </Badge>
                    )}
                    {task.files && task.files.length > 0 && (
                      <Badge variant="secondary" className="text-[11px] gap-1 bg-muted/80">
                        <Paperclip className="h-3 w-3" />
                        {task.files.length}
                      </Badge>
                    )}
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-1">
                          {task.assignees.slice(0, 3).map((assignee) => (
                            <Avatar key={assignee.id} className="h-6 w-6 border border-background">
                              {assignee.user?.avatarUrl ? (
                                <img src={assignee.user.avatarUrl} alt={assignee.user.name} className="w-full h-full object-cover" />
                              ) : (
                                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                  {assignee.user?.name ? getInitials(assignee.user.name) : '?'}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          ))}
                        </div>
                        {task.assignees.length > 3 && (
                          <span className="ml-1 text-[11px] text-muted-foreground">
                            +{task.assignees.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {renderCompletedSection()}
    </div>
  );
}
