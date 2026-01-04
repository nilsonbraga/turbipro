import { Button } from '@/components/ui/button';
import { Kanban, List, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TaskViewMode = 'board' | 'list' | 'todo';

interface TaskViewToggleProps {
  view: TaskViewMode;
  onViewChange: (view: TaskViewMode) => void;
}

export function TaskViewToggle({ view, onViewChange }: TaskViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 gap-1.5 px-3",
          view === 'board' && "bg-background shadow-sm"
        )}
        onClick={() => onViewChange('board')}
      >
        <Kanban className="h-4 w-4" />
        <span className="hidden sm:inline">Quadro</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 gap-1.5 px-3",
          view === 'list' && "bg-background shadow-sm"
        )}
        onClick={() => onViewChange('list')}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">Lista</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 gap-1.5 px-3",
          view === 'todo' && "bg-background shadow-sm"
        )}
        onClick={() => onViewChange('todo')}
      >
        <CheckSquare className="h-4 w-4" />
        <span className="hidden sm:inline">A fazer</span>
      </Button>
    </div>
  );
}
