import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface InsuranceDetails {
  insurer: string;
  planName: string;
  insuredPeople: string;
  coverageStart: string;
  coverageEnd: string;
  destinationRegion: string;
  medicalCoverageAmount?: string;
  baggageCoverageAmount?: string;
  tripCancellationCoverageAmount?: string;
  sportsCoverage?: boolean;
  policyNumber?: string;
  assistanceContacts?: string;
}

interface InsuranceFieldsProps {
  details: InsuranceDetails;
  onChange: (details: InsuranceDetails) => void;
}

export function InsuranceFields({ details, onChange }: InsuranceFieldsProps) {
  const data: InsuranceDetails = {
    insurer: details?.insurer || '',
    planName: details?.planName || '',
    insuredPeople: details?.insuredPeople || '',
    coverageStart: details?.coverageStart || '',
    coverageEnd: details?.coverageEnd || '',
    destinationRegion: details?.destinationRegion || '',
    medicalCoverageAmount: details?.medicalCoverageAmount || '',
    baggageCoverageAmount: details?.baggageCoverageAmount || '',
    tripCancellationCoverageAmount: details?.tripCancellationCoverageAmount || '',
    sportsCoverage: details?.sportsCoverage ?? false,
    policyNumber: details?.policyNumber || '',
    assistanceContacts: details?.assistanceContacts || '',
  };

  const updateField = <K extends keyof InsuranceDetails>(key: K, value: InsuranceDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Seguradora *</Label>
          <Input
            value={data.insurer}
            onChange={(e) => updateField('insurer', e.target.value)}
            placeholder="Assist Card, Travel Ace..."
          />
        </div>
        <div className="space-y-2">
          <Label>Nome do Plano *</Label>
          <Input
            value={data.planName}
            onChange={(e) => updateField('planName', e.target.value)}
            placeholder="Europa 60"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pessoas Seguradas</Label>
        <Textarea
          value={data.insuredPeople}
          onChange={(e) => updateField('insuredPeople', e.target.value)}
          placeholder="João Silva, Maria Silva..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Início da Cobertura</Label>
          <Input
            type="date"
            value={data.coverageStart}
            onChange={(e) => updateField('coverageStart', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Fim da Cobertura</Label>
          <Input
            type="date"
            value={data.coverageEnd}
            onChange={(e) => updateField('coverageEnd', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Região de Destino</Label>
          <Input
            value={data.destinationRegion}
            onChange={(e) => updateField('destinationRegion', e.target.value)}
            placeholder="Europa, Mundial, América do Sul..."
          />
        </div>
        <div className="space-y-2">
          <Label>Nº Apólice</Label>
          <Input
            value={data.policyNumber || ''}
            onChange={(e) => updateField('policyNumber', e.target.value)}
            placeholder="POL123456"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Cobertura Médica</Label>
          <Input
            value={data.medicalCoverageAmount || ''}
            onChange={(e) => updateField('medicalCoverageAmount', e.target.value)}
            placeholder="USD 60.000"
          />
        </div>
        <div className="space-y-2">
          <Label>Cobertura Bagagem</Label>
          <Input
            value={data.baggageCoverageAmount || ''}
            onChange={(e) => updateField('baggageCoverageAmount', e.target.value)}
            placeholder="USD 1.200"
          />
        </div>
        <div className="space-y-2">
          <Label>Cancel. de Viagem</Label>
          <Input
            value={data.tripCancellationCoverageAmount || ''}
            onChange={(e) => updateField('tripCancellationCoverageAmount', e.target.value)}
            placeholder="USD 5.000"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="sportsCoverage"
          checked={data.sportsCoverage}
          onCheckedChange={(checked) => updateField('sportsCoverage', !!checked)}
        />
        <Label htmlFor="sportsCoverage" className="text-sm">Cobertura para esportes radicais</Label>
      </div>

      <div className="space-y-2">
        <Label>Contatos de Assistência</Label>
        <Textarea
          value={data.assistanceContacts || ''}
          onChange={(e) => updateField('assistanceContacts', e.target.value)}
          placeholder="0800-xxx-xxxx, +1-xxx-xxx-xxxx"
          rows={2}
        />
      </div>
    </div>
  );
}
