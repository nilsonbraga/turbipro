import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CollaboratorTimeOff, TimeOffInput, TimeOffType, TimeOffStatus, timeOffTypeLabels, timeOffStatusLabels } from '@/hooks/useCollaboratorTimeOff';
import { Collaborator } from '@/hooks/useCollaborators';

interface TimeOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeOff?: CollaboratorTimeOff | null;
  collaborators: Collaborator[];
  onSave: (data: TimeOffInput & { id?: string }) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  preselectedCollaboratorId?: string;
}

export function TimeOffDialog({
  open,
  onOpenChange,
  timeOff,
  collaborators,
  onSave,
  onDelete,
  isLoading,
  preselectedCollaboratorId,
}: TimeOffDialogProps) {
  const [formData, setFormData] = useState<TimeOffInput>({
    collaborator_id: '',
    type: 'day_off',
    start_date: '',
    end_date: '',
    reason: '',
    status: 'approved',
  });

  useEffect(() => {
    if (timeOff) {
      setFormData({
        collaborator_id: timeOff.collaborator_id,
        type: timeOff.type,
        start_date: timeOff.start_date,
        end_date: timeOff.end_date,
        reason: timeOff.reason || '',
        status: timeOff.status,
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        collaborator_id: preselectedCollaboratorId || '',
        type: 'day_off',
        start_date: today,
        end_date: today,
        reason: '',
        status: 'approved',
      });
    }
  }, [timeOff, open, preselectedCollaboratorId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timeOff) {
      onSave({ ...formData, id: timeOff.id });
    } else {
      onSave(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {timeOff ? 'Editar Férias/Folga' : 'Nova Férias/Folga'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collaborator">Colaborador</Label>
            <Select
              value={formData.collaborator_id}
              onValueChange={(value) => setFormData({ ...formData, collaborator_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um colaborador" />
              </SelectTrigger>
              <SelectContent>
                {collaborators
                  .filter((c) => c.status === 'active')
                  .map((collaborator) => (
                    <SelectItem key={collaborator.id} value={collaborator.id}>
                      {collaborator.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as TimeOffType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(timeOffTypeLabels) as TimeOffType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {timeOffTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data Fim</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as TimeOffStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(timeOffStatusLabels) as TimeOffStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {timeOffStatusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              value={formData.reason || ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Observações ou motivo"
              rows={3}
            />
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {timeOff && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onDelete(timeOff.id)}
                >
                  Excluir
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading || !formData.collaborator_id}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
