import { useEffect, useMemo, useState } from "react";
import { format as formatDate } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Building2, MapPin, Users, BedDouble, UtensilsCrossed, KeyRound, Image as ImageIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MultiImageUploader } from "@/components/itineraries/MultiImageUploader";

interface HotelGuests {
  adults: number;
  children: number;
  childrenAges?: number[];
}

interface HotelDetails {
  hotelName: string;
  city: string;
  country: string;
  address?: string;
  checkIn: string;
  checkInTime?: string;
  checkOut: string;
  checkOutTime?: string;
  roomType: string;
  board: "RO" | "BB" | "HB" | "FB" | "AI";
  guests: HotelGuests;
  ratePlan?: string;
  amenities?: string;
  confirmationNumber?: string;
  photos?: string[];
}

interface HotelFieldsProps {
  details: HotelDetails;
  onChange: (details: HotelDetails) => void;
  partnerId?: string | null;
  partners?: { id: string; name: string }[];
  onPartnerChange?: (id: string | null) => void;
}

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

const parseDateLocal = (val?: string) => {
  if (!val) return undefined;
  const [y, m, d] = val.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
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
  const dateObj = useMemo(() => parseDateLocal(value), [value]);

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
          {dateObj ? formatDate(dateObj, "dd/MM/yyyy") : (placeholder || "Selecionar")}
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

/** HH:mm com máscara (mesmo padrão do voo) */
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
    return `${String(isNaN(h) ? 0 : h).padStart(2, "0")}:${String(isNaN(m) ? 0 : m).padStart(2, "0")}`;
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

const boardLabel = (b: HotelDetails["board"]) => {
  switch (b) {
    case "RO": return "Sem refeições";
    case "BB": return "Café da manhã";
    case "HB": return "Meia pensão";
    case "FB": return "Pensão completa";
    case "AI": return "All inclusive";
    default: return b;
  }
};

const calcNights = (checkIn: string, checkOut: string) => {
  const a = parseDateLocal(checkIn);
  const b = parseDateLocal(checkOut);
  if (!a || !b) return 0;
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
  return Math.max(0, diff);
};

export function HotelFields({
  details,
  onChange,
  partnerId,
  partners = [],
  onPartnerChange,
}: HotelFieldsProps) {
  const data: HotelDetails = {
    hotelName: details?.hotelName || "",
    city: details?.city || "",
    country: details?.country || "",
    address: details?.address || "",
    checkIn: details?.checkIn || "",
    checkInTime: details?.checkInTime || "",
    checkOut: details?.checkOut || "",
    checkOutTime: details?.checkOutTime || "",
    roomType: details?.roomType || "",
    board: details?.board || "BB",
    guests: details?.guests || { adults: 2, children: 0 },
    ratePlan: details?.ratePlan || "",
    amenities: details?.amenities || "",
    confirmationNumber: details?.confirmationNumber || "",
    photos: details?.photos || [],
  };

  const updateField = <K extends keyof HotelDetails>(key: K, value: HotelDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  const guestsTotal = (data.guests?.adults || 0) + (data.guests?.children || 0);
  const nights = calcNights(data.checkIn, data.checkOut);

  return (
    <div className="space-y-4">
      {/* Header (sem label do fornecedor, placeholder “Selecione o Serviço”) */}
      <div className="rounded-lg border bg-muted/20 px-4 py-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div className="flex items-end gap-3 min-w-0">
            <div className="h-9 w-9 rounded-md border bg-background/60 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-primary" />
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

              {/* Micro texto opcional (bem discreto) */}
            
            </div>
          </div>

          <div className="hidden sm:flex items-end gap-2 flex-nowrap pb-[1px]">
            <Pill icon={<Users className="h-3 w-3" />}>{guestsTotal} hóspedes</Pill>
            <Pill icon={<UtensilsCrossed className="h-3 w-3" />}>{data.board}</Pill>
            {nights > 0 ? <Pill>{nights} noite{nights > 1 ? "s" : ""}</Pill> : null}
          </div>
        </div>
      </div>

      {/* Hóspedes */}
      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Hóspedes
            <Badge variant="secondary" className="ml-auto">
              Total: {guestsTotal}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Adultos</TinyLabel>
              <Input
                type="number"
                min="1"
                value={data.guests.adults}
                onChange={(e) =>
                  updateField("guests", {
                    ...data.guests,
                    adults: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                className="mt-2 h-9 font-mono"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Crianças</TinyLabel>
              <Input
                type="number"
                min="0"
                value={data.guests.children}
                onChange={(e) =>
                  updateField("guests", {
                    ...data.guests,
                    children: Math.max(0, parseInt(e.target.value) || 0),
                  })
                }
                className="mt-2 h-9 font-mono"
              />
            </div>
          </div>

          {/* removido “Total de hóspedes” conforme pedido */}
        </CardContent>
      </Card>

      {/* Informações do Hotel */}
      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-primary" />
            Hotel
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="rounded-lg border bg-muted/10 p-3">
            <TinyLabel>Nome do Hotel *</TinyLabel>
            <Input
              value={data.hotelName}
              onChange={(e) => updateField("hotelName", e.target.value)}
              placeholder="Hotel Ritz Paris"
              className="mt-2 h-9"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Cidade</TinyLabel>
              <Input
                value={data.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="Paris"
                className="mt-2 h-9"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>País</TinyLabel>
              <Input
                value={data.country}
                onChange={(e) => updateField("country", e.target.value)}
                placeholder="França"
                className="mt-2 h-9"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/10 p-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium">Endereço</div>
            </div>
            <Input
              value={data.address || ""}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="15 Place Vendôme, 75001"
              className="mt-2 h-9"
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Check-in</div>
                <Badge variant="outline" className="text-xs">IN</Badge>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <DatePickerField
                  value={data.checkIn}
                  onChange={(date) => updateField("checkIn", date)}
                  placeholder="Data"
                />
                <TimeInputField
                  value={data.checkInTime || ""}
                  onChange={(time) => updateField("checkInTime", time)}
                  placeholder="HH:mm"
                />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Check-out</div>
                <Badge variant="outline" className="text-xs">OUT</Badge>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <DatePickerField
                  value={data.checkOut}
                  onChange={(date) => updateField("checkOut", date)}
                  placeholder="Data"
                />
                <TimeInputField
                  value={data.checkOutTime || ""}
                  onChange={(time) => updateField("checkOutTime", time)}
                  placeholder="HH:mm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Tipo de Quarto</TinyLabel>
              <Input
                value={data.roomType}
                onChange={(e) => updateField("roomType", e.target.value)}
                placeholder="Deluxe King"
                className="mt-2 h-9"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3 space-y-2">
              <TinyLabel>Regime</TinyLabel>
              <Select
                value={data.board}
                onValueChange={(v) => updateField("board", v as HotelDetails["board"])}
              >
                <SelectTrigger className="h-9 rounded-md shadow-none bg-background/60">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RO">RO — Sem Refeições</SelectItem>
                  <SelectItem value="BB">BB — Café da Manhã</SelectItem>
                  <SelectItem value="HB">HB — Meia Pensão</SelectItem>
                  <SelectItem value="FB">FB — Pensão Completa</SelectItem>
                  <SelectItem value="AI">AI — All Inclusive</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-[11px] text-muted-foreground">
                {boardLabel(data.board)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium">Confirmação</div>
              </div>
              <Input
                value={data.confirmationNumber || ""}
                onChange={(e) => updateField("confirmationNumber", e.target.value)}
                placeholder="CONF123456"
                className="mt-2 h-9 font-mono uppercase"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Plano Tarifário</TinyLabel>
              <Input
                value={data.ratePlan || ""}
                onChange={(e) => updateField("ratePlan", e.target.value)}
                placeholder="Flexível"
                className="mt-2 h-9"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/10 p-3">
            <TinyLabel>Comodidades</TinyLabel>
            <Input
              value={data.amenities || ""}
              onChange={(e) => updateField("amenities", e.target.value)}
              placeholder="Wi-Fi, Piscina, Spa, Academia"
              className="mt-2 h-9"
            />
          </div>

          <div className="rounded-lg border bg-muted/10 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium">Fotos do hotel</div>
            </div>
            <MultiImageUploader
              value={data.photos || []}
              onChange={(urls) => updateField("photos", urls)}
              label=""
              bucket="proposal-files"
              folder="hotel"
              aspectRatio="wide"
              maxImages={4}
              maxFileSizeMB={3}
            />
            <p className="text-[11px] text-muted-foreground">Até 4 imagens de 3MB.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
