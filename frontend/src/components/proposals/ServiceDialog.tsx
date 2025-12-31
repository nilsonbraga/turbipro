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
import { ServiceInput } from '@/hooks/useProposalServices';

import {
  FlightFields,
  HotelFields,
  CarFields,
  PackageFields,
  TourFields,
  CruiseFields,
  InsuranceFields,
  TransferFields,
  OtherFields,
} from './service-fields';

interface Partner {
  id: string;
  name: string;
}

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: string;
  service?: any;
  partners: Partner[];
  onSubmit: (data: ServiceInput & { id?: string }) => void;
  isLoading?: boolean;
  initialType?: string;
  mode?: 'create' | 'edit' | 'view';
}

const serviceTypes = [
  { value: 'flight', label: 'Voo' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'car', label: 'Carro' },
  { value: 'package', label: 'Pacote' },
  { value: 'tour', label: 'Roteiro' },
  { value: 'cruise', label: 'Cruzeiro' },
  { value: 'insurance', label: 'Seguro' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'other', label: 'Outro' },
];

export function ServiceDialog({ 
  open, 
  onOpenChange, 
  proposalId,
  service, 
  partners,
  onSubmit, 
  isLoading,
  initialType,
  mode = 'create',
}: ServiceDialogProps) {
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const parseCurrency = (input: string) => {
    const onlyDigits = input.replace(/\D/g, '');
    if (!onlyDigits) return 0;
    return Number(onlyDigits) / 100;
  };

  const [formData, setFormData] = useState<ServiceInput & { commission_type: string; commission_value: number; details: Record<string, any>; unit_value: number; quantity: number }>({
    proposal_id: proposalId,
    type: 'flight',
    description: '',
    partner_id: null,
    start_date: null,
    end_date: null,
    start_time: null,
    end_time: null,
    value: 0,
    unit_value: 0,
    quantity: 1,
    commission_type: 'percentage',
    commission_value: 0,
    details: {},
  });
  const [unitValueInput, setUnitValueInput] = useState('');
  const [commissionValueInput, setCommissionValueInput] = useState('');
  const [commissionPercentInput, setCommissionPercentInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('1');
  const isViewMode = mode === 'view';
  const dialogTitle = isViewMode ? 'Detalhes do Serviço' : service ? 'Editar Serviço' : 'Novo Serviço';

  useEffect(() => {
    if (service) {
      const quantity = service.details?.quantity || 1;
      const totalValue = service.value || 0;
      const unitValue = service.details?.unit_value || (quantity > 0 ? totalValue / quantity : totalValue);
      setFormData({
        proposal_id: proposalId,
        type: service.type || 'flight',
        description: service.description || '',
        partner_id: service.partner_id || null,
        start_date: service.start_date || null,
        end_date: service.end_date || null,
        start_time: service.start_time || null,
        end_time: service.end_time || null,
        value: totalValue,
        unit_value: unitValue,
        quantity: quantity,
        commission_type: service.commission_type || 'percentage',
        commission_value: service.commission_value || 0,
        details: service.details || {},
      });
      setUnitValueInput(unitValue ? formatCurrency(unitValue) : '');
      setCommissionValueInput(
        service.commission_type === 'fixed' && service.commission_value
          ? formatCurrency(service.commission_value)
          : '',
      );
      setCommissionPercentInput(
        service.commission_type === 'percentage' && service.commission_value
          ? String(service.commission_value)
          : '',
      );
      setQuantityInput(String(quantity || 1));
    } else {
      setFormData({
        proposal_id: proposalId,
        type: initialType || 'flight',
        description: '',
        partner_id: null,
        start_date: null,
        end_date: null,
        start_time: null,
        end_time: null,
        value: 0,
        unit_value: 0,
        quantity: 1,
        commission_type: 'percentage',
        commission_value: 0,
        details: {},
      });
      setUnitValueInput('');
      setCommissionValueInput('');
      setCommissionPercentInput('');
      setQuantityInput('1');
    }
  }, [service, proposalId, open, initialType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewMode) {
      onOpenChange(false);
      return;
    }
    
    // Build submission data excluding unit_value and quantity from top level
    // They are stored only in details JSONB field
    const { unit_value, quantity, ...restFormData } = formData;
    
    const submissionData = {
      ...restFormData,
      value: unit_value * quantity, // Total value
      details: {
        ...formData.details,
        unit_value: unit_value,
        quantity: quantity,
      }
    };
    
    if (service) {
      onSubmit({ ...submissionData, id: service.id });
    } else {
      onSubmit(submissionData);
    }
    onOpenChange(false);
  };

  const handleDetailsChange = (details: Record<string, any>) => {
    setFormData({ ...formData, details });
  };

  const handleCurrencyChange = (field: 'unit_value' | 'commission_value', rawValue: string) => {
    const numeric = parseCurrency(rawValue);
    const formatted = rawValue === '' ? '' : formatCurrency(numeric);
    if (field === 'unit_value') setUnitValueInput(formatted);
    if (field === 'commission_value') setCommissionValueInput(formatted);

    setFormData((prev) => ({
      ...prev,
      [field]: numeric,
      value: field === 'unit_value' ? numeric * prev.quantity : prev.value,
    }));
  };

  const totalValue = formData.unit_value * formData.quantity;

  // Calculate commission based on type
  const calculatedCommission = formData.commission_type === 'percentage'
    ? (totalValue * (formData.commission_value || 0)) / 100
    : formData.commission_value || 0;
  
  const calculatedPercentage = totalValue > 0 && formData.commission_type === 'fixed'
    ? ((formData.commission_value || 0) / totalValue * 100).toFixed(1)
    : formData.commission_value?.toFixed(1) || '0';

  // Handle commission type toggle and recalculate
  const handleCommissionTypeChange = (newType: string) => {
    if (newType === formData.commission_type) return;
    
    let newValue = 0;
    if (newType === 'fixed' && formData.commission_type === 'percentage') {
      newValue = (totalValue * (formData.commission_value || 0)) / 100;
    } else if (newType === 'percentage' && formData.commission_type === 'fixed') {
      newValue = totalValue > 0 ? ((formData.commission_value || 0) / totalValue * 100) : 0;
    }
    
    setFormData({ 
      ...formData, 
      commission_type: newType,
      commission_value: Math.round(newValue * 100) / 100
    });
  };

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'flight':
        return (
          <FlightFields
            details={formData.details as any}
            onChange={handleDetailsChange}
            partnerId={formData.partner_id}
            partners={partners}
            onPartnerChange={(id) => setFormData({ ...formData, partner_id: id })}
          />
        );
      case 'hotel':
        return (
          <HotelFields
            details={formData.details as any}
            onChange={handleDetailsChange}
            partnerId={formData.partner_id}
            partners={partners}
            onPartnerChange={(id) => setFormData({ ...formData, partner_id: id })}
          />
        );
      case 'car':
        return (
          <CarFields
            details={formData.details as any}
            onChange={handleDetailsChange}
            partnerId={formData.partner_id}
            partners={partners}
            onPartnerChange={(id) => setFormData({ ...formData, partner_id: id })}
          />
        );
      case 'package':
        return (
          <PackageFields
            details={formData.details as any}
            onChange={handleDetailsChange}
            partnerId={formData.partner_id}
            partners={partners}
            onPartnerChange={(id) => setFormData({ ...formData, partner_id: id })}
          />
        );
      case 'tour':
        return (
          <TourFields
            details={formData.details as any}
            onChange={handleDetailsChange}
            partnerId={formData.partner_id}
            partners={partners}
            onPartnerChange={(id) => setFormData({ ...formData, partner_id: id })}
          />
        );
      case 'cruise':
        return (
          <CruiseFields
            details={formData.details as any}
            onChange={handleDetailsChange}
            partnerId={formData.partner_id}
            partners={partners}
            onPartnerChange={(id) => setFormData({ ...formData, partner_id: id })}
          />
        );
      case 'insurance':
        return (
          <InsuranceFields
            details={formData.details as any}
            onChange={handleDetailsChange}
            partnerId={formData.partner_id}
            partners={partners}
            onPartnerChange={(id) => setFormData({ ...formData, partner_id: id })}
          />
        );
      case 'transfer':
        return (
          <TransferFields
            details={formData.details as any}
            onChange={handleDetailsChange}
            partnerId={formData.partner_id}
            partners={partners}
            onPartnerChange={(id) => setFormData({ ...formData, partner_id: id })}
          />
        );
      case 'other':
        return (
          <OtherFields
            details={formData.details as any}
            onChange={handleDetailsChange}
            partnerId={formData.partner_id}
            partners={partners}
            onPartnerChange={(id) => setFormData({ ...formData, partner_id: id })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <fieldset
            disabled={isViewMode}
            className={`flex-1 min-h-0 flex flex-col ${isViewMode ? 'opacity-90' : ''}`}
          >
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-6 pb-4">
                {/* Tipo já foi escolhido antes de abrir o modal */}

                {/* Type-Specific Fields */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  {renderTypeSpecificFields()}
                </div>

                {/* Description - common */}
                <div className="space-y-2">
                  <Label>Descrição / Observações</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Informações adicionais sobre este serviço..."
                    rows={2}
                  />
                </div>

                {/* Value and Commission */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Valor Unitário (R$) *</Label>
                    <Input
                      value={unitValueInput}
                      onChange={(e) => handleCurrencyChange('unit_value', e.target.value)}
                      inputMode="decimal"
                      placeholder="R$ 0,00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      value={quantityInput}
                      inputMode="numeric"
                      placeholder="1"
                      onChange={(e) => {
                        const raw = e.target.value;
                        setQuantityInput(raw);
                        const qty = parseInt(raw, 10);
                        const safeQty = Number.isNaN(qty) || qty <= 0 ? 1 : qty;
                        setFormData({
                          ...formData,
                          quantity: safeQty,
                          value: formData.unit_value * safeQty,
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Total (R$)</Label>
                    <Input
                      value={formatCurrency(formData.unit_value * formData.quantity)}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">

                  <div className="space-y-2">
                    <Label>Comissão</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.commission_type}
                        onValueChange={handleCommissionTypeChange}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="fixed">R$</SelectItem>
                        </SelectContent>
                      </Select>
                    <Input
                      type={formData.commission_type === 'percentage' ? 'text' : 'text'}
                      step="0.01"
                      min="0"
                      value={formData.commission_type === 'percentage' ? commissionPercentInput : commissionValueInput}
                      onChange={(e) => {
                        if (formData.commission_type === 'percentage') {
                          const raw = e.target.value;
                          setCommissionPercentInput(raw);
                          const numeric = parseFloat(raw);
                          setFormData({ ...formData, commission_value: Number.isNaN(numeric) ? 0 : numeric });
                        } else {
                          handleCurrencyChange('commission_value', e.target.value);
                        }
                      }}
                      className="flex-1"
                      placeholder={formData.commission_type === 'percentage' ? '0' : 'R$ 0,00'}
                      inputMode={formData.commission_type === 'percentage' ? 'decimal' : 'numeric'}
                    />
                  </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.commission_type === 'percentage' 
                        ? `= R$ ${calculatedCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : `= ${calculatedPercentage}% do valor`
                      }
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Comissão:</span>
                    <span className="text-primary font-medium">
                      R$ {calculatedCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
          </fieldset>

          {!isViewMode && (
            <DialogFooter className="mt-4 flex-shrink-0 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {service ? 'Salvar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
