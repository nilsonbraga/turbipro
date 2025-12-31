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
  Shield,
  CalendarDays,
  Globe2,
  FileText,
  Stethoscope,
  BaggageClaim,
  Ban,
  PhoneCall,
  PersonStanding,
} from "lucide-react";

interface InsuranceDetails {
  insurer: string;
  planName: string;
  insuredPeople: string;
  coverageStart: string;
  coverageEnd: string;
  destinationRegion: string;
  medicalCoverageAmount?: string;
  baggageCoverageAmount?: string;
  tripCancellationCoverageAmount?: string;
  sportsCoverage?: boolean;
  policyNumber?: string;
  assistanceContacts?: string;
}

interface InsuranceFieldsProps {
  details: InsuranceDetails;
  onChange: (details: InsuranceDetails) => void;
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

export function InsuranceFields({
  details,
  onChange,
  partnerId,
  partners = [],
  onPartnerChange,
}: InsuranceFieldsProps) {
  const data: InsuranceDetails = {
    insurer: details?.insurer || "",
    planName: details?.planName || "",
    insuredPeople: details?.insuredPeople || "",
    coverageStart: details?.coverageStart || "",
    coverageEnd: details?.coverageEnd || "",
    destinationRegion: details?.destinationRegion || "",
    medicalCoverageAmount: details?.medicalCoverageAmount || "",
    baggageCoverageAmount: details?.baggageCoverageAmount || "",
    tripCancellationCoverageAmount: details?.tripCancellationCoverageAmount || "",
    sportsCoverage: details?.sportsCoverage ?? false,
    policyNumber: details?.policyNumber || "",
    assistanceContacts: details?.assistanceContacts || "",
  };

  const updateField = <K extends keyof InsuranceDetails>(key: K, value: InsuranceDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  const coverageDays = useMemo(() => {
    if (!data.coverageStart || !data.coverageEnd) return "";
    const d1 = new Date(`${data.coverageStart}T12:00:00`);
    const d2 = new Date(`${data.coverageEnd}T12:00:00`);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return "";
    const diff = Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000));
    return diff > 0 ? `${diff} dia(s)` : "";
  }, [data.coverageStart, data.coverageEnd]);

  const hasAnyCoverage =
    !!data.medicalCoverageAmount || !!data.baggageCoverageAmount || !!data.tripCancellationCoverageAmount;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border bg-muted/20 px-4 py-3">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
          <div className="flex items-end gap-3 min-w-0">
            <div className="h-9 w-9 rounded-md border bg-background/60 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-primary" />
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
            <Pill icon={<CalendarDays className="h-3 w-3" />}>{coverageDays || "cobertura"}</Pill>
            <Pill icon={<Globe2 className="h-3 w-3" />}>{data.destinationRegion || "destino"}</Pill>
            <Pill icon={<FileText className="h-3 w-3" />}>{data.policyNumber || "apólice"}</Pill>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
         
          {data.sportsCoverage ? (
            <Badge variant="secondary" className="text-xs">
              Esportes
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Básico */}
      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Informações do Seguro
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Seguradora *</TinyLabel>
              <Input
                value={data.insurer}
                onChange={(e) => updateField("insurer", e.target.value)}
                placeholder="Assist Card, Travel Ace..."
                className="mt-2 h-9"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Nome do Plano *</TinyLabel>
              <Input
                value={data.planName}
                onChange={(e) => updateField("planName", e.target.value)}
                placeholder="Europa 60"
                className="mt-2 h-9"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/10 p-3">
            <div className="flex items-center gap-2">
              <PersonStanding className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium">Pessoas seguradas</div>
            </div>
            <Textarea
              value={data.insuredPeople}
              onChange={(e) => updateField("insuredPeople", e.target.value)}
              placeholder="João Silva; Maria Silva; ..."
              rows={2}
              className="mt-2"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              Dica: separe por “;” para ficar legível no PDF.
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Início da Cobertura
                </div>
                <Badge variant="outline" className="text-xs">
                  START
                </Badge>
              </div>
              <Input
                type="date"
                value={data.coverageStart}
                onChange={(e) => updateField("coverageStart", e.target.value)}
                className="h-9"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Fim da Cobertura
                </div>
                <Badge variant="outline" className="text-xs">
                  END
                </Badge>
              </div>
              <Input
                type="date"
                value={data.coverageEnd}
                onChange={(e) => updateField("coverageEnd", e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Região de Destino</TinyLabel>
              <Input
                value={data.destinationRegion}
                onChange={(e) => updateField("destinationRegion", e.target.value)}
                placeholder="Europa, Mundial, América do Sul..."
                className="mt-2 h-9"
              />
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <TinyLabel>Nº Apólice</TinyLabel>
              <Input
                value={data.policyNumber || ""}
                onChange={(e) => updateField("policyNumber", e.target.value)}
                placeholder="POL123456"
                className="mt-2 h-9 font-mono uppercase"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coberturas */}
      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            Coberturas
            {hasAnyCoverage ? (
              <Badge variant="secondary" className="ml-auto">
                Informadas
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-auto">
                Opcional
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="rounded-lg border bg-muted/10 p-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                <div className="text-sm font-medium">Cobertura Médica</div>
              </div>
              <Input
                value={data.medicalCoverageAmount || ""}
                onChange={(e) => updateField("medicalCoverageAmount", e.target.value)}
                placeholder="USD 60.000"
                className="mt-2 h-9"
              />
              <div className="mt-2 text-xs text-muted-foreground">Ex.: despesas médicas/hospitalares.</div>
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <div className="flex items-center gap-2">
                <BaggageClaim className="h-4 w-4 text-primary" />
                <div className="text-sm font-medium">Cobertura Bagagem</div>
              </div>
              <Input
                value={data.baggageCoverageAmount || ""}
                onChange={(e) => updateField("baggageCoverageAmount", e.target.value)}
                placeholder="USD 1.200"
                className="mt-2 h-9"
              />
              <div className="mt-2 text-xs text-muted-foreground">Ex.: extravio/danos.</div>
            </div>

            <div className="rounded-lg border bg-muted/10 p-3">
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-primary" />
                <div className="text-sm font-medium">Cancelamento</div>
              </div>
              <Input
                value={data.tripCancellationCoverageAmount || ""}
                onChange={(e) => updateField("tripCancellationCoverageAmount", e.target.value)}
                placeholder="USD 5.000"
                className="mt-2 h-9"
              />
              <div className="mt-2 text-xs text-muted-foreground">Ex.: cancelamento/interruptão.</div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/10 p-3">
            <div className="flex items-start gap-2">
              <Checkbox
                id="sportsCoverage"
                checked={!!data.sportsCoverage}
                onCheckedChange={(checked) => updateField("sportsCoverage", !!checked)}
              />
              <div className="min-w-0">
                <Label htmlFor="sportsCoverage" className="text-sm cursor-pointer font-medium">
                  Cobertura para esportes radicais
                </Label>
                <div className="text-xs text-muted-foreground">
                  Marque se o plano inclui (ou se você contratou o adicional).
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assistência */}
      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-primary" />
            Assistência
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="rounded-lg border bg-muted/10 p-3">
            <div className="text-sm font-medium">Contatos de Assistência</div>
            <Textarea
              value={data.assistanceContacts || ""}
              onChange={(e) => updateField("assistanceContacts", e.target.value)}
              placeholder="0800-xxx-xxxx; +1-xxx-xxx-xxxx; WhatsApp ..."
              rows={2}
              className="mt-2"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              Dica: coloque telefone + país e WhatsApp, se existir.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
