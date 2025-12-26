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
import { Collaborator, CollaboratorInput, EmploymentType, CollaboratorLevel, CommissionBase } from '@/hooks/useCollaborators';
import { Team } from '@/hooks/useTeams';

interface CollaboratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborator?: Collaborator | null;
  teams: Team[];
  onSave: (data: CollaboratorInput & { id?: string }) => void;
  isLoading?: boolean;
}

const employmentTypeLabels: Record<EmploymentType, string> = {
  clt: 'CLT',
  pj: 'PJ',
  freela: 'Freelancer',
};

const levelLabels: Record<CollaboratorLevel, string> = {
  junior: 'Júnior',
  pleno: 'Pleno',
  senior: 'Sênior',
};

const commissionBaseLabels: Record<CommissionBase, string> = {
  sale_value: 'Valor da Venda',
  profit: 'Lucro/Margem',
};

export function CollaboratorDialog({ 
  open, 
  onOpenChange, 
  collaborator, 
  teams, 
  onSave, 
  isLoading 
}: CollaboratorDialogProps) {
  const [formData, setFormData] = useState<CollaboratorInput>({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    status: 'active',
    employment_type: 'clt',
    position: '',
    level: undefined,
    team_id: undefined,
    commission_percentage: 0,
    commission_base: 'sale_value',
  });

  useEffect(() => {
    if (collaborator) {
      setFormData({
        name: collaborator.name,
        email: collaborator.email || '',
        phone: collaborator.phone || '',
        cpf: collaborator.cpf || '',
        status: collaborator.status,
        employment_type: collaborator.employment_type,
        position: collaborator.position || '',
        level: collaborator.level || undefined,
        team_id: collaborator.team_id || undefined,
        commission_percentage: collaborator.commission_percentage,
        commission_base: collaborator.commission_base,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        status: 'active',
        employment_type: 'clt',
        position: '',
        level: undefined,
        team_id: undefined,
        commission_percentage: 0,
        commission_base: 'sale_value',
      });
    }
  }, [collaborator, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: collaborator?.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{collaborator ? 'Editar Colaborador' : 'Novo Colaborador'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf || ''}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vínculo</Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value) => setFormData({ ...formData, employment_type: value as EmploymentType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(employmentTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Ex: Consultor de Vendas"
              />
            </div>

            <div className="space-y-2">
              <Label>Nível</Label>
              <Select
                value={formData.level || 'none'}
                onValueChange={(value) => setFormData({ ...formData, level: value === 'none' ? undefined : value as CollaboratorLevel })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definido</SelectItem>
                  {Object.entries(levelLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equipe</Label>
              <Select
                value={formData.team_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, team_id: value === 'none' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem equipe</SelectItem>
                  {teams.filter(t => t.is_active).map((team) => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-4">Configuração de Comissão</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commission_percentage">Percentual de Comissão (%)</Label>
                <Input
                  id="commission_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commission_percentage}
                  onChange={(e) => setFormData({ ...formData, commission_percentage: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Base de Cálculo</Label>
                <Select
                  value={formData.commission_base}
                  onValueChange={(value) => setFormData({ ...formData, commission_base: value as CommissionBase })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(commissionBaseLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.commission_base === 'sale_value' 
                    ? 'A comissão será calculada sobre o valor total da venda'
                    : 'A comissão será calculada sobre o lucro/margem da venda'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? 'Salvando...' : collaborator ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
