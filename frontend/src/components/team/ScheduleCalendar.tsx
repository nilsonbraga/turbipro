import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, List, LayoutGrid } from 'lucide-react';
import { CollaboratorSchedule } from '@/hooks/useCollaboratorSchedules';
import { CollaboratorTimeOff, timeOffTypeLabels } from '@/hooks/useCollaboratorTimeOff';
import { Collaborator } from '@/hooks/useCollaborators';
import { ShiftType } from '@/hooks/useShiftTypes';
import { cn } from '@/lib/utils';

type ViewMode = 'month' | 'week' | 'day';

interface ScheduleCalendarProps {
  schedules: CollaboratorSchedule[];
  timeOffs: CollaboratorTimeOff[];
  collaborators: Collaborator[];
  shiftTypes: ShiftType[];
  onAddSchedule?: (date: Date, collaboratorId?: string) => void;
  onEditSchedule?: (schedule: CollaboratorSchedule) => void;
  onEditTimeOff?: (timeOff: CollaboratorTimeOff) => void;
  onAddTimeOff?: (collaboratorId?: string) => void;
  canEdit?: boolean;
}

export function ScheduleCalendar({
  schedules,
  timeOffs,
  collaborators,
  shiftTypes,
  onAddSchedule,
  onEditSchedule,
  onEditTimeOff,
  onAddTimeOff,
  canEdit = true,
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedCollaborator, setSelectedCollaborator] = useState<string>('all');

  const activeCollaborators = collaborators.filter((c) => c.status === 'active');

  const filteredSchedules = useMemo(() => {
    if (selectedCollaborator === 'all') return schedules;
    return schedules.filter((s) => s.collaborator_id === selectedCollaborator);
  }, [schedules, selectedCollaborator]);

  const filteredTimeOffs = useMemo(() => {
    if (selectedCollaborator === 'all') return timeOffs;
    return timeOffs.filter((t) => t.collaborator_id === selectedCollaborator);
  }, [timeOffs, selectedCollaborator]);

  const navigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const getSchedulesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredSchedules.filter((s) => s.schedule_date === dateStr);
  };

  const getTimeOffsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredTimeOffs.filter((t) => t.start_date <= dateStr && t.end_date >= dateStr && t.status === 'approved');
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: ptBR });
    const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const daySchedules = getSchedulesForDate(day);
          const dayTimeOffs = getTimeOffsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[100px] border rounded-md p-1 transition-colors',
                !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                isToday && 'border-primary',
                canEdit && 'cursor-pointer hover:bg-accent/50'
              )}
              onClick={canEdit && onAddSchedule ? () => onAddSchedule(day) : undefined}
            >
              <div className={cn('text-sm font-medium mb-1', isToday && 'text-primary')}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1 overflow-hidden">
                {dayTimeOffs.slice(0, 2).map((timeOff) => (
                  <Badge
                    key={timeOff.id}
                    variant="outline"
                    className={cn(
                      "text-xs w-full justify-start truncate bg-destructive/10 text-destructive border-destructive/30",
                      canEdit && "cursor-pointer hover:bg-destructive/20"
                    )}
                    onClick={canEdit && onEditTimeOff ? (e) => {
                      e.stopPropagation();
                      onEditTimeOff(timeOff);
                    } : undefined}
                  >
                    {timeOff.collaborator?.name?.split(' ')[0]} - {timeOffTypeLabels[timeOff.type]}
                  </Badge>
                ))}
                {daySchedules.slice(0, 2).map((schedule) => (
                  <Badge
                    key={schedule.id}
                    variant="outline"
                    className={cn("text-xs w-full justify-start truncate", canEdit && "cursor-pointer")}
                    style={{
                      backgroundColor: schedule.shift_type?.color ? `${schedule.shift_type.color}20` : undefined,
                      borderColor: schedule.shift_type?.color,
                      color: schedule.shift_type?.color,
                    }}
                    onClick={canEdit && onEditSchedule ? (e) => {
                      e.stopPropagation();
                      onEditSchedule(schedule);
                    } : undefined}
                  >
                    {schedule.collaborator?.name?.split(' ')[0]} - {schedule.shift_type?.name || 'Escala'}
                  </Badge>
                ))}
                {(daySchedules.length + dayTimeOffs.length > 2) && (
                  <span className="text-xs text-muted-foreground">
                    +{daySchedules.length + dayTimeOffs.length - 2} mais
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: ptBR });
    const weekEnd = endOfWeek(currentDate, { locale: ptBR });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const daySchedules = getSchedulesForDate(day);
          const dayTimeOffs = getTimeOffsForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[300px] border rounded-md p-2',
                isToday && 'border-primary'
              )}
            >
              <div className={cn('text-center mb-2', isToday && 'text-primary')}>
                <div className="text-sm text-muted-foreground">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div className="text-lg font-semibold">{format(day, 'd')}</div>
              </div>
              {canEdit && onAddSchedule && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mb-2"
                  onClick={() => onAddSchedule(day)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <div className="space-y-1">
                {dayTimeOffs.map((timeOff) => (
                  <div
                    key={timeOff.id}
                    className={cn(
                      "p-2 rounded-md bg-destructive/10 text-destructive text-xs",
                      canEdit && "cursor-pointer hover:bg-destructive/20"
                    )}
                    onClick={canEdit && onEditTimeOff ? () => onEditTimeOff(timeOff) : undefined}
                  >
                    <div className="font-medium">{timeOff.collaborator?.name}</div>
                    <div>{timeOffTypeLabels[timeOff.type]}</div>
                  </div>
                ))}
                {daySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={cn("p-2 rounded-md text-xs", canEdit && "cursor-pointer hover:opacity-80")}
                    style={{
                      backgroundColor: schedule.shift_type?.color ? `${schedule.shift_type.color}20` : 'hsl(var(--muted))',
                      borderLeft: `3px solid ${schedule.shift_type?.color || 'hsl(var(--primary))'}`,
                    }}
                    onClick={canEdit && onEditSchedule ? () => onEditSchedule(schedule) : undefined}
                  >
                    <div className="font-medium">{schedule.collaborator?.name}</div>
                    <div>{schedule.shift_type?.name}</div>
                    <div className="text-muted-foreground">
                      {schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const daySchedules = getSchedulesForDate(currentDate);
    const dayTimeOffs = getTimeOffsForDate(currentDate);
    const isToday = isSameDay(currentDate, new Date());

    return (
      <div className="space-y-4">
        <div className={cn('text-center', isToday && 'text-primary')}>
          <div className="text-lg text-muted-foreground">
            {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCollaborators.map((collaborator) => {
            const collabSchedule = daySchedules.find((s) => s.collaborator_id === collaborator.id);
            const collabTimeOff = dayTimeOffs.find((t) => t.collaborator_id === collaborator.id);

            return (
              <Card key={collaborator.id} className="relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{collaborator.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {collabTimeOff ? (
                    <div 
                      className={cn(
                        "p-3 rounded-md bg-destructive/10 text-destructive",
                        canEdit && "cursor-pointer hover:bg-destructive/20"
                      )}
                      onClick={canEdit && onEditTimeOff ? () => onEditTimeOff(collabTimeOff) : undefined}
                    >
                      <div className="font-medium">{timeOffTypeLabels[collabTimeOff.type]}</div>
                      {collabTimeOff.reason && (
                        <div className="text-sm mt-1">{collabTimeOff.reason}</div>
                      )}
                    </div>
                  ) : collabSchedule ? (
                    <div
                      className={cn("p-3 rounded-md", canEdit && "cursor-pointer hover:opacity-80")}
                      style={{
                        backgroundColor: collabSchedule.shift_type?.color ? `${collabSchedule.shift_type.color}20` : 'hsl(var(--muted))',
                        borderLeft: `4px solid ${collabSchedule.shift_type?.color || 'hsl(var(--primary))'}`,
                      }}
                      onClick={canEdit && onEditSchedule ? () => onEditSchedule(collabSchedule) : undefined}
                    >
                      <div className="font-medium">{collabSchedule.shift_type?.name || 'Escala'}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {collabSchedule.start_time?.slice(0, 5)} - {collabSchedule.end_time?.slice(0, 5)}
                      </div>
                      {collabSchedule.notes && (
                        <div className="text-sm mt-2">{collabSchedule.notes}</div>
                      )}
                    </div>
                  ) : canEdit && onAddSchedule ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => onAddSchedule(currentDate, collaborator.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Escala
                    </Button>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center p-3">
                      Sem escala
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const getTitle = () => {
    if (viewMode === 'month') {
      return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { locale: ptBR });
      const weekEnd = endOfWeek(currentDate, { locale: ptBR });
      return `${format(weekStart, 'd')} - ${format(weekEnd, "d 'de' MMMM", { locale: ptBR })}`;
    } else {
      return format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center capitalize">
            {getTitle()}
          </h2>
          <Button variant="outline" size="icon" onClick={() => navigate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedCollaborator} onValueChange={setSelectedCollaborator}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos colaboradores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos colaboradores</SelectItem>
              {activeCollaborators.map((collaborator) => (
                <SelectItem key={collaborator.id} value={collaborator.id}>
                  {collaborator.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'day' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </div>
  );
}
