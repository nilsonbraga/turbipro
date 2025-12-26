import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CollaboratorSchedule, ScheduleInput } from '@/hooks/useCollaboratorSchedules';
import { Collaborator } from '@/hooks/useCollaborators';
import { ShiftType } from '@/hooks/useShiftTypes';

type BulkMode = 'single' | 'weekdays' | 'weekends' | 'saturdays' | 'sundays' | 'full_month' | 'custom';

interface BulkDeleteCriteria {
  collaborator_id: string;
  shift_type_id?: string | null;
  start_time?: string | null;
  end_time?: string | null;
}

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: CollaboratorSchedule | null;
  collaborators: Collaborator[];
  shiftTypes: ShiftType[];
  onSave: (data: ScheduleInput & { id?: string }) => void;
  onSaveBulk?: (data: ScheduleInput[]) => void;
  onDelete?: (id: string) => void;
  onBulkDelete?: (criteria: BulkDeleteCriteria) => void;
  similarCount?: number;
  isLoading?: boolean;
  preselectedDate?: Date;
  preselectedCollaboratorId?: string;
}

const bulkModeLabels: Record<BulkMode, string> = {
  single: 'Dia único',
  weekdays: 'Segunda a Sexta',
  weekends: 'Finais de semana',
  saturdays: 'Somente Sábados',
  sundays: 'Somente Domingos',
  full_month: 'Mês inteiro',
  custom: 'Personalizado',
};

export function ScheduleDialog({
  open,
  onOpenChange,
  schedule,
  collaborators,
  shiftTypes,
  onSave,
  onSaveBulk,
  onDelete,
  onBulkDelete,
  similarCount = 0,
  isLoading,
  preselectedDate,
  preselectedCollaboratorId,
}: ScheduleDialogProps) {
  const [collaboratorId, setCollaboratorId] = useState('');
  const [shiftTypeId, setShiftTypeId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [bulkMode, setBulkMode] = useState<BulkMode>('single');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const activeShiftTypes = useMemo(() => 
    shiftTypes.filter((s) => s.is_active), 
    [shiftTypes]
  );

  const activeCollaborators = useMemo(() => 
    collaborators.filter((c) => c.status === 'active'),
    [collaborators]
  );

  useEffect(() => {
    if (!open) return;
    
    if (schedule) {
      setCollaboratorId(schedule.collaborator_id);
      setShiftTypeId(schedule.shift_type_id);
      setScheduleDate(schedule.schedule_date);
      setStartTime(schedule.start_time);
      setEndTime(schedule.end_time);
      setNotes(schedule.notes || '');
      setBulkMode('single');
    } else {
      const dateStr = preselectedDate ? format(preselectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      const defaultShift = activeShiftTypes[0];
      
      setCollaboratorId(preselectedCollaboratorId || '');
      setShiftTypeId(defaultShift?.id || null);
      setScheduleDate(dateStr);
      setStartTime(defaultShift?.start_time || '08:00');
      setEndTime(defaultShift?.end_time || '17:00');
      setNotes('');
      setBulkMode('single');
      
      if (preselectedDate) {
        setSelectedMonth(preselectedDate.getMonth());
        setSelectedYear(preselectedDate.getFullYear());
      }
    }
  }, [schedule, open, preselectedDate, preselectedCollaboratorId]);

  useEffect(() => {
    if (shiftTypeId) {
      const shiftType = shiftTypes.find((s) => s.id === shiftTypeId);
      if (shiftType) {
        setStartTime(shiftType.start_time);
        setEndTime(shiftType.end_time);
      }
    }
  }, [shiftTypeId, shiftTypes]);

  const getDaysForBulkMode = (): Date[] => {
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth));
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth));
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    switch (bulkMode) {
      case 'weekdays':
        return allDays.filter(day => {
          const dayOfWeek = getDay(day);
          return dayOfWeek >= 1 && dayOfWeek <= 5;
        });
      case 'weekends':
        return allDays.filter(day => {
          const dayOfWeek = getDay(day);
          return dayOfWeek === 0 || dayOfWeek === 6;
        });
      case 'saturdays':
        return allDays.filter(day => getDay(day) === 6);
      case 'sundays':
        return allDays.filter(day => getDay(day) === 0);
      case 'full_month':
        return allDays;
      case 'custom':
        return allDays.filter(day => customDays.includes(getDay(day)));
      default:
        return [];
    }
  };

  const bulkDays = bulkMode !== 'single' ? getDaysForBulkMode() : [];

  const toggleCustomDay = (day: number) => {
    setCustomDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const baseData: ScheduleInput = {
      collaborator_id: collaboratorId,
      shift_type_id: shiftTypeId,
      schedule_date: scheduleDate,
      start_time: startTime,
      end_time: endTime,
      notes: notes || null,
    };

    if (schedule) {
      onSave({ ...baseData, id: schedule.id });
    } else if (bulkMode !== 'single' && onSaveBulk) {
      const bulkData = bulkDays.map(day => ({
        ...baseData,
        schedule_date: format(day, 'yyyy-MM-dd'),
      }));
      onSaveBulk(bulkData);
    } else {
      onSave(baseData);
    }
  };

  const handleDeleteClick = () => {
    if (schedule && similarCount > 1 && onBulkDelete) {
      setDeleteDialogOpen(true);
    } else if (schedule && onDelete) {
      onDelete(schedule.id);
    }
  };

  const handleDeleteSingle = () => {
    if (schedule && onDelete) {
      onDelete(schedule.id);
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteAll = () => {
    if (schedule && onBulkDelete) {
      onBulkDelete({
        collaborator_id: schedule.collaborator_id,
        shift_type_id: schedule.shift_type_id,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
      });
      setDeleteDialogOpen(false);
      onOpenChange(false);
    }
  };

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const shiftTypeName = schedule?.shift_type?.name || shiftTypes.find(s => s.id === schedule?.shift_type_id)?.name || 'este tipo';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {schedule ? 'Editar Escala' : 'Nova Escala'}
              {preselectedDate && !schedule && (
                <span className="text-muted-foreground font-normal ml-2">
                  - {format(preselectedDate, "d 'de' MMMM", { locale: ptBR })}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collaborator">Colaborador</Label>
              <Select
                value={collaboratorId}
                onValueChange={setCollaboratorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {activeCollaborators.map((collaborator) => (
                    <SelectItem key={collaborator.id} value={collaborator.id}>
                      {collaborator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!schedule && (
              <div className="space-y-2">
                <Label>Modo de Agendamento</Label>
                <Select
                  value={bulkMode}
                  onValueChange={(value) => setBulkMode(value as BulkMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(bulkModeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {bulkMode === 'single' && (
              <div className="space-y-2">
                <Label htmlFor="schedule_date">Data</Label>
                <Input
                  id="schedule_date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  required
                />
              </div>
            )}

            {bulkMode !== 'single' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mês</Label>
                    <Select
                      value={selectedMonth.toString()}
                      onValueChange={(v) => setSelectedMonth(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          'Janeiro', 'Fevereiro', 'Março', 'Abril', 
                          'Maio', 'Junho', 'Julho', 'Agosto',
                          'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                        ].map((month, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ano</Label>
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(v) => setSelectedYear(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026].map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {bulkMode === 'custom' && (
                  <div className="space-y-2">
                    <Label>Dias da semana</Label>
                    <div className="flex flex-wrap gap-2">
                      {dayLabels.map((label, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`day-${idx}`}
                            checked={customDays.includes(idx)}
                            onCheckedChange={() => toggleCustomDay(idx)}
                          />
                          <label
                            htmlFor={`day-${idx}`}
                            className="text-sm cursor-pointer"
                          >
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Dias selecionados: <strong>{bulkDays.length}</strong>
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {bulkDays.slice(0, 15).map((day) => (
                      <Badge key={day.toISOString()} variant="secondary" className="text-xs">
                        {format(day, 'dd/MM')}
                      </Badge>
                    ))}
                    {bulkDays.length > 15 && (
                      <Badge variant="outline" className="text-xs">
                        +{bulkDays.length - 15} dias
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="shift_type">Tipo de Plantão</Label>
              <Select
                value={shiftTypeId || ''}
                onValueChange={setShiftTypeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  {activeShiftTypes.map((shiftType) => (
                    <SelectItem key={shiftType.id} value={shiftType.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: shiftType.color }}
                        />
                        {shiftType.name} ({shiftType.start_time?.slice(0, 5)} - {shiftType.end_time?.slice(0, 5)})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Hora Início</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={startTime || ''}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Hora Fim</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={endTime || ''}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre a escala"
                rows={2}
              />
            </div>

            <DialogFooter className="flex justify-between">
              <div>
                {schedule && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteClick}
                  >
                    Excluir
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || !collaboratorId}
                >
                  {isLoading ? 'Salvando...' : bulkMode !== 'single' && !schedule ? `Salvar ${bulkDays.length} dias` : 'Salvar'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Escala</AlertDialogTitle>
            <AlertDialogDescription>
              Este colaborador tem <strong>{similarCount}</strong> escalas com o mesmo tipo de plantão "{shiftTypeName}" e horário.
              <br /><br />
              O que deseja fazer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="outline" onClick={handleDeleteSingle}>
              Excluir somente esta
            </Button>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir todas ({similarCount})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
