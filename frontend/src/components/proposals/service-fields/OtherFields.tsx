import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface OtherDetails {
  name: string;
  category: string;
  date?: string;
  provider?: string;
  location?: string;
  details?: string;
}

interface OtherFieldsProps {
  details: OtherDetails;
  onChange: (details: OtherDetails) => void;
}

export function OtherFields({ details, onChange }: OtherFieldsProps) {
  const data: OtherDetails = {
    name: details?.name || '',
    category: details?.category || '',
    date: details?.date || '',
    provider: details?.provider || '',
    location: details?.location || '',
    details: details?.details || '',
  };

  const updateField = <K extends keyof OtherDetails>(key: K, value: OtherDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Serviço *</Label>
        <Input
          value={data.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Ingresso para show, Curso, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input
            value={data.category}
            onChange={(e) => updateField('category', e.target.value)}
            placeholder="Entretenimento, Passeio, etc."
          />
        </div>
        <div className="space-y-2">
          <Label>Data</Label>
          <Input
            type="date"
            value={data.date || ''}
            onChange={(e) => updateField('date', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fornecedor</Label>
          <Input
            value={data.provider || ''}
            onChange={(e) => updateField('provider', e.target.value)}
            placeholder="Nome do fornecedor"
          />
        </div>
        <div className="space-y-2">
          <Label>Local</Label>
          <Input
            value={data.location || ''}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="Endereço ou nome do local"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Detalhes</Label>
        <Textarea
          value={data.details || ''}
          onChange={(e) => updateField('details', e.target.value)}
          placeholder="Informações adicionais sobre este serviço..."
          rows={3}
        />
      </div>
    </div>
  );
}
