import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PackageDetails {
  packageName: string;
  startDate: string;
  endDate: string;
  destinations: string;
  nights?: number;
  inclusions: string;
  exclusions: string;
  itinerarySummary?: string;
  cancellationPolicy?: string;
}

interface PackageFieldsProps {
  details: PackageDetails;
  onChange: (details: PackageDetails) => void;
}

export function PackageFields({ details, onChange }: PackageFieldsProps) {
  const data: PackageDetails = {
    packageName: details?.packageName || '',
    startDate: details?.startDate || '',
    endDate: details?.endDate || '',
    destinations: details?.destinations || '',
    nights: details?.nights,
    inclusions: details?.inclusions || '',
    exclusions: details?.exclusions || '',
    itinerarySummary: details?.itinerarySummary || '',
    cancellationPolicy: details?.cancellationPolicy || '',
  };

  const updateField = <K extends keyof PackageDetails>(key: K, value: PackageDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Pacote *</Label>
        <Input
          value={data.packageName}
          onChange={(e) => updateField('packageName', e.target.value)}
          placeholder="Lua de Mel em Paris"
        />
      </div>

      <div className="space-y-2">
        <Label>Destinos</Label>
        <Input
          value={data.destinations}
          onChange={(e) => updateField('destinations', e.target.value)}
          placeholder="Paris, Versalhes, Mont Saint-Michel"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Data Início</Label>
          <Input
            type="date"
            value={data.startDate}
            onChange={(e) => updateField('startDate', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Data Fim</Label>
          <Input
            type="date"
            value={data.endDate}
            onChange={(e) => updateField('endDate', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Noites</Label>
          <Input
            type="number"
            min="0"
            value={data.nights || ''}
            onChange={(e) => updateField('nights', parseInt(e.target.value) || undefined)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Inclui</Label>
        <Textarea
          value={data.inclusions}
          onChange={(e) => updateField('inclusions', e.target.value)}
          placeholder="Aéreo, Hotel 5*, Traslados, City Tour, Seguro..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Não Inclui</Label>
        <Textarea
          value={data.exclusions}
          onChange={(e) => updateField('exclusions', e.target.value)}
          placeholder="Refeições, Gorjetas, Extras..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Resumo do Roteiro</Label>
        <Textarea
          value={data.itinerarySummary || ''}
          onChange={(e) => updateField('itinerarySummary', e.target.value)}
          placeholder="Dia 1: Chegada em Paris...&#10;Dia 2: Tour pela cidade..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Política de Cancelamento</Label>
        <Input
          value={data.cancellationPolicy || ''}
          onChange={(e) => updateField('cancellationPolicy', e.target.value)}
          placeholder="Cancelamento grátis até 30 dias antes"
        />
      </div>
    </div>
  );
}
