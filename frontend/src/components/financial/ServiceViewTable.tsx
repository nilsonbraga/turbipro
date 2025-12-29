import { useState } from "react";
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

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data Fechamento</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Cliente</TableHead>
                {isSuperAdmin && <TableHead>Agência</TableHead>}
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
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
                services.map((service) => (
                  <TableRow key={service.id}>
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
                      <Badge variant="secondary">
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
                    <TableCell className="text-right font-medium">
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

      {/* Summary Cards */}
      {services.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Serviços</div>
              <div className="text-2xl font-bold">{services.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Valor Total</div>
              <div className="text-2xl font-bold">{formatCurrency(totals.totalValue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Comissões</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalCommission)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Ticket Médio</div>
              <div className="text-2xl font-bold">
                {formatCurrency(services.length > 0 ? totals.totalValue / services.length : 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
