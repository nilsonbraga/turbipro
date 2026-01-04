import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragCancelEvent,
} from '@dnd-kit/core';

import { useTasks, useTaskColumns, Task, TaskColumn, TaskInput } from '@/hooks/useTasks';
import { useClients } from '@/hooks/useClients';
import { useAgencyUsers } from '@/hooks/useAgencyUsers';
import { useProposals } from '@/hooks/useProposals';
import { useAgencies } from '@/hooks/useAgencies';
import { useAuth } from '@/contexts/AuthContext';

import { TaskColumnComponent } from '@/components/tasks/TaskColumn';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { ColumnDialog } from '@/components/tasks/ColumnDialog';
import { TaskListView } from '@/components/tasks/TaskListView';
import { TaskTodoListView } from '@/components/tasks/TaskTodoListView';
import { TaskViewToggle, TaskViewMode } from '@/components/tasks/TaskViewToggle';

import { ProposalDetail } from '@/components/proposals/ProposalDetail';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';

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

import { Plus, Filter, CalendarIcon, X, Search, Settings, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface PrefillTaskData {
  title?: string;
  description?: string;
}

export default function Tasks() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSuperAdmin, agency } = useAuth();
  const prefillTask = (location.state as { prefillTask?: PrefillTaskData })?.prefillTask;

  const [view, setView] = useState<TaskViewMode>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<{
    clientId?: string;
    assigneeId?: string;
    startDate?: string;
    endDate?: string;
    status?: 'overdue' | 'due_soon' | 'on_time' | 'no_date';
  }>({});

  // Para super admin, usa a agência selecionada; para usuário normal, usa a agência do usuário
  const effectiveAgencyId = isSuperAdmin ? selectedAgencyId : agency?.id;

  const { agencies } = useAgencies();
  const { columns, isLoading: columnsLoading, createColumn, updateColumn, deleteColumn, initializeDefaultColumns } =
    useTaskColumns(effectiveAgencyId);

  const {
    tasks,
    isLoading: tasksLoading,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
  } = useTasks({ ...filters, agencyId: effectiveAgencyId });

  const tasksList = tasks ?? [];

  const { clients } = useClients();
  const { users } = useAgencyUsers(effectiveAgencyId);
  const { proposals } = useProposals();

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<TaskColumn | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState<string>('');
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<PrefillTaskData | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  /**
   * ✅ CORREÇÃO PRINCIPAL:
   * Só inicia drag depois de mover X px.
   * Isso faz o click “passar” e abrir o modal normalmente.
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // ajuste fino: 6~12 costuma ficar ótimo
      },
    }),
  );

  // Set default agency for super admin
  useEffect(() => {
    if (isSuperAdmin && agencies.length > 0 && !selectedAgencyId) {
      setSelectedAgencyId(agencies[0].id);
    }
  }, [isSuperAdmin, agencies, selectedAgencyId]);

  // Initialize default columns if none exist
  useEffect(() => {
    if (!columnsLoading && columns.length === 0 && effectiveAgencyId) {
      initializeDefaultColumns.mutate(effectiveAgencyId);
    }
  }, [columnsLoading, columns.length, effectiveAgencyId, initializeDefaultColumns]);

  // Handle prefill data from navigation state
  useEffect(() => {
    if (prefillTask && columns.length > 0) {
      setPrefillData(prefillTask);
      setDefaultColumnId(columns[0]?.id || '');
      setTaskDialogOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [prefillTask, columns, navigate, location.pathname]);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      setFilters((prev) => ({
        ...prev,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
      }));
    }
  }, [dateRange]);

  // Abrir modal de tarefa quando vindo do calendário (?taskId=...)
  useEffect(() => {
    const taskId = searchParams.get('taskId');
    if (!taskId || !tasksList.length) return;
    const task = tasksList.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setDefaultColumnId(task.column_id);
      setTaskDialogOpen(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('taskId');
        return next;
      }, { replace: true });
    }
  }, [searchParams, tasksList, setSearchParams]);

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tasksList;

    return tasksList.filter((task) => {
      const title = (task.title || '').toLowerCase();
      const desc = (task.description || '').toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [tasksList, searchQuery]);

  const completedColumn = useMemo(() => {
    if (columns.length === 0) return undefined;

    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const keywords = ['feito', 'concluido', 'concluida', 'done', 'completed'];

    return (
      columns.find((column) => {
        const normalizedName = normalize(column.name);
        return keywords.some((keyword) => normalizedName.includes(keyword));
      }) || columns[columns.length - 1]
    );
  }, [columns]);

  const incompleteTasks = useMemo(() => {
    if (!completedColumn) return filteredTasks;
    return filteredTasks.filter((task) => task.column_id !== completedColumn.id);
  }, [filteredTasks, completedColumn]);

  const completedTasks = useMemo(() => {
    if (!completedColumn) return [];
    return filteredTasks.filter((task) => task.column_id === completedColumn.id);
  }, [filteredTasks, completedColumn]);

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);

    const { active } = event;
    const task = tasksList.find((t) => t.id === (active.id as string));
    if (task) setActiveTask(task);
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setIsDragging(false);
    setActiveTask(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setIsDragging(false);
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const targetColumn = columns.find((c) => c.id === overId);
    if (targetColumn) {
      const task = tasksList.find((t) => t.id === taskId);
      if (task && task.column_id !== targetColumn.id) {
        moveTask.mutate({ taskId, columnId: targetColumn.id });
      }
    }
  };

  const handleAddTask = (columnId: string) => {
    setSelectedTask(null);
    setDefaultColumnId(columnId);
    setTaskDialogOpen(true);
  };

  // ✅ “Abrir” no clique: aqui você decide se quer abrir no modo editar (TaskDialog) ou outro modal de detalhe.
  const handleOpenTask = (task: Task) => {
    // Se estava arrastando, não abre (proteção extra)
    if (isDragging) return;

    setSelectedTask(task);
    setDefaultColumnId(task.column_id);
    setTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setDefaultColumnId(task.column_id);
    setTaskDialogOpen(true);
  };

  const handleSaveTask = (data: TaskInput & { id?: string }) => {
    if (data.id) {
      updateTask.mutate(data as any, {
        onSuccess: () => setTaskDialogOpen(false),
      });
    } else {
      createTask.mutate(data, {
        onSuccess: () => setTaskDialogOpen(false),
      });
    }
  };

  const handleEditColumn = (column: TaskColumn) => {
    setSelectedColumn(column);
    setColumnDialogOpen(true);
  };

  const handleSaveColumn = (data: { id?: string; name: string; color: string }) => {
    if (data.id) {
      updateColumn.mutate(data as any, {
        onSuccess: () => setColumnDialogOpen(false),
      });
    } else {
      createColumn.mutate(data, {
        onSuccess: () => setColumnDialogOpen(false),
      });
    }
  };

  const handleCompleteTask = (taskId: string) => {
    if (!completedColumn?.id) return;

    setCompletingTaskId(taskId);
    moveTask.mutate(
      { taskId, columnId: completedColumn.id },
      {
        onSettled: () => setCompletingTaskId(null),
      },
    );
  };

  const clearFilters = () => {
    setFilters({});
    setDateRange(undefined);
  };

  const handleOpenProposal = (proposalId: string) => {
    setSelectedProposalId(proposalId);
  };

  const selectedProposal = proposals?.find((p) => p.id === selectedProposalId);
  const hasActiveFilters = !!(
    filters.clientId ||
    filters.assigneeId ||
    filters.status ||
    (dateRange?.from && dateRange?.to)
  );
  const agencyOptions = useMemo(
    () => agencies.map((agencyItem) => ({ value: agencyItem.id, label: agencyItem.name })),
    [agencies]
  );
  const clientOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos os clientes' },
      ...(clients ?? []).map((client) => ({ value: client.id, label: client.name })),
    ],
    [clients]
  );
  const assigneeOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos os responsáveis' },
      ...(users ?? []).map((user) => ({
        value: user.id,
        label: user.name || user.email || 'Usuário',
      })),
    ],
    [users]
  );
  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos os status' },
      { value: 'overdue', label: 'Vencidas' },
      { value: 'due_soon', label: 'Vence em breve' },
      { value: 'on_time', label: 'No prazo' },
      { value: 'no_date', label: 'Sem prazo' },
    ],
    []
  );

  if (columnsLoading && effectiveAgencyId) {
    return (
      <div className="p-6">
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-80 h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {/* Agency Selector for Super Admin */}
            {isSuperAdmin && (
              <>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Combobox
                    options={agencyOptions}
                    value={selectedAgencyId || ''}
                    onValueChange={(value) => setSelectedAgencyId(value)}
                    placeholder="Selecionar agência"
                    searchPlaceholder="Buscar agência..."
                    emptyText="Nenhuma agência encontrada"
                    buttonClassName="w-56 h-9 pl-9"
                    contentClassName="w-56"
                  />
                </div>
                <div className="h-6 w-px bg-border" />
              </>
            )}

            <TaskViewToggle view={view} onViewChange={setView} />

            <div className="h-6 w-px bg-border" />

            <Button
              variant="ghost"
              size="sm"
              className={cn('gap-1.5', hasActiveFilters && 'text-primary')}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">!</span>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefas..."
                className="pl-9 h-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedColumn(null);
                setColumnDialogOpen(true);
              }}
              disabled={!effectiveAgencyId}
            >
              <Settings className="h-4 w-4 mr-1.5" />
              Colunas
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setSelectedTask(null);
                setDefaultColumnId(columns[0]?.id || '');
                setTaskDialogOpen(true);
              }}
              disabled={!effectiveAgencyId || columns.length === 0}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Adicionar tarefa
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 px-4 pb-4">
            <Combobox
              options={clientOptions}
              value={filters.clientId || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, clientId: value === 'all' ? undefined : value }))
              }
              placeholder="Cliente"
              searchPlaceholder="Buscar cliente..."
              emptyText="Nenhum cliente encontrado"
              buttonClassName="w-44 h-9"
              contentClassName="w-56"
            />

            <Combobox
              options={assigneeOptions}
              value={filters.assigneeId || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, assigneeId: value === 'all' ? undefined : value }))
              }
              placeholder="Responsável"
              searchPlaceholder="Buscar responsável..."
              emptyText="Nenhum responsável encontrado"
              buttonClassName="w-44 h-9"
              contentClassName="w-56"
            />

            <Combobox
              options={statusOptions}
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value === 'all' ? undefined : (value as any) }))
              }
              placeholder="Status do prazo"
              searchPlaceholder="Buscar status..."
              emptyText="Nenhum status encontrado"
              buttonClassName="w-44 h-9"
              contentClassName="w-56"
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('h-9 w-52 justify-start text-left font-normal', !dateRange && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd/MM/yy', { locale: ptBR })} -{' '}
                        {format(dateRange.to, 'dd/MM/yy', { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                    )
                  ) : (
                    'Período'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={ptBR}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* No agency selected message for super admin */}
      {isSuperAdmin && !selectedAgencyId && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione uma agência para ver as tarefas</p>
          </div>
        </div>
      )}

      {/* Content */}
      {effectiveAgencyId && (
        <>
          {view === 'board' ? (
            <div className="flex-1 overflow-x-auto px-4 py-4 lg:px-6">
              <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragCancel={handleDragCancel}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-4 h-full">
                  {columns.map((column) => (
                    <TaskColumnComponent
                      key={column.id}
                      column={column}
                      tasks={filteredTasks.filter((t) => t.column_id === column.id)}
                      onAddTask={handleAddTask}
                      onEditTask={handleEditTask}
                      onDeleteTask={(id) => setDeleteTaskId(id)}
                      onEditColumn={handleEditColumn}
                      onDeleteColumn={(id) => setDeleteColumnId(id)}
                      onOpenProposal={handleOpenProposal}
                      /**
                       * ✅ Se o seu TaskColumn/TaskCard aceitar isso, use para abrir no clique.
                       * Se não aceitar, o clique vai voltar a funcionar só com o activationConstraint,
                       * e o TaskCard continuará chamando onEditTask como já fazia.
                       */
                      onOpenTask={handleOpenTask as any}
                    />
                  ))}
                </div>

                <DragOverlay>
                  {activeTask && (
                    <TaskCard
                      task={activeTask}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  )}
                </DragOverlay>
              </DndContext>
            </div>
          ) : view === 'list' ? (
            <div className="flex-1 overflow-y-auto">
              <TaskListView
                columns={columns}
                tasks={filteredTasks}
                onEditTask={handleEditTask}
                onDeleteTask={(id) => setDeleteTaskId(id)}
                onOpenProposal={handleOpenProposal}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <TaskTodoListView
                columns={columns}
                tasks={incompleteTasks}
                completedColumnId={completedColumn?.id}
                completedColumnName={completedColumn?.name}
                completedTasks={completedTasks}
                completingTaskId={completingTaskId}
                onEditTask={handleEditTask}
                onCompleteTask={handleCompleteTask}
                alignHeaderTop
              />
            </div>
          )}
        </>
      )}

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open);
          if (!open) setPrefillData(null);
        }}
        task={selectedTask}
        columns={columns}
        defaultColumnId={defaultColumnId}
        agencyId={effectiveAgencyId}
        onSave={handleSaveTask}
        isLoading={createTask.isPending || updateTask.isPending}
        prefillData={prefillData}
      />

      {/* Column Dialog */}
      <ColumnDialog
        open={columnDialogOpen}
        onOpenChange={setColumnDialogOpen}
        column={selectedColumn}
        onSave={handleSaveColumn}
        isLoading={createColumn.isPending || updateColumn.isPending}
      />

      {/* Delete Task Confirmation */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTaskId) {
                  deleteTask.mutate(deleteTaskId);
                  setDeleteTaskId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Column Confirmation */}
      <AlertDialog open={!!deleteColumnId} onOpenChange={() => setDeleteColumnId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir coluna?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as tarefas desta coluna também serão excluídas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteColumnId) {
                  deleteColumn.mutate(deleteColumnId);
                  setDeleteColumnId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Proposal Detail Modal */}
      <Dialog open={!!selectedProposalId} onOpenChange={() => setSelectedProposalId(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Detalhes da proposta</DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <ProposalDetail
              proposal={selectedProposal}
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
