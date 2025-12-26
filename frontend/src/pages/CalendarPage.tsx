import { useState, useMemo } from 'react';
import { useCalendarEvents, CalendarEvent } from '@/hooks/useCalendarEvents';
import { useProposals, Proposal } from '@/hooks/useProposals';
import { ProposalDetail } from '@/components/proposals/ProposalDetail';
import { ProposalDialog } from '@/components/proposals/ProposalDialog';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { useClients } from '@/hooks/useClients';
import { useCollaborators } from '@/hooks/useCollaborators';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plane, 
  Hotel, 
  Car, 
  Package, 
  Map,
  Ship,
  Shield,
  Bus,
  Calendar,
  List,
  Grid3X3,
  Clock,
  User,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

const serviceIcons: Record<string, typeof Plane> = {
  flight: Plane,
  hotel: Hotel,
  car: Car,
  package: Package,
  tour: Map,
  cruise: Ship,
  insurance: Shield,
  transfer: Bus,
  other: Package,
};

const serviceColors: Record<string, { bg: string; text: string; light: string }> = {
  flight: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50 border-blue-200' },
  hotel: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50 border-purple-200' },
  car: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50 border-orange-200' },
  package: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50 border-green-200' },
  tour: { bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-50 border-pink-200' },
  cruise: { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50 border-cyan-200' },
  insurance: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50 border-emerald-200' },
  transfer: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50 border-amber-200' },
  other: { bg: 'bg-gray-500', text: 'text-gray-600', light: 'bg-gray-50 border-gray-200' },
};

const serviceLabels: Record<string, string> = {
  flight: 'Voo',
  hotel: 'Hotel',
  car: 'Carro',
  package: 'Pacote',
  tour: 'Roteiro',
  cruise: 'Cruzeiro',
  insurance: 'Seguro',
  transfer: 'Transfer',
  other: 'Outro',
};

type ViewMode = 'month' | 'list';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { isAdmin, isSuperAdmin } = useAuth();
  const { data: events = [], isLoading } = useCalendarEvents();
  const { proposals } = useProposals();
  const { stages } = usePipelineStages();
  const { clients } = useClients();
  const { collaborators } = useCollaborators();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const fullDayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get events for a specific day
  const getEventsForDay = (day: number): CalendarEvent[] => {
    const targetDate = new Date(year, month, day);
    targetDate.setHours(0, 0, 0, 0);

    return events.filter(event => {
      const startDate = new Date(event.start_date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = event.end_date ? new Date(event.end_date) : startDate;
      endDate.setHours(0, 0, 0, 0);

      return targetDate >= startDate && targetDate <= endDate;
    });
  };

  // Events count for current month
  const currentMonthEventsCount = useMemo(() => {
    return events.filter(e => {
      const eventDate = new Date(e.start_date);
      return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    }).length;
  }, [events, month, year]);

  // Group events by date for list view
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      const dateKey = new Date(event.start_date).toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, events]) => ({ date, events }));
  }, [events]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${fullDayNames[date.getDay()]}, ${date.getDate()} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}`;
  };

  // Handle event click - find full proposal and open detail modal
  const handleEventClick = (event: CalendarEvent) => {
    const proposal = proposals.find(p => p.id === event.proposal_id);
    if (proposal) {
      setSelectedProposal(proposal);
    }
  };

  const handleEditProposal = () => {
    if (selectedProposal) {
      setEditingProposal(selectedProposal);
      setDialogOpen(true);
      setSelectedProposal(null);
    }
  };

  const renderMonthView = () => {
    const days = [];
    const totalSlots = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < totalSlots; i++) {
      const dayNumber = i - startingDayOfWeek + 1;
      const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
      const currentDay = new Date(year, month, dayNumber);
      currentDay.setHours(0, 0, 0, 0);
      const isToday = currentDay.getTime() === today.getTime() && isCurrentMonth;

      const dayEvents = isCurrentMonth ? getEventsForDay(dayNumber) : [];

      days.push(
        <div
          key={i}
          className={cn(
            "min-h-[120px] border-r border-b border-border p-1 relative",
            !isCurrentMonth && "bg-muted/30"
          )}
        >
          {isCurrentMonth && (
            <>
              <div className={cn(
                "w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full mx-auto mb-1",
                isToday && "bg-primary text-primary-foreground"
              )}>
                {dayNumber}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => {
                  const colors = serviceColors[event.type] || serviceColors.other;
                  return (
                    <div 
                      key={event.id}
                      className={cn(
                        "text-xs py-0.5 px-1.5 rounded cursor-pointer truncate font-medium transition-all hover:opacity-80",
                        colors.bg,
                        "text-white"
                      )}
                      onClick={() => handleEventClick(event)}
                    >
                      {event.client_name || serviceLabels[event.type]}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center font-medium">
                    +{dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 border-t border-l border-border">
        {dayNames.map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium border-r border-b border-border bg-muted/50">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderListView = () => {
    if (events.length === 0) {
      return (
        <div className="p-12 text-center text-muted-foreground">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Nenhum evento encontrado</p>
          <p className="text-sm">Feche propostas com serviços datados para vê-los aqui</p>
        </div>
      );
    }

    return (
      <div className="divide-y">
        {eventsByDate.map(({ date, events: dateEvents }) => (
          <div key={date}>
            <div className="px-4 py-3 bg-muted/30 font-semibold text-sm">
              {formatFullDate(date)}
            </div>
            <div className="divide-y">
              {dateEvents.map(event => {
                const Icon = serviceIcons[event.type] || Package;
                const colors = serviceColors[event.type] || serviceColors.other;
                return (
                  <div 
                    key={event.id} 
                    className={cn(
                      "p-4 cursor-pointer hover:bg-muted/30 transition-colors border-l-4",
                      colors.light
                    )}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("flex-1 min-w-0")}>
                        <p className={cn("font-semibold", colors.text)}>
                          {event.description || serviceLabels[event.type]}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <User className="w-3.5 h-3.5" />
                          <span>{event.client_name || 'Cliente não definido'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(event.start_date)}</span>
                          {event.end_date && event.end_date !== event.start_date && (
                            <span>- {formatDate(event.end_date)}</span>
                          )}
                        </div>
                        {event.origin && event.destination && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{event.origin} → {event.destination}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className={cn("flex-shrink-0", colors.text)}>
                        <Icon className="w-3.5 h-3.5 mr-1" />
                        {serviceLabels[event.type]}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="overflow-hidden">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between border-b bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground rounded-lg overflow-hidden">
                <div className="text-xs font-bold px-3 py-1 text-center">
                  {monthNames[month].slice(0, 3).toUpperCase()}
                </div>
                <div className="bg-background text-foreground text-xl font-bold px-3 py-1 text-center">
                  {new Date().getDate()}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {monthNames[month]} {year}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentMonthEventsCount} eventos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ChevronLeft className="w-4 h-4" />
              <span>
                {monthNames[month].slice(0, 3)} 1, {year} - {monthNames[month].slice(0, 3)} {daysInMonth}, {year}
              </span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button 
                variant={viewMode === 'list' ? 'default' : 'ghost'} 
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === 'month' ? 'default' : 'ghost'} 
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode('month')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {viewMode === 'month' ? renderMonthView() : renderListView()}
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(serviceIcons).map(([type, Icon]) => {
              const colors = serviceColors[type] || serviceColors.other;
              return (
                <div key={type} className="flex items-center gap-2">
                  <div className={cn("w-6 h-6 rounded flex items-center justify-center text-white", colors.bg)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm">{serviceLabels[type]}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Proposal Detail Dialog - Same as Leads page */}
      <Dialog open={!!selectedProposal} onOpenChange={() => setSelectedProposal(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedProposal && (
            <ProposalDetail 
              proposal={selectedProposal} 
              onClose={() => setSelectedProposal(null)}
              onEdit={handleEditProposal}
              onProposalUpdate={(updated) => setSelectedProposal(updated)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Proposal Dialog */}
      <ProposalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        proposal={editingProposal}
        clients={clients.map(c => ({ id: c.id, name: c.name }))}
        stages={stages}
        collaborators={collaborators.filter(c => c.status === 'active').map(c => ({ id: c.id, name: c.name }))}
        isAdmin={isAdmin || isSuperAdmin}
        onSubmit={() => {
          setDialogOpen(false);
          setEditingProposal(null);
        }}
        isLoading={false}
      />
    </div>
  );
}