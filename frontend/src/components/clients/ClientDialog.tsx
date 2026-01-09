import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Search } from 'lucide-react';
import { Client, ClientInput } from '@/hooks/useClients';
import { useFavoriteDestinations } from '@/hooks/useFavoriteDestinations';

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
    favorite_destination_ids: [],
  });
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [birthInput, setBirthInput] = useState<string>('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const { destinations, isLoading: isLoadingDestinations } = useFavoriteDestinations();

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
        favorite_destination_ids: client.favorite_destinations?.map((destination) => destination.id) ?? [],
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
        favorite_destination_ids: [],
      });
      setBirthInput('');
    }
    setErrors({});
    setDestinationSearch('');
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

  const filteredDestinations = destinations.filter((destination) => {
    if (!destinationSearch.trim()) return true;
    const term = destinationSearch.toLowerCase();
    return (
      destination.name.toLowerCase().includes(term) ||
      (destination.notes ?? '').toLowerCase().includes(term)
    );
  });

  const toggleDestination = (destinationId: string, checked: boolean) => {
    const current = formData.favorite_destination_ids ?? [];
    const next = checked
      ? current.includes(destinationId)
        ? current
        : [...current, destinationId]
      : current.filter((id) => id !== destinationId);
    setFormData({ ...formData, favorite_destination_ids: next });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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
          <div className="space-y-2">
            <Label>Destinos favoritos</Label>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar destinos favoritos..."
                  value={destinationSearch}
                  onChange={(e) => setDestinationSearch(e.target.value)}
                  className="pl-9 h-8 bg-white"
                />
              </div>
              {isLoadingDestinations ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando destinos...
                </div>
              ) : filteredDestinations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum destino favorito cadastrado.
                </p>
              ) : (
                <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
                  {filteredDestinations.map((destination) => {
                    const checked = formData.favorite_destination_ids?.includes(destination.id) ?? false;
                    return (
                      <label key={destination.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleDestination(destination.id, value === true)}
                        />
                        <span className="flex-1">{destination.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {formData.favorite_destination_ids && formData.favorite_destination_ids.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.favorite_destination_ids.map((destinationId) => {
                    const destination = destinations.find((item) => item.id === destinationId);
                    if (!destination) return null;
                    return (
                      <Badge key={destination.id} variant="secondary" className="rounded-full bg-white text-slate-600">
                        {destination.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
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
