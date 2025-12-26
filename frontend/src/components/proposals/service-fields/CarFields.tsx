import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format as formatDate } from 'date-fns';

interface CarDetails {
  rentalCompany: string;
  pickupLocation: string;
  pickupAt: string;
  dropoffLocation: string;
  dropoffAt: string;
  carCategory: string;
  transmission: 'auto' | 'manual';
  driverName?: string;
  driverAge?: number;
  mileagePolicy: string;
  fuelPolicy: string;
  insurance?: string;
  deposit?: string;
  extras?: string;
}

interface CarFieldsProps {
  details: CarDetails;
  onChange: (details: CarDetails) => void;
}

const parseDate = (value?: string) => {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(Date.UTC(y, m - 1, d, 12));
};

const DatePickerField = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const dateObj = parseDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateObj ? formatDate(dateObj, "dd/MM/yyyy") : (placeholder || "Selecionar")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateObj}
          onSelect={(day) => {
            onChange(day ? formatDate(day, "yyyy-MM-dd") : '');
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

const splitDateTime = (value?: string) => ({
  date: value ? value.slice(0, 10) : '',
  time: value && value.includes('T') ? value.slice(11, 16) : '',
});

const combineDateTime = (date?: string, time?: string) => {
  if (!date) return '';
  return `${date}T${time || '00:00'}`;
};

const timeOptions = Array.from({ length: 48 }).map((_, idx) => {
  const hours = Math.floor(idx / 2)
    .toString()
    .padStart(2, '0');
  const minutes = idx % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});

export function CarFields({ details, onChange }: CarFieldsProps) {
  const data: CarDetails = {
    rentalCompany: details?.rentalCompany || '',
    pickupLocation: details?.pickupLocation || '',
    pickupAt: details?.pickupAt || '',
    dropoffLocation: details?.dropoffLocation || '',
    dropoffAt: details?.dropoffAt || '',
    carCategory: details?.carCategory || '',
    transmission: details?.transmission || 'auto',
    driverName: details?.driverName || '',
    driverAge: details?.driverAge,
    mileagePolicy: details?.mileagePolicy || '',
    fuelPolicy: details?.fuelPolicy || '',
    insurance: details?.insurance || '',
    deposit: details?.deposit || '',
    extras: details?.extras || '',
  };

  const updateField = <K extends keyof CarDetails>(key: K, value: CarDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Locadora *</Label>
        <Input
          value={data.rentalCompany}
          onChange={(e) => updateField('rentalCompany', e.target.value)}
          placeholder="Localiza, Hertz, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoria do Veículo</Label>
          <Input
            value={data.carCategory}
            onChange={(e) => updateField('carCategory', e.target.value)}
            placeholder="SUV Compacto"
          />
        </div>
        <div className="space-y-2">
          <Label>Câmbio</Label>
          <Select value={data.transmission} onValueChange={(v) => updateField('transmission', v as 'auto' | 'manual')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automático</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Local de Retirada</Label>
          <Input
            value={data.pickupLocation}
            onChange={(e) => updateField('pickupLocation', e.target.value)}
            placeholder="Aeroporto CDG"
          />
        </div>
        <div className="space-y-2">
          <Label>Data/Hora Retirada</Label>
          <div className="grid grid-cols-2 gap-2">
            <DatePickerField
              value={splitDateTime(data.pickupAt).date}
              onChange={(date) => updateField('pickupAt', combineDateTime(date, splitDateTime(data.pickupAt).time))}
              placeholder="Data"
            />
            <Select
              value={splitDateTime(data.pickupAt).time || undefined}
              onValueChange={(time) => updateField('pickupAt', combineDateTime(splitDateTime(data.pickupAt).date, time))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Hora" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Local de Devolução</Label>
          <Input
            value={data.dropoffLocation}
            onChange={(e) => updateField('dropoffLocation', e.target.value)}
            placeholder="Aeroporto ORY"
          />
        </div>
        <div className="space-y-2">
          <Label>Data/Hora Devolução</Label>
          <div className="grid grid-cols-2 gap-2">
            <DatePickerField
              value={splitDateTime(data.dropoffAt).date}
              onChange={(date) => updateField('dropoffAt', combineDateTime(date, splitDateTime(data.dropoffAt).time))}
              placeholder="Data"
            />
            <Select
              value={splitDateTime(data.dropoffAt).time || undefined}
              onValueChange={(time) => updateField('dropoffAt', combineDateTime(splitDateTime(data.dropoffAt).date, time))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Hora" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Motorista</Label>
          <Input
            value={data.driverName || ''}
            onChange={(e) => updateField('driverName', e.target.value)}
            placeholder="João Silva"
          />
        </div>
        <div className="space-y-2">
          <Label>Idade do Motorista</Label>
          <Input
            type="number"
            min="18"
            value={data.driverAge || ''}
            onChange={(e) => updateField('driverAge', parseInt(e.target.value) || undefined)}
            placeholder="25"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Política de Km</Label>
          <Input
            value={data.mileagePolicy}
            onChange={(e) => updateField('mileagePolicy', e.target.value)}
            placeholder="Km ilimitado"
          />
        </div>
        <div className="space-y-2">
          <Label>Política de Combustível</Label>
          <Input
            value={data.fuelPolicy}
            onChange={(e) => updateField('fuelPolicy', e.target.value)}
            placeholder="Cheio/Cheio"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Seguro</Label>
          <Input
            value={data.insurance || ''}
            onChange={(e) => updateField('insurance', e.target.value)}
            placeholder="CDW + Roubo"
          />
        </div>
        <div className="space-y-2">
          <Label>Depósito Caução</Label>
          <Input
            value={data.deposit || ''}
            onChange={(e) => updateField('deposit', e.target.value)}
            placeholder="€500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Extras</Label>
        <Input
          value={data.extras || ''}
          onChange={(e) => updateField('extras', e.target.value)}
          placeholder="GPS, Cadeirinha, Motorista adicional"
        />
      </div>
    </div>
  );
}
