import { useState } from 'react';
import { Task, TaskColumn } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  User,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TaskListViewProps {
  columns: TaskColumn[];
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenProposal?: (proposalId: string) => void;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getDueDateStatus(dueDate: string | null) {
  if (!dueDate) return null;

  const date = new Date(dueDate);
  const daysUntilDue = differenceInDays(date, new Date());

  if (isPast(date) && !isToday(date)) {
    return {
      label: 'Vencida',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      icon: AlertCircle,
    };
  }

  if (isToday(date) || daysUntilDue <= 3) {
    return {
      label: daysUntilDue === 0 ? 'Hoje' : `${daysUntilDue}d`,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      icon: Clock,
    };
  }

  return {
    label: `${daysUntilDue}d`,
    color: 'text-success',
    bgColor: 'bg-success/10',
    icon: CheckCircle2,
  };
}

interface ColumnSectionProps {
  column: TaskColumn;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenProposal?: (proposalId: string) => void;
}

function ColumnSection({ column, tasks, onEditTask, onDeleteTask, onOpenProposal }: ColumnSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-2">
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <span className="font-medium text-sm">{column.name}</span>
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            {tasks.length}
          </Badge>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {tasks.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm ml-8">
            Nenhuma tarefa nesta coluna
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[200px]">Nome</TableHead>
                <TableHead className="w-[220px]">Cliente</TableHead>
                <TableHead className="w-[150px]">Responsável</TableHead>
                <TableHead className="w-[100px]">Data início</TableHead>
                <TableHead className="w-[100px]">Prazo</TableHead>
                <TableHead className="w-[100px]">Prioridade</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const dueDateStatus = getDueDateStatus(task.due_date);
                
                return (
                  <TableRow 
                    key={task.id} 
                    className="group cursor-pointer hover:bg-muted/30"
                    onClick={() => onEditTask(task)}
                  >
                    <TableCell>
                      <span className="font-medium text-sm">{task.title}</span>
                    </TableCell>
                    <TableCell>
                      {task.client ? (
                        <Badge variant="secondary" className="text-xs gap-1 h-5">
                          <User className="h-3 w-3" />
                          {task.client.name}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.assignees && task.assignees.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-1">
                            {task.assignees.slice(0, 2).map((assignee) => (
                              <Avatar key={assignee.id} className="h-6 w-6 border border-background">
                                <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                                  {assignee.user?.name ? getInitials(assignee.user.name) : '?'}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          {task.assignees.length === 1 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              {task.assignees[0].user?.name?.split(' ')[0]}
                            </span>
                          )}
                          {task.assignees.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{task.assignees.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.created_at && format(new Date(task.created_at), "dd/MM/yy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {task.due_date ? (
                        <span className={cn("text-sm", dueDateStatus?.color)}>
                          {format(new Date(task.due_date), "dd/MM/yy", { locale: ptBR })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {dueDateStatus ? (
                        <Badge 
                          variant="secondary" 
                          className={cn("text-xs gap-1", dueDateStatus.bgColor, dueDateStatus.color)}
                        >
                          <dueDateStatus.icon className="h-3 w-3" />
                          {dueDateStatus.label}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Normal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TaskListView({ columns, tasks, onEditTask, onDeleteTask, onOpenProposal }: TaskListViewProps) {
  return (
    <div className="p-6 space-y-2">
      {columns.map((column) => (
        <ColumnSection
          key={column.id}
          column={column}
          tasks={tasks.filter((t) => t.column_id === column.id)}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onOpenProposal={onOpenProposal}
        />
      ))}
    </div>
  );
}
