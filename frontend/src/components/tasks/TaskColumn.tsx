import { useDroppable } from '@dnd-kit/core';
import { Task, TaskColumn as TaskColumnType } from '@/hooks/useTasks';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TaskColumnProps {
  column: TaskColumnType;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditColumn: (column: TaskColumnType) => void;
  onDeleteColumn: (columnId: string) => void;
  onOpenProposal?: (proposalId: string) => void;
}

export function TaskColumnComponent({
  column,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onEditColumn,
  onDeleteColumn,
  onOpenProposal,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { column },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-80 shrink-0 bg-muted/30 rounded-lg",
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-semibold text-sm">{column.name}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddTask(column.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditColumn(column)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar coluna
              </DropdownMenuItem>
              {!column.is_default && (
                <DropdownMenuItem
                  onClick={() => onDeleteColumn(column.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir coluna
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onOpenProposal={onOpenProposal}
          />
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma tarefa
          </div>
        )}
      </div>
    </div>
  );
}
