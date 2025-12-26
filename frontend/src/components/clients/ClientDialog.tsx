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
import { Loader2 } from 'lucide-react';
import { Client, ClientInput } from '@/hooks/useClients';

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSubmit: (data: ClientInput & { id?: string }) => void;
  isLoading?: boolean;
}

export function ClientDialog({ open, onOpenChange, client, onSubmit, isLoading }: ClientDialogProps) {
  const [formData, setFormData] = useState<ClientInput>({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    passport: '',
    birth_date: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [birthInput, setBirthInput] = useState<string>('');

  useEffect(() => {
    if (client) {
      const birthStr = client.birth_date
        ? client.birth_date.includes('-')
          ? client.birth_date.split('-').reverse().join('/')
          : client.birth_date
        : '';
      setFormData({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        cpf: client.cpf || '',
        passport: client.passport || '',
        birth_date: birthStr || '',
        address: client.address || '',
        notes: client.notes || '',
      });
      setBirthInput(birthStr || '');
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        passport: '',
        birth_date: '',
        address: '',
        notes: '',
      });
      setBirthInput('');
    }
    setErrors({});
  }, [client, open]);

  const formatDateInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
    return parts.join('/');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors: { name?: string } = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    // Persist formatted birth date back to formData
    const finalBirth = birthInput && birthInput.length === 10 ? birthInput : '';
    const payload = { ...formData, birth_date: finalBirth };

    if (client && client.id) {
      onSubmit({ ...payload, id: client.id });
    } else {
      onSubmit(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{client?.id ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passport">Passaporte</Label>
              <Input
                id="passport"
                value={formData.passport}
                onChange={(e) => setFormData({ ...formData, passport: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input
              id="birth_date"
              placeholder="dd/mm/aaaa"
              value={birthInput}
              onChange={(e) => {
                const formatted = formatDateInput(e.target.value);
                setBirthInput(formatted);
                setFormData({ ...formData, birth_date: formatted });
              }}
              inputMode="numeric"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
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
              {client?.id ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
