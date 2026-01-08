import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomItineraries, CustomItineraryInput } from '@/hooks/useCustomItineraries';
import { useClients } from '@/hooks/useClients';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '@/components/itineraries/ImageUploader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ItineraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItinerary?: any;
}

export default function ItineraryDialog({ open, onOpenChange, editingItinerary }: ItineraryDialogProps) {
  const navigate = useNavigate();
  const { createItinerary, isCreating } = useCustomItineraries();
  const { clients } = useClients();

  const [formData, setFormData] = useState<CustomItineraryInput>({
    title: '',
    description: '',
    destination: '',
    client_id: '',
    start_date: '',
    end_date: '',
    logo_url: '',
    requires_token: false,
    access_token: '',
  });

  useEffect(() => {
    if (editingItinerary) {
      setFormData({
        title: editingItinerary.title || '',
        description: editingItinerary.description || '',
        destination: editingItinerary.destination || '',
        client_id: editingItinerary.client_id || '',
        start_date: editingItinerary.start_date ? editingItinerary.start_date.slice(0, 10) : '',
        end_date: editingItinerary.end_date ? editingItinerary.end_date.slice(0, 10) : '',
        logo_url: editingItinerary.logo_url || '',
        requires_token: editingItinerary.requires_token || false,
        access_token: editingItinerary.access_token || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        destination: '',
        client_id: '',
        start_date: '',
        end_date: '',
        logo_url: '',
        requires_token: false,
        access_token: '',
      });
    }
  }, [editingItinerary, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const input: CustomItineraryInput = {
      ...formData,
      client_id: formData.client_id || undefined,
    };

    const newItinerary = await createItinerary(input);
    onOpenChange(false);
    // Navigate to edit page to add days and items
    navigate(`/itineraries/${newItinerary.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Roteiro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <ImageUploader
                value={formData.logo_url || ''}
                onChange={(url) => setFormData({ ...formData, logo_url: url })}
                label="Logo do Roteiro"
                folder="logos"
                aspectRatio="square"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="title">Título do Roteiro *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Viagem para Portugal - Família Silva"
                required
              />
            </div>

            <div>
              <Label htmlFor="destination">Destino</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="Ex: Portugal"
              />
            </div>

            <div>
              <Label htmlFor="client">Cliente</Label>
              <Select
                value={formData.client_id || 'none'}
                onValueChange={(v) => setFormData({ ...formData, client_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem cliente</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="end_date">Data de Fim</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Uma breve descrição do roteiro..."
                rows={3}
              />
            </div>

            <div className="col-span-2 border-t pt-4">
              <h3 className="font-medium mb-3">Configurações de Acesso</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requires_token">Requer senha de acesso</Label>
                    <p className="text-sm text-muted-foreground">
                      O cliente precisará de uma senha para visualizar o roteiro
                    </p>
                  </div>
                  <Switch
                    id="requires_token"
                    checked={formData.requires_token}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_token: checked })}
                  />
                </div>

                {formData.requires_token && (
                  <div>
                    <Label htmlFor="access_token">Senha de Acesso</Label>
                    <Input
                      id="access_token"
                      value={formData.access_token}
                      onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                      placeholder="Digite uma senha..."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating || !formData.title}>
              {isCreating ? 'Criando...' : 'Criar e Editar Dias'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
