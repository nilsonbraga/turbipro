import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FinancialService, useServiceTotals } from "@/hooks/useFinancialServices";
import { ProposalDetail } from "@/components/proposals/ProposalDetail";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { BackendProposal, Proposal, mapBackendProposalToFront, proposalInclude } from "@/hooks/useProposals";

interface ServiceViewTableProps {
  services: FinancialService[];
  isLoading: boolean;
  isSuperAdmin: boolean;
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  flight: "Aéreo",
  hotel: "Hospedagem",
  car: "Carro",
  transfer: "Transfer",
  tour: "Passeio",
  cruise: "Cruzeiro",
  insurance: "Seguro",
  package: "Pacote",
  other: "Outro",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function ServiceViewTable({ services, isLoading, isSuperAdmin }: ServiceViewTableProps) {
  const { toast } = useToast();
  const totals = useServiceTotals(services);
  
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [proposalDetailOpen, setProposalDetailOpen] = useState(false);
  const [sort, setSort] = useState<{
    key: "date" | "lead" | "client" | "agency" | "type" | "description" | "partner" | "value" | "commission";
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });

  const handleOpenProposal = async (proposalId: string) => {
    try {
      const params = new URLSearchParams({
        include: JSON.stringify(proposalInclude),
      });
      const data = await apiFetch<BackendProposal>(`/api/proposal/${proposalId}?${params.toString()}`);
      setSelectedProposal(mapBackendProposalToFront(data));
      setProposalDetailOpen(true);
    } catch (error: any) {
      toast({ title: "Erro ao carregar proposta", description: error.message, variant: "destructive" });
    }
  };

  const calculateCommission = (service: FinancialService): number => {
    if (service.commission_type === "percentage") {
      return (service.value || 0) * (service.commission_value || 0) / 100;
    }
    return service.commission_value || 0;
  };

  const toggleSort = (key: "date" | "lead" | "client" | "agency" | "type" | "description" | "partner" | "value" | "commission") => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const sortedServices = useMemo(() => {
    const sorted = [...services].sort((a, b) => {
      if (sort.key === "lead") {
        const aLead = a.proposal?.number?.toString() || "";
        const bLead = b.proposal?.number?.toString() || "";
        return aLead.localeCompare(bLead, "pt-BR", { sensitivity: "base" });
      }
      if (sort.key === "client") {
        return (a.proposal?.client?.name || "").localeCompare(b.proposal?.client?.name || "", "pt-BR", { sensitivity: "base" });
      }
      if (sort.key === "agency") {
        return (a.proposal?.agency?.name || "").localeCompare(b.proposal?.agency?.name || "", "pt-BR", { sensitivity: "base" });
      }
      if (sort.key === "type") {
        return (SERVICE_TYPE_LABELS[a.type] || a.type).localeCompare(SERVICE_TYPE_LABELS[b.type] || b.type, "pt-BR", { sensitivity: "base" });
      }
      if (sort.key === "description") {
        return (a.description || "").localeCompare(b.description || "", "pt-BR", { sensitivity: "base" });
      }
      if (sort.key === "partner") {
        return (a.partner?.name || "").localeCompare(b.partner?.name || "", "pt-BR", { sensitivity: "base" });
      }
      if (sort.key === "value") {
        return (a.value || 0) - (b.value || 0);
      }
      if (sort.key === "commission") {
        return calculateCommission(a) - calculateCommission(b);
      }
      const aDate = a.proposal?.updated_at ? new Date(a.proposal.updated_at).getTime() : 0;
      const bDate = b.proposal?.updated_at ? new Date(b.proposal.updated_at).getTime() : 0;
      return aDate - bDate;
    });
    return sort.direction === "asc" ? sorted : sorted.reverse();
  }, [services, sort]);

  return (
    <>
      {/* Summary Cards */}
      {services.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
            <CardContent className="p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Total Serviços</div>
              <div className="text-2xl font-semibold">{services.length}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
            <CardContent className="p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Valor Total</div>
              <div className="text-2xl font-semibold">{formatCurrency(totals.totalValue)}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
            <CardContent className="p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Total Comissões</div>
              <div className="text-2xl font-semibold text-green-600">{formatCurrency(totals.totalCommission)}</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
            <CardContent className="p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Ticket Médio</div>
              <div className="text-2xl font-semibold">
                {formatCurrency(services.length > 0 ? totals.totalValue / services.length : 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="rounded-2xl border-0 shadow-none bg-white overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("date")}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                  >
                    Data Fechamento
                    {sort.key === "date" ? (
                      sort.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3" />
                    )}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("lead")}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                  >
                    Lead
                    {sort.key === "lead" ? (
                      sort.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3" />
                    )}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("client")}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                  >
                    Cliente
                    {sort.key === "client" ? (
                      sort.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3" />
                    )}
                  </button>
                </TableHead>
                {isSuperAdmin && (
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("agency")}
                      className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                    >
                      Agência
                      {sort.key === "agency" ? (
                        sort.direction === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </button>
                  </TableHead>
                )}
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("type")}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                  >
                    Tipo
                    {sort.key === "type" ? (
                      sort.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3" />
                    )}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("description")}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                  >
                    Descrição
                    {sort.key === "description" ? (
                      sort.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3" />
                    )}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("partner")}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                  >
                    Fornecedor
                    {sort.key === "partner" ? (
                      sort.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort("value")}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                  >
                    Valor
                    {sort.key === "value" ? (
                      sort.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort("commission")}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                  >
                    Comissão
                    {sort.key === "commission" ? (
                      sort.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3" />
                    )}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 9 : 8} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 9 : 8} className="text-center py-8 text-muted-foreground">
                    Nenhum serviço encontrado
                  </TableCell>
                </TableRow>
              ) : (
                sortedServices.map((service, index) => (
                  <TableRow
                    key={service.id}
                    className={index % 2 === 0 ? 'bg-slate-50/60 hover:bg-slate-50' : 'hover:bg-slate-50'}
                  >
                    <TableCell>
                      {service.proposal?.updated_at
                        ? format(new Date(service.proposal.updated_at), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => service.proposal?.id && handleOpenProposal(service.proposal.id)}
                      >
                        #{service.proposal?.number}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{service.proposal?.client?.name || "-"}</span>
                        {service.proposal?.client?.cpf && (
                          <span className="text-xs text-muted-foreground">{service.proposal.client.cpf}</span>
                        )}
                      </div>
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>{service.proposal?.agency?.name || "-"}</TableCell>
                    )}
                    <TableCell>
                      <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-600">
                        {SERVICE_TYPE_LABELS[service.type] || service.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{service.description || "-"}</span>
                        {service.origin && service.destination && (
                          <span className="text-xs text-muted-foreground">
                            {service.origin} → {service.destination}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{service.partner?.name || "-"}</TableCell>
                    <TableCell className="text-right font-medium text-slate-700">
                      {formatCurrency(service.value || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium text-green-600">
                          {formatCurrency(calculateCommission(service))}
                        </span>
                        {service.commission_type === "percentage" && (
                          <span className="text-xs text-muted-foreground">
                            {service.commission_value}%
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Proposal Detail Modal */}
      <Dialog
        open={proposalDetailOpen && !!selectedProposal}
        onOpenChange={(open) => {
          if (!open) {
            setProposalDetailOpen(false);
            setSelectedProposal(null);
          }
        }}
      >
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] overflow-auto p-6">
          <DialogHeader className="sr-only">
            <DialogTitle>Detalhes da proposta</DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <ProposalDetail
              proposal={selectedProposal}
              onClose={() => {
                setProposalDetailOpen(false);
                setSelectedProposal(null);
              }}
              onEdit={() => {}}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
