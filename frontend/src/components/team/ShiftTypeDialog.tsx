import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ShiftType, ShiftTypeInput } from '@/hooks/useShiftTypes';

interface ShiftTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftType?: ShiftType | null;
  onSave: (data: ShiftTypeInput & { id?: string }) => void;
  isLoading?: boolean;
}

export function ShiftTypeDialog({
  open,
  onOpenChange,
  shiftType,
  onSave,
  isLoading,
}: ShiftTypeDialogProps) {
  const [formData, setFormData] = useState<ShiftTypeInput>({
    name: '',
    start_time: '08:00',
    end_time: '17:00',
    color: '#3B82F6',
    is_active: true,
  });

  useEffect(() => {
    if (shiftType) {
      setFormData({
        name: shiftType.name,
        start_time: shiftType.start_time,
        end_time: shiftType.end_time,
        color: shiftType.color,
        is_active: shiftType.is_active,
      });
    } else {
      setFormData({
        name: '',
        start_time: '08:00',
        end_time: '17:00',
        color: '#3B82F6',
        is_active: true,
      });
    }
  }, [shiftType, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shiftType) {
      onSave({ ...formData, id: shiftType.id });
    } else {
      onSave(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {shiftType ? 'Editar Tipo de Plantão' : 'Novo Tipo de Plantão'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Manhã, Tarde, Noite"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Hora Início</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Hora Fim</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-16 h-10 p-1"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Ativo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
