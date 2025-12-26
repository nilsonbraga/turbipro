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
import { format as formatDate } from 'date-fns';

interface HotelGuests {
  adults: number;
  children: number;
  childrenAges?: number[];
}

interface HotelDetails {
  hotelName: string;
  city: string;
  country: string;
  address?: string;
  checkIn: string;
  checkInTime?: string;
  checkOut: string;
  checkOutTime?: string;
  roomType: string;
  board: 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
  guests: HotelGuests;
  ratePlan?: string;
  amenities?: string;
  confirmationNumber?: string;
}

interface HotelFieldsProps {
  details: HotelDetails;
  onChange: (details: HotelDetails) => void;
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

export function HotelFields({ details, onChange }: HotelFieldsProps) {
  const data: HotelDetails = {
    hotelName: details?.hotelName || '',
    city: details?.city || '',
    country: details?.country || '',
    address: details?.address || '',
    checkIn: details?.checkIn || '',
    checkInTime: details?.checkInTime || '',
    checkOut: details?.checkOut || '',
    checkOutTime: details?.checkOutTime || '',
    roomType: details?.roomType || '',
    board: details?.board || 'BB',
    guests: details?.guests || { adults: 2, children: 0 },
    ratePlan: details?.ratePlan || '',
    amenities: details?.amenities || '',
    confirmationNumber: details?.confirmationNumber || '',
  };

  const updateField = <K extends keyof HotelDetails>(key: K, value: HotelDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Hotel *</Label>
        <Input
          value={data.hotelName}
          onChange={(e) => updateField('hotelName', e.target.value)}
          placeholder="Hotel Ritz Paris"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input
            value={data.city}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="Paris"
          />
        </div>
        <div className="space-y-2">
          <Label>País</Label>
          <Input
            value={data.country}
            onChange={(e) => updateField('country', e.target.value)}
            placeholder="França"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Endereço</Label>
        <Input
          value={data.address || ''}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="15 Place Vendôme, 75001"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Check-in</Label>
          <div className="grid grid-cols-2 gap-2">
            <DatePickerField
              value={data.checkIn}
              onChange={(date) => updateField('checkIn', date)}
              placeholder="Data"
            />
            <Input
              type="time"
              value={data.checkInTime || ''}
              onChange={(e) => updateField('checkInTime', e.target.value)}
              placeholder="Hora"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Check-out</Label>
          <div className="grid grid-cols-2 gap-2">
            <DatePickerField
              value={data.checkOut}
              onChange={(date) => updateField('checkOut', date)}
              placeholder="Data"
            />
            <Input
              type="time"
              value={data.checkOutTime || ''}
              onChange={(e) => updateField('checkOutTime', e.target.value)}
              placeholder="Hora"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Quarto</Label>
          <Input
            value={data.roomType}
            onChange={(e) => updateField('roomType', e.target.value)}
            placeholder="Deluxe King"
          />
        </div>
        <div className="space-y-2">
          <Label>Regime</Label>
          <Select value={data.board} onValueChange={(v) => updateField('board', v as HotelDetails['board'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RO">Sem Refeições</SelectItem>
              <SelectItem value="BB">Café da Manhã</SelectItem>
              <SelectItem value="HB">Meia Pensão</SelectItem>
              <SelectItem value="FB">Pensão Completa</SelectItem>
              <SelectItem value="AI">All Inclusive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Adultos</Label>
          <Input
            type="number"
            min="1"
            value={data.guests.adults}
            onChange={(e) => updateField('guests', { ...data.guests, adults: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Crianças</Label>
          <Input
            type="number"
            min="0"
            value={data.guests.children}
            onChange={(e) => updateField('guests', { ...data.guests, children: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nº Confirmação</Label>
          <Input
            value={data.confirmationNumber || ''}
            onChange={(e) => updateField('confirmationNumber', e.target.value)}
            placeholder="CONF123456"
          />
        </div>
        <div className="space-y-2">
          <Label>Plano Tarifário</Label>
          <Input
            value={data.ratePlan || ''}
            onChange={(e) => updateField('ratePlan', e.target.value)}
            placeholder="Flexível"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Comodidades</Label>
        <Input
          value={data.amenities || ''}
          onChange={(e) => updateField('amenities', e.target.value)}
          placeholder="Wi-Fi, Piscina, Spa, Academia"
        />
      </div>
    </div>
  );
}
