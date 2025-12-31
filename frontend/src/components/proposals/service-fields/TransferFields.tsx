import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Car, Users, Plane, Train, MapPin, Luggage, Phone } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface TransferDetails {
  transferType: "privado" | "compartilhado";
  pickupPlace: string;
  dropoffPlace: string;
  pickupAt: string;
  passengersCount: number;
  vehicleType: string;
  flightRef?: string;
  trainRef?: string;
  meetingPointInstructions?: string;
  luggageInfo?: string;
  driverContact?: string;
}

interface TransferFieldsProps {
  details: TransferDetails;
  onChange: (details: TransferDetails) => void;
  partnerId?: string | null;
  partners?: { id: string; name: string }[];
  onPartnerChange?: (id: string | null) => void;
}

const parseDate = (val?: string) => {
  if (!val) return undefined;
  const [y, m, d] = val.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(Date.UTC(y, m - 1, d, 12));
};

const DatePickerField = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const dateObj = parseDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !value && "text-muted-foreground"
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

const splitDateTime = (value?: string) => ({
  date: value ? value.slice(0, 10) : "",
  time: value && value.includes("T") ? value.slice(11, 16) : "",
});

const combineDateTime = (date?: string, time?: string) => {
  if (!date) return "";
  return `${date}T${time || "00:00"}`;
};

const timeOptions = Array.from({ length: 48 }).map((_, idx) => {
  const hours = Math.floor(idx / 2)
    .toString()
    .padStart(2, "0");
  const minutes = idx % 2 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});

const Pill = ({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground">
    {icon}
    {children}
  </div>
);

const formatDateBR = (yyyyMmDd?: string) => {
  if (!yyyyMmDd) return "";
  const [y, m, d] = yyyyMmDd.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
};

const paceTransferType = (t: TransferDetails["transferType"]) => (t === "privado" ? "Privado" : "Compartilhado");

export function TransferFields({
  details,
  onChange,
  partnerId,
  partners = [],
  onPartnerChange,
}: TransferFieldsProps) {
  const data: TransferDetails = {
    transferType: details?.transferType || "privado",
    pickupPlace: details?.pickupPlace || "",
    dropoffPlace: details?.dropoffPlace || "",
    pickupAt: details?.pickupAt || "",
    passengersCount: details?.passengersCount || 1,
    vehicleType: details?.vehicleType || "",
    flightRef: details?.flightRef || "",
    trainRef: details?.trainRef || "",
    meetingPointInstructions: details?.meetingPointInstructions || "",
    luggageInfo: details?.luggageInfo || "",
    driverContact: details?.driverContact || "",
  };

  const updateField = <K extends keyof TransferDetails>(key: K, value: TransferDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  const headerPickupDate = useMemo(() => formatDateBR(splitDateTime(data.pickupAt).date), [data.pickupAt]);
  const headerPickupTime = useMemo(() => splitDateTime(data.pickupAt).time || "", [data.pickupAt]);
  const headerWhen = useMemo(() => {
    if (!headerPickupDate && !headerPickupTime) return "";
    if (headerPickupDate && headerPickupTime) return `${headerPickupDate} • ${headerPickupTime}`;
    return headerPickupDate || headerPickupTime;
  }, [headerPickupDate, headerPickupTime]);

  return (
    <div className="space-y-4">
      {/* Header (1 linha, sem “duas linhas”) */}
      <div className="rounded-lg border bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-md border bg-background/60 flex items-center justify-center shrink-0">
            <Car className="h-4 w-4 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">
              Transfer {data.pickupPlace ? `• ${data.pickupPlace}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Pill icon={<Users className="h-3 w-3" />}>{data.passengersCount} pax</Pill>
            <Pill icon={<Car className="h-3 w-3" />}>{paceTransferType(data.transferType)}</Pill>
            {headerWhen ? <Pill icon={<CalendarIcon className="h-3 w-3" />}>{headerWhen}</Pill> : null}
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
              Transfer
            </Badge>
          </div>
        </div>
      </div>

      {/* Fornecedor (sem texto extra, mantém Select original) */}
      <div className="rounded-lg border bg-muted/10 p-3">
        <Label className="text-[11px] font-medium text-muted-foreground">Fornecedor</Label>
        <Select
          value={partnerId || "none"}
          onValueChange={(value) => onPartnerChange?.(value === "none" ? null : value)}
        >
          <SelectTrigger className="mt-2 h-9">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {partners.map((partner) => (
              <SelectItem key={partner.id} value={partner.id}>
                {partner.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-lg border bg-muted/10 p-3">
          <Label className="text-[11px] font-medium text-muted-foreground">Tipo de Transfer *</Label>
          <Select
            value={data.transferType}
            onValueChange={(v) => updateField("transferType", v as TransferDetails["transferType"])}
          >
            <SelectTrigger className="mt-2 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="privado">Privado</SelectItem>
              <SelectItem value="compartilhado">Compartilhado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border bg-muted/10 p-3">
          <Label className="text-[11px] font-medium text-muted-foreground">Tipo de Veículo</Label>
          <div className="mt-2 flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            <Input
              value={data.vehicleType}
              onChange={(e) => updateField("vehicleType", e.target.value)}
              placeholder="Sedan, Van, SUV..."
              className="h-9"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-lg border bg-muted/10 p-3">
          <Label className="text-[11px] font-medium text-muted-foreground">Local de Embarque *</Label>
          <div className="mt-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Input
              value={data.pickupPlace}
              onChange={(e) => updateField("pickupPlace", e.target.value)}
              placeholder="Aeroporto CDG, Terminal 2E"
              className="h-9"
            />
          </div>
        </div>

        <div className="rounded-lg border bg-muted/10 p-3">
          <Label className="text-[11px] font-medium text-muted-foreground">Local de Desembarque *</Label>
          <div className="mt-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Input
              value={data.dropoffPlace}
              onChange={(e) => updateField("dropoffPlace", e.target.value)}
              placeholder="Hotel Ritz, Paris"
              className="h-9"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-lg border bg-muted/10 p-3">
          <Label className="text-[11px] font-medium text-muted-foreground">Data/Hora Embarque</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <DatePickerField
              value={splitDateTime(data.pickupAt).date}
              onChange={(date) =>
                updateField("pickupAt", combineDateTime(date, splitDateTime(data.pickupAt).time))
              }
              placeholder="Data"
            />
            <Select
              value={splitDateTime(data.pickupAt).time || undefined}
              onValueChange={(time) =>
                updateField("pickupAt", combineDateTime(splitDateTime(data.pickupAt).date, time))
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Hora" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/10 p-3">
          <Label className="text-[11px] font-medium text-muted-foreground">Qtd. Passageiros</Label>
          <div className="mt-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              min="1"
              value={data.passengersCount}
              onChange={(e) => updateField("passengersCount", parseInt(e.target.value) || 1)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-lg border bg-muted/10 p-3">
          <Label className="text-[11px] font-medium text-muted-foreground">Ref. Voo</Label>
          <div className="mt-2 flex items-center gap-2">
            <Plane className="h-4 w-4 text-muted-foreground" />
            <Input
              value={data.flightRef || ""}
              onChange={(e) => updateField("flightRef", e.target.value)}
              placeholder="LA8084"
              className="h-9"
            />
          </div>
        </div>

        <div className="rounded-lg border bg-muted/10 p-3">
          <Label className="text-[11px] font-medium text-muted-foreground">Ref. Trem</Label>
          <div className="mt-2 flex items-center gap-2">
            <Train className="h-4 w-4 text-muted-foreground" />
            <Input
              value={data.trainRef || ""}
              onChange={(e) => updateField("trainRef", e.target.value)}
              placeholder="TGV 6789"
              className="h-9"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/10 p-3">
        <Label className="text-[11px] font-medium text-muted-foreground">Instruções do Ponto de Encontro</Label>
        <Input
          value={data.meetingPointInstructions || ""}
          onChange={(e) => updateField("meetingPointInstructions", e.target.value)}
          placeholder="Aguardar na saída 5 com placa"
          className="mt-2 h-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="rounded-lg border bg-muted/10 p-3">
          <Label className="text-[11px] font-medium text-muted-foreground">Info Bagagem</Label>
          <div className="mt-2 flex items-center gap-2">
            <Luggage className="h-4 w-4 text-muted-foreground" />
            <Input
              value={data.luggageInfo || ""}
              onChange={(e) => updateField("luggageInfo", e.target.value)}
              placeholder="2 malas grandes + 2 de mão"
              className="h-9"
            />
          </div>
        </div>

        <div className="rounded-lg border bg-muted/10 p-3">
          <Label className="text-[11px] font-medium text-muted-foreground">Contato do Motorista</Label>
          <div className="mt-2 flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <Input
              value={data.driverContact || ""}
              onChange={(e) => updateField("driverContact", e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="h-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
