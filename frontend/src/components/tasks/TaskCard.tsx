import { useState } from 'react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  User,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  GripVertical,
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
  const [isDragMode, setIsDragMode] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Não abre edição se estava arrastando
    if (isDragMode) {
      setIsDragMode(false);
      return;
    }
    onEdit(task);
  };

  const handleProposalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.proposal?.id && onOpenProposal) {
      onOpenProposal(task.proposal.id);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 hover:shadow-md transition-all group relative",
        isDragging && "shadow-lg",
        dueDateStatus?.priority === 'high' && "border-l-4 border-l-destructive",
        dueDateStatus?.priority === 'medium' && "border-l-4 border-l-warning",
      )}
    >
      {/* Drag Handle */}
      <div 
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
        onMouseDown={() => setIsDragMode(true)}
        onMouseUp={() => setTimeout(() => setIsDragMode(false), 100)}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Content - Clickable area for edit */}
      <div 
        className="cursor-pointer pl-5"
        onClick={handleCardClick}
      >
        {/* Header with title and menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-sm flex-1 line-clamp-2">{task.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Status Badge - Prominent display */}
        {dueDateStatus && (
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium mb-2",
            dueDateStatus.bgColor,
            dueDateStatus.color
          )}>
            <dueDateStatus.icon className="h-3.5 w-3.5" />
            <span>{dueDateStatus.label}</span>
            {task.due_date && (
              <span className="text-muted-foreground ml-auto">
                {format(new Date(task.due_date), "dd/MM", { locale: ptBR })}
              </span>
            )}
          </div>
        )}

        {/* Client and Proposal badges */}
        <div className="flex flex-wrap gap-1.5">
          {task.client && (
            <Badge variant="secondary" className="text-xs gap-1">
              <User className="h-3 w-3" />
              {task.client.name}
            </Badge>
          )}

          {task.proposal && (
            <Badge 
              variant="outline" 
              className="text-xs gap-1 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={handleProposalClick}
            >
              <FileText className="h-3 w-3" />
              Cotação #{task.proposal.number}
            </Badge>
          )}

          {!task.due_date && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Sem prazo
            </Badge>
          )}
        </div>

        {/* Assignees */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center gap-1 mt-2 -space-x-1">
            {task.assignees.slice(0, 3).map((assignee) => (
              <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                  {assignee.user?.name ? getInitials(assignee.user.name) : '?'}
                </AvatarFallback>
              </Avatar>
            ))}
            {task.assignees.length > 3 && (
              <span className="text-xs text-muted-foreground ml-2">
                +{task.assignees.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
