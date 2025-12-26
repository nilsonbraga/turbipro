import { useState } from 'react';
import { useDiscountCoupons, DiscountCoupon, DiscountCouponInput } from '@/hooks/useDiscountCoupons';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Edit, Trash2, Ticket, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function DiscountCouponsCard() {
  const { coupons, createCoupon, updateCoupon, deleteCoupon, isCreating, isUpdating, isDeleting } = useDiscountCoupons();
  const { plans } = useSubscriptionPlans();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<DiscountCoupon | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<DiscountCoupon | null>(null);
  
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const openDialog = (coupon?: DiscountCoupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCode(coupon.code);
      setDescription(coupon.description || '');
      setDiscountType(coupon.discount_type);
      setDiscountValue(coupon.discount_value.toString());
      setValidFrom(coupon.valid_from ? coupon.valid_from.split('T')[0] : '');
      setValidUntil(coupon.valid_until ? coupon.valid_until.split('T')[0] : '');
      setMaxUses(coupon.max_uses?.toString() || '');
      setSelectedPlans(coupon.applicable_plans || []);
      setIsActive(coupon.is_active);
    } else {
      setEditingCoupon(null);
      setCode('');
      setDescription('');
      setDiscountType('percentage');
      setDiscountValue('');
      setValidFrom('');
      setValidUntil('');
      setMaxUses('');
      setSelectedPlans([]);
      setIsActive(true);
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    const data: DiscountCouponInput = {
      code,
      description: description || undefined,
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      valid_from: validFrom ? `${validFrom}T00:00:00Z` : null,
      valid_until: validUntil ? `${validUntil}T23:59:59Z` : null,
      max_uses: maxUses ? parseInt(maxUses) : null,
      applicable_plans: selectedPlans.length > 0 ? selectedPlans : null,
      is_active: isActive,
    };

    if (editingCoupon) {
      updateCoupon({ ...data, id: editingCoupon.id });
    } else {
      createCoupon(data);
    }
    setDialogOpen(false);
  };

  const handleDelete = (coupon: DiscountCoupon) => {
    setCouponToDelete(coupon);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (couponToDelete) {
      deleteCoupon(couponToDelete.id);
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
    }
  };

  const togglePlan = (planId: string) => {
    setSelectedPlans(prev =>
      prev.includes(planId)
        ? prev.filter(p => p !== planId)
        : [...prev, planId]
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Cupons de Desconto
              </CardTitle>
              <CardDescription>
                Gerencie cupons de desconto para assinaturas
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cupom
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {coupons.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum cupom cadastrado
              </p>
            ) : (
              coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg">{coupon.code}</span>
                      <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                        {coupon.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge variant="outline">
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}%`
                          : `R$ ${coupon.discount_value.toFixed(2)}`
                        }
                      </Badge>
                    </div>
                    {coupon.description && (
                      <p className="text-sm text-muted-foreground mt-1">{coupon.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Usos: {coupon.current_uses}{coupon.max_uses ? `/${coupon.max_uses}` : ''}</span>
                      {coupon.valid_until && (
                        <span>
                          Válido até: {format(new Date(coupon.valid_until), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(coupon)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(coupon)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? 'Editar Cupom' : 'Novo Cupom de Desconto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código do Cupom *</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EX: PROMO20"
                className="uppercase font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do cupom"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Desconto</Label>
                <Select value={discountType} onValueChange={(v: 'percentage' | 'fixed') => setDiscountType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValue">Valor *</Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? '20' : '50.00'}
                  min="0"
                  step={discountType === 'percentage' ? '1' : '0.01'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Válido a partir de</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Válido até</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxUses">Limite de Usos (deixe vazio para ilimitado)</Label>
              <Input
                id="maxUses"
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="100"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Planos Aplicáveis (deixe vazio para todos)</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {plans.map((plan) => (
                  <div key={plan.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`plan-${plan.id}`}
                      checked={selectedPlans.includes(plan.id)}
                      onCheckedChange={() => togglePlan(plan.id)}
                    />
                    <Label htmlFor={`plan-${plan.id}`} className="font-normal cursor-pointer">
                      {plan.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Cupom Ativo</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!code || !discountValue || isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCoupon ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cupom</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cupom "{couponToDelete?.code}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
