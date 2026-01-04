import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
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
import { Loader2, User } from 'lucide-react';
import { Proposal, ProposalInput } from '@/hooks/useProposals';
import { PipelineStage } from '@/hooks/usePipelineStages';

interface Client {
  id: string;
  name: string;
}

interface Collaborator {
  id: string;
  name: string;
}

interface ProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal?: Proposal | null;
  clients: Client[];
  stages: PipelineStage[];
  collaborators?: Collaborator[];
  isAdmin?: boolean;
  onSubmit: (data: ProposalInput & { id?: string }) => void;
  isLoading?: boolean;
}

export function ProposalDialog({ 
  open, 
  onOpenChange, 
  proposal, 
  clients, 
  stages,
  collaborators = [],
  isAdmin = false,
  onSubmit, 
  isLoading 
}: ProposalDialogProps) {
  const [formData, setFormData] = useState<ProposalInput>({
    title: '',
    client_id: null,
    stage_id: null,
    assigned_collaborator_id: null,
    notes: '',
  });
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    if (proposal) {
      setFormData({
        title: proposal.title,
        client_id: proposal.client_id,
        stage_id: proposal.stage_id,
        assigned_collaborator_id: proposal.assigned_collaborator_id,
        notes: proposal.notes || '',
      });
    } else {
      const firstStage = stages.find(s => s.order === 0) || stages[0];
      setFormData({
        title: '',
        client_id: null,
        stage_id: firstStage?.id || null,
        assigned_collaborator_id: null,
        notes: '',
      });
    }
    setErrors({});
  }, [proposal, open, stages]);

  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: client.name,
  }));
  const stageOptions = stages.map((stage) => ({
    value: stage.id,
    label: stage.name,
  }));
  const collaboratorOptions = [
    { value: 'none', label: 'Nenhum' },
    ...collaborators.map((collaborator) => ({
      value: collaborator.id,
      label: collaborator.name,
    })),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors: { title?: string } = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    if (proposal && proposal.id) {
      onSubmit({ ...formData, id: proposal.id });
    } else {
      onSubmit(formData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{proposal ? 'Editar Proposta' : 'Nova Proposta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors({ ...errors, title: undefined });
              }}
              placeholder="Ex: Viagem para Paris"
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Combobox
                options={clientOptions}
                value={formData.client_id || ''}
                onValueChange={(value) => setFormData({ ...formData, client_id: value || null })}
                placeholder="Selecione"
                searchPlaceholder="Buscar cliente..."
                emptyText="Nenhum cliente encontrado"
                buttonClassName="w-full"
                contentClassName="w-[260px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stage">Estágio</Label>
              <Combobox
                options={stageOptions}
                value={formData.stage_id || ''}
                onValueChange={(value) => setFormData({ ...formData, stage_id: value || null })}
                placeholder="Selecione"
                searchPlaceholder="Buscar estágio..."
                emptyText="Nenhum estágio encontrado"
                buttonClassName="w-full"
                contentClassName="w-[260px]"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="collaborator">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Vendedor Responsável
                </div>
              </Label>
              <Combobox
                options={collaboratorOptions}
                value={formData.assigned_collaborator_id || 'none'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    assigned_collaborator_id: value === 'none' ? null : value,
                  })
                }
                placeholder="Selecione o vendedor"
                searchPlaceholder="Buscar vendedor..."
                emptyText="Nenhum vendedor encontrado"
                buttonClassName="w-full"
                contentClassName="w-[260px]"
              />
              <p className="text-xs text-muted-foreground">
                Ao fechar este lead, a comissão será atribuída ao vendedor selecionado
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informações adicionais..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {proposal ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
