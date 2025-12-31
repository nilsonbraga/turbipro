import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicProposal } from '@/hooks/usePublicProposalLinks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Plane,
  Hotel,
  Car,
  Package,
  Map,
  Ship,
  Shield,
  Bus,
  Calendar,
  Ticket,
  FileText,
  Dot,
  Users,
  Luggage,
  Briefcase,
  Clock,
  BedDouble,
  UtensilsCrossed,
  KeyRound,
  Building2,
  Wallet,
  MapPin,
  Mail,
  Phone,
  Gauge,
  Activity,
  Route,
  Moon,
  Globe,
  Instagram,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* -------------------- Format helpers -------------------- */

function toNumber(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value)
    .replace(/\s/g, '')
    .replace(/[R$\u00A0]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

const formatCurrency = (value: any) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toNumber(value));

const formatDate = (date: any) => {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString('pt-BR'); // dd/mm/yyyy
};

const formatDateRange = (start?: any, end?: any) => {
  const s = start ? formatDate(start) : '';
  const e = end ? formatDate(end) : '';
  if (!s && !e) return '';
  if (s && e && s !== e) return `${s} → ${e}`;
  return s || e;
};

const formatDateTime = (value: any) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTime = (value: any) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const cabinLabels: Record<string, string> = {
  economy: 'Econômica',
  premium_economy: 'Premium Economy',
  business: 'Executiva',
  first: 'Primeira Classe',
};

const tripTypeLabels: Record<string, string> = {
  oneway: 'Só ida',
  roundtrip: 'Ida e volta',
  multicity: 'Múltiplos trechos',
};

const boardLabels: Record<string, string> = {
  RO: 'Sem refeições',
  BB: 'Café da manhã',
  HB: 'Meia pensão',
  FB: 'Pensão completa',
  AI: 'All inclusive',
};

const boolLabel = (v: any) => (v ? 'Sim' : 'Não');
const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

function toPtLabel(key: string): string {
  const map: Record<string, string> = {
    // comuns
    provider: 'Fornecedor',
    supplier: 'Fornecedor',
    description: 'Descrição',
    notes: 'Observações',
    category: 'Categoria',
    locator: 'Localizador',
    record_locator: 'Localizador',
    booking_code: 'Código da reserva',
    reservation_code: 'Código da reserva',
    confirmation: 'Confirmação',

    // datas / período
    start_date: 'Data inicial',
    end_date: 'Data final',
    check_in: 'Check-in',
    check_out: 'Check-out',
    date: 'Data',
    departure_date: 'Data de saída',
    return_date: 'Data de retorno',

    // rota
    origin: 'Origem',
    destination: 'Destino',
    from: 'Origem',
    to: 'Destino',

    // voo (comuns)
    airline: 'Companhia aérea',
    flight_number: 'Nº do voo',
    cabin: 'Classe',
    fare_class: 'Classe tarifária',
    baggage: 'Bagagem',
    baggage_allowance: 'Franquia de bagagem',
    seats: 'Assentos',
    connections: 'Conexões',
    stops: 'Paradas',
    duration: 'Duração',

    // hotel
    city: 'Cidade',
    room: 'Quarto',
    room_type: 'Tipo de quarto',
    board: 'Regime',
    meal_plan: 'Regime',
    guests: 'Hóspedes',
    nights: 'Noites',

    // carro
    pickup_location: 'Local de retirada',
    dropoff_location: 'Local de devolução',
    pickup_date: 'Retirada',
    dropoff_date: 'Devolução',
    vehicle: 'Veículo',
    group: 'Grupo',
    insurance: 'Seguro',

    // transfer / tour
    pickup: 'Embarque',
    dropoff: 'Desembarque',
    meeting_point: 'Ponto de encontro',
  };

  if (map[key]) return map[key];

  // fallback: transforma snake_case/camelCase em “Título”
  const pretty = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}

function isEmptyValue(v: any) {
  return v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
}

/* -------------------- UI bits -------------------- */

const serviceIcons: Record<string, any> = {
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

const serviceLabels: Record<string, string> = {
  flight: 'Voo',
  hotel: 'Hotel',
  car: 'Carro',
  package: 'Pacote',
  tour: 'Passeio / Roteiro',
  cruise: 'Cruzeiro',
  insurance: 'Seguro',
  transfer: 'Transfer',
  other: 'Outro',
};

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: any;
}) {
  if (isEmptyValue(value)) return null;
  return (
    <div className="flex items-start gap-2 px-1 py-1">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0 leading-tight">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-[13px] font-medium text-foreground truncate">{String(value)}</div>
      </div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value?: any }) {
  if (isEmptyValue(value)) return null;
  return (
    <div className="flex gap-2">
      <span className="text-[11px] font-medium text-muted-foreground min-w-[140px]">
        {label}
      </span>
      <span className="text-[12px] text-foreground break-words">{String(value)}</span>
    </div>
  );
}

function ServiceMetaLine({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1 text-[12px] text-muted-foreground', className)}>
      {children}
    </div>
  );
}

const renderExtraDetails = (details: any, exclude: string[] = []) => {
  const blacklist = new Set([
    'unit_value',
    'quantity',
    'commission_value',
    'commission_type',
    'segments',
    'passengers',
    'baggage',
  ]);

  const entries = Object.entries(details || {}).filter(([k, v]) => {
    if (exclude.includes(k) || blacklist.has(k)) return false;
    if (isEmptyValue(v)) return false;
    if (typeof v === 'object' && !Array.isArray(v)) return false;
    return true;
  });

  if (!entries.length) return null;

  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-2">
        Outros detalhes
      </div>
      <div className="space-y-1">
        {entries.map(([k, v]) => {
          const value = Array.isArray(v)
            ? v.map((item) => (typeof item === 'object' ? '' : String(item))).filter(Boolean).join('  ')
            : typeof v === 'boolean'
            ? boolLabel(v)
            : String(v);
          return <FieldRow key={k} label={toPtLabel(k)} value={value} />;
        })}
      </div>
    </div>
  );
};

function FlightDetail({ service }: { service: any }) {
  const details = service?.details || {};
  const provider = service?.partners?.name || service?.provider;

  const passengers = Array.isArray(details.passengers) ? details.passengers : [];
  const paxSummary = passengers
    .map((p: any) => {
      const count = Number(p?.count || 0);
      if (!count) return null;
      const label =
        p?.type === 'ADT' ? 'Adulto' : p?.type === 'CHD' ? 'Criança' : p?.type === 'INF' ? 'Bebê' : 'Passageiro';
      return `${count} ${label}${count > 1 ? 's' : ''}`;
    })
    .filter(Boolean)
    .join(', ');

  const baggage = details?.baggage || {};
  const carryOnText = baggage?.carryOn ? `${baggage.carryOnQty || 1}x` : '';
  const checkedText = baggage?.checked
    ? `${baggage.checkedQty || 1}x${baggage.checkedWeight ? ` (${baggage.checkedWeight})` : ''}`
    : '';

  const segments = Array.isArray(details.segments) ? details.segments : [];
  const firstSegment = segments[0] || {};
  const airline =
    details?.airline ||
    service?.airline ||
    firstSegment?.airlineCode ||
    firstSegment?.operatingCarrier ||
    '';
  const mainFlightNumber = firstSegment?.flightNumber || details?.flight_number || '';

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {provider && <InfoPill icon={<Briefcase className="h-4 w-4" />} label="Fornecedor" value={provider} />}
        {paxSummary && <InfoPill icon={<Users className="h-4 w-4" />} label="Passageiros" value={paxSummary} />}
        {airline && <InfoPill icon={<Plane className="h-4 w-4" />} label="Companhia" value={airline} />}
        {mainFlightNumber && <InfoPill icon={<Ticket className="h-4 w-4" />} label="Voo" value={mainFlightNumber} />}
        {details?.tripType && (
          <InfoPill icon={<Plane className="h-4 w-4" />} label="Tipo de viagem" value={tripTypeLabels[details.tripType] || details.tripType} />
        )}
        {details?.cabinClass && (
          <InfoPill icon={<Ticket className="h-4 w-4" />} label="Classe" value={cabinLabels[details.cabinClass] || details.cabinClass} />
        )}
        {details?.fareClass && (
          <InfoPill icon={<Ticket className="h-4 w-4" />} label="Classe tarifária" value={details.fareClass} />
        )}
        {carryOnText && <InfoPill icon={<Briefcase className="h-4 w-4" />} label="Bagagem de mão" value={carryOnText} />}
        {checkedText && <InfoPill icon={<Luggage className="h-4 w-4" />} label="Despachada" value={checkedText} />}
        {details?.pnr && <InfoPill icon={<Ticket className="h-4 w-4" />} label="Localizador" value={details.pnr} />}
        {typeof details?.refundable === 'boolean' && (
          <InfoPill icon={<Shield className="h-4 w-4" />} label="Reembolsável" value={boolLabel(details.refundable)} />
        )}
      </div>

      {segments.length > 0 && (
        <div className="space-y-2">
          {segments.map((seg: any, idx: number) => {
            const flightNo =
              seg?.airlineCode || seg?.flightNumber
                ? `${seg?.airlineCode || ''}${seg?.flightNumber ? ` ${seg.flightNumber}` : ''}`
                : '';
            const connections = Array.isArray(seg?.connections) ? seg.connections : [];
            return (
              <div key={idx} className="rounded-md border border-muted/40 bg-transparent p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold">
                    {(seg?.fromIata || '---').toUpperCase()} → {(seg?.toIata || '---').toUpperCase()}
                  </div>
                  {flightNo && <div className="text-[12px] text-muted-foreground">{flightNo}</div>}
                </div>

                <div className="grid sm:grid-cols-2 gap-2 text-[12px] text-muted-foreground">
                  <div>Partida: {formatDateTime(seg?.departureAt)}</div>
                  <div>Chegada: {formatDateTime(seg?.arrivalAt)}</div>
                </div>

                {connections.length > 0 && (
                  <div className="text-[12px] text-foreground space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Conexões
                    </div>
                    {connections.map((conn: any, cIdx: number) => {
                      const connFlight =
                        conn?.airlineCode || conn?.flightNumber
                          ? `${conn?.airlineCode || ''}${conn?.flightNumber ? ` ${conn.flightNumber}` : ''}`
                          : '';
                      const times = [conn?.departureAt && `Saída ${formatTime(conn.departureAt)}`, conn?.arrivalAt && `Chegada ${formatTime(conn.arrivalAt)}`]
                        .filter(Boolean)
                        .join('  ');
                      return (
                        <div key={cIdx} className="flex items-center justify-between gap-2">
                          <div className="font-medium">{(conn?.iata || '---').toUpperCase()}</div>
                          <div className="text-muted-foreground text-right flex-1">
                            {[times, connFlight].filter(Boolean).join(' | ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {renderExtraDetails(details, ['passengers', 'segments', 'baggage', 'pnr', 'tripType', 'cabinClass', 'fareClass', 'refundable'])}
    </div>
  );
}

function HotelDetail({ service }: { service: any }) {
  const details = service?.details || {};
  const provider = service?.partners?.name || service?.provider;
  const guests = details?.guests || {};
  const totalGuests = Number(guests.adults || 0) + Number(guests.children || 0);

  const nights = (() => {
    const a = details?.checkIn ? new Date(details.checkIn) : null;
    const b = details?.checkOut ? new Date(details.checkOut) : null;
    if (!a || !b || Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
  })();

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {provider && <InfoPill icon={<Briefcase className="h-4 w-4" />} label="Fornecedor" value={provider} />}
        {details?.hotelName && <InfoPill icon={<BedDouble className="h-4 w-4" />} label="Hotel" value={details.hotelName} />}
        {(details?.city || details?.country || details?.address) && (
          <InfoPill
            icon={<MapPin className="h-4 w-4" />}
            label="Local"
            value={[details?.city, details?.country, details?.address].filter(Boolean).join(' • ')}
          />
        )}
        {details?.roomType && <InfoPill icon={<KeyRound className="h-4 w-4" />} label="Quarto" value={details.roomType} />}
        {details?.board && <InfoPill icon={<UtensilsCrossed className="h-4 w-4" />} label="Regime" value={boardLabels[details.board] || details.board} />}
        {totalGuests > 0 && (
          <InfoPill
            icon={<Users className="h-4 w-4" />}
            label="Hóspedes"
            value={`${totalGuests} hóspede${totalGuests > 1 ? 's' : ''}`}
          />
        )}
        {details?.ratePlan && <InfoPill icon={<Ticket className="h-4 w-4" />} label="Tarifa" value={details.ratePlan} />}
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-[12px] text-muted-foreground">
        <div>Check-in: {formatDateTime(details?.checkIn)} {details?.checkInTime ? `às ${details.checkInTime}` : ''}</div>
        <div>Check-out: {formatDateTime(details?.checkOut)} {details?.checkOutTime ? `às ${details.checkOutTime}` : ''}</div>
        {nights != null && <div className="col-span-full text-foreground text-sm">Estadia: {nights} noite{nights === 1 ? '' : 's'}</div>}
      </div>

      {renderExtraDetails(details, ['guests', 'checkIn', 'checkOut', 'checkInTime', 'checkOutTime', 'hotelName', 'city', 'country', 'address', 'roomType', 'board', 'ratePlan'])}
    </div>
  );
}

function CarDetail({ service }: { service: any }) {
  const details = service?.details || {};
  const provider = service?.partners?.name || service?.provider;

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {provider && <InfoPill icon={<Briefcase className="h-4 w-4" />} label="Fornecedor" value={provider} />}
        {details?.rentalCompany && <InfoPill icon={<Building2 className="h-4 w-4" />} label="Locadora" value={details.rentalCompany} />}
        {details?.carCategory && <InfoPill icon={<Car className="h-4 w-4" />} label="Categoria" value={details.carCategory} />}
        {details?.transmission && (
          <InfoPill icon={<KeyRound className="h-4 w-4" />} label="Câmbio" value={details.transmission === 'auto' ? 'Automático' : 'Manual'} />
        )}
        {details?.insurance && <InfoPill icon={<Shield className="h-4 w-4" />} label="Seguro" value={details.insurance} />}
        {details?.deposit && <InfoPill icon={<Wallet className="h-4 w-4" />} label="Depósito" value={details.deposit} />}
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-[12px] text-muted-foreground">
        <div>Retirada: {details?.pickupLocation} {details?.pickupAt ? `${formatDateTime(details.pickupAt)}` : ''}</div>
        <div>Devolução: {details?.dropoffLocation} {details?.dropoffAt ? `${formatDateTime(details.dropoffAt)}` : ''}</div>
      </div>

      {renderExtraDetails(details, ['pickupAt', 'dropoffAt', 'pickupLocation', 'dropoffLocation', 'rentalCompany', 'carCategory', 'transmission', 'insurance', 'deposit'])}
    </div>
  );
}

function TransferDetail({ service }: { service: any }) {
  const details = service?.details || {};
  const provider = service?.partners?.name || service?.provider;

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {provider && <InfoPill icon={<Briefcase className="h-4 w-4" />} label="Fornecedor" value={provider} />}
        {details?.transferType && (
          <InfoPill
            icon={<Bus className="h-4 w-4" />}
            label="Tipo de transfer"
            value={details.transferType === 'privado' ? 'Privado' : 'Compartilhado'}
          />
        )}
        {details?.vehicleType && <InfoPill icon={<Car className="h-4 w-4" />} label="Veículo" value={details.vehicleType} />}
        {details?.passengersCount && (
          <InfoPill icon={<Users className="h-4 w-4" />} label="Passageiros" value={`${details.passengersCount}`} />
        )}
        {details?.flightRef && <InfoPill icon={<Plane className="h-4 w-4" />} label="Ref. do voo" value={details.flightRef} />}
        {details?.trainRef && <InfoPill icon={<Bus className="h-4 w-4" />} label="Ref. do trem" value={details.trainRef} />}
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-[12px] text-muted-foreground">
        <div>
          Embarque: <span className="text-foreground">{details?.pickupPlace}</span>
          {details?.pickupAt && <span className="text-muted-foreground"> • {formatDateTime(details.pickupAt)}</span>}
        </div>
        <div>
          Desembarque: <span className="text-foreground">{details?.dropoffPlace}</span>
        </div>
      </div>

      {details?.meetingPointInstructions && (
        <div className="text-[12px] text-muted-foreground">
          Ponto de encontro: <span className="text-foreground">{details.meetingPointInstructions}</span>
        </div>
      )}

      {details?.luggageInfo && (
        <div className="text-[12px] text-muted-foreground">
          Bagagem: <span className="text-foreground">{details.luggageInfo}</span>
        </div>
      )}

      {renderExtraDetails(details, [
        'transferType',
        'vehicleType',
        'passengersCount',
        'pickupPlace',
        'dropoffPlace',
        'pickupAt',
        'meetingPointInstructions',
        'luggageInfo',
        'flightRef',
        'trainRef',
      ])}
    </div>
  );
}

function InsuranceDetail({ service }: { service: any }) {
  const details = service?.details || {};
  const provider = service?.partners?.name || service?.provider;

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {provider && <InfoPill icon={<Briefcase className="h-4 w-4" />} label="Fornecedor" value={provider} />}
        {details?.plan && <InfoPill icon={<Shield className="h-4 w-4" />} label="Plano" value={details.plan} />}
        {details?.coverage && <InfoPill icon={<Shield className="h-4 w-4" />} label="Cobertura" value={details.coverage} />}
        {details?.travellers && (
          <InfoPill icon={<Users className="h-4 w-4" />} label="Viajantes" value={Array.isArray(details.travellers) ? details.travellers.join(', ') : details.travellers} />
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-[12px] text-muted-foreground">
        <div>Início da cobertura: {formatDateTime(details?.coverageStart)}</div>
        <div>Fim da cobertura: {formatDateTime(details?.coverageEnd)}</div>
      </div>

      {renderExtraDetails(details, ['plan', 'coverage', 'travellers', 'coverageStart', 'coverageEnd'])}
    </div>
  );
}

function TourDetail({ service }: { service: any }) {
  const details = service?.details || {};
  const provider = service?.partners?.name || service?.provider;
  const days = Array.isArray(details?.days) ? details.days : [];

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-[13px]">
        {provider && <InfoPill icon={<Briefcase className="h-4 w-4" />} label="Fornecedor" value={provider} />}
        {details?.destinationBase && <InfoPill icon={<Map className="h-4 w-4" />} label="Destino base" value={details.destinationBase} />}
        {details?.pace && <InfoPill icon={<Gauge className="h-4 w-4" />} label="Ritmo" value={details.pace} />}
        {days.length > 0 && (
          <InfoPill icon={<Activity className="h-4 w-4" />} label="Dias" value={`${days.length} dia(s)`} />
        )}
        <InfoPill icon={<Calendar className="h-4 w-4" />} label="Início" value={formatDateTime(details?.startDate || details?.start_date)} />
        <InfoPill icon={<Calendar className="h-4 w-4" />} label="Fim" value={formatDateTime(details?.endDate || details?.end_date)} />
        {details?.mobilityNotes && (
          <InfoPill icon={<Shield className="h-4 w-4" />} label="Mobilidade" value={details.mobilityNotes} />
        )}
      </div>

      {days.length > 0 && (
        <div className="space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Itinerário
          </div>
          <div className="space-y-3">
            {days.map((day: any, idx: number) => {
              const acts =
                Array.isArray(day?.activities) && day.activities.length
                  ? day.activities
                  : [{ name: 'Sem atividades', summary: '', time: '' }];

              return (
                <div key={idx} className="rounded-lg border border-muted/60 bg-muted/10 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    Dia {day?.dayNumber || idx + 1}
                  </div>
                  {day?.title && (
                    <div className="text-[12px] text-muted-foreground">
                      {day.title}
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="py-2 px-3 text-left font-semibold w-[220px]">Atividade</th>
                          <th className="py-2 px-3 text-left font-semibold w-[120px]">Hora</th>
                          <th className="py-2 px-3 text-left font-semibold">Descrição da atividade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {acts.map((act: any, aIdx: number) => (
                          <tr key={`${idx}-${aIdx}`} className="align-top">
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-foreground">{act?.name || 'Atividade'}</div>
                            </td>
                            <td className="py-2.5 px-3 text-[12px] text-foreground">
                              {act?.time || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-[12px] text-muted-foreground">
                              {act?.summary || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {renderExtraDetails(details, [
        'destinationBase',
        'pace',
        'startDate',
        'endDate',
        'start_date',
        'end_date',
        'days',
        'mobilityNotes',
      ])}
    </div>
  );
}

function PackageDetail({ service }: { service: any }) {
  const details = service?.details || {};
  const provider = service?.partners?.name || service?.provider;

  return (
      <div className="mt-3 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {provider && <InfoPill icon={<Briefcase className="h-4 w-4" />} label="Fornecedor" value={provider} />}
        {details?.packageName && <InfoPill icon={<Package className="h-4 w-4" />} label="Pacote" value={details.packageName} />}
        {details?.destinations && <InfoPill icon={<MapPin className="h-4 w-4" />} label="Destinos" value={details.destinations} />}
        {typeof details?.nights === 'number' && (
          <InfoPill icon={<Moon className="h-4 w-4" />} label="Noites" value={`${details.nights} noite(s)`} />
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-[12px] text-muted-foreground">
        <div>Início: {formatDateTime(details?.startDate)}</div>
        <div>Fim: {formatDateTime(details?.endDate)}</div>
      </div>

      <div className="space-y-2 text-[12px]">
        {details?.itinerarySummary && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Resumo do roteiro</div>
            <div className="text-foreground">{details.itinerarySummary}</div>
          </div>
        )}
        {details?.inclusions && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Inclusões</div>
            <div className="text-foreground whitespace-pre-wrap">{details.inclusions}</div>
          </div>
        )}
        {details?.exclusions && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Exclusões</div>
            <div className="text-foreground whitespace-pre-wrap">{details.exclusions}</div>
          </div>
        )}
        {details?.cancellationPolicy && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Política de cancelamento</div>
            <div className="text-foreground whitespace-pre-wrap">{details.cancellationPolicy}</div>
          </div>
        )}
      </div>

      {renderExtraDetails(details, [
        'packageName',
        'destinations',
        'nights',
        'startDate',
        'endDate',
        'itinerarySummary',
        'inclusions',
        'exclusions',
        'cancellationPolicy',
      ])}
    </div>
  );
}

function CruiseDetail({ service }: { service: any }) {
  const details = service?.details || {};
  const provider = service?.partners?.name || service?.provider;

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {provider && <InfoPill icon={<Briefcase className="h-4 w-4" />} label="Fornecedor" value={provider} />}
        {details?.ship && <InfoPill icon={<Ship className="h-4 w-4" />} label="Navio" value={details.ship} />}
        {details?.cabin && <InfoPill icon={<BedDouble className="h-4 w-4" />} label="Cabine" value={details.cabin} />}
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-[12px] text-muted-foreground">
        <div>Início: {formatDateTime(details?.sailingDate || details?.startDate)}</div>
        <div>Retorno: {formatDateTime(details?.returnDate || details?.endDate)}</div>
      </div>

      {renderExtraDetails(details, ['ship', 'cabin', 'sailingDate', 'returnDate', 'startDate', 'endDate'])}
    </div>
  );
}

function GenericDetail({ service }: { service: any }) {
  const details = service?.details || {};
  const provider = service?.partners?.name || service?.provider;
  return (
    <div className="mt-3 space-y-3">
      {provider && <InfoPill icon={<Briefcase className="h-4 w-4" />} label="Fornecedor" value={provider} />}
      {renderExtraDetails(details)}
    </div>
  );
}

function ServiceDetails({ service }: { service: any }) {
  const type = service?.type;

  switch (type) {
    case 'flight':
      return <FlightDetail service={service} />;
    case 'hotel':
      return <HotelDetail service={service} />;
    case 'car':
      return <CarDetail service={service} />;
    case 'transfer':
      return <TransferDetail service={service} />;
    case 'insurance':
      return <InsuranceDetail service={service} />;
    case 'package':
      return <PackageDetail service={service} />;
    case 'tour':
      return <TourDetail service={service} />;
    case 'cruise':
      return <CruiseDetail service={service} />;
    default:
      return <GenericDetail service={service} />;
  }
}

/* -------------------- Page -------------------- */

export default function PublicProposal() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = usePublicProposal(token || null);

  const computed = useMemo(() => {
    const proposal = data?.proposal;
    const services = data?.services || [];
    const totalServices = services.reduce((sum: number, s: any) => sum + toNumber(s?.value), 0);
    const discountPct = toNumber(proposal?.discount);
    const discountValue = (totalServices * discountPct) / 100;
    const finalValue = totalServices - discountValue;
    return { totalServices, discountValue, finalValue };
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">😕</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Proposta não encontrada</h2>
            <p className="text-muted-foreground">
              Este link pode ter expirado ou a proposta não está mais disponível.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { proposal, services, agency } = data;
  const summaryRows = (services || []).map((s: any) => {
    const qty = Number(s?.details?.quantity) || 1;
    const total = toNumber(s?.value);
    const unit = qty > 0 ? total / qty : total;
    const typeLabel = serviceLabels[s?.type] || 'Serviço';
    const label = s?.description || typeLabel;
    const sublabel = s?.description && s?.description !== typeLabel ? typeLabel : '';
    return { id: s.id, label, sublabel, qty, total, unit };
  });
  const summaryTotal = summaryRows.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Conteúdo */}
      <main className="container mx-auto px-4 py-8 print:py-0">
        <div className="mx-auto max-w-[980px]">
          {/* “Folha” */}
          <div className={cn('rounded-2xl border bg-background shadow-none overflow-hidden', 'print:shadow-none print:border-0')}>
            {/* HERO HEADER */}
            <div
              className={cn(
                'relative px-6 sm:px-8 pt-8 pb-6',
                'bg-gradient-to-br from-primary/12 via-background to-background'
              )}
            >
              <div className="absolute inset-0 opacity-[0.18] pointer-events-none">
                <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary))_0%,transparent_40%),radial-gradient(circle_at_80%_10%,hsl(var(--primary))_0%,transparent_35%),radial-gradient(circle_at_60%_90%,hsl(var(--primary))_0%,transparent_35%)]" />
              </div>

              <div className="relative flex flex-col gap-6">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div className="flex items-start gap-4 min-w-0">
                    {agency?.logo_url ? (
                      <img
                        src={agency.logo_url}
                        alt={agency?.name || 'Logo'}
                        className="h-14 w-14 rounded-xl object-contain border-none bg-transparent"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        LOGO
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="text-sm font-semibold leading-tight truncate">
                        {agency?.name || 'Agência de Viagens'}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-3 text-[13px] text-muted-foreground">
                        {agency?.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {agency.email}
                          </span>
                        )}
                        {agency?.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {agency.phone}
                          </span>
                        )}
                        {agency?.address && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {agency.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm font-semibold justify-end">
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground font-medium">Proposta</span>
                      <span className="text-foreground">#{proposal?.number}</span>
                      {proposal?.created_at && (
                        <span className="text-[12px] text-muted-foreground font-normal">
                          Emitida em {formatDate(proposal.created_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      
                    </div>
                    <div className="text-xl sm:text-2xl font-bold leading-tight break-words">
                      {proposal?.title || 'Proposta'}
                    </div>
                  </div>

                  <Badge variant="default" className="text-[11px]">
                    {pluralize(services?.length || 0, 'serviço', 'serviços')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* BODY */}
            <div className="px-6 sm:px-8 pb-8">
              {/* Resumo rápido */}
              <section className="mt-4 mb-6">
                <div className="overflow-x-auto border border-muted/40 rounded-xl bg-transparent shadow-none">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Resumo dos itens
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {pluralize(summaryRows.length, 'item', 'itens')}
                    </div>
                  </div>

                  {summaryRows.length === 0 ? (
                    <div className="px-3 pb-3 text-[13px] text-muted-foreground">Nenhum serviço adicionado.</div>
                  ) : (
                    <table className="w-full text-[13px]">
                      <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40">
                        <tr>
                          <th className="text-left py-2 px-3 font-semibold">Item</th>
                          <th className="text-center py-2 px-2 font-semibold w-[80px]">Qtd</th>
                          <th className="text-right py-2 px-3 font-semibold w-[160px]">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {summaryRows.map((row) => (
                          <tr key={row.id}>
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-foreground">{row.label}</div>
                              {row.sublabel && (
                                <div className="text-[11px] text-muted-foreground">{row.sublabel}</div>
                              )}
                            </td>
                            <td className="text-center py-2.5 px-2">
                              <div className="text-foreground font-medium">{row.qty}</div>
                              {row.qty > 1 && (
                                <div className="text-[11px] text-muted-foreground">
                                  {formatCurrency(row.unit)} un.
                                </div>
                              )}
                            </td>
                            <td className="text-right py-2.5 px-3 font-semibold">
                              {formatCurrency(row.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/40">
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-right" colSpan={2}>
                            Total
                          </td>
                          <td className="py-2.5 px-3 text-right text-lg font-extrabold">
                            {formatCurrency(summaryTotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </section>

              <Separator className="my-6" />

              {/* Cliente */}
              {proposal?.clients && (
                <section className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Preparada para
                    </div>
                  </div>

                  <div className="rounded-2xl border p-4 bg-muted/10">
                    <div className="text-base font-semibold">{proposal.clients?.name}</div>
                    {proposal.clients?.email && (
                      <div className="text-sm text-muted-foreground">{proposal.clients.email}</div>
                    )}
                  </div>
                </section>
              )}

              {/* Serviços */}
              <section className="mb-6">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Serviços inclusos
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {pluralize(services.length, 'item', 'itens')}
                  </div>
                </div>

                {services.length === 0 ? (
                  <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground bg-muted/10">
                    Nenhum serviço adicionado nesta proposta.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {services.map((service: any) => {
                      const Icon = serviceIcons[service?.type] || Package;
                      const label = serviceLabels[service?.type] || 'Serviço';

                      const hasRoute = !!(service?.origin || service?.destination);
                      const dateLine = formatDateRange(service?.start_date, service?.end_date);

                      const providerName = service?.partners?.name || service?.provider;
                      const qty = Number(service?.details?.quantity) || 1;
                      const total = toNumber(service?.value);
                      const unit = qty > 0 ? total / qty : total;

                      return (
                        <div
                          key={service.id}
                          className={cn(
                            'rounded-2xl border bg-background',
                            'p-4 sm:p-5',
                            'shadow-none hover:shadow-md transition-shadow'
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div className="h-11 w-11 rounded-xl border bg-muted/40 flex items-center justify-center shrink-0">
                              <Icon className="h-5 w-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="text-[11px]">
                                  {label}
                                </Badge>

                                {providerName && (
                                  <span className="text-[12px] text-muted-foreground truncate">
                                    {providerName}
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 text-sm sm:text-[15px] font-semibold">
                                {service?.description || 'Sem descrição'}
                              </div>

                              <div className="mt-2 space-y-1">
                                {hasRoute && (
                                  <ServiceMetaLine>
                                    <Map className="h-3.5 w-3.5" />
                                    <span className="truncate">
                                      {service?.origin || ''}
                                      {service?.origin && service?.destination ? ' → ' : ''}
                                      {service?.destination || ''}
                                    </span>
                                  </ServiceMetaLine>
                                )}

                                {dateLine && (
                                  <ServiceMetaLine>
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{dateLine}</span>
                                  </ServiceMetaLine>
                                )}
                              </div>

                              {/* Detalhes por tipo + extras */}
                              <ServiceDetails service={service} />
                            </div>

                            <div className="text-right shrink-0 min-w-[120px]">
                              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                Valor
                              </div>
                              <div className="text-base sm:text-lg font-bold">
                                {formatCurrency(total)}
                              </div>
                              {qty > 1 && (
                                <div className="text-[12px] text-muted-foreground">
                                  {qty} x {formatCurrency(unit)}
                                </div>
                              )}
                            </div>
                          </div>

                         
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Observações */}
              {proposal?.notes && (
                <section className="mb-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Observações
                  </div>
                  <div className="rounded-2xl border p-4 bg-muted/10">
                    <p className="text-sm whitespace-pre-wrap">{proposal.notes}</p>
                  </div>
                </section>
              )}

              {/* Totais */}
              <section className="mt-8">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch lg:justify-end">
                  <div className="w-full lg:w-[460px] rounded-2xl border p-5 bg-muted/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">{formatCurrency(computed.totalServices)}</span>
                    </div>

                    {toNumber(proposal?.discount) > 0 && (
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-muted-foreground">
                          Desconto ({toNumber(proposal?.discount)}%)
                        </span>
                        <span className="font-semibold">
                          - {formatCurrency(computed.discountValue)}
                        </span>
                      </div>
                    )}

                    <Separator className="my-4" />

                    <div className="flex items-end justify-between">
                      <span className="text-sm font-semibold">Valor total</span>
                      <span className="text-2xl font-extrabold">
                        {formatCurrency(computed.finalValue)}
                      </span>
                    </div>

                    <div className="mt-3 text-[12px] text-muted-foreground flex items-center gap-1">
                      <Dot className="h-4 w-4" />
                      Valores sujeitos a disponibilidade e alteração até a confirmação da reserva.
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center text-[12px] text-muted-foreground">
                  {(agency?.email || agency?.phone) && (
                    <div>
                      {agency?.email ? `${agency.email}` : ''}
                      {agency?.email && agency?.phone ? ' | ' : ''}
                      {agency?.phone ? agency.phone : ''}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          <div className="h-10 print:hidden" />
          {(agency?.website_url || agency?.instagram_handle) && (
            <footer className="print:hidden text-center text-[12px] text-muted-foreground py-4">
              <div className="flex items-center justify-center gap-4">
                {agency?.website_url && (
                  <a
                    href={agency.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <Globe className="h-4 w-4" />
                    {agency.website_url.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {agency?.instagram_handle && (
                  <a
                    href={`https://instagram.com/${agency.instagram_handle.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <Instagram className="h-4 w-4" />
                    {agency.instagram_handle.startsWith('@') ? agency.instagram_handle : `@${agency.instagram_handle}`}
                  </a>
                )}
              </div>
            </footer>
          )}
        </div>
      </main>
    </div>
  );
}
