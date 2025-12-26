import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface TourActivity {
  name: string;
  summary?: string;
  location?: string;
  time?: string;
}

interface TourDay {
  dayNumber: number;
  title: string;
  activities: TourActivity[];
}

interface TourDetails {
  startDate: string;
  endDate: string;
  destinationBase: string;
  pace: 'leve' | 'moderado' | 'intenso';
  days: TourDay[];
  mobilityNotes?: string;
}

interface TourFieldsProps {
  details: TourDetails;
  onChange: (details: TourDetails) => void;
}

export function TourFields({ details, onChange }: TourFieldsProps) {
  const data: TourDetails = {
    startDate: details?.startDate || '',
    endDate: details?.endDate || '',
    destinationBase: details?.destinationBase || '',
    pace: details?.pace || 'moderado',
    days: details?.days || [],
    mobilityNotes: details?.mobilityNotes || '',
  };

  const updateField = <K extends keyof TourDetails>(key: K, value: TourDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  const addDay = () => {
    const newDay: TourDay = {
      dayNumber: data.days.length + 1,
      title: '',
      activities: [{ name: '', summary: '' }],
    };
    updateField('days', [...data.days, newDay]);
  };

  const removeDay = (index: number) => {
    const newDays = data.days.filter((_, i) => i !== index).map((d, i) => ({ ...d, dayNumber: i + 1 }));
    updateField('days', newDays);
  };

  const updateDay = (index: number, field: keyof TourDay, value: any) => {
    const newDays = [...data.days];
    newDays[index] = { ...newDays[index], [field]: value };
    updateField('days', newDays);
  };

  const addActivity = (dayIndex: number) => {
    const newDays = [...data.days];
    newDays[dayIndex].activities.push({ name: '', summary: '' });
    updateField('days', newDays);
  };

  const updateActivity = (dayIndex: number, actIndex: number, field: keyof TourActivity, value: string) => {
    const newDays = [...data.days];
    newDays[dayIndex].activities[actIndex] = { ...newDays[dayIndex].activities[actIndex], [field]: value };
    updateField('days', newDays);
  };

  const removeActivity = (dayIndex: number, actIndex: number) => {
    const newDays = [...data.days];
    if (newDays[dayIndex].activities.length > 1) {
      newDays[dayIndex].activities = newDays[dayIndex].activities.filter((_, i) => i !== actIndex);
      updateField('days', newDays);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Destino Base *</Label>
        <Input
          value={data.destinationBase}
          onChange={(e) => updateField('destinationBase', e.target.value)}
          placeholder="Roma, Itália"
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
          <Label>Ritmo</Label>
          <Select value={data.pace} onValueChange={(v) => updateField('pace', v as TourDetails['pace'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="leve">Leve</SelectItem>
              <SelectItem value="moderado">Moderado</SelectItem>
              <SelectItem value="intenso">Intenso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Dias do Roteiro</Label>
          <Button type="button" variant="outline" size="sm" onClick={addDay}>
            <Plus className="w-4 h-4 mr-1" /> Dia
          </Button>
        </div>
        
        {data.days.map((day, dayIndex) => (
          <div key={dayIndex} className="p-3 border rounded-lg space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted-foreground">Dia {day.dayNumber}</span>
              <Input
                value={day.title}
                onChange={(e) => updateDay(dayIndex, 'title', e.target.value)}
                placeholder="Título do dia"
                className="flex-1"
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeDay(dayIndex)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            
            {day.activities.map((activity, actIndex) => (
              <div key={actIndex} className="grid grid-cols-12 gap-2 items-center">
                <Input
                  value={activity.name}
                  onChange={(e) => updateActivity(dayIndex, actIndex, 'name', e.target.value)}
                  placeholder="Atividade"
                  className="col-span-5"
                />
                <Input
                  value={activity.time || ''}
                  onChange={(e) => updateActivity(dayIndex, actIndex, 'time', e.target.value)}
                  placeholder="09:00"
                  className="col-span-2"
                />
                <Input
                  value={activity.summary || ''}
                  onChange={(e) => updateActivity(dayIndex, actIndex, 'summary', e.target.value)}
                  placeholder="Descrição"
                  className="col-span-4"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeActivity(dayIndex, actIndex)}
                  className="col-span-1"
                  disabled={day.activities.length <= 1}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            
            <Button type="button" variant="ghost" size="sm" onClick={() => addActivity(dayIndex)}>
              <Plus className="w-4 h-4 mr-1" /> Atividade
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Notas de Mobilidade</Label>
        <Textarea
          value={data.mobilityNotes || ''}
          onChange={(e) => updateField('mobilityNotes', e.target.value)}
          placeholder="Informações sobre acessibilidade, caminhadas, etc."
          rows={2}
        />
      </div>
    </div>
  );
}
