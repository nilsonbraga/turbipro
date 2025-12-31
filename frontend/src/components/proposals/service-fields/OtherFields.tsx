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
import { CalendarDays, MapPin, Wrench } from "lucide-react";

interface OtherDetails {
  name: string;
  category: string;
  date?: string;
  provider?: string;
  location?: string;
  details?: string;
}

interface OtherFieldsProps {
  details: OtherDetails;
  onChange: (details: OtherDetails) => void;
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

export function OtherFields({
  details,
  onChange,
  partnerId,
  partners = [],
  onPartnerChange,
}: OtherFieldsProps) {
  const data: OtherDetails = {
    name: details?.name || "",
    category: details?.category || "",
    date: details?.date || "",
    provider: details?.provider || "",
    location: details?.location || "",
    details: details?.details || "",
  };

  const updateField = <K extends keyof OtherDetails>(key: K, value: OtherDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  // Header (apenas resumo visual, sem criar campos)
  const headerTitle = useMemo(() => data.name?.trim() || "Outro serviço", [data.name]);
  const headerDate = useMemo(() => formatDateBR(data.date || ""), [data.date]);
  const headerLocation = useMemo(() => data.location?.trim() || "", [data.location]);

  return (
    <div className="space-y-4">
      {/* Header 1 linha (sem pill de categoria) */}
      <div className="rounded-lg border bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-md border bg-background/60 flex items-center justify-center shrink-0">
            <Wrench className="h-4 w-4 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{headerTitle}</div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerDate ? (
              <Pill icon={<CalendarDays className="h-3 w-3" />}>{headerDate}</Pill>
            ) : null}

            {headerLocation ? (
              <Pill icon={<MapPin className="h-3 w-3" />}>{headerLocation}</Pill>
            ) : null}

            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
              Outros
            </Badge>
          </div>
        </div>
      </div>

      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            Informações do serviço
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Nome */}
          <div className="rounded-lg border bg-muted/10 p-3">
            <TinyLabel>Nome do Serviço *</TinyLabel>
            <Input
              value={data.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Ingresso para show, Curso, etc."
              className="mt-2 h-9"
            />
          </div>

          {/* Categoria + Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Categoria</TinyLabel>
              <Input
                value={data.category}
                onChange={(e) => updateField("category", e.target.value)}
                placeholder="Entretenimento, Passeio, etc."
                className="mt-2 h-9"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Data</TinyLabel>
              <Input
                type="date"
                value={data.date || ""}
                onChange={(e) => updateField("date", e.target.value)}
                className="mt-2 h-9"
              />
            </div>
          </div>

          <Separator />

          {/* Fornecedor + Local */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Local</TinyLabel>
              <Input
                value={data.location || ""}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Endereço ou nome do local"
                className="mt-2 h-9"
              />
            </div>
          </div>

          {/* Detalhes */}
          <div className="rounded-lg border bg-muted/10 p-3">
            <TinyLabel>Detalhes</TinyLabel>
            <Textarea
              value={data.details || ""}
              onChange={(e) => updateField("details", e.target.value)}
              placeholder="Informações adicionais sobre este serviço..."
              rows={3}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
