import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Plus, Trash2, Plane, ArrowRight, Briefcase, Luggage, Circle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FlightConnection {
  iata: string;
  arrivalAt: string;
  departureAt: string;
  airlineCode?: string;
  flightNumber?: string;
}

interface FlightSegment {
  fromIata: string;
  toIata: string;
  departureAt: string;
  arrivalAt: string;
  airlineCode: string;
  flightNumber: string;
  operatingCarrier?: string;
  connections: FlightConnection[];
}

interface FlightPassenger {
  type: 'ADT' | 'CHD' | 'INF';
  count: number;
}

interface BaggageInfo {
  carryOn: boolean;
  carryOnQty: number;
  checked: boolean;
  checkedQty: number;
  checkedWeight?: string;
}

interface FlightDetails {
  tripType: 'oneway' | 'roundtrip' | 'multicity';
  cabinClass: string;
  passengers: FlightPassenger[];
  segments: FlightSegment[];
  fareClass?: string;
  baggage?: BaggageInfo;
  pnr?: string;
  refundable?: boolean;
}

interface FlightFieldsProps {
  details: FlightDetails;
  onChange: (details: FlightDetails) => void;
}

const defaultSegment: FlightSegment = {
  fromIata: '',
  toIata: '',
  departureAt: '',
  arrivalAt: '',
  airlineCode: '',
  flightNumber: '',
  connections: [],
};

const defaultBaggage: BaggageInfo = {
  carryOn: true,
  carryOnQty: 1,
  checked: false,
  checkedQty: 0,
  checkedWeight: '23kg',
};

const splitDateTime = (value?: string) => ({
  date: value ? value.slice(0, 10) : '',
  time: value && value.includes('T') ? value.slice(11, 16) : '',
});

const combineDateTime = (date?: string, time?: string) => {
  if (!date) return '';
  return `${date}T${time || '00:00'}`;
};

const parseDate = (value?: string) => {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

const timeOptions = Array.from({ length: 48 }).map((_, idx) => {
  const hours = Math.floor(idx / 2)
    .toString()
    .padStart(2, '0');
  const minutes = idx % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});

const TimePickerField = ({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
}) => {
  const displayValue = value || '';
  return (
    <Select
      value={displayValue || undefined}
      onValueChange={(v) => onChange(v)}
    >
      <SelectTrigger className={cn('h-9', className)}>
        <SelectValue placeholder={placeholder || 'Hora'} />
      </SelectTrigger>
      <SelectContent>
        {timeOptions.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const DatePickerField = ({
  value,
  onChange,
  placeholder,
  buttonClassName,
}: {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  buttonClassName?: string;
}) => {
  const [open, setOpen] = useState(false);
  const dateObj = useMemo(() => parseDate(value), [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !value && "text-muted-foreground",
            buttonClassName,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateObj ? format(dateObj, "dd/MM/yyyy") : (placeholder || "Selecionar")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateObj}
          onSelect={(day) => {
            onChange(day ? format(day, "yyyy-MM-dd") : '');
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export function FlightFields({ details, onChange }: FlightFieldsProps) {
  const data: FlightDetails = {
    tripType: details?.tripType || 'roundtrip',
    cabinClass: details?.cabinClass || 'economy',
    passengers: details?.passengers || [{ type: 'ADT', count: 1 }],
    segments: details?.segments?.map(s => ({ ...s, connections: s.connections || [] })) || [{ ...defaultSegment }],
    fareClass: details?.fareClass || '',
    baggage: details?.baggage || { ...defaultBaggage },
    pnr: details?.pnr || '',
    refundable: details?.refundable ?? false,
  };

  const updateField = <K extends keyof FlightDetails>(key: K, value: FlightDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  const updateBaggage = (field: keyof BaggageInfo, value: boolean | number | string) => {
    updateField('baggage', { ...data.baggage!, [field]: value });
  };

  const addSegment = () => {
    const lastSegment = data.segments[data.segments.length - 1];
    const newSegment = { 
      ...defaultSegment, 
      fromIata: lastSegment?.toIata || '',
      connections: []
    };
    updateField('segments', [...data.segments, newSegment]);
  };

  const removeSegment = (index: number) => {
    if (data.segments.length > 1) {
      updateField('segments', data.segments.filter((_, i) => i !== index));
    }
  };

  const updateSegment = (index: number, field: keyof FlightSegment, value: string | FlightConnection[]) => {
    const newSegments = [...data.segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    updateField('segments', newSegments);
  };

  const addConnection = (segmentIndex: number) => {
    const segment = data.segments[segmentIndex];
    const newConnections = [...segment.connections, {
      iata: '',
      arrivalAt: '',
      departureAt: '',
      airlineCode: '',
      flightNumber: ''
    }];
    updateSegment(segmentIndex, 'connections', newConnections);
  };

  const updateConnection = (segmentIndex: number, connectionIndex: number, field: keyof FlightConnection, value: string) => {
    const segment = data.segments[segmentIndex];
    const newConnections = [...segment.connections];
    newConnections[connectionIndex] = { ...newConnections[connectionIndex], [field]: value };
    updateSegment(segmentIndex, 'connections', newConnections);
  };

  const removeConnection = (segmentIndex: number, connectionIndex: number) => {
    const segment = data.segments[segmentIndex];
    const newConnections = segment.connections.filter((_, i) => i !== connectionIndex);
    updateSegment(segmentIndex, 'connections', newConnections);
  };

  const updatePassenger = (type: 'ADT' | 'CHD' | 'INF', count: number) => {
    const existing = data.passengers.find(p => p.type === type);
    let newPassengers: FlightPassenger[];
    if (existing) {
      newPassengers = data.passengers.map(p => p.type === type ? { ...p, count } : p);
    } else {
      newPassengers = [...data.passengers, { type, count }];
    }
    updateField('passengers', newPassengers.filter(p => p.count > 0));
  };

  const getPassengerCount = (type: 'ADT' | 'CHD' | 'INF') => {
    return data.passengers.find(p => p.type === type)?.count || 0;
  };

  const getSegmentLabel = (index: number) => {
    if (data.tripType === 'roundtrip' && data.segments.length === 2) {
      return index === 0 ? 'Ida' : 'Volta';
    }
    return `Trecho ${index + 1}`;
  };

  const baggage = data.baggage || defaultBaggage;

  return (
    <div className="space-y-4">
      {/* Trip Type and Class */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo de Viagem</Label>
          <Select value={data.tripType} onValueChange={(v) => updateField('tripType', v as FlightDetails['tripType'])}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oneway">Só Ida</SelectItem>
              <SelectItem value="roundtrip">Ida e Volta</SelectItem>
              <SelectItem value="multicity">Múltiplos Trechos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Classe</Label>
          <Select value={data.cabinClass} onValueChange={(v) => updateField('cabinClass', v)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">Econômica</SelectItem>
              <SelectItem value="premium_economy">Premium Economy</SelectItem>
              <SelectItem value="business">Executiva</SelectItem>
              <SelectItem value="first">Primeira Classe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Passengers */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">Adultos</Label>
          <Input
            type="number"
            min="0"
            className="h-9"
            value={getPassengerCount('ADT')}
            onChange={(e) => updatePassenger('ADT', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">Crianças</Label>
          <Input
            type="number"
            min="0"
            className="h-9"
            value={getPassengerCount('CHD')}
            onChange={(e) => updatePassenger('CHD', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">Bebês</Label>
          <Input
            type="number"
            min="0"
            className="h-9"
            value={getPassengerCount('INF')}
            onChange={(e) => updatePassenger('INF', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Flight Segments */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-primary" />
            <Label className="text-sm font-medium">Trechos</Label>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSegment} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Adicionar Trecho
          </Button>
        </div>
        
        <div className="space-y-3">
          {data.segments.map((segment, segIndex) => (
            <div key={segIndex} className="border rounded-lg bg-background overflow-hidden">
              {/* Segment Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-medium">
                    {getSegmentLabel(segIndex)}
                  </Badge>
                  {segment.fromIata && segment.toIata && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {segment.fromIata}
                      {segment.connections.length > 0 && segment.connections.map((c, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          <span className="text-primary">{c.iata || '?'}</span>
                        </span>
                      ))}
                      <ArrowRight className="w-3 h-3" />
                      {segment.toIata}
                    </span>
                  )}
                </div>
                {data.segments.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeSegment(segIndex)}
                    className="h-6 w-6 p-0 hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                )}
              </div>
              
              {/* Segment Fields */}
              <div className="p-3 space-y-3">
                {/* Visual Flight Path */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex flex-col gap-3">
                    {/* Origin */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-2">
                        <Plane className="w-4 h-4 text-primary rotate-45" />
                        {(segment.connections.length > 0 || true) && (
                          <div className="w-0.5 h-full min-h-8 bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 grid grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Origem</Label>
                          <Input
                            value={segment.fromIata}
                            onChange={(e) => updateSegment(segIndex, 'fromIata', e.target.value.toUpperCase())}
                            placeholder="FOR"
                            maxLength={3}
                            className="h-8 text-center font-mono uppercase font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Partida</Label>
                          <DatePickerField
                            value={splitDateTime(segment.departureAt).date}
                            onChange={(date) =>
                              updateSegment(
                                segIndex,
                                'departureAt',
                                combineDateTime(date, splitDateTime(segment.departureAt).time),
                              )
                            }
                            placeholder="Data"
                          />
                          <TimePickerField
                            value={splitDateTime(segment.departureAt).time}
                            onChange={(time) =>
                              updateSegment(
                                segIndex,
                                'departureAt',
                                combineDateTime(splitDateTime(segment.departureAt).date, time),
                              )
                            }
                            className="h-8 text-xs"
                            placeholder="Horário"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Cia</Label>
                          <Input
                            value={segment.airlineCode}
                            onChange={(e) => updateSegment(segIndex, 'airlineCode', e.target.value.toUpperCase())}
                            placeholder="LATAM"
                            maxLength={10}
                            className="h-8 text-center uppercase"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Voo</Label>
                          <Input
                            value={segment.flightNumber}
                            onChange={(e) => updateSegment(segIndex, 'flightNumber', e.target.value)}
                            placeholder="8084"
                            className="h-8 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Connections */}
                    {segment.connections.map((conn, connIndex) => (
                      <div key={connIndex} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-0.5 h-2 bg-border" />
                          <Circle className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <div className="w-0.5 h-full min-h-8 bg-border mt-1" />
                        </div>
                        <div className="flex-1 border-l-2 border-dashed border-amber-500/50 pl-3 py-1">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                              Conexão {connIndex + 1}
                            </Badge>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeConnection(segIndex, connIndex)}
                              className="h-5 w-5 p-0"
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Aeroporto</Label>
                              <Input
                                value={conn.iata}
                                onChange={(e) => updateConnection(segIndex, connIndex, 'iata', e.target.value.toUpperCase())}
                                placeholder="REC"
                                maxLength={3}
                                className="h-7 text-center font-mono uppercase text-xs font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Chegada</Label>
                              <DatePickerField
                                value={splitDateTime(conn.arrivalAt).date}
                                onChange={(date) =>
                                  updateConnection(
                                    segIndex,
                                    connIndex,
                                    'arrivalAt',
                                    combineDateTime(date, splitDateTime(conn.arrivalAt).time),
                                  )
                                }
                                placeholder="Data"
                                buttonClassName="h-8 text-[10px]"
                              />
                              <TimePickerField
                                value={splitDateTime(conn.arrivalAt).time}
                                onChange={(time) =>
                                  updateConnection(
                                    segIndex,
                                    connIndex,
                                    'arrivalAt',
                                    combineDateTime(splitDateTime(conn.arrivalAt).date, time),
                                  )
                                }
                                className="h-7 text-[10px]"
                                placeholder="Horário"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Saída</Label>
                              <DatePickerField
                                value={splitDateTime(conn.departureAt).date}
                                onChange={(date) =>
                                  updateConnection(
                                    segIndex,
                                    connIndex,
                                    'departureAt',
                                    combineDateTime(date, splitDateTime(conn.departureAt).time),
                                  )
                                }
                                placeholder="Data"
                                buttonClassName="h-8 text-[10px]"
                              />
                              <TimePickerField
                                value={splitDateTime(conn.departureAt).time}
                                onChange={(time) =>
                                  updateConnection(
                                    segIndex,
                                    connIndex,
                                    'departureAt',
                                    combineDateTime(splitDateTime(conn.departureAt).date, time),
                                  )
                                }
                                className="h-7 text-[10px]"
                                placeholder="Horário"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Cia</Label>
                            <Input
                              value={conn.airlineCode || ''}
                              onChange={(e) => updateConnection(segIndex, connIndex, 'airlineCode', e.target.value.toUpperCase())}
                              placeholder="LATAM"
                              maxLength={10}
                              className="h-7 text-center uppercase text-xs"
                            />
                          </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Voo</Label>
                              <Input
                                value={conn.flightNumber || ''}
                                onChange={(e) => updateConnection(segIndex, connIndex, 'flightNumber', e.target.value)}
                                placeholder="1234"
                                className="h-7 font-mono text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add Connection Button */}
                    <div className="flex items-center gap-3 pl-7">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addConnection(segIndex)}
                        className="h-7 text-xs border-dashed border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Adicionar Conexão
                      </Button>
                    </div>

                    {/* Destination */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-0.5 h-2 bg-border" />
                        <Plane className="w-4 h-4 text-primary -rotate-45" />
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Destino</Label>
                          <Input
                            value={segment.toIata}
                            onChange={(e) => updateSegment(segIndex, 'toIata', e.target.value.toUpperCase())}
                            placeholder="GRU"
                            maxLength={3}
                            className="h-8 text-center font-mono uppercase font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground">Chegada</Label>
                          <DatePickerField
                            value={splitDateTime(segment.arrivalAt).date}
                            onChange={(date) =>
                              updateSegment(
                                segIndex,
                                'arrivalAt',
                                combineDateTime(date, splitDateTime(segment.arrivalAt).time),
                              )
                            }
                            placeholder="Data"
                          />
                          <TimePickerField
                            value={splitDateTime(segment.arrivalAt).time}
                            onChange={(time) =>
                              updateSegment(
                                segIndex,
                                'arrivalAt',
                                combineDateTime(splitDateTime(segment.arrivalAt).date, time),
                              )
                            }
                            className="h-8 text-xs"
                            placeholder="Horário"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Baggage Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Luggage className="w-4 h-4 text-primary" />
          <Label className="text-sm font-medium">Bagagem</Label>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Carry-on */}
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="carryOn"
                checked={baggage.carryOn}
                onCheckedChange={(checked) => updateBaggage('carryOn', !!checked)}
              />
              <Label htmlFor="carryOn" className="text-sm flex items-center gap-1.5 cursor-pointer">
                <Briefcase className="w-3.5 h-3.5" />
                Bagagem de Mão
              </Label>
            </div>
            {baggage.carryOn && (
              <div className="flex items-center gap-2 pl-6">
                <Label className="text-xs text-muted-foreground">Qtd:</Label>
                <Select 
                  value={String(baggage.carryOnQty)} 
                  onValueChange={(v) => updateBaggage('carryOnQty', parseInt(v))}
                >
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Checked */}
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="checked"
                checked={baggage.checked}
                onCheckedChange={(checked) => updateBaggage('checked', !!checked)}
              />
              <Label htmlFor="checked" className="text-sm flex items-center gap-1.5 cursor-pointer">
                <Luggage className="w-3.5 h-3.5" />
                Bagagem Despachada
              </Label>
            </div>
            {baggage.checked && (
              <div className="flex items-center gap-2 pl-6">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Qtd:</Label>
                  <Select 
                    value={String(baggage.checkedQty)} 
                    onValueChange={(v) => updateBaggage('checkedQty', parseInt(v))}
                  >
                    <SelectTrigger className="h-8 w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(n => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Peso:</Label>
                  <Select 
                    value={baggage.checkedWeight || '23kg'} 
                    onValueChange={(v) => updateBaggage('checkedWeight', v)}
                  >
                    <SelectTrigger className="h-8 w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="23kg">23kg</SelectItem>
                      <SelectItem value="32kg">32kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PNR */}
      <div className="space-y-1.5">
        <Label className="text-xs">Localizador (PNR)</Label>
        <Input
          value={data.pnr || ''}
          onChange={(e) => updateField('pnr', e.target.value.toUpperCase())}
          placeholder="ABC123"
          className="h-9 font-mono uppercase"
        />
      </div>
    </div>
  );
}
