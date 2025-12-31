import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2, MapPin, CalendarDays, Activity, Gauge, Route } from "lucide-react";

interface TourActivity {
  name: string;
  summary?: string;
  location?: string;
  time?: string;
}

interface TourDay {
  dayNumber: number;
  title: string;
  activities: TourActivity[];
}

interface TourDetails {
  startDate: string;
  endDate: string;
  destinationBase: string;
  pace: "leve" | "moderado" | "intenso";
  days: TourDay[];
  mobilityNotes?: string;
}

interface TourFieldsProps {
  details: TourDetails;
  onChange: (details: TourDetails) => void;
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

const paceLabel = (pace: TourDetails["pace"]) => {
  if (pace === "leve") return "Leve";
  if (pace === "intenso") return "Intenso";
  return "Moderado";
};

export function TourFields({ details, onChange, partnerId, partners = [], onPartnerChange }: TourFieldsProps) {
  const data: TourDetails = {
    startDate: details?.startDate || "",
    endDate: details?.endDate || "",
    destinationBase: details?.destinationBase || "",
    pace: details?.pace || "moderado",
    days: details?.days || [],
    mobilityNotes: details?.mobilityNotes || "",
  };

  const updateField = <K extends keyof TourDetails>(key: K, value: TourDetails[K]) => {
    onChange({ ...data, [key]: value });
  };

  const addDay = () => {
    const newDay: TourDay = {
      dayNumber: data.days.length + 1,
      title: "",
      activities: [{ name: "", summary: "" }],
    };
    updateField("days", [...data.days, newDay]);
  };

  const removeDay = (index: number) => {
    const newDays = data.days
      .filter((_, i) => i !== index)
      .map((d, i) => ({ ...d, dayNumber: i + 1 }));
    updateField("days", newDays);
  };

  const updateDay = (index: number, field: keyof TourDay, value: any) => {
    const newDays = [...data.days];
    newDays[index] = { ...newDays[index], [field]: value };
    updateField("days", newDays);
  };

  const addActivity = (dayIndex: number) => {
    const newDays = [...data.days];
    newDays[dayIndex].activities.push({ name: "", summary: "" });
    updateField("days", newDays);
  };

  const updateActivity = (dayIndex: number, actIndex: number, field: keyof TourActivity, value: string) => {
    const newDays = [...data.days];
    newDays[dayIndex].activities[actIndex] = {
      ...newDays[dayIndex].activities[actIndex],
      [field]: value,
    };
    updateField("days", newDays);
  };

  const removeActivity = (dayIndex: number, actIndex: number) => {
    const newDays = [...data.days];
    if (newDays[dayIndex].activities.length > 1) {
      newDays[dayIndex].activities = newDays[dayIndex].activities.filter((_, i) => i !== actIndex);
      updateField("days", newDays);
    }
  };

  const headerBase = useMemo(() => data.destinationBase?.trim() || "Roteiro", [data.destinationBase]);
  const headerDates = useMemo(() => {
    const a = formatDateBR(data.startDate);
    const b = formatDateBR(data.endDate);
    if (a && b) return `${a} → ${b}`;
    return a || b || "";
  }, [data.startDate, data.endDate]);
  const headerDaysCount = useMemo(() => (data.days?.length ? `${data.days.length} dia(s)` : ""), [data.days]);

  return (
    <div className="space-y-4">
      {/* Header (1 linha, clean) */}
      <div className="rounded-lg border bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-md border bg-background/60 flex items-center justify-center shrink-0">
            <Route className="h-4 w-4 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{headerBase}</div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerDaysCount ? <Pill icon={<Activity className="h-3 w-3" />}>{headerDaysCount}</Pill> : null}
            {headerDates ? <Pill icon={<CalendarDays className="h-3 w-3" />}>{headerDates}</Pill> : null}
            <Pill icon={<Gauge className="h-3 w-3" />}>{paceLabel(data.pace)}</Pill>
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">
              Tour
            </Badge>
          </div>
        </div>
      </div>

      <Card className="rounded-lg border bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            Informações gerais
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

          <div className="rounded-lg border bg-muted/10 p-3">
            <TinyLabel>Destino Base *</TinyLabel>
            <div className="mt-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Input
                value={data.destinationBase}
                onChange={(e) => updateField("destinationBase", e.target.value)}
                placeholder="Roma, Itália"
                className="h-9"
              />
            </div>
          </div>

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
              <TinyLabel>Ritmo</TinyLabel>
              <Select value={data.pace} onValueChange={(v) => updateField("pace", v as TourDetails["pace"])}>
                <SelectTrigger className="mt-2 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leve">Leve</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="intenso">Intenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Dias do Roteiro */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium">Dias do Roteiro</div>
              <Button type="button" variant="outline" size="sm" onClick={addDay} className="h-9">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Dia
              </Button>
            </div>

            {data.days.length === 0 ? (
              <div className="rounded-lg border bg-muted/10 p-4 text-sm text-muted-foreground">
                Nenhum dia cadastrado.
              </div>
            ) : null}

            {data.days.map((day, dayIndex) => (
              <div key={dayIndex} className="rounded-lg border bg-muted/10 overflow-hidden">
                {/* Day header */}
                <div className="px-4 py-3 border-b bg-background">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Dia {day.dayNumber}
                    </Badge>

                    <Input
                      value={day.title}
                      onChange={(e) => updateDay(dayIndex, "title", e.target.value)}
                      placeholder="Título do dia"
                      className="h-9 flex-1"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDay(dayIndex)}
                      className="h-9 w-9 p-0 hover:bg-destructive/10"
                      aria-label="Remover dia"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Activities */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-12 md:col-span-5">
                      <TinyLabel>Atividade</TinyLabel>
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <TinyLabel>Hora</TinyLabel>
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <TinyLabel>Descrição</TinyLabel>
                    </div>
                    <div className="hidden md:block md:col-span-1">
                      <TinyLabel>&nbsp;</TinyLabel>
                    </div>
                  </div>

                  {day.activities.map((activity, actIndex) => (
                    <div key={actIndex} className="grid grid-cols-12 gap-2 items-start">
                      <Input
                        value={activity.name}
                        onChange={(e) => updateActivity(dayIndex, actIndex, "name", e.target.value)}
                        placeholder="Atividade"
                        className="col-span-12 md:col-span-5 h-9"
                      />

                      <Input
                        value={activity.time || ""}
                        onChange={(e) => updateActivity(dayIndex, actIndex, "time", e.target.value)}
                        placeholder="09:00"
                        className="col-span-6 md:col-span-2 h-9 font-mono"
                      />

                      <Input
                        value={activity.summary || ""}
                        onChange={(e) => updateActivity(dayIndex, actIndex, "summary", e.target.value)}
                        placeholder="Descrição"
                        className="col-span-6 md:col-span-4 h-9"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeActivity(dayIndex, actIndex)}
                        className="col-span-12 md:col-span-1 h-9 w-full md:w-9 p-0 hover:bg-destructive/10"
                        disabled={day.activities.length <= 1}
                        aria-label="Remover atividade"
                      >
                        <Trash2 className={cn("w-4 h-4", day.activities.length <= 1 ? "text-muted-foreground" : "text-destructive")} />
                      </Button>
                    </div>
                  ))}

                  <Button type="button" variant="outline" size="sm" onClick={() => addActivity(dayIndex)} className="h-9 w-full border-dashed">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Atividade
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Notas de Mobilidade */}
          <div className="rounded-lg border bg-muted/10 p-3">
            <TinyLabel>Notas de Mobilidade</TinyLabel>
            <Textarea
              value={data.mobilityNotes || ""}
              onChange={(e) => updateField("mobilityNotes", e.target.value)}
              placeholder="Informações sobre acessibilidade, caminhadas, etc."
              rows={2}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
