import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Plane,
  ArrowRight,
  Briefcase,
  Luggage,
  Circle,
  Users,
  Ticket,
  Route,
  Clock,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  type: "ADT" | "CHD" | "INF";
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
  tripType: "oneway" | "roundtrip" | "multicity";
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
  partnerId?: string | null;
  partners?: { id: string; name: string }[];
  onPartnerChange?: (id: string | null) => void;
}

const defaultSegment: FlightSegment = {
  fromIata: "",
  toIata: "",
  departureAt: "",
  arrivalAt: "",
  airlineCode: "",
  flightNumber: "",
  connections: [],
};

const defaultBaggage: BaggageInfo = {
  carryOn: true,
  carryOnQty: 1,
  checked: false,
  checkedQty: 0,
  checkedWeight: "23kg",
};

const splitDateTime = (value?: string) => ({
  date: value ? value.slice(0, 10) : "",
  time: value && value.includes("T") ? value.slice(11, 16) : "",
});

const combineDateTime = (date?: string, time?: string) => {
  if (!date) return "";
  return `${date}T${time || "00:00"}`;
};

const parseDate = (value?: string) => {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

const parseISODateTimeLocal = (value?: string) => {
  if (!value) return undefined;
  const [date, time] = value.split("T");
  if (!date) return undefined;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
};

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h <= 0 && m <= 0) return "";
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const TinyLabel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <Label className={cn("text-[11px] font-medium text-muted-foreground", className)}>
    {children}
  </Label>
);

const Pill = ({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) => (
  <div
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
      "bg-background/60",
      "text-[11px] text-muted-foreground"
    )}
  >
    {icon}
    {children}
  </div>
);

const IataChip = ({ value }: { value?: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-md border px-2 py-1",
      "bg-background/60",
      "font-mono text-xs font-semibold uppercase tracking-wide",
      !value && "text-muted-foreground"
    )}
  >
    {value || "___"}
  </span>
);

/**
 * Time input with HH:mm mask.
 * - accepts digits and formats to "HH:mm"
 * - clamps on blur (00-23 / 00-59)
 */
const TimeInputField = ({
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
  const [display, setDisplay] = useState(value || "");

  useEffect(() => {
    setDisplay(value || "");
  }, [value]);

  const formatPartial = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  };

  const clampFinal = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length === 0) return "";
    const hh = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const h = Math.min(23, Math.max(0, parseInt(hh || "0", 10)));
    const m = Math.min(59, Math.max(0, parseInt(mm || "0", 10)));
    const hh2 = String(isNaN(h) ? 0 : h).padStart(2, "0");
    const mm2 = String(isNaN(m) ? 0 : m).padStart(2, "0");
    return `${hh2}:${mm2}`;
  };

  return (
    <Input
      value={display}
      onChange={(e) => {
        const next = formatPartial(e.target.value);
        setDisplay(next);
        if (/^\d{2}:\d{2}$/.test(next)) onChange(next);
        if (next === "") onChange("");
      }}
      onBlur={() => {
        const final = clampFinal(display);
        setDisplay(final);
        onChange(final);
      }}
      inputMode="numeric"
      placeholder={placeholder || "HH:mm"}
      className={cn("h-9 font-mono", className)}
    />
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
            "w-full justify-start text-left font-normal h-9 rounded-md",
            "bg-background/60",
            "shadow-none",
            !value && "text-muted-foreground",
            buttonClassName
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateObj ? format(dateObj, "dd/MM/yyyy") : placeholder || "Selecionar"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateObj}
          onSelect={(day) => {
            onChange(day ? format(day, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

/**
 * Timeline that does NOT distort when connections change.
 */
const StopTimeline = ({
  from,
  to,
  connectionIatas,
}: {
  from: string;
  to: string;
  connectionIatas: string[];
}) => {
  const stops = connectionIatas;
  const count = stops.length;

  const stopPositions = useMemo(() => {
    if (count <= 0) return [];
    return Array.from({ length: count }).map((_, i) => ((i + 1) / (count + 1)) * 100);
  }, [count]);

  return (
    <div className="space-y-2">
      <div className="relative rounded-md border bg-background/60 px-3 py-2">
        <div className="relative h-9">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-semibold">
            {from || "___"}
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-semibold">
            {to || "___"}
          </div>

          <div className="absolute left-14 right-14 top-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="h-1 rounded-full bg-border" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-primary" />

              {stopPositions.map((pct, idx) => {
                const label = (stops[idx] || "").toUpperCase();
                return (
                  <div
                    key={`${idx}-${pct}`}
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left: `${pct}%` }}
                  >
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <div className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap">
                      <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        {label || "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {count > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Circle className="h-3 w-3 text-amber-500 fill-amber-500" />
              {count} conexão(ões):
            </span>
            {stops.map((iata, idx) => (
              <span key={`${iata}-${idx}`} className="font-mono uppercase">
                {(iata || "—").toUpperCase()}
                {idx < stops.length - 1 ? "," : ""}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export function FlightFields({
  details,
  onChange,
  partnerId,
  partners = [],
  onPartnerChange,
}: FlightFieldsProps) {
  const data: FlightDetails = {
    tripType: details?.tripType || "roundtrip",
    cabinClass: details?.cabinClass || "economy",
    passengers: details?.passengers || [{ type: "ADT", count: 1 }],
    segments:
      details?.segments?.map((s) => ({ ...s, connections: s.connections || [] })) ||
      [{ ...defaultSegment }],
    fareClass: details?.fareClass || "",
    baggage: details?.baggage || { ...defaultBaggage },
    pnr: details?.pnr || "",
    refundable: details?.refundable ?? false,
  };

  const updateField = <K extends keyof FlightDetails>(key: K, value: FlightDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  const updateBaggage = (field: keyof BaggageInfo, value: boolean | number | string) => {
    updateField("baggage", { ...data.baggage!, [field]: value });
  };

  const addSegment = () => {
    const lastSegment = data.segments[data.segments.length - 1];
    const newSegment = { ...defaultSegment, fromIata: lastSegment?.toIata || "", connections: [] };
    updateField("segments", [...data.segments, newSegment]);
  };

  const removeSegment = (index: number) => {
    if (data.segments.length > 1) {
      updateField(
        "segments",
        data.segments.filter((_, i) => i !== index)
      );
    }
  };

  const updateSegment = (
    index: number,
    field: keyof FlightSegment,
    value: string | FlightConnection[]
  ) => {
    const newSegments = [...data.segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    updateField("segments", newSegments);
  };

  const addConnection = (segmentIndex: number) => {
    const segment = data.segments[segmentIndex];
    const newConnections = [
      ...segment.connections,
      { iata: "", arrivalAt: "", departureAt: "", airlineCode: "", flightNumber: "" },
    ];
    updateSegment(segmentIndex, "connections", newConnections);
  };

  const updateConnection = (
    segmentIndex: number,
    connectionIndex: number,
    field: keyof FlightConnection,
    value: string
  ) => {
    const segment = data.segments[segmentIndex];
    const newConnections = [...segment.connections];
    newConnections[connectionIndex] = { ...newConnections[connectionIndex], [field]: value };
    updateSegment(segmentIndex, "connections", newConnections);
  };

  const removeConnection = (segmentIndex: number, connectionIndex: number) => {
    const segment = data.segments[segmentIndex];
    const newConnections = segment.connections.filter((_, i) => i !== connectionIndex);
    updateSegment(segmentIndex, "connections", newConnections);
  };

  const updatePassenger = (type: "ADT" | "CHD" | "INF", count: number) => {
    const existing = data.passengers.find((p) => p.type === type);
    let newPassengers: FlightPassenger[];
    if (existing) {
      newPassengers = data.passengers.map((p) => (p.type === type ? { ...p, count } : p));
    } else {
      newPassengers = [...data.passengers, { type, count }];
    }
    updateField("passengers", newPassengers.filter((p) => p.count > 0));
  };

  const getPassengerCount = (type: "ADT" | "CHD" | "INF") =>
    data.passengers.find((p) => p.type === type)?.count || 0;

  const getSegmentLabel = (index: number) => {
    if (data.tripType === "roundtrip" && data.segments.length === 2) {
      return index === 0 ? "Ida" : "Volta";
    }
    return `Trecho ${index + 1}`;
  };

  const passengersTotal = data.passengers.reduce((acc, p) => acc + p.count, 0);
  const baggage = data.baggage || defaultBaggage;

  const segmentDurationLabel = (s: FlightSegment) => {
    const d1 = parseISODateTimeLocal(s.departureAt);
    const d2 = parseISODateTimeLocal(s.arrivalAt);
    if (!d1 || !d2) return "";
    const diffMin = Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 60000));
    return formatDuration(diffMin);
  };

  const segmentDateLabel = (s: FlightSegment) => {
    const d1 = parseISODateTimeLocal(s.departureAt);
    if (!d1) return "";
    return format(d1, "dd/MM/yyyy");
  };

  const segmentTimeLabel = (s: FlightSegment) => {
    const dep = splitDateTime(s.departureAt).time || "--:--";
    const arr = splitDateTime(s.arrivalAt).time || "--:--";
    return `${dep} → ${arr}`;
  };

  return (
    <div className="space-y-4">
     {/* Header (alinhado pela base do Select) */}
<div className="rounded-lg border bg-muted/20 px-4 py-3">
  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
    {/* Left */}
    <div className="flex items-end gap-3 min-w-0">
      <div className="h-9 w-9 rounded-md border bg-background/60 flex items-center justify-center shrink-0">
        <Plane className="h-4 w-4 text-primary" />
      </div>

      <div className="min-w-0">
        <div className="mt-1">
          <Select
            value={partnerId || "none"}
            onValueChange={(value) => onPartnerChange?.(value === "none" ? null : value)}
          >
            <SelectTrigger className="h-9 w-[260px] sm:w-[320px]">
              <SelectValue placeholder="Selecione o Fornecedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Selecione o Fornecedor</SelectItem>
              {partners.map((partner) => (
                <SelectItem key={partner.id} value={partner.id}>
                  {partner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    {/* Right */}
    <div className="hidden sm:flex items-end gap-2 flex-nowrap pb-[1px]">
      <Pill icon={<Users className="h-3 w-3" />}>{passengersTotal} pax</Pill>
      <Pill icon={<Ticket className="h-3 w-3" />}>{data.cabinClass}</Pill>
      <Pill icon={<Route className="h-3 w-3" />}>{data.tripType}</Pill>
    </div>
  </div>
</div>


      {/* Passengers */}
      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Passageiros
            <Badge variant="secondary" className="ml-auto">
              Total: {passengersTotal}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Adultos (ADT)</TinyLabel>
              <Input
                type="number"
                min="0"
                className="mt-2 h-9 w-full font-mono"
                value={getPassengerCount("ADT")}
                onChange={(e) => updatePassenger("ADT", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Crianças (CHD)</TinyLabel>
              <Input
                type="number"
                min="0"
                className="mt-2 h-9 w-full font-mono"
                value={getPassengerCount("CHD")}
                onChange={(e) => updatePassenger("CHD", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Bebês (INF)</TinyLabel>
              <Input
                type="number"
                min="0"
                className="mt-2 h-9 w-full font-mono"
                value={getPassengerCount("INF")}
                onChange={(e) => updatePassenger("INF", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Total (sem "Calculado automaticamente") */}
          <div className="rounded-lg border bg-muted/10 p-3 flex items-center justify-between">
            <div className="text-sm font-medium">Total de passageiros</div>
            <Input value={String(passengersTotal)} readOnly disabled className="h-9 w-24 text-right font-mono" />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-2 rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Localizador (PNR)</TinyLabel>
              <Input
                value={data.pnr || ""}
                onChange={(e) => updateField("pnr", e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="mt-2 h-9 font-mono uppercase"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="refundable"
                  checked={!!data.refundable}
                  onCheckedChange={(checked) => updateField("refundable", !!checked)}
                />
                <div className="min-w-0">
                  <Label htmlFor="refundable" className="text-sm cursor-pointer font-medium">
                    Reembolsável
                  </Label>
                  <div className="text-xs text-muted-foreground">Marque se a tarifa permitir reembolso.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3 space-y-2">
              <TinyLabel>Tipo de Viagem</TinyLabel>
              <Select
                value={data.tripType}
                onValueChange={(v) => updateField("tripType", v as FlightDetails["tripType"])}
              >
                <SelectTrigger className="h-9 rounded-md shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oneway">Só Ida</SelectItem>
                  <SelectItem value="roundtrip">Ida e Volta</SelectItem>
                  <SelectItem value="multicity">Múltiplos Trechos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border bg-muted/10 p-3 space-y-2">
              <TinyLabel>Classe</TinyLabel>
              <Select value={data.cabinClass} onValueChange={(v) => updateField("cabinClass", v)}>
                <SelectTrigger className="h-9 rounded-md shadow-none">
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

            <div className="rounded-lg border bg-muted/10 p-3 space-y-2">
              <TinyLabel>Fare Class (opcional)</TinyLabel>
              <Input
                value={data.fareClass || ""}
                onChange={(e) => updateField("fareClass", e.target.value.toUpperCase())}
                placeholder="Y, B, M..."
                className="h-9 font-mono uppercase"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segments */}
      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plane className="h-4 w-4 text-primary" />
              Trechos
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addSegment} className="h-9">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Trecho
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {data.segments.map((segment, segIndex) => {
            const dep = splitDateTime(segment.departureAt);
            const arr = splitDateTime(segment.arrivalAt);
            const connIatas = segment.connections.map((c) => (c.iata || "").toUpperCase());

            return (
              <div key={segIndex} className="rounded-lg border overflow-hidden bg-muted/10">
                <div className="px-4 py-3 border-b bg-background">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {getSegmentLabel(segIndex)}
                        </Badge>

                        {(segment.airlineCode || segment.flightNumber) && (
                          <Badge variant="outline" className="text-xs">
                            {segment.airlineCode || "—"}
                            {segment.flightNumber ? ` ${segment.flightNumber}` : ""}
                          </Badge>
                        )}

                        {!!segmentDurationLabel(segment) && (
                          <Pill icon={<Clock className="h-3 w-3" />}>{segmentDurationLabel(segment)}</Pill>
                        )}
                        {!!segmentDateLabel(segment) && <Pill>{segmentDateLabel(segment)}</Pill>}
                        {!!segmentTimeLabel(segment) && <Pill>{segmentTimeLabel(segment)}</Pill>}
                      </div>

                      <StopTimeline from={segment.fromIata} to={segment.toIata} connectionIatas={connIatas} />

                      <div className="flex items-center gap-2 flex-wrap">
                        <IataChip value={segment.fromIata} />
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <IataChip value={segment.toIata} />
                        {segment.operatingCarrier ? (
                          <Badge variant="outline" className="text-xs">
                            Op: {segment.operatingCarrier}
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    {data.segments.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSegment(segIndex)}
                        className="h-9 w-9 p-0 hover:bg-destructive/10"
                        aria-label="Remover trecho"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="rounded-lg border bg-background p-3">
                      <TinyLabel>Origem (IATA)</TinyLabel>
                      <Input
                        value={segment.fromIata}
                        onChange={(e) => updateSegment(segIndex, "fromIata", e.target.value.toUpperCase())}
                        placeholder="FOR"
                        maxLength={3}
                        className="mt-2 h-9 text-center font-mono uppercase font-semibold"
                      />
                    </div>

                    <div className="rounded-lg border bg-background p-3">
                      <TinyLabel>Destino (IATA)</TinyLabel>
                      <Input
                        value={segment.toIata}
                        onChange={(e) => updateSegment(segIndex, "toIata", e.target.value.toUpperCase())}
                        placeholder="GRU"
                        maxLength={3}
                        className="mt-2 h-9 text-center font-mono uppercase font-semibold"
                      />
                    </div>

                    <div className="rounded-lg border bg-background p-3">
                      <TinyLabel>Operadora (opcional)</TinyLabel>
                      <Input
                        value={segment.operatingCarrier || ""}
                        onChange={(e) => updateSegment(segIndex, "operatingCarrier", e.target.value.toUpperCase())}
                        placeholder="G3 / LA / TP..."
                        className="mt-2 h-9 font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="rounded-lg border bg-background p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Partida</div>
                        <Badge variant="outline" className="text-xs">
                          DEP
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <DatePickerField
                          value={dep.date}
                          onChange={(date) => updateSegment(segIndex, "departureAt", combineDateTime(date, dep.time))}
                          placeholder="Data"
                        />
                        <TimeInputField
                          value={dep.time}
                          onChange={(time) => updateSegment(segIndex, "departureAt", combineDateTime(dep.date, time))}
                          placeholder="HH:mm"
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border bg-background p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Chegada</div>
                        <Badge variant="outline" className="text-xs">
                          ARR
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <DatePickerField
                          value={arr.date}
                          onChange={(date) => updateSegment(segIndex, "arrivalAt", combineDateTime(date, arr.time))}
                          placeholder="Data"
                        />
                        <TimeInputField
                          value={arr.time}
                          onChange={(time) => updateSegment(segIndex, "arrivalAt", combineDateTime(arr.date, time))}
                          placeholder="HH:mm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="rounded-lg border bg-background p-3">
                      <TinyLabel>Cia</TinyLabel>
                      <Input
                        value={segment.airlineCode}
                        onChange={(e) => updateSegment(segIndex, "airlineCode", e.target.value.toUpperCase())}
                        placeholder="LA"
                        maxLength={10}
                        className="mt-2 h-9 text-center font-mono uppercase"
                      />
                    </div>

                    <div className="rounded-lg border bg-background p-3">
                      <TinyLabel>Nº Voo</TinyLabel>
                      <Input
                        value={segment.flightNumber}
                        onChange={(e) => updateSegment(segIndex, "flightNumber", e.target.value)}
                        placeholder="8084"
                        className="mt-2 h-9 text-center font-mono"
                      />
                    </div>

                    <div className="rounded-lg border bg-background p-3">
                      <div className="flex items-center justify-between">
                        <TinyLabel>Conexões</TinyLabel>
                        <Badge variant="secondary">{segment.connections.length}</Badge>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addConnection(segIndex)}
                        className="mt-2 w-full h-9 border-dashed"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Conexão
                      </Button>
                    </div>
                  </div>

                  {segment.connections.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Circle className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <div className="text-sm font-medium">Conexões</div>
                      </div>

                      <div className="space-y-2">
                        {segment.connections.map((conn, connIndex) => {
                          const cArr = splitDateTime(conn.arrivalAt);
                          const cDep = splitDateTime(conn.departureAt);

                          return (
                            <div key={connIndex} className="rounded-lg border bg-amber-500/5 p-3">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-700">
                                  Conexão {connIndex + 1}
                                </Badge>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeConnection(segIndex, connIndex)}
                                  className="h-9 w-9 p-0 hover:bg-destructive/10"
                                  aria-label="Remover conexão"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div className="rounded-lg border bg-background p-3">
                                  <TinyLabel>Aeroporto (IATA)</TinyLabel>
                                  <Input
                                    value={conn.iata}
                                    onChange={(e) =>
                                      updateConnection(segIndex, connIndex, "iata", e.target.value.toUpperCase())
                                    }
                                    placeholder="REC"
                                    maxLength={3}
                                    className="mt-2 h-9 text-center font-mono uppercase font-semibold"
                                  />
                                </div>

                                <div className="rounded-lg border bg-background p-3">
                                  <TinyLabel>Cia</TinyLabel>
                                  <Input
                                    value={conn.airlineCode || ""}
                                    onChange={(e) =>
                                      updateConnection(segIndex, connIndex, "airlineCode", e.target.value.toUpperCase())
                                    }
                                    placeholder="LA"
                                    maxLength={10}
                                    className="mt-2 h-9 text-center font-mono uppercase"
                                  />
                                </div>

                                <div className="rounded-lg border bg-background p-3">
                                  <TinyLabel>Nº Voo</TinyLabel>
                                  <Input
                                    value={conn.flightNumber || ""}
                                    onChange={(e) =>
                                      updateConnection(segIndex, connIndex, "flightNumber", e.target.value)
                                    }
                                    placeholder="1234"
                                    className="mt-2 h-9 text-center font-mono"
                                  />
                                </div>
                              </div>

                              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="rounded-lg border bg-background p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium">Chegada</div>
                                    <Badge variant="outline" className="text-xs">
                                      ARR
                                    </Badge>
                                  </div>
                                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <DatePickerField
                                      value={cArr.date}
                                      onChange={(date) =>
                                        updateConnection(
                                          segIndex,
                                          connIndex,
                                          "arrivalAt",
                                          combineDateTime(date, cArr.time)
                                        )
                                      }
                                      placeholder="Data"
                                    />
                                    <TimeInputField
                                      value={cArr.time}
                                      onChange={(time) =>
                                        updateConnection(
                                          segIndex,
                                          connIndex,
                                          "arrivalAt",
                                          combineDateTime(cArr.date, time)
                                        )
                                      }
                                      placeholder="HH:mm"
                                    />
                                  </div>
                                </div>

                                <div className="rounded-lg border bg-background p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium">Saída</div>
                                    <Badge variant="outline" className="text-xs">
                                      DEP
                                    </Badge>
                                  </div>
                                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <DatePickerField
                                      value={cDep.date}
                                      onChange={(date) =>
                                        updateConnection(
                                          segIndex,
                                          connIndex,
                                          "departureAt",
                                          combineDateTime(date, cDep.time)
                                        )
                                      }
                                      placeholder="Data"
                                    />
                                    <TimeInputField
                                      value={cDep.time}
                                      onChange={(time) =>
                                        updateConnection(
                                          segIndex,
                                          connIndex,
                                          "departureAt",
                                          combineDateTime(cDep.date, time)
                                        )
                                      }
                                      placeholder="HH:mm"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Baggage */}
      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Luggage className="h-4 w-4 text-primary" />
            Bagagem
          </CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="carryOn"
                checked={baggage.carryOn}
                onCheckedChange={(checked) => updateBaggage("carryOn", !!checked)}
              />
              <Label htmlFor="carryOn" className="text-sm flex items-center gap-1.5 cursor-pointer font-medium">
                <Briefcase className="w-4 h-4" />
                Bagagem de Mão
              </Label>
              <Badge variant="outline" className="ml-auto text-xs">
                CABIN
              </Badge>
            </div>

            {baggage.carryOn && (
              <div className="flex items-center justify-between gap-3">
                <TinyLabel>Quantidade</TinyLabel>
                <Select
                  value={String(baggage.carryOnQty)}
                  onValueChange={(v) => updateBaggage("carryOnQty", parseInt(v))}
                >
                  <SelectTrigger className="h-9 w-24 rounded-md shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="text-xs text-muted-foreground">Cabine: franquia varia por companhia/tarifa.</div>
          </div>

          <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="checked"
                checked={baggage.checked}
                onCheckedChange={(checked) => updateBaggage("checked", !!checked)}
              />
              <Label htmlFor="checked" className="text-sm flex items-center gap-1.5 cursor-pointer font-medium">
                <Luggage className="w-4 h-4" />
                Bagagem Despachada
              </Label>
              <Badge variant="outline" className="ml-auto text-xs">
                HOLD
              </Badge>
            </div>

            {baggage.checked && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between gap-3">
                  <TinyLabel>Qtd</TinyLabel>
                  <Select
                    value={String(baggage.checkedQty)}
                    onValueChange={(v) => updateBaggage("checkedQty", parseInt(v))}
                  >
                    <SelectTrigger className="h-9 rounded-md shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <TinyLabel>Peso</TinyLabel>
                  <Select
                    value={baggage.checkedWeight || "23kg"}
                    onValueChange={(v) => updateBaggage("checkedWeight", v)}
                  >
                    <SelectTrigger className="h-9 rounded-md shadow-none">
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

            <div className="text-xs text-muted-foreground">Despachada: informe quantidade e peso.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
