import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Task, TaskColumn, TaskInput } from '@/hooks/useTasks';
import { useClients } from '@/hooks/useClients';
import { useProposals } from '@/hooks/useProposals';
import { useAgencyUsers } from '@/hooks/useAgencyUsers';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  columns: TaskColumn[];
  defaultColumnId?: string;
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
  onSave,
  isLoading,
  prefillData,
}: TaskDialogProps) {
  const { clients } = useClients();
  const { proposals } = useProposals();
  const { users } = useAgencyUsers();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [columnId, setColumnId] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [proposalId, setProposalId] = useState<string>('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setColumnId(task.column_id);
      setClientId(task.client_id || '');
      setProposalId(task.proposal_id || '');
      setSelectedAssignees(task.assignees?.map(a => a.user_id) || []);
    } else {
      setTitle(prefillData?.title || '');
      setDescription(prefillData?.description || '');
      setDueDate(undefined);
      setColumnId(defaultColumnId || columns[0]?.id || '');
      setClientId('');
      setProposalId('');
      setSelectedAssignees([]);
    }
  }, [task, defaultColumnId, columns, prefillData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !columnId) return;

    onSave({
      id: task?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate?.toISOString() || null,
      column_id: columnId,
      client_id: clientId || null,
      proposal_id: proposalId || null,
      assignee_ids: selectedAssignees,
    });
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da tarefa"
              required
            />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Coluna *</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: col.color }}
                        />
                        {col.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={clientId || "none"} onValueChange={(val) => setClientId(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cotação</Label>
              <Select value={proposalId || "none"} onValueChange={(val) => setProposalId(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {proposals?.map((proposal) => (
                    <SelectItem key={proposal.id} value={proposal.id}>
                      #{proposal.number} - {proposal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {users && users.length > 0 && (
            <div className="space-y-2">
              <Label>Responsáveis</Label>
              <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedAssignees.includes(user.id)}
                      onCheckedChange={() => toggleAssignee(user.id)}
                    />
                    <label
                      htmlFor={`user-${user.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {user.name} ({user.email})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

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
      </DialogContent>
    </Dialog>
  );
}
