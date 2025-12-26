import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Partner, PartnerInput } from '@/hooks/usePartners';

interface PartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: Partner | null;
  onSubmit: (data: PartnerInput & { id?: string }) => void;
  isLoading?: boolean;
}

const partnerTypes = [
  { value: 'airline', label: 'Companhia Aérea' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'car_rental', label: 'Locadora' },
  { value: 'tour_operator', label: 'Operadora' },
  { value: 'other', label: 'Outro' },
];

export function PartnerDialog({ open, onOpenChange, partner, onSubmit, isLoading }: PartnerDialogProps) {
  const [formData, setFormData] = useState<PartnerInput>({
    name: '',
    type: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name,
        type: partner.type || '',
        email: partner.email || '',
        phone: partner.phone || '',
        notes: partner.notes || '',
      });
    } else {
      setFormData({
        name: '',
        type: '',
        email: '',
        phone: '',
        notes: '',
      });
    }
  }, [partner, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (partner) {
      onSubmit({ ...formData, id: partner.id });
    } else {
      onSubmit(formData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{partner ? 'Editar Parceiro' : 'Novo Parceiro'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {partnerTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {partner ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
