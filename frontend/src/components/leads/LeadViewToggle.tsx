import { Button } from '@/components/ui/button';
import { Kanban, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LeadViewMode = 'board' | 'list';

interface LeadViewToggleProps {
  view: LeadViewMode;
  onViewChange: (view: LeadViewMode) => void;
}

export function LeadViewToggle({ view, onViewChange }: LeadViewToggleProps) {
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
        <span className="hidden sm:inline">Board</span>
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
    </div>
  );
}
