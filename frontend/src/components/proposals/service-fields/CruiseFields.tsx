import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Anchor,
  Ship,
  CalendarDays,
  MapPin,
  LayoutGrid,
  Ticket,
  Wine,
  Wifi,
  Utensils,
} from "lucide-react";

interface CruiseDetails {
  cruiseLine: string;
  shipName: string;
  sailingDate: string;
  returnDate: string;
  embarkPort: string;
  disembarkPort: string;
  cabinType: string;
  cabinCategory: string;
  itineraryPorts?: string;
  deck?: string;
  cabinNumber?: string;
  dining?: string;
  gratuitiesIncluded?: boolean;
  drinkPackage?: string;
  wifiPackage?: string;
  bookingRef?: string;
}

interface CruiseFieldsProps {
  details: CruiseDetails;
  onChange: (details: CruiseDetails) => void;
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

export function CruiseFields({
  details,
  onChange,
  partnerId,
  partners = [],
  onPartnerChange,
}: CruiseFieldsProps) {
  const data: CruiseDetails = {
    cruiseLine: details?.cruiseLine || "",
    shipName: details?.shipName || "",
    sailingDate: details?.sailingDate || "",
    returnDate: details?.returnDate || "",
    embarkPort: details?.embarkPort || "",
    disembarkPort: details?.disembarkPort || "",
    cabinType: details?.cabinType || "",
    cabinCategory: details?.cabinCategory || "",
    itineraryPorts: details?.itineraryPorts || "",
    deck: details?.deck || "",
    cabinNumber: details?.cabinNumber || "",
    dining: details?.dining || "",
    gratuitiesIncluded: details?.gratuitiesIncluded ?? false,
    drinkPackage: details?.drinkPackage || "",
    wifiPackage: details?.wifiPackage || "",
    bookingRef: details?.bookingRef || "",
  };

  const updateField = <K extends keyof CruiseDetails>(key: K, value: CruiseDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  const nights = useMemo(() => {
    if (!data.sailingDate || !data.returnDate) return "";
    const d1 = new Date(`${data.sailingDate}T12:00:00`);
    const d2 = new Date(`${data.returnDate}T12:00:00`);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return "";
    const diff = Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000));
    return diff > 0 ? `${diff} noite(s)` : "";
  }, [data.sailingDate, data.returnDate]);

  const headerLeft = `${data.cruiseLine || "Companhia"} • ${data.shipName || "Navio"}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border bg-muted/20 px-4 py-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div className="flex items-end gap-3 min-w-0">
            <div className="h-9 w-9 rounded-md border bg-background/60 flex items-center justify-center shrink-0">
              <Ship className="h-4 w-4 text-primary" />
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
            <Pill icon={<Anchor className="h-3 w-3" />}>{nights || "cruzeiro"}</Pill>
            <Pill icon={<Ticket className="h-3 w-3" />}>{data.bookingRef || "reserva"}</Pill>
          </div>
        </div>
      </div>

      {/* Básico */}
      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Ship className="h-4 w-4 text-primary" />
            Informações do Cruzeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Companhia *</TinyLabel>
              <Input
                value={data.cruiseLine}
                onChange={(e) => updateField("cruiseLine", e.target.value)}
                placeholder="MSC, Royal Caribbean, Costa..."
                className="mt-2 h-9"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Nome do Navio *</TinyLabel>
              <Input
                value={data.shipName}
                onChange={(e) => updateField("shipName", e.target.value)}
                placeholder="MSC Grandiosa"
                className="mt-2 h-9"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Embarque
                </div>
                <Badge variant="outline" className="text-xs">
                  START
                </Badge>
              </div>
              <Input
                type="date"
                value={data.sailingDate}
                onChange={(e) => updateField("sailingDate", e.target.value)}
                className="h-9"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Desembarque
                </div>
                <Badge variant="outline" className="text-xs">
                  END
                </Badge>
              </div>
              <Input
                type="date"
                value={data.returnDate}
                onChange={(e) => updateField("returnDate", e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Porto de Embarque</TinyLabel>
              <Input
                value={data.embarkPort}
                onChange={(e) => updateField("embarkPort", e.target.value)}
                placeholder="Santos, SP"
                className="mt-2 h-9"
              />
            </div>
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Porto de Desembarque</TinyLabel>
              <Input
                value={data.disembarkPort}
                onChange={(e) => updateField("disembarkPort", e.target.value)}
                placeholder="Santos, SP"
                className="mt-2 h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cabine */}
      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            Cabine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Tipo de Cabine</TinyLabel>
              <Input
                value={data.cabinType}
                onChange={(e) => updateField("cabinType", e.target.value)}
                placeholder="Interna / Externa / Varanda / Suíte"
                className="mt-2 h-9"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Categoria da Cabine</TinyLabel>
              <Input
                value={data.cabinCategory}
                onChange={(e) => updateField("cabinCategory", e.target.value)}
                placeholder="Fantastica"
                className="mt-2 h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Deck</TinyLabel>
              <Input
                value={data.deck || ""}
                onChange={(e) => updateField("deck", e.target.value)}
                placeholder="12"
                className="mt-2 h-9"
              />
            </div>
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Nº Cabine</TinyLabel>
              <Input
                value={data.cabinNumber || ""}
                onChange={(e) => updateField("cabinNumber", e.target.value)}
                placeholder="12045"
                className="mt-2 h-9"
              />
            </div>
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Nº Reserva</TinyLabel>
              <Input
                value={data.bookingRef || ""}
                onChange={(e) => updateField("bookingRef", e.target.value)}
                placeholder="ABC123456"
                className="mt-2 h-9 font-mono uppercase"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/10 p-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium">Roteiro</div>
            </div>
            <Textarea
              value={data.itineraryPorts || ""}
              onChange={(e) => updateField("itineraryPorts", e.target.value)}
              placeholder="Santos → Ilhabela → Búzios → Santos"
              rows={2}
              className="mt-2"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              Dica: use “→” para ficar legível no PDF/print.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extras */}
      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wine className="h-4 w-4 text-primary" />
            Extras
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <div className="flex items-center gap-2">
                <Wine className="h-4 w-4 text-primary" />
                <div className="text-sm font-medium">Pacote de Bebidas</div>
              </div>
              <Input
                value={data.drinkPackage || ""}
                onChange={(e) => updateField("drinkPackage", e.target.value)}
                placeholder="Premium / Easy / Deluxe..."
                className="mt-2 h-9"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                <div className="text-sm font-medium">Pacote de Wi-Fi</div>
              </div>
              <Input
                value={data.wifiPackage || ""}
                onChange={(e) => updateField("wifiPackage", e.target.value)}
                placeholder="Social / Streaming..."
                className="mt-2 h-9"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/10 p-3">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium">Turno do Jantar</div>
            </div>
            <Input
              value={data.dining || ""}
              onChange={(e) => updateField("dining", e.target.value)}
              placeholder="Primeiro turno / Segundo turno - 21h"
              className="mt-2 h-9"
            />
          </div>

          <div className="rounded-lg border bg-muted/10 p-3">
            <div className="flex items-start gap-2">
              <Checkbox
                id="gratuitiesIncluded"
                checked={!!data.gratuitiesIncluded}
                onCheckedChange={(checked) => updateField("gratuitiesIncluded", !!checked)}
              />
              <div className="min-w-0">
                <Label htmlFor="gratuitiesIncluded" className="text-sm cursor-pointer font-medium">
                  Gorjetas incluídas
                </Label>
                <div className="text-xs text-muted-foreground">
                  Marque se a tarifa já inclui gratuities/service charge.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
