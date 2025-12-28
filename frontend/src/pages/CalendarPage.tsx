import { useMemo } from 'react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { EventManager, type Event as UiEvent } from '@/components/ui/event-manager';
import { Skeleton } from '@/components/ui/skeleton';

const TYPE_LABELS: Record<string, string> = {
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

const TYPE_COLORS: Record<string, string> = {
  flight: 'blue',
  hotel: 'purple',
  car: 'orange',
  package: 'green',
  tour: 'pink',
  cruise: 'red',
  insurance: 'green',
  transfer: 'orange',
  other: 'blue',
};

export default function CalendarPage() {
  const { data: events = [], isLoading } = useCalendarEvents();

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const buildTitle = (evt: ReturnType<typeof useCalendarEvents>['data'][number]) => {
    const client = evt.client_name || 'Sem cliente';
    const label = TYPE_LABELS[evt.type] || 'Serviço';
    const timeLabel = formatTime(evt.start_date);
    const details: any = evt.details || {};

    if (evt.type === 'flight') {
      const segment = details?.segments?.[0] || {};
      const flightNumber = segment.flightNumber || details.flightNumber || '';
      const flightTag = flightNumber ? `Voo ${flightNumber}` : 'Voo';
      return [client, flightTag, timeLabel].filter(Boolean).join(' - ');
    }

    if (evt.type === 'hotel') {
      const hotelName = details.hotelName || details.name || 'Hotel';
      return [client, hotelName].filter(Boolean).join(' - ');
    }

    if (evt.type === 'car') {
      const carModel = details.carModel || details.model || '';
      return [client, carModel || label, timeLabel].filter(Boolean).join(' - ');
    }

    return [client, label, timeLabel].filter(Boolean).join(' - ');
  };

  const uiEvents: UiEvent[] = useMemo(() => {
    return events.map((evt) => {
      const start = new Date(evt.start_date);
      const end = evt.end_date ? new Date(evt.end_date) : new Date(start.getTime() + 60 * 60 * 1000);
      const color = TYPE_COLORS[evt.type] || 'green';
      const tags = [TYPE_LABELS[evt.type] || 'Evento', evt.client_name, evt.proposal_title].filter(Boolean) as string[];

      return {
        id: evt.id,
        title: buildTitle(evt),
        description: evt.description || undefined,
        startTime: start,
        endTime: end,
        color,
        category: TYPE_LABELS[evt.type] || 'Outro',
        tags,
      };
    });
  }, [events]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    uiEvents.forEach((e) => e.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [uiEvents]);

  const clientOptions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.client_name) set.add(e.client_name);
    });
    return Array.from(set);
  }, [events]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 pb-6 pt-2">
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 pb-6 pt-2">
      <EventManager
        key={uiEvents.length}
        events={uiEvents}
        categories={Object.values(TYPE_LABELS)}
        availableTags={availableTags}
        clientOptions={clientOptions}
        defaultView="month"
        className="min-h-[calc(100vh-180px)] rounded-2xl border bg-card p-4 shadow-sm"
      />
    </div>
  );
}
