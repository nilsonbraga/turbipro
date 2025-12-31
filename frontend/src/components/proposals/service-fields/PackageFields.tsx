import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Package, CalendarDays, MapPin, Moon } from "lucide-react";

interface PackageDetails {
  packageName: string;
  startDate: string;
  endDate: string;
  destinations: string;
  nights?: number;
  inclusions: string;
  exclusions: string;
  itinerarySummary?: string;
  cancellationPolicy?: string;
}

interface PackageFieldsProps {
  details: PackageDetails;
  onChange: (details: PackageDetails) => void;
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

const formatDateBR = (yyyyMmDd?: string) => {
  if (!yyyyMmDd) return "";
  const [y, m, d] = yyyyMmDd.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
};

export function PackageFields({
  details,
  onChange,
  partnerId,
  partners = [],
  onPartnerChange,
}: PackageFieldsProps) {
  const data: PackageDetails = {
    packageName: details?.packageName || "",
    startDate: details?.startDate || "",
    endDate: details?.endDate || "",
    destinations: details?.destinations || "",
    nights: details?.nights,
    inclusions: details?.inclusions || "",
    exclusions: details?.exclusions || "",
    itinerarySummary: details?.itinerarySummary || "",
    cancellationPolicy: details?.cancellationPolicy || "",
  };

  const updateField = <K extends keyof PackageDetails>(key: K, value: PackageDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  const headerTitle = useMemo(
    () => data.packageName?.trim() || "Pacote",
    [data.packageName]
  );

  const headerDest = useMemo(
    () => data.destinations?.trim() || "",
    [data.destinations]
  );

  const headerDates = useMemo(() => {
    const a = formatDateBR(data.startDate);
    const b = formatDateBR(data.endDate);
    if (a && b) return `${a} → ${b}`;
    return a || b || "";
  }, [data.startDate, data.endDate]);

  const headerNights = useMemo(() => {
    if (typeof data.nights !== "number") return "";
    return data.nights === 1 ? "1 noite" : `${data.nights} noites`;
  }, [data.nights]);

  return (
    <div className="space-y-4">
      {/* Header (1 linha, sem inventar campos) */}
      <div className="rounded-lg border bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-md border bg-background/60 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{headerTitle}</div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerNights ? (
              <Pill icon={<Moon className="h-3 w-3" />}>{headerNights}</Pill>
            ) : null}

            {headerDates ? (
              <Pill icon={<CalendarDays className="h-3 w-3" />}>{headerDates}</Pill>
            ) : null}

            {headerDest ? (
              <Pill icon={<MapPin className="h-3 w-3" />}>{headerDest}</Pill>
            ) : null}

            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
              Pacote
            </Badge>
          </div>
        </div>
      </div>

      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Detalhes do pacote
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Fornecedor (mesmo campo/Select do original) */}
          <div className="rounded-lg border bg-muted/10 p-3">
            <TinyLabel>Fornecedor</TinyLabel>
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

          {/* Nome */}
          <div className="rounded-lg border bg-muted/10 p-3">
            <TinyLabel>Nome do Pacote *</TinyLabel>
            <Input
              value={data.packageName}
              onChange={(e) => updateField("packageName", e.target.value)}
              placeholder="Lua de Mel em Paris"
              className="mt-2 h-9"
            />
          </div>

          {/* Destinos */}
          <div className="rounded-lg border bg-muted/10 p-3">
            <TinyLabel>Destinos</TinyLabel>
            <Input
              value={data.destinations}
              onChange={(e) => updateField("destinations", e.target.value)}
              placeholder="Paris, Versalhes, Mont Saint-Michel"
              className="mt-2 h-9"
            />
          </div>

          {/* Datas + Noites (mesmos campos) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Data Início</TinyLabel>
              <Input
                type="date"
                value={data.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                className="mt-2 h-9"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Data Fim</TinyLabel>
              <Input
                type="date"
                value={data.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                className="mt-2 h-9"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Noites</TinyLabel>
              <Input
                type="number"
                min="0"
                value={typeof data.nights === "number" ? data.nights : ""}
                onChange={(e) => updateField("nights", parseInt(e.target.value) || undefined)}
                className="mt-2 h-9"
              />
            </div>
          </div>

          <Separator />

          {/* Inclui / Não inclui */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Inclui</TinyLabel>
              <Textarea
                value={data.inclusions}
                onChange={(e) => updateField("inclusions", e.target.value)}
                placeholder="Aéreo, Hotel 5*, Traslados, City Tour, Seguro..."
                rows={2}
                className="mt-2"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Não Inclui</TinyLabel>
              <Textarea
                value={data.exclusions}
                onChange={(e) => updateField("exclusions", e.target.value)}
                placeholder="Refeições, Gorjetas, Extras..."
                rows={2}
                className="mt-2"
              />
            </div>
          </div>

          {/* Resumo do Roteiro */}
          <div className="rounded-lg border bg-muted/10 p-3">
            <TinyLabel>Resumo do Roteiro</TinyLabel>
            <Textarea
              value={data.itinerarySummary || ""}
              onChange={(e) => updateField("itinerarySummary", e.target.value)}
              placeholder={"Dia 1: Chegada em Paris...\nDia 2: Tour pela cidade..."}
              rows={3}
              className="mt-2 font-normal"
            />
          </div>

          {/* Política de Cancelamento */}
          <div className="rounded-lg border bg-muted/10 p-3">
            <TinyLabel>Política de Cancelamento</TinyLabel>
            <Input
              value={data.cancellationPolicy || ""}
              onChange={(e) => updateField("cancellationPolicy", e.target.value)}
              placeholder="Cancelamento grátis até 30 dias antes"
              className="mt-2 h-9"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
