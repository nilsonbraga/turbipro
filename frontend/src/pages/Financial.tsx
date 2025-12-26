import { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  MoreHorizontal,
  Pencil,
  Trash2,
  LayoutList,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAuth } from "@/contexts/AuthContext";
import { useAgencies } from "@/hooks/useAgencies";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useFinancialTransactions, FinancialTransaction, TransactionInput } from "@/hooks/useFinancialTransactions";
import { useFinancialServices } from "@/hooks/useFinancialServices";
import { usePartners } from "@/hooks/usePartners";
import { TransactionDialog } from "@/components/financial/TransactionDialog";
import { ServiceViewTable } from "@/components/financial/ServiceViewTable";
import { ProposalDetail } from "@/components/proposals/ProposalDetail";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { BackendProposal, Proposal, mapBackendProposalToFront, proposalInclude } from "@/hooks/useProposals";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-muted text-muted-foreground",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  cancelled: "Cancelado",
  overdue: "Atrasado",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  boleto: "Boleto",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  pix: "PIX",
  cash: "Dinheiro",
  transfer: "Transferência",
};

export default function Financial() {
  const { toast } = useToast();
  const { agency, isSuperAdmin } = useAuth();
  const { agencies } = useAgencies();
  const { suppliers } = useSuppliers();
  const { partners } = usePartners();

  // View mode: "leads" (transactions) or "services"
  const [viewMode, setViewMode] = useState<"leads" | "services">("leads");

  // Date filters - default to current month
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [partnerFilter, setPartnerFilter] = useState<string>("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("");

  const { 
    transactions, 
    totals, 
    isLoading,
    createTransaction, 
    updateTransaction, 
    deleteTransaction,
    isCreating: isCreatingTransaction,
  } = useFinancialTransactions({
    startDate,
    endDate,
    agencyId: selectedAgencyId || undefined,
    type: typeFilter as "income" | "expense" | undefined,
    status: statusFilter || undefined,
  });

  // Financial services (for service view)
  const { data: financialServices = [], isLoading: isLoadingServices } = useFinancialServices({
    startDate,
    endDate,
    agencyId: selectedAgencyId || undefined,
    partnerId: partnerFilter || undefined,
    serviceType: serviceTypeFilter || undefined,
  });

  // Dialogs state
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [defaultTransactionType, setDefaultTransactionType] = useState<"income" | "expense">("expense");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Proposal detail modal state
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [proposalDetailOpen, setProposalDetailOpen] = useState(false);

  const handleCreateTransaction = async (data: TransactionInput) => {
    const agencyId = isSuperAdmin && selectedAgencyId ? selectedAgencyId : agency?.id;
    if (!agencyId) return;
    await createTransaction({ ...data, agency_id: agencyId });
  };

  const handleUpdateTransaction = (data: TransactionInput) => {
    if (!editingTransaction) return;
    updateTransaction({ ...data, id: editingTransaction.id });
    setEditingTransaction(null);
  };

  const handleDelete = () => {
    if (!transactionToDelete) return;
    deleteTransaction(transactionToDelete);
    setTransactionToDelete(null);
    setDeleteDialogOpen(false);
  };

  const openNewTransaction = (type: "income" | "expense") => {
    setDefaultTransactionType(type);
    setEditingTransaction(null);
    setTransactionDialogOpen(true);
  };

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

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
            <p className="text-muted-foreground">
              Gerencie receitas e despesas
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openNewTransaction("expense")}>
              <TrendingDown className="mr-2 h-4 w-4" />
              Nova Despesa
            </Button>
            <Button onClick={() => openNewTransaction("income")}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Nova Receita
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Visualização:</span>
          <ToggleGroup type="single" value={viewMode} onValueChange={(val) => val && setViewMode(val as "leads" | "services")}>
            <ToggleGroupItem value="leads" aria-label="Ver por Lead">
              <LayoutList className="h-4 w-4 mr-2" />
              Por Lead
            </ToggleGroupItem>
            <ToggleGroupItem value="services" aria-label="Ver por Serviço">
              <Layers className="h-4 w-4 mr-2" />
              Por Serviço
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              {isSuperAdmin && (
                <div className="w-[200px]">
                  <Select value={selectedAgencyId || "all"} onValueChange={(val) => setSelectedAgencyId(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as Agências" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Agências</SelectItem>
                      {agencies?.map((ag) => (
                        <SelectItem key={ag.id} value={ag.id}>
                          {ag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={format(startDate, "yyyy-MM-dd")}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  className="w-[150px]"
                />
                <span className="text-muted-foreground">até</span>
                <Input
                  type="date"
                  value={format(endDate, "yyyy-MM-dd")}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                  className="w-[150px]"
                />
              </div>

              {/* Filters for Leads view */}
              {viewMode === "leads" && (
                <>
                  <Select value={typeFilter || "all"} onValueChange={(val) => setTypeFilter(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="income">Receitas</SelectItem>
                      <SelectItem value="expense">Despesas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter || "all"} onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="overdue">Atrasado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}

              {/* Filters for Services view */}
              {viewMode === "services" && (
                <>
                  <Select value={partnerFilter || "all"} onValueChange={(val) => setPartnerFilter(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Fornecedores</SelectItem>
                      {partners?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={serviceTypeFilter || "all"} onValueChange={(val) => setServiceTypeFilter(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Tipo Serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Tipos</SelectItem>
                      <SelectItem value="flight">Aéreo</SelectItem>
                      <SelectItem value="hotel">Hospedagem</SelectItem>
                      <SelectItem value="car">Carro</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="tour">Passeio</SelectItem>
                      <SelectItem value="cruise">Cruzeiro</SelectItem>
                      <SelectItem value="insurance">Seguro</SelectItem>
                      <SelectItem value="package">Pacote</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards - only show in leads view */}
        {viewMode === "leads" && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals.totalIncome)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totals.totalExpense)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(totals.totalProfit)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totals.totalIncome - totals.totalExpense >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(totals.totalIncome - totals.totalExpense)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Services View */}
        {viewMode === "services" && (
          <ServiceViewTable
            services={financialServices}
            isLoading={isLoadingServices}
            isSuperAdmin={isSuperAdmin}
          />
        )}

        {/* Leads View - Transactions Table */}
        {viewMode === "leads" && (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    {isSuperAdmin && <TableHead>Agência</TableHead>}
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 10 : 9} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 10 : 9} className="text-center py-8 text-muted-foreground">
                        Nenhuma transação encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.launch_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          {transaction.proposals ? (
                            <Badge
                              variant="outline"
                              className="cursor-pointer hover:bg-accent"
                              onClick={() => handleOpenProposal(transaction.proposal_id!)}
                            >
                              #{transaction.proposals.number}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === "income" ? "default" : "secondary"}>
                            {transaction.type === "income" ? "Receita" : "Despesa"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{transaction.description}</span>
                            {transaction.clients && (
                              <span className="text-xs text-muted-foreground">
                                Cliente: {transaction.clients.name}
                                {transaction.clients.cpf && ` (${transaction.clients.cpf})`}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            {transaction.agencies?.name || "-"}
                          </TableCell>
                        )}
                        <TableCell>
                          {transaction.suppliers?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className={transaction.type === "income" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                              {formatCurrency(transaction.total_value)}
                            </span>
                            {transaction.type === "income" && transaction.profit_value && transaction.profit_value > 0 && (
                              <span className="text-xs text-muted-foreground">
                                Lucro: {formatCurrency(transaction.profit_value)}
                              </span>
                            )}
                            {transaction.installments && transaction.installments > 1 && (
                              <span className="text-xs text-muted-foreground">
                                {transaction.current_installment}/{transaction.installments}x
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[transaction.status]}>
                            {STATUS_LABELS[transaction.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.payment_method ? PAYMENT_METHOD_LABELS[transaction.payment_method] : "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingTransaction(transaction);
                                setTransactionDialogOpen(true);
                              }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setTransactionToDelete(transaction.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

      {/* Transaction Dialog */}
      <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        transaction={editingTransaction}
        suppliers={suppliers}
        onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
        isLoading={isCreatingTransaction}
        defaultType={defaultTransactionType}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Proposal Detail Modal */}
      <Dialog open={proposalDetailOpen && !!selectedProposal} onOpenChange={(open) => {
        if (!open) {
          setProposalDetailOpen(false);
          setSelectedProposal(null);
        }
      }}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] overflow-auto p-6">
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
    </div>
  );
}
