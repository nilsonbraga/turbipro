import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface CruiseDetails {
  cruiseLine: string;
  shipName: string;
  sailingDate: string;
  returnDate: string;
  embarkPort: string;
  disembarkPort: string;
  cabinType: string;
  cabinCategory: string;
  itineraryPorts?: string;
  deck?: string;
  cabinNumber?: string;
  dining?: string;
  gratuitiesIncluded?: boolean;
  drinkPackage?: string;
  wifiPackage?: string;
  bookingRef?: string;
}

interface CruiseFieldsProps {
  details: CruiseDetails;
  onChange: (details: CruiseDetails) => void;
}

export function CruiseFields({ details, onChange }: CruiseFieldsProps) {
  const data: CruiseDetails = {
    cruiseLine: details?.cruiseLine || '',
    shipName: details?.shipName || '',
    sailingDate: details?.sailingDate || '',
    returnDate: details?.returnDate || '',
    embarkPort: details?.embarkPort || '',
    disembarkPort: details?.disembarkPort || '',
    cabinType: details?.cabinType || '',
    cabinCategory: details?.cabinCategory || '',
    itineraryPorts: details?.itineraryPorts || '',
    deck: details?.deck || '',
    cabinNumber: details?.cabinNumber || '',
    dining: details?.dining || '',
    gratuitiesIncluded: details?.gratuitiesIncluded ?? false,
    drinkPackage: details?.drinkPackage || '',
    wifiPackage: details?.wifiPackage || '',
    bookingRef: details?.bookingRef || '',
  };

  const updateField = <K extends keyof CruiseDetails>(key: K, value: CruiseDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Companhia *</Label>
          <Input
            value={data.cruiseLine}
            onChange={(e) => updateField('cruiseLine', e.target.value)}
            placeholder="MSC, Royal Caribbean, Costa..."
          />
        </div>
        <div className="space-y-2">
          <Label>Nome do Navio *</Label>
          <Input
            value={data.shipName}
            onChange={(e) => updateField('shipName', e.target.value)}
            placeholder="MSC Grandiosa"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data Embarque</Label>
          <Input
            type="date"
            value={data.sailingDate}
            onChange={(e) => updateField('sailingDate', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Data Desembarque</Label>
          <Input
            type="date"
            value={data.returnDate}
            onChange={(e) => updateField('returnDate', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Porto de Embarque</Label>
          <Input
            value={data.embarkPort}
            onChange={(e) => updateField('embarkPort', e.target.value)}
            placeholder="Santos, SP"
          />
        </div>
        <div className="space-y-2">
          <Label>Porto de Desembarque</Label>
          <Input
            value={data.disembarkPort}
            onChange={(e) => updateField('disembarkPort', e.target.value)}
            placeholder="Santos, SP"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Cabine</Label>
          <Input
            value={data.cabinType}
            onChange={(e) => updateField('cabinType', e.target.value)}
            placeholder="Varanda"
          />
        </div>
        <div className="space-y-2">
          <Label>Categoria da Cabine</Label>
          <Input
            value={data.cabinCategory}
            onChange={(e) => updateField('cabinCategory', e.target.value)}
            placeholder="Fantastica"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Deck</Label>
          <Input
            value={data.deck || ''}
            onChange={(e) => updateField('deck', e.target.value)}
            placeholder="12"
          />
        </div>
        <div className="space-y-2">
          <Label>Nº Cabine</Label>
          <Input
            value={data.cabinNumber || ''}
            onChange={(e) => updateField('cabinNumber', e.target.value)}
            placeholder="12045"
          />
        </div>
        <div className="space-y-2">
          <Label>Nº Reserva</Label>
          <Input
            value={data.bookingRef || ''}
            onChange={(e) => updateField('bookingRef', e.target.value)}
            placeholder="ABC123456"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Roteiro (Portos)</Label>
        <Textarea
          value={data.itineraryPorts || ''}
          onChange={(e) => updateField('itineraryPorts', e.target.value)}
          placeholder="Santos → Ilhabela → Búzios → Santos"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Pacote de Bebidas</Label>
          <Input
            value={data.drinkPackage || ''}
            onChange={(e) => updateField('drinkPackage', e.target.value)}
            placeholder="Premium"
          />
        </div>
        <div className="space-y-2">
          <Label>Pacote de Wi-Fi</Label>
          <Input
            value={data.wifiPackage || ''}
            onChange={(e) => updateField('wifiPackage', e.target.value)}
            placeholder="Streaming"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Turno do Jantar</Label>
        <Input
          value={data.dining || ''}
          onChange={(e) => updateField('dining', e.target.value)}
          placeholder="Segundo turno - 21h"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="gratuitiesIncluded"
          checked={data.gratuitiesIncluded}
          onCheckedChange={(checked) => updateField('gratuitiesIncluded', !!checked)}
        />
        <Label htmlFor="gratuitiesIncluded" className="text-sm">Gorjetas incluídas</Label>
      </div>
    </div>
  );
}
