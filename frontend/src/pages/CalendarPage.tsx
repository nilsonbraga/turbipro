import { useMemo, useState, useEffect } from 'react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { EventManager, type Event as UiEvent } from '@/components/ui/event-manager';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, useTaskColumns, Task, TaskInput } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { useAgencies } from '@/hooks/useAgencies';
import { useProposals } from '@/hooks/useProposals';
import { ProposalDetail } from '@/components/proposals/ProposalDetail';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const TYPE_LABELS: Record<string, string> = {
  flight: 'Voo',
  hotel: 'Hotel',
  car: 'Carro',
  package: 'Pacote',
  tour: 'Roteiro',
  cruise: 'Cruzeiro',
  insurance: 'Seguro',
  transfer: 'Transfer',
  other: 'Outro',
  task: 'Tarefa',
  calendar: 'Evento',
};

const TYPE_COLORS: Record<string, string> = {
  flight: 'blue',
  hotel: 'purple',
  car: 'orange',
  package: 'green',
  tour: 'pink',
  cruise: 'red',
  insurance: 'green',
  transfer: 'orange',
  other: 'blue',
  task: 'green',
  calendar: 'orange',
};

const CALENDAR_TAG = 'Calendário';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useCalendarEvents();
  const { user } = useAuth();
  const { agencies } = useAgencies();
  const { toast } = useToast();

  const defaultAgencyId = user?.isSuperAdmin ? agencies[0]?.id : user?.agencyId;
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | undefined>(defaultAgencyId);

  useEffect(() => {
    if (!selectedAgencyId && defaultAgencyId) setSelectedAgencyId(defaultAgencyId);
  }, [defaultAgencyId, selectedAgencyId]);

  const {
    tasks = [],
    createTask,
    updateTask,
    deleteTask,
  } = useTasks({ agencyId: selectedAgencyId });

  const { columns = [] } = useTaskColumns(selectedAgencyId);
  const { proposals = [] } = useProposals();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  function buildTitle(evt: ReturnType<typeof useCalendarEvents>['data'][number]) {
    const client = evt.client_name || 'Sem cliente';
    const label = TYPE_LABELS[evt.type] || 'Serviço';
    const timeLabel = formatTime(evt.start_date);
    const details: any = evt.details || {};

    if (evt.type === 'flight') {
      const segment = details?.segments?.[0] || {};
      const flightNumber = segment.flightNumber || details.flightNumber || '';
      const flightTag = flightNumber ? `Voo ${flightNumber}` : 'Voo';
      return [client, flightTag, timeLabel].filter(Boolean).join(' - ');
    }

    if (evt.type === 'hotel') {
      const hotelName = details.hotelName || details.name || 'Hotel';
      return [client, hotelName].filter(Boolean).join(' - ');
    }

    if (evt.type === 'task') {
      const taskTitle = details.taskTitle || evt.proposal_title || 'Tarefa';
      return taskTitle;
    }

    if (evt.type === 'car') {
      const carModel = details.carModel || details.model || '';
      return [client, carModel || label, timeLabel].filter(Boolean).join(' - ');
    }

    return [client, label, timeLabel].filter(Boolean).join(' - ');
  }

  const priorityColor = (priority?: string | null) => {
    if (priority === 'high') return 'red';
    if (priority === 'medium') return 'orange';
    return 'green';
  };

  const uiEvents: UiEvent[] = useMemo(() => {
    return events.map((evt) => {
      const start = new Date(evt.start_date);
      const end = evt.end_date ? new Date(evt.end_date) : new Date(start.getTime() + 60 * 60 * 1000);
      const isTask = evt.type === 'task';
      const rawTags = Array.isArray(evt.tags) ? evt.tags : [];
      const visibleTags = rawTags.filter((tag) => tag.toLowerCase() !== CALENDAR_TAG.toLowerCase());
      const isCalendarEvent = isTask && rawTags.some((tag) => tag.toLowerCase() === CALENDAR_TAG.toLowerCase());
      const categoryTag = visibleTags[0];
      const category = isCalendarEvent
        ? categoryTag || TYPE_LABELS.calendar
        : TYPE_LABELS[evt.type] || 'Outro';
      const color = isTask ? priorityColor(evt.priority) : TYPE_COLORS[evt.type] || 'green';
      const columnTag = isCalendarEvent ? null : evt.column_name;
      const tags = Array.from(
        new Set(
          [
            category,
            ...visibleTags,
            evt.client_name,
            evt.proposal_title,
            columnTag,
            ...(evt.assignees || []),
          ].filter(Boolean) as string[],
        ),
      );

      return {
        id: evt.id,
        title: buildTitle(evt),
        description: evt.description || undefined,
        startTime: start,
        endTime: end,
        color,
        category,
        tags,
        isAllDay: evt.isAllDay,
      };
    });
  }, [events]);


  const availableTags = useMemo(() => {
    const set = new Set<string>();
    uiEvents.forEach((e) => e.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [uiEvents]);

  const clientOptions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.client_name) set.add(e.client_name);
    });
    return Array.from(set);
  }, [events]);

  if (isLoading) {
    return (
      <div className="w-full space-y-4 px-4 pb-6 pt-2">
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </div>
    );
  }

  const serviceCategories = Object.values(TYPE_LABELS).filter((c) => c !== 'Tarefa');
  const defaultColumnId = columns[0]?.id;

  return (
    <div className="w-full space-y-4 px-4 pb-6 pt-2">
      <EventManager
        key={uiEvents.length}
        events={uiEvents}
        categories={serviceCategories}
        availableTags={availableTags}
        clientOptions={clientOptions}
        defaultView="month"
        className="min-h-[calc(100vh-180px)] w-full rounded-2xl border-none bg-card p-4"
        onEventCreate={(event) => {
          if (!defaultColumnId) {
            toast({
              title: 'Não foi possível criar o evento',
              description: 'Crie uma coluna de tarefas antes de adicionar eventos.',
              variant: 'destructive',
            });
            return;
          }

          const tags = [CALENDAR_TAG, event.category, ...(event.tags || [])].filter(Boolean) as string[];
          createTask.mutate({
            title: event.title,
            description: event.description,
            start_date: event.startTime.toISOString(),
            due_date: event.endTime?.toISOString() || null,
            column_id: defaultColumnId,
            priority: 'medium',
            tags: Array.from(new Set(tags)),
          });
        }}
        onEventUpdate={(id, update) => {
          const task = tasks.find((t) => t.id === id);
          if (!task) return;
          const hadCalendarTag = (task.tags || []).some(
            (tag) => tag.toLowerCase() === CALENDAR_TAG.toLowerCase(),
          );
          const incomingTags = update.tags ?? task.tags ?? [];
          const normalizedTags = hadCalendarTag
            ? Array.from(
                new Set([CALENDAR_TAG, ...incomingTags.filter((tag) => tag !== CALENDAR_TAG)]),
              )
            : incomingTags;
          updateTask.mutate({
            id,
            title: update.title ?? task.title,
            description: update.description ?? task.description ?? undefined,
            start_date: update.startTime ? update.startTime.toISOString() : task.start_date ?? undefined,
            due_date: update.endTime ? update.endTime.toISOString() : task.due_date ?? undefined,
            tags: normalizedTags,
          });
        }}
        onEventDelete={(id) => {
          const task = tasks.find((t) => t.id === id);
          if (!task) return;
          deleteTask.mutate(id);
        }}
        onEventClickOverride={(event) => {
          if (event.category === 'Tarefa') {
            const task = tasks.find((t) => t.id === event.id);
            if (task) {
              setSelectedTask(task);
              setTaskDialogOpen(true);
              return true;
            }
            return false;
          }
          // Eventos de leads/propostas: abre o modal da lead
          const proposalId = (events.find((e) => e.id === event.id)?.proposal_id) || (event as any).proposal_id;
          if (proposalId) {
            setSelectedProposalId(proposalId);
            return true;
          }
          return false;
        }}
      />
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open);
          if (!open) setSelectedTask(null);
        }}
        task={selectedTask}
        columns={columns}
        defaultColumnId={columns[0]?.id}
        agencyId={selectedAgencyId}
        onSave={(data: TaskInput & { id?: string }) => {
          if (data.id) {
            updateTask.mutate(data as any, {
              onSuccess: () => setTaskDialogOpen(false),
            });
          } else {
            createTask.mutate(data, {
              onSuccess: () => setTaskDialogOpen(false),
            });
          }
        }}
        isLoading={createTask.isPending || updateTask.isPending}
        prefillData={null}
      />

      {/* Modal de Lead/Proposta */}
      <Dialog open={!!selectedProposalId} onOpenChange={() => setSelectedProposalId(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Detalhes da proposta</DialogTitle>
          </DialogHeader>
          {selectedProposalId && (
            <ProposalDetail
              proposal={proposals.find((p) => p.id === selectedProposalId)!}
              onClose={() => setSelectedProposalId(null)}
              onEdit={() => setSelectedProposalId(null)}
              onProposalUpdate={() => {}}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
