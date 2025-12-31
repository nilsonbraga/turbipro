import { useMemo, useState } from "react";
import { format as formatDate } from "date-fns";
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
import {
  Calendar as CalendarIcon,
  Car,
  Fuel,
  Gauge,
  MapPin,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface CarDetails {
  rentalCompany: string;
  pickupLocation: string;
  pickupAt: string; // yyyy-MM-ddTHH:mm
  dropoffLocation: string;
  dropoffAt: string; // yyyy-MM-ddTHH:mm
  carCategory: string;
  transmission: "auto" | "manual";
  driverName?: string;
  driverAge?: number;
  mileagePolicy: string;
  fuelPolicy: string;
  insurance?: string;
  deposit?: string;
  extras?: string;
}

interface CarFieldsProps {
  details: CarDetails;
  onChange: (details: CarDetails) => void;
  partnerId?: string | null;
  partners?: { id: string; name: string }[];
  onPartnerChange?: (id: string | null) => void;
}

const parseDate = (value?: string) => {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
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
  const hours = String(Math.floor(idx / 2)).padStart(2, "0");
  const minutes = idx % 2 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});

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
  const dateObj = useMemo(() => parseDate(value), [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9 rounded-md",
            "bg-background/60 shadow-none",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateObj ? formatDate(dateObj, "dd/MM/yyyy") : placeholder || "Selecionar"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateObj}
          onSelect={(day) => {
            onChange(day ? formatDate(day, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export function CarFields({
  details,
  onChange,
  partnerId,
  partners = [],
  onPartnerChange,
}: CarFieldsProps) {
  const data: CarDetails = {
    rentalCompany: details?.rentalCompany || "",
    pickupLocation: details?.pickupLocation || "",
    pickupAt: details?.pickupAt || "",
    dropoffLocation: details?.dropoffLocation || "",
    dropoffAt: details?.dropoffAt || "",
    carCategory: details?.carCategory || "",
    transmission: details?.transmission || "auto",
    driverName: details?.driverName || "",
    driverAge: details?.driverAge,
    mileagePolicy: details?.mileagePolicy || "",
    fuelPolicy: details?.fuelPolicy || "",
    insurance: details?.insurance || "",
    deposit: details?.deposit || "",
    extras: details?.extras || "",
  };

  const updateField = <K extends keyof CarDetails>(key: K, value: CarDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  const pickup = splitDateTime(data.pickupAt);
  const dropoff = splitDateTime(data.dropoffAt);

  const durationLabel = useMemo(() => {
    const d1 = data.pickupAt ? new Date(data.pickupAt) : null;
    const d2 = data.dropoffAt ? new Date(data.dropoffAt) : null;
    if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) return "";
    const diffMin = Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 60000));
    const days = Math.floor(diffMin / 1440);
    const hours = Math.floor((diffMin % 1440) / 60);
    if (days <= 0 && hours <= 0) return "";
    if (days > 0 && hours > 0) return `${days}d ${hours}h`;
    if (days > 0) return `${days}d`;
    return `${hours}h`;
  }, [data.pickupAt, data.dropoffAt]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border bg-muted/20 px-4 py-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div className="flex items-end gap-3 min-w-0">
            <div className="h-9 w-9 rounded-md border bg-background/60 flex items-center justify-center shrink-0">
              <Car className="h-4 w-4 text-primary" />
            </div>

            <div className="min-w-0">
              <Select
                value={partnerId || "none"}
                onValueChange={(value) => onPartnerChange?.(value === "none" ? null : value)}
              >
                <SelectTrigger className="h-9 w-[260px] sm:w-[320px]">
                  <SelectValue placeholder="Selecione o Serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione o Serviço</SelectItem>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="hidden sm:flex items-end gap-2 flex-nowrap pb-[1px]">
            <Pill icon={<Gauge className="h-3 w-3" />}>{data.carCategory || "categoria"}</Pill>
            <Pill>{data.transmission}</Pill>
            {!!durationLabel && <Pill>{durationLabel}</Pill>}
          </div>
        </div>
      </div>

      {/* Locação */}
      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            Locação
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Locadora *</TinyLabel>
              <Input
                value={data.rentalCompany}
                onChange={(e) => updateField("rentalCompany", e.target.value)}
                placeholder="Localiza, Hertz, Sixt..."
                className="mt-2 h-9"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Categoria do Veículo</TinyLabel>
              <Input
                value={data.carCategory}
                onChange={(e) => updateField("carCategory", e.target.value)}
                placeholder="SUV compacto / Econômico / Intermediário..."
                className="mt-2 h-9"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/10 p-3 space-y-2">
            <TinyLabel>Câmbio</TinyLabel>
            <Select
              value={data.transmission}
              onValueChange={(v) => updateField("transmission", v as "auto" | "manual")}
            >
              <SelectTrigger className="h-9 rounded-md shadow-none bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automático</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Retirada / Devolução */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Retirada
                </div>
                <Badge variant="outline" className="text-xs">
                  PICKUP
                </Badge>
              </div>

              <Input
                value={data.pickupLocation}
                onChange={(e) => updateField("pickupLocation", e.target.value)}
                placeholder="Aeroporto CDG / Centro / Estação..."
                className="h-9"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <DatePickerField
                  value={pickup.date}
                  onChange={(date) => updateField("pickupAt", combineDateTime(date, pickup.time))}
                  placeholder="Data"
                />
                <Select
                  value={pickup.time || undefined}
                  onValueChange={(time) => updateField("pickupAt", combineDateTime(pickup.date, time))}
                >
                  <SelectTrigger className="h-9 bg-background/60">
                    <SelectValue placeholder="Hora" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {timeOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/10 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Devolução
                </div>
                <Badge variant="outline" className="text-xs">
                  DROPOFF
                </Badge>
              </div>

              <Input
                value={data.dropoffLocation}
                onChange={(e) => updateField("dropoffLocation", e.target.value)}
                placeholder="Aeroporto ORY / Centro / Estação..."
                className="h-9"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <DatePickerField
                  value={dropoff.date}
                  onChange={(date) => updateField("dropoffAt", combineDateTime(date, dropoff.time))}
                  placeholder="Data"
                />
                <Select
                  value={dropoff.time || undefined}
                  onValueChange={(time) => updateField("dropoffAt", combineDateTime(dropoff.date, time))}
                >
                  <SelectTrigger className="h-9 bg-background/60">
                    <SelectValue placeholder="Hora" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {timeOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Condutor */}
      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Condutor
          </CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="rounded-lg border bg-muted/10 p-3">
            <TinyLabel>Nome do Motorista</TinyLabel>
            <Input
              value={data.driverName || ""}
              onChange={(e) => updateField("driverName", e.target.value)}
              placeholder="João Silva"
              className="mt-2 h-9"
            />
          </div>

          <div className="rounded-lg border bg-muted/10 p-3">
            <TinyLabel>Idade do Motorista</TinyLabel>
            <Input
              type="number"
              min="18"
              value={data.driverAge ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                updateField("driverAge", v === "" ? undefined : Math.max(18, parseInt(v, 10) || 18));
              }}
              placeholder="25"
              className="mt-2 h-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Políticas */}
      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Fuel className="h-4 w-4 text-primary" />
            Políticas
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Política de Km</TinyLabel>
              <Input
                value={data.mileagePolicy}
                onChange={(e) => updateField("mileagePolicy", e.target.value)}
                placeholder="Km ilimitado"
                className="mt-2 h-9"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Política de Combustível</TinyLabel>
              <Input
                value={data.fuelPolicy}
                onChange={(e) => updateField("fuelPolicy", e.target.value)}
                placeholder="Cheio/Cheio"
                className="mt-2 h-9"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <div className="text-sm font-medium">Seguro</div>
              </div>
              <Input
                value={data.insurance || ""}
                onChange={(e) => updateField("insurance", e.target.value)}
                placeholder="CDW + Roubo / Cobertura total..."
                className="mt-2 h-9"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <div className="text-sm font-medium">Depósito / Caução</div>
              </div>
              <Input
                value={data.deposit || ""}
                onChange={(e) => updateField("deposit", e.target.value)}
                placeholder="€500 / R$ 2.000"
                className="mt-2 h-9"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/10 p-3">
            <TinyLabel>Extras</TinyLabel>
            <Input
              value={data.extras || ""}
              onChange={(e) => updateField("extras", e.target.value)}
              placeholder="GPS, Cadeirinha, Motorista adicional..."
              className="mt-2 h-9"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
