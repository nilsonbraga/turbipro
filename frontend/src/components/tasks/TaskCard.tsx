import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/hooks/useTasks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  User,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageSquare,
  Paperclip,
  CheckSquare,
  Calendar,
} from 'lucide-react';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onOpenProposal?: (proposalId: string) => void;
}

export function TaskCard({ task, onEdit, onDelete, onOpenProposal }: TaskCardProps) {
  const priorityStyles: Record<'low' | 'medium' | 'high', { bg: string; text: string; label: string }> = {
    high: { bg: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100', label: 'Alta' },
    medium: { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100', label: 'Média' },
    low: { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100', label: 'Baixa' },
  };
  const priorityBarStyles: Record<'low' | 'medium' | 'high', string> = {
    high: 'from-red-500/80 to-red-400/80',
    medium: 'from-amber-500/80 to-amber-400/80',
    low: 'from-emerald-500/80 to-emerald-400/80',
  };
  const priorityChip = priorityStyles[task.priority || 'medium'];
  const priorityBar = priorityBarStyles[task.priority || 'medium'];
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    activationConstraint: { distance: 12 },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDueDateStatus = () => {
    if (!task.due_date) return null;

    const dueDate = new Date(task.due_date);
    const daysUntilDue = differenceInDays(dueDate, new Date());

    if (isPast(dueDate) && !isToday(dueDate)) {
      return {
        label: 'Vencida',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/30',
        icon: AlertCircle,
        priority: 'high',
        isOverdue: true,
        daysOverdue: Math.abs(daysUntilDue),
      };
    }

    if (isToday(dueDate) || daysUntilDue <= 3) {
      return {
        label: daysUntilDue === 0 ? 'Vence hoje' : `Vence em ${daysUntilDue}d`,
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/30',
        icon: Clock,
        priority: 'medium',
      };
    }

    return {
      label: `${daysUntilDue} dias restantes`,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
      icon: CheckCircle2,
      priority: 'low',
    };
  };

  const dueDateStatus = getDueDateStatus();

  const totalChecklistItems =
    task.checklists?.reduce((sum, c) => sum + (c.items?.length || 0), 0) ?? 0;
  const doneChecklistItems =
    task.checklists?.reduce(
      (sum, c) => sum + (c.items?.filter((it) => it.is_done).length || 0),
      0,
    ) ?? 0;

  const handleProposalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.proposal?.id && onOpenProposal) {
      onOpenProposal(task.proposal.id);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={{
        ...style,
        touchAction: 'manipulation',
      }}
      className={cn(
        "p-4 rounded-xl border-0 bg-white/95 dark:bg-slate-900/70 backdrop-blur-sm",
        "shadow-[0_10px_30px_-22px_rgba(15,23,42,0.35)] hover:shadow-[0_16px_36px_-24px_rgba(15,23,42,0.45)]",
        "transition-all duration-200 group relative cursor-grab hover:-translate-y-[1px]",
        isDragging && "shadow-xl ring-1 ring-primary/30",
      )}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (isDragging) return;
        e.stopPropagation();
        onEdit(task);
      }}
    >
      {/* Content - Clickable area for edit */}
      <div className="cursor-pointer">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className={`h-1.5 w-1/4 min-w-[72px] rounded-full bg-gradient-to-r ${priorityBar}`} />
          {(task.start_date || task.due_date) && (
            <span className="inline-flex items-center gap-1 text-[11px] leading-tight text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {task.start_date && task.due_date ? (
                <span>
                  {format(new Date(task.start_date), "dd MMM", { locale: ptBR })} -{' '}
                  {format(new Date(task.due_date), "dd MMM", { locale: ptBR })}
                </span>
              ) : (
                <>
                  {task.start_date && (
                    <span>
                      Início {format(new Date(task.start_date), "dd MMM", { locale: ptBR })}
                    </span>
                  )}
                  {task.due_date && (
                    <span>
                      Fim {format(new Date(task.due_date), "dd MMM", { locale: ptBR })}
                    </span>
                  )}
                </>
              )}
            </span>
          )}
        </div>
        {/* Header with title and menu */}
        <div className="flex items-start justify-between gap-2 mb-0">
          <h4 className="font-semibold text-sm flex-1 line-clamp-2 text-foreground">{task.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Client and Proposal badges */}
        <div className="flex flex-wrap gap-1.5">
          {task.client && (
            <Badge variant="secondary" className="text-xs gap-1 bg-primary/10 text-primary">
              <User className="h-3 w-3" />
              {task.client.name}
            </Badge>
          )}

          {task.proposal && (
            <Badge 
              variant="outline" 
              className="text-xs gap-1 cursor-pointer border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={handleProposalClick}
            >
              <FileText className="h-3 w-3" />
              Cotação #{task.proposal.number}
            </Badge>
          )}

          {!task.due_date && (
            <Badge variant="outline" className="text-xs text-muted-foreground border-border/60">
              Sem prazo
            </Badge>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {task.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[11px] border-border/60 bg-muted/60 text-muted-foreground px-2 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {(task.assignees?.length || dueDateStatus) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex items-center gap-1 -space-x-1">
              {task.assignees.slice(0, 3).map((assignee) => {
                const avatarUrl = assignee.user?.avatarUrl || (assignee.user as any)?.avatar_url || null;
                const assigneeLabel = assignee.user?.name || assignee.user?.email || 'Usuário';
                return (
                  <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background" title={assigneeLabel}>
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={assigneeLabel} />
                    ) : (
                      <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                        {assignee.user?.name ? getInitials(assignee.user.name) : '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                );
              })}
                {task.assignees.length > 3 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    +{task.assignees.length - 3}
                  </span>
                )}
              </div>
            )}
            {dueDateStatus && (
              <div className={cn("flex items-center gap-2", task.assignees?.length ? 'ml-auto' : '')}>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm",
                    dueDateStatus.bgColor,
                    dueDateStatus.color
                  )}
                >
                  <dueDateStatus.icon className="h-3.5 w-3.5" />
                  {dueDateStatus.isOverdue && dueDateStatus.daysOverdue !== undefined
                    ? (dueDateStatus.daysOverdue >= 1000
                        ? 'Vencida'
                        : `Vencida há ${dueDateStatus.daysOverdue} dias`)
                    : dueDateStatus.label}
                </span>
                {task.due_date && !dueDateStatus.isOverdue && (
                  <span className="inline-flex items-center rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {format(new Date(task.due_date), "dd/MM", { locale: ptBR })}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom indicators */}
        <div className="mt-3 flex justify-end gap-2 border-t border-border/60 pt-3">
          {totalChecklistItems > 0 && (
            <Badge variant="secondary" className="text-[11px] gap-1 bg-muted/60">
              <CheckSquare className="h-3 w-3" />
              {doneChecklistItems}/{totalChecklistItems}
            </Badge>
          )}
          {task.comments && task.comments.length > 0 && (
            <Badge variant="secondary" className="text-[11px] gap-1 bg-muted/60">
              <MessageSquare className="h-3 w-3" />
              {task.comments.length}
            </Badge>
          )}
          {task.files && task.files.length > 0 && (
            <Badge variant="secondary" className="text-[11px] gap-1 bg-muted/60">
              <Paperclip className="h-3 w-3" />
              {task.files.length}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
