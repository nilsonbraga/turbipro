import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [startDate, setStartDate] = useState<Date | null>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | null>(endOfMonth(new Date()));
  const [periodFilter, setPeriodFilter] = useState<"month" | "semester" | "year" | "all">("month");
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
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
    startDate: startDate ?? undefined,
    endDate: endDate ?? undefined,
    agencyId: selectedAgencyId || undefined,
    type: typeFilter as "income" | "expense" | undefined,
    status: statusFilter || undefined,
    dueToday: dueTodayOnly || undefined,
  });

  // Financial services (for service view)
  const { data: financialServices = [], isLoading: isLoadingServices } = useFinancialServices({
    startDate: startDate ?? undefined,
    endDate: endDate ?? undefined,
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
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);

  // Proposal detail modal state
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [proposalDetailOpen, setProposalDetailOpen] = useState(false);

  useEffect(() => {
    const now = new Date();

    if (periodFilter === "all") {
      setStartDate(null);
      setEndDate(null);
      return;
    }

    if (periodFilter === "month") {
      setStartDate(startOfMonth(now));
      setEndDate(endOfMonth(now));
      return;
    }

    if (periodFilter === "year") {
      setStartDate(startOfYear(now));
      setEndDate(endOfYear(now));
      return;
    }

    const semesterStartMonth = now.getMonth() < 6 ? 0 : 6;
    const semesterEndMonth = now.getMonth() < 6 ? 5 : 11;
    setStartDate(new Date(now.getFullYear(), semesterStartMonth, 1));
    setEndDate(endOfMonth(new Date(now.getFullYear(), semesterEndMonth, 1)));
  }, [periodFilter]);

  const handleCreateTransaction = async (data: TransactionInput) => {
    const agencyId = isSuperAdmin && selectedAgencyId ? selectedAgencyId : agency?.id;
    if (!agencyId) return;
    await createTransaction({ ...data, agency_id: agencyId });
  };

  const handleUpdateTransaction = (data: TransactionInput) => {
    if (!editingTransaction) return;
    updateTransaction({
      ...data,
      id: editingTransaction.id,
      proposal_id: data.proposal_id ?? editingTransaction.proposal_id,
      client_id: data.client_id ?? editingTransaction.client_id,
    });
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

  const formatShortDate = (value?: string | null) => {
    if (!value) return "-";
    const dateOnly = value.slice(0, 10);
    const [y, m, d] = dateOnly.split("-").map(Number);
    if (!y || !m || !d) return "-";
    const date = new Date(Date.UTC(y, m - 1, d, 12));
    if (Number.isNaN(date.getTime())) return "-";
    return format(date, "dd/MM/yyyy");
  };

  return (
    <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Financeiro</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie receitas e despesas
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => openNewTransaction("expense")}>
              <TrendingDown className="mr-2 h-4 w-4" />
              Nova Despesa
            </Button>
            <Button size="sm" onClick={() => openNewTransaction("income")}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Nova Receita
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Visualização:</span>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(val) => val && setViewMode(val as "leads" | "services")}
            className="flex items-center gap-2 rounded-full bg-slate-100 p-1"
          >
            <ToggleGroupItem
              value="leads"
              aria-label="Ver por Lead"
              className="rounded-full px-4 py-2 text-xs font-semibold text-slate-600 data-[state=on]:bg-white data-[state=on]:text-[#f06a12]"
            >
              <LayoutList className="h-4 w-4 mr-2" />
              Por Lead
            </ToggleGroupItem>
            <ToggleGroupItem
              value="services"
              aria-label="Ver por Serviço"
              className="rounded-full px-4 py-2 text-xs font-semibold text-slate-600 data-[state=on]:bg-white data-[state=on]:text-[#f06a12]"
            >
              <Layers className="h-4 w-4 mr-2" />
              Por Serviço
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {isSuperAdmin && (
                  <div className="w-[200px]">
                    <Select value={selectedAgencyId || "all"} onValueChange={(val) => setSelectedAgencyId(val === "all" ? "" : val)}>
                      <SelectTrigger className="h-9 bg-white border-slate-200">
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

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: "Neste mês", value: "month" },
                    { label: "Neste semestre", value: "semester" },
                    { label: "Neste ano", value: "year" },
                    { label: "Todos", value: "all" },
                  ].map((option) => {
                    const isActive = periodFilter === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPeriodFilter(option.value as typeof periodFilter)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isActive
                            ? "bg-[#f06a12] text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filters for Leads view */}
              {viewMode === "leads" && (
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={typeFilter || "all"} onValueChange={(val) => setTypeFilter(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-[150px] h-9 bg-white border-slate-200">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="income">Receitas</SelectItem>
                      <SelectItem value="expense">Despesas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter || "all"} onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-[150px] h-9 bg-white border-slate-200">
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
                  <button
                    type="button"
                    onClick={() => setDueTodayOnly((prev) => !prev)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      dueTodayOnly
                        ? "bg-[#f06a12] text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Vence Hoje
                  </button>
                </div>
              )}

              {/* Filters for Services view */}
              {viewMode === "services" && (
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={partnerFilter || "all"} onValueChange={(val) => setPartnerFilter(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-[180px] h-9 bg-white border-slate-200">
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
                    <SelectTrigger className="w-[150px] h-9 bg-white border-slate-200">
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
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards - only show in leads view */}
        {viewMode === "leads" && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Total Receitas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-green-600">
                  {formatCurrency(totals.totalIncome)}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Total Despesas</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-red-600">
                  {formatCurrency(totals.totalExpense)}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Lucro</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-primary">
                  {formatCurrency(totals.totalProfit)}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Saldo</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-semibold ${totals.totalIncome - totals.totalExpense >= 0 ? "text-green-600" : "text-red-600"}`}>
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
          <Card className="rounded-2xl border-0 shadow-none bg-white overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-xs uppercase tracking-wide text-slate-500">Data</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-slate-500">Lead</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-slate-500">Tipo</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-slate-500">Descrição</TableHead>
                    {isSuperAdmin && (
                      <TableHead className="text-xs uppercase tracking-wide text-slate-500">
                        Agência
                      </TableHead>
                    )}
                    <TableHead className="text-xs uppercase tracking-wide text-slate-500">Fornecedor</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-slate-500">Valor</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-slate-500">Status</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-slate-500">Pagamento</TableHead>
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
                    transactions.map((transaction, index) => (
                      <TableRow
                        key={transaction.id}
                        className={index % 2 === 0 ? 'bg-slate-50/60 hover:bg-slate-50' : 'hover:bg-slate-50'}
                        onClick={(event) => {
                          const target = event.target as HTMLElement;
                          if (target.closest('button') || target.closest('a') || target.closest('[data-row-action]')) {
                            return;
                          }
                          setSelectedTransaction(transaction);
                          setTransactionDetailOpen(true);
                        }}
                      >
                        <TableCell>
                          {formatShortDate(transaction.launch_date)}
                        </TableCell>
                        <TableCell>
                          {transaction.proposals || transaction.proposal_id ? (
                            <Badge
                              variant="outline"
                              className="cursor-pointer hover:bg-accent"
                              onClick={(event) => {
                                event.stopPropagation();
                                const proposalId = transaction.proposal_id || transaction.proposals?.id;
                                if (proposalId) {
                                  handleOpenProposal(proposalId);
                                }
                              }}
                            >
                              #{transaction.proposals?.number ?? transaction.proposal_id}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={transaction.type === "income" ? "rounded-full bg-emerald-100 text-emerald-700" : "rounded-full bg-slate-100 text-slate-600"}>
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
                              <Button variant="ghost" size="icon" data-row-action>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(event) => {
                                event.stopPropagation();
                                setEditingTransaction(transaction);
                                setTransactionDialogOpen(true);
                              }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(event) => {
                                  event.stopPropagation();
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

      {/* Transaction Detail Modal */}
      <Dialog
        open={transactionDetailOpen && !!selectedTransaction}
        onOpenChange={(open) => {
          if (!open) {
            setTransactionDetailOpen(false);
            setSelectedTransaction(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden">
          {selectedTransaction && (
            <div className="flex flex-col">
              <div className="relative border-b border-slate-100">
                <div className="absolute inset-0 bg-gradient-to-br from-[#fff1e0] via-white to-[#fef5e9]" />
                <div className="relative p-6 space-y-4">
                  <DialogHeader className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Detalhes da transação
                    </p>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <DialogTitle className="text-2xl font-semibold text-slate-900">
                          {selectedTransaction.description}
                        </DialogTitle>
                        {selectedTransaction.details ? (
                          <p className="text-sm text-slate-600">{selectedTransaction.details}</p>
                        ) : (
                          <p className="text-sm text-slate-400">Sem observações adicionais.</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={selectedTransaction.type === "income"
                              ? "rounded-full bg-emerald-100 text-emerald-700"
                              : "rounded-full bg-slate-100 text-slate-600"}
                          >
                            {selectedTransaction.type === "income" ? "Receita" : "Despesa"}
                          </Badge>
                          <Badge className={STATUS_COLORS[selectedTransaction.status]}>
                            {STATUS_LABELS[selectedTransaction.status]}
                          </Badge>
                        </div>
                        <span className={`text-3xl font-semibold ${
                          selectedTransaction.type === "income" ? "text-green-600" : "text-red-600"
                        }`}>
                          {formatCurrency(selectedTransaction.total_value)}
                        </span>
                        {selectedTransaction.installments ? (
                          <span className="text-xs text-slate-500">
                            Parcela {selectedTransaction.current_installment || 1} de {selectedTransaction.installments}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 shadow-sm">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Lançamento</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {formatShortDate(selectedTransaction.launch_date)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 shadow-sm">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Vencimento</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {formatShortDate(selectedTransaction.due_date)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 shadow-sm">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Pagamento</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {formatShortDate(selectedTransaction.payment_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 bg-white">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">Envolvidos</p>
                    <dl className="mt-3 divide-y divide-slate-100 text-sm text-slate-600">
                      <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-500">Cliente</dt>
                        <dd className="font-medium text-slate-800">{selectedTransaction.clients?.name || "-"}</dd>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-500">CPF</dt>
                        <dd className="font-medium text-slate-800">{selectedTransaction.clients?.cpf || "-"}</dd>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-500">Fornecedor</dt>
                        <dd className="font-medium text-slate-800">{selectedTransaction.suppliers?.name || "-"}</dd>
                      </div>
                      {isSuperAdmin && (
                        <div className="flex items-center justify-between py-2">
                          <dt className="text-slate-500">Agência</dt>
                          <dd className="font-medium text-slate-800">{selectedTransaction.agencies?.name || "-"}</dd>
                        </div>
                      )}
                      <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-500">Lead</dt>
                        <dd>
                          {selectedTransaction.proposals || selectedTransaction.proposal_id ? (
                            <Badge
                              variant="outline"
                              className="cursor-pointer hover:bg-accent"
                              onClick={() => {
                                const proposalId = selectedTransaction.proposal_id || selectedTransaction.proposals?.id;
                                if (proposalId) {
                                  handleOpenProposal(proposalId);
                                }
                              }}
                            >
                              #{selectedTransaction.proposals?.number ?? selectedTransaction.proposal_id}
                            </Badge>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">Pagamento</p>
                    <dl className="mt-3 divide-y divide-slate-100 text-sm text-slate-600">
                      <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-500">Método</dt>
                        <dd className="font-medium text-slate-800">
                          {selectedTransaction.payment_method ? PAYMENT_METHOD_LABELS[selectedTransaction.payment_method] : "-"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-500">Documento</dt>
                        <dd className="font-medium text-slate-800">{selectedTransaction.document_number || "-"}</dd>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-500">Nome do documento</dt>
                        <dd className="font-medium text-slate-800">{selectedTransaction.document_name || "-"}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">Valores</p>
                    <dl className="mt-3 divide-y divide-slate-100 text-sm text-slate-600">
                      <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-500">Total</dt>
                        <dd className="font-semibold text-slate-800">{formatCurrency(selectedTransaction.total_value)}</dd>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-500">Lucro</dt>
                        <dd className="font-semibold text-slate-800">
                          {selectedTransaction.profit_value ? formatCurrency(selectedTransaction.profit_value) : "-"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-500">Parcelas</dt>
                        <dd className="font-semibold text-slate-800">
                          {selectedTransaction.installments ? `${selectedTransaction.current_installment || 1}/${selectedTransaction.installments}` : "-"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">Registro</p>
                    <dl className="mt-3 divide-y divide-slate-100 text-sm text-slate-600">
                      <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-500">Criado em</dt>
                        <dd className="font-medium text-slate-800">{formatShortDate(selectedTransaction.created_at)}</dd>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-500">Atualizado em</dt>
                        <dd className="font-medium text-slate-800">{formatShortDate(selectedTransaction.updated_at)}</dd>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-500">Categoria</dt>
                        <dd className="font-medium text-slate-800">{selectedTransaction.category || "-"}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
