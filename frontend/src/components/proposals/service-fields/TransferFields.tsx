import { useState } from 'react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface TransferDetails {
  transferType: 'privado' | 'compartilhado';
  pickupPlace: string;
  dropoffPlace: string;
  pickupAt: string;
  passengersCount: number;
  vehicleType: string;
  flightRef?: string;
  trainRef?: string;
  meetingPointInstructions?: string;
  luggageInfo?: string;
  driverContact?: string;
}

interface TransferFieldsProps {
  details: TransferDetails;
  onChange: (details: TransferDetails) => void;
}

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
  const parseDate = (val?: string) => {
    if (!val) return undefined;
    const [y, m, d] = val.split('-').map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(Date.UTC(y, m - 1, d, 12));
  };
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
          {dateObj ? format(dateObj, "dd/MM/yyyy") : (placeholder || "Selecionar")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateObj}
          onSelect={(day) => {
            onChange(day ? format(day, "yyyy-MM-dd") : '');
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

export function TransferFields({ details, onChange }: TransferFieldsProps) {
  const data: TransferDetails = {
    transferType: details?.transferType || 'privado',
    pickupPlace: details?.pickupPlace || '',
    dropoffPlace: details?.dropoffPlace || '',
    pickupAt: details?.pickupAt || '',
    passengersCount: details?.passengersCount || 1,
    vehicleType: details?.vehicleType || '',
    flightRef: details?.flightRef || '',
    trainRef: details?.trainRef || '',
    meetingPointInstructions: details?.meetingPointInstructions || '',
    luggageInfo: details?.luggageInfo || '',
    driverContact: details?.driverContact || '',
  };

  const updateField = <K extends keyof TransferDetails>(key: K, value: TransferDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Transfer *</Label>
          <Select value={data.transferType} onValueChange={(v) => updateField('transferType', v as TransferDetails['transferType'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="privado">Privado</SelectItem>
              <SelectItem value="compartilhado">Compartilhado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tipo de Veículo</Label>
          <Input
            value={data.vehicleType}
            onChange={(e) => updateField('vehicleType', e.target.value)}
            placeholder="Sedan, Van, SUV..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Local de Embarque *</Label>
          <Input
            value={data.pickupPlace}
            onChange={(e) => updateField('pickupPlace', e.target.value)}
            placeholder="Aeroporto CDG, Terminal 2E"
          />
        </div>
        <div className="space-y-2">
          <Label>Local de Desembarque *</Label>
          <Input
            value={data.dropoffPlace}
            onChange={(e) => updateField('dropoffPlace', e.target.value)}
            placeholder="Hotel Ritz, Paris"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data/Hora Embarque</Label>
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
        <div className="space-y-2">
          <Label>Qtd. Passageiros</Label>
          <Input
            type="number"
            min="1"
            value={data.passengersCount}
            onChange={(e) => updateField('passengersCount', parseInt(e.target.value) || 1)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ref. Voo</Label>
          <Input
            value={data.flightRef || ''}
            onChange={(e) => updateField('flightRef', e.target.value)}
            placeholder="LA8084"
          />
        </div>
        <div className="space-y-2">
          <Label>Ref. Trem</Label>
          <Input
            value={data.trainRef || ''}
            onChange={(e) => updateField('trainRef', e.target.value)}
            placeholder="TGV 6789"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Instruções do Ponto de Encontro</Label>
        <Input
          value={data.meetingPointInstructions || ''}
          onChange={(e) => updateField('meetingPointInstructions', e.target.value)}
          placeholder="Aguardar na saída 5 com placa"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Info Bagagem</Label>
          <Input
            value={data.luggageInfo || ''}
            onChange={(e) => updateField('luggageInfo', e.target.value)}
            placeholder="2 malas grandes + 2 de mão"
          />
        </div>
        <div className="space-y-2">
          <Label>Contato do Motorista</Label>
          <Input
            value={data.driverContact || ''}
            onChange={(e) => updateField('driverContact', e.target.value)}
            placeholder="+33 6 12 34 56 78"
          />
        </div>
      </div>
    </div>
  );
}
