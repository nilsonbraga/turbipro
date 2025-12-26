import { useState } from 'react';
import { useSubscriptionPlans, SubscriptionPlan, SubscriptionPlanInput } from '@/hooks/useSubscriptionPlans';
import { ALL_MODULES } from '@/hooks/useModuleAccess';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Loader2, CreditCard, Package } from 'lucide-react';

interface FormData extends SubscriptionPlanInput {
  modules: string[];
}

export function SubscriptionPlansCard() {
  const { plans, isLoading, createPlan, updatePlan, deletePlan, isCreating, isUpdating, isDeleting } = useSubscriptionPlans();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    max_proposals: null,
    max_clients: null,
    max_users: null,
    trial_days: null,
    is_active: true,
    modules: ALL_MODULES.map(m => m.key),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price_monthly: 0,
      price_yearly: 0,
      max_proposals: null,
      max_clients: null,
      max_users: null,
      trial_days: null,
      is_active: true,
      modules: ALL_MODULES.map(m => m.key),
    });
    setEditingPlan(null);
  };

  const handleOpenDialog = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        stripe_price_id_monthly: plan.stripe_price_id_monthly || '',
        stripe_price_id_yearly: plan.stripe_price_id_yearly || '',
        max_proposals: plan.max_proposals,
        max_clients: plan.max_clients,
        max_users: plan.max_users,
        trial_days: plan.trial_days,
        is_active: plan.is_active,
        modules: (plan as any).modules || ALL_MODULES.map(m => m.key),
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      modules: formData.modules,
    };
    
    if (editingPlan) {
      updatePlan({ ...submitData, id: editingPlan.id } as any);
    } else {
      createPlan(submitData as any);
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (plan: SubscriptionPlan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (planToDelete) {
      deletePlan(planToDelete.id);
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const toggleModule = (moduleKey: string) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.includes(moduleKey)
        ? prev.modules.filter(m => m !== moduleKey)
        : [...prev.modules, moduleKey]
    }));
  };

  const selectAllModules = () => {
    setFormData(prev => ({
      ...prev,
      modules: ALL_MODULES.map(m => m.key)
    }));
  };

  const deselectAllModules = () => {
    setFormData(prev => ({
      ...prev,
      modules: []
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Planos de Assinatura
          </CardTitle>
          <CardDescription>
            Gerencie os planos disponíveis para as agências
          </CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum plano cadastrado
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Preço Mensal</TableHead>
                <TableHead>Preço Anual</TableHead>
                <TableHead>Limites</TableHead>
                <TableHead>Módulos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {plan.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(plan.price_monthly)}</TableCell>
                  <TableCell>{formatCurrency(plan.price_yearly)}</TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div>Propostas: {plan.max_proposals ?? 'Ilimitado'}</div>
                      <div>Clientes: {plan.max_clients ?? 'Ilimitado'}</div>
                      <div>Usuários: {plan.max_users ?? 'Ilimitado'}</div>
                      {plan.trial_days && <div className="text-primary">Trial: {plan.trial_days} dias</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {((plan as any).modules?.length || ALL_MODULES.length)} módulos
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                      {plan.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(plan)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => handleDelete(plan)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Plan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              <div className="space-y-2">
                <Label>Nome do Plano</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Básico"
                />
              </div>
              <div className="space-y-2 flex items-center gap-4 pt-6">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Plano ativo</Label>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do plano..."
                />
              </div>
              <div className="space-y-2">
                <Label>Preço Mensal (R$)</Label>
                <Input
                  type="number"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Preço Anual (R$)</Label>
                <Input
                  type="number"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Stripe Price ID (Mensal)</Label>
                <Input
                  value={formData.stripe_price_id_monthly || ''}
                  onChange={(e) => setFormData({ ...formData, stripe_price_id_monthly: e.target.value })}
                  placeholder="price_..."
                />
              </div>
              <div className="space-y-2">
                <Label>Stripe Price ID (Anual)</Label>
                <Input
                  value={formData.stripe_price_id_yearly || ''}
                  onChange={(e) => setFormData({ ...formData, stripe_price_id_yearly: e.target.value })}
                  placeholder="price_..."
                />
              </div>
              <div className="space-y-2">
                <Label>Máximo de Propostas</Label>
                <Input
                  type="number"
                  value={formData.max_proposals ?? ''}
                  onChange={(e) => setFormData({ ...formData, max_proposals: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Deixe vazio para ilimitado"
                />
              </div>
              <div className="space-y-2">
                <Label>Máximo de Clientes</Label>
                <Input
                  type="number"
                  value={formData.max_clients ?? ''}
                  onChange={(e) => setFormData({ ...formData, max_clients: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Deixe vazio para ilimitado"
                />
              </div>
              <div className="space-y-2">
                <Label>Máximo de Usuários</Label>
                <Input
                  type="number"
                  value={formData.max_users ?? ''}
                  onChange={(e) => setFormData({ ...formData, max_users: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Deixe vazio para ilimitado"
                />
              </div>
              <div className="space-y-2">
                <Label>Dias de Período de Teste</Label>
                <Input
                  type="number"
                  value={formData.trial_days ?? ''}
                  onChange={(e) => setFormData({ ...formData, trial_days: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Ex: 14"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Quantos dias de teste grátis antes de cobrar
                </p>
              </div>
              
              {/* Modules Selection */}
              <div className="space-y-3 col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Módulos Inclusos
                  </Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={selectAllModules}>
                      Selecionar Todos
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={deselectAllModules}>
                      Limpar
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {ALL_MODULES.map((module) => (
                      <div 
                        key={module.key}
                        className="flex items-start gap-2"
                      >
                        <Checkbox
                          id={module.key}
                          checked={formData.modules.includes(module.key)}
                          onCheckedChange={() => toggleModule(module.key)}
                        />
                        <div className="grid gap-0.5">
                          <label
                            htmlFor={module.key}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {module.label}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {module.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.modules.length} de {ALL_MODULES.length} módulos selecionados
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating || isUpdating || !formData.name}>
              {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o plano "{planToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
