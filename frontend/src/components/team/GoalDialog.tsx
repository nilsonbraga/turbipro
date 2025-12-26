import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collaborator } from '@/hooks/useCollaborators';
import { GoalInput } from '@/hooks/useCollaboratorGoals';

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborator: Collaborator | null;
  currentGoal?: {
    target_sales_value: number;
    target_profit: number;
    target_deals_count: number;
  };
  onSave: (data: GoalInput) => void;
  isLoading?: boolean;
}

const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export function GoalDialog({ 
  open, 
  onOpenChange, 
  collaborator, 
  currentGoal, 
  onSave, 
  isLoading 
}: GoalDialogProps) {
  const currentDate = new Date();
  const [formData, setFormData] = useState({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    target_sales_value: 0,
    target_profit: 0,
    target_deals_count: 0,
  });

  useEffect(() => {
    if (currentGoal) {
      setFormData(prev => ({
        ...prev,
        target_sales_value: currentGoal.target_sales_value,
        target_profit: currentGoal.target_profit,
        target_deals_count: currentGoal.target_deals_count,
      }));
    } else {
      setFormData({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        target_sales_value: 0,
        target_profit: 0,
        target_deals_count: 0,
      });
    }
  }, [currentGoal, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collaborator) return;
    
    onSave({
      collaborator_id: collaborator.id,
      month: formData.month,
      year: formData.year,
      target_sales_value: formData.target_sales_value,
      target_profit: formData.target_profit,
      target_deals_count: formData.target_deals_count,
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Definir Meta - {collaborator?.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select
                value={String(formData.month)}
                onValueChange={(value) => setFormData({ ...formData, month: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={String(month.value)}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ano</Label>
              <Select
                value={String(formData.year)}
                onValueChange={(value) => setFormData({ ...formData, year: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_sales_value">Meta de Vendas (R$)</Label>
            <Input
              id="target_sales_value"
              type="number"
              min="0"
              step="0.01"
              value={formData.target_sales_value}
              onChange={(e) => setFormData({ ...formData, target_sales_value: Number(e.target.value) })}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_profit">Meta de Lucro (R$)</Label>
            <Input
              id="target_profit"
              type="number"
              min="0"
              step="0.01"
              value={formData.target_profit}
              onChange={(e) => setFormData({ ...formData, target_profit: Number(e.target.value) })}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_deals_count">Meta de Vendas Fechadas</Label>
            <Input
              id="target_deals_count"
              type="number"
              min="0"
              step="1"
              value={formData.target_deals_count}
              onChange={(e) => setFormData({ ...formData, target_deals_count: Number(e.target.value) })}
              placeholder="0"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Meta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
