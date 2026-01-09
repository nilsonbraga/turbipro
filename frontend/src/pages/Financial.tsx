import { useEffect, useMemo, useState } from "react";
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
  FileText,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { FinancialService, useFinancialServices } from "@/hooks/useFinancialServices";
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

type ReportColumn<T> = {
  key: string;
  label: string;
  group: string;
  adminOnly?: boolean;
  getValue: (item: T) => string | number;
};

const DEFAULT_LEAD_REPORT_COLUMNS = [
  "launch_date",
  "due_date",
  "payment_date",
  "lead",
  "client",
  "type",
  "category",
  "description",
  "supplier",
  "agency",
  "total_value",
  "status",
  "payment_method",
];

const DEFAULT_SERVICE_REPORT_COLUMNS = [
  "close_date",
  "lead",
  "client",
  "service_type",
  "description",
  "supplier",
  "agency",
  "value",
  "commission",
];

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
  const [leadSort, setLeadSort] = useState<{
    key: "date" | "lead" | "type" | "description" | "agency" | "supplier" | "value" | "status" | "payment";
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });

  // Report options
  const [reportOpen, setReportOpen] = useState(false);
  const [reportView, setReportView] = useState<"leads" | "services">("leads");
  const [reportPeriod, setReportPeriod] = useState<"month" | "semester" | "year" | "all" | "custom">("month");
  const [reportStartDate, setReportStartDate] = useState<Date | null>(startOfMonth(new Date()));
  const [reportEndDate, setReportEndDate] = useState<Date | null>(endOfMonth(new Date()));
  const [reportIncludeIncome, setReportIncludeIncome] = useState(true);
  const [reportIncludeExpense, setReportIncludeExpense] = useState(true);
  const [reportLeadColumns, setReportLeadColumns] = useState<string[]>([]);
  const [reportServiceColumns, setReportServiceColumns] = useState<string[]>([]);

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

  const reportTypeFilter =
    reportIncludeIncome && !reportIncludeExpense
      ? "income"
      : reportIncludeExpense && !reportIncludeIncome
        ? "expense"
        : undefined;

  const {
    transactions: reportTransactionsRaw = [],
    isLoading: isLoadingReportTransactions,
  } = useFinancialTransactions({
    startDate: reportStartDate ?? undefined,
    endDate: reportEndDate ?? undefined,
    agencyId: selectedAgencyId || undefined,
    type: reportTypeFilter,
    enabled: reportOpen && reportView === "leads",
  });

  const { data: reportServicesRaw = [], isLoading: isLoadingReportServices } = useFinancialServices({
    startDate: reportStartDate ?? undefined,
    endDate: reportEndDate ?? undefined,
    agencyId: selectedAgencyId || undefined,
    enabled: reportOpen && reportView === "services",
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

  useEffect(() => {
    if (!reportOpen) return;
    setReportView(viewMode);
    setReportPeriod(periodFilter);
    setReportStartDate(startDate);
    setReportEndDate(endDate);
    setReportIncludeIncome(true);
    setReportIncludeExpense(true);

    const defaultLeadColumns = isSuperAdmin
      ? DEFAULT_LEAD_REPORT_COLUMNS
      : DEFAULT_LEAD_REPORT_COLUMNS.filter((key) => key !== "agency");
    const defaultServiceColumns = isSuperAdmin
      ? DEFAULT_SERVICE_REPORT_COLUMNS
      : DEFAULT_SERVICE_REPORT_COLUMNS.filter((key) => key !== "agency");

    setReportLeadColumns((current) => (current.length ? current : defaultLeadColumns));
    setReportServiceColumns((current) => (current.length ? current : defaultServiceColumns));
  }, [reportOpen, viewMode, periodFilter, startDate, endDate, isSuperAdmin]);

  useEffect(() => {
    if (reportPeriod === "custom") return;

    const now = new Date();
    if (reportPeriod === "all") {
      setReportStartDate(null);
      setReportEndDate(null);
      return;
    }

    if (reportPeriod === "month") {
      setReportStartDate(startOfMonth(now));
      setReportEndDate(endOfMonth(now));
      return;
    }

    if (reportPeriod === "year") {
      setReportStartDate(startOfYear(now));
      setReportEndDate(endOfYear(now));
      return;
    }

    const semesterStartMonth = now.getMonth() < 6 ? 0 : 6;
    const semesterEndMonth = now.getMonth() < 6 ? 5 : 11;
    setReportStartDate(new Date(now.getFullYear(), semesterStartMonth, 1));
    setReportEndDate(endOfMonth(new Date(now.getFullYear(), semesterEndMonth, 1)));
  }, [reportPeriod]);

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

  const toggleReportColumn = (key: string, checked: boolean) => {
    const setColumns = reportView === "leads" ? setReportLeadColumns : setReportServiceColumns;
    setColumns((current) => {
      if (checked) {
        return current.includes(key) ? current : [...current, key];
      }
      return current.filter((column) => column !== key);
    });
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

  const parseDateInput = (value: string) => {
    if (!value) return null;
    const parsed = new Date(`${value}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDateInputValue = (value: Date | null) => {
    if (!value) return "";
    return format(value, "yyyy-MM-dd");
  };

  const formatServiceType = (value?: string | null) => {
    if (!value) return "-";
    return SERVICE_TYPE_LABELS[value] || value;
  };

  const formatCommissionType = (value?: string | null) => {
    if (!value) return "-";
    if (value === "percentage") return "Percentual";
    if (value === "fixed") return "Fixo";
    return value;
  };

  const toggleLeadSort = (key: "date" | "lead" | "type" | "description" | "agency" | "supplier" | "value" | "status" | "payment") => {
    setLeadSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      if (leadSort.key === "lead") {
        const aLead = a.proposals?.number?.toString() || a.proposal_id || "";
        const bLead = b.proposals?.number?.toString() || b.proposal_id || "";
        return aLead.localeCompare(bLead, "pt-BR", { sensitivity: "base" });
      }
      if (leadSort.key === "type") {
        return a.type.localeCompare(b.type, "pt-BR", { sensitivity: "base" });
      }
      if (leadSort.key === "description") {
        return (a.description || "").localeCompare(b.description || "", "pt-BR", { sensitivity: "base" });
      }
      if (leadSort.key === "agency") {
        return (a.agencies?.name || "").localeCompare(b.agencies?.name || "", "pt-BR", { sensitivity: "base" });
      }
      if (leadSort.key === "supplier") {
        return (a.suppliers?.name || "").localeCompare(b.suppliers?.name || "", "pt-BR", { sensitivity: "base" });
      }
      if (leadSort.key === "value") {
        return (a.total_value || 0) - (b.total_value || 0);
      }
      if (leadSort.key === "status") {
        return a.status.localeCompare(b.status, "pt-BR", { sensitivity: "base" });
      }
      if (leadSort.key === "payment") {
        return (a.payment_method || "").localeCompare(b.payment_method || "", "pt-BR", { sensitivity: "base" });
      }
      const aDate = a.launch_date ? new Date(a.launch_date).getTime() : 0;
      const bDate = b.launch_date ? new Date(b.launch_date).getTime() : 0;
      return aDate - bDate;
    });
    return leadSort.direction === "asc" ? sorted : sorted.reverse();
  }, [transactions, leadSort]);

  const leadReportColumns: ReportColumn<FinancialTransaction>[] = [
    {
      key: "launch_date",
      label: "Lançamento",
      group: "Datas",
      getValue: (transaction) => formatShortDate(transaction.launch_date),
    },
    {
      key: "due_date",
      label: "Vencimento",
      group: "Datas",
      getValue: (transaction) => formatShortDate(transaction.due_date),
    },
    {
      key: "payment_date",
      label: "Pagamento",
      group: "Datas",
      getValue: (transaction) => formatShortDate(transaction.payment_date),
    },
    {
      key: "created_at",
      label: "Criado em",
      group: "Datas",
      getValue: (transaction) => formatShortDate(transaction.created_at),
    },
    {
      key: "updated_at",
      label: "Atualizado em",
      group: "Datas",
      getValue: (transaction) => formatShortDate(transaction.updated_at),
    },
    {
      key: "lead",
      label: "Lead",
      group: "Identificação",
      getValue: (transaction) => {
        const leadNumber = transaction.proposals?.number ?? transaction.proposal_id;
        return leadNumber ? `#${leadNumber}` : "-";
      },
    },
    {
      key: "client",
      label: "Cliente",
      group: "Identificação",
      getValue: (transaction) => transaction.clients?.name || "-",
    },
    {
      key: "client_cpf",
      label: "CPF",
      group: "Identificação",
      getValue: (transaction) => transaction.clients?.cpf || "-",
    },
    {
      key: "agency",
      label: "Agência",
      group: "Identificação",
      adminOnly: true,
      getValue: (transaction) => transaction.agencies?.name || "-",
    },
    {
      key: "type",
      label: "Tipo",
      group: "Financeiro",
      getValue: (transaction) => (transaction.type === "income" ? "Receita" : "Despesa"),
    },
    {
      key: "status",
      label: "Status",
      group: "Financeiro",
      getValue: (transaction) => STATUS_LABELS[transaction.status],
    },
    {
      key: "category",
      label: "Categoria",
      group: "Financeiro",
      getValue: (transaction) => transaction.category || "-",
    },
    {
      key: "total_value",
      label: "Valor",
      group: "Financeiro",
      getValue: (transaction) => formatCurrency(transaction.total_value),
    },
    {
      key: "profit_value",
      label: "Lucro",
      group: "Financeiro",
      getValue: (transaction) =>
        transaction.profit_value === null || transaction.profit_value === undefined
          ? "-"
          : formatCurrency(transaction.profit_value),
    },
    {
      key: "installments",
      label: "Parcelas",
      group: "Financeiro",
      getValue: (transaction) =>
        transaction.installments ? `${transaction.current_installment || 1}/${transaction.installments}` : "-",
    },
    {
      key: "payment_method",
      label: "Método",
      group: "Financeiro",
      getValue: (transaction) =>
        transaction.payment_method ? PAYMENT_METHOD_LABELS[transaction.payment_method] : "-",
    },
    {
      key: "supplier",
      label: "Fornecedor",
      group: "Operação",
      getValue: (transaction) => transaction.suppliers?.name || "-",
    },
    {
      key: "document_number",
      label: "Documento",
      group: "Operação",
      getValue: (transaction) => transaction.document_number || "-",
    },
    {
      key: "document_name",
      label: "Nome documento",
      group: "Operação",
      getValue: (transaction) => transaction.document_name || "-",
    },
    {
      key: "description",
      label: "Descrição",
      group: "Descrição",
      getValue: (transaction) => transaction.description || "-",
    },
    {
      key: "details",
      label: "Observações",
      group: "Descrição",
      getValue: (transaction) => transaction.details || "-",
    },
  ];

  const serviceReportColumns: ReportColumn<FinancialService>[] = [
    {
      key: "close_date",
      label: "Data Fechamento",
      group: "Datas",
      getValue: (service) => formatShortDate(service.proposal?.updated_at || null),
    },
    {
      key: "start_date",
      label: "Início",
      group: "Datas",
      getValue: (service) => formatShortDate(service.start_date),
    },
    {
      key: "end_date",
      label: "Fim",
      group: "Datas",
      getValue: (service) => formatShortDate(service.end_date),
    },
    {
      key: "lead",
      label: "Lead",
      group: "Identificação",
      getValue: (service) => {
        const leadNumber = service.proposal?.number ?? "-";
        return leadNumber === "-" ? "-" : `#${leadNumber}`;
      },
    },
    {
      key: "proposal",
      label: "Proposta",
      group: "Identificação",
      getValue: (service) => service.proposal?.title || "-",
    },
    {
      key: "client",
      label: "Cliente",
      group: "Identificação",
      getValue: (service) => service.proposal?.client?.name || "-",
    },
    {
      key: "client_cpf",
      label: "CPF",
      group: "Identificação",
      getValue: (service) => service.proposal?.client?.cpf || "-",
    },
    {
      key: "agency",
      label: "Agência",
      group: "Identificação",
      adminOnly: true,
      getValue: (service) => service.proposal?.agency?.name || "-",
    },
    {
      key: "stage",
      label: "Etapa",
      group: "Identificação",
      getValue: (service) => service.proposal?.stage?.name || "-",
    },
    {
      key: "service_type",
      label: "Tipo",
      group: "Serviço",
      getValue: (service) => formatServiceType(service.type),
    },
    {
      key: "description",
      label: "Descrição",
      group: "Serviço",
      getValue: (service) => service.description || "-",
    },
    {
      key: "supplier",
      label: "Fornecedor",
      group: "Serviço",
      getValue: (service) => service.partner?.name || "-",
    },
    {
      key: "origin",
      label: "Origem",
      group: "Serviço",
      getValue: (service) => service.origin || "-",
    },
    {
      key: "destination",
      label: "Destino",
      group: "Serviço",
      getValue: (service) => service.destination || "-",
    },
    {
      key: "value",
      label: "Valor",
      group: "Valores",
      getValue: (service) => formatCurrency(service.value || 0),
    },
    {
      key: "commission",
      label: "Comissão",
      group: "Valores",
      getValue: (service) => {
        const commission =
          service.commission_type === "percentage"
            ? (service.value || 0) * ((service.commission_value || 0) / 100)
            : service.commission_value || 0;
        return formatCurrency(commission);
      },
    },
    {
      key: "commission_type",
      label: "Comissão tipo",
      group: "Valores",
      getValue: (service) => formatCommissionType(service.commission_type),
    },
    {
      key: "commission_percent",
      label: "Comissão %",
      group: "Valores",
      getValue: (service) =>
        service.commission_type === "percentage" ? `${service.commission_value || 0}%` : "-",
    },
  ];

  const reportTransactions = (reportTransactionsRaw || []).filter((transaction) => {
    if (reportIncludeIncome && transaction.type === "income") return true;
    if (reportIncludeExpense && transaction.type === "expense") return true;
    return false;
  });

  const reportTotals = reportTransactions.reduce(
    (acc, transaction) => {
      if (transaction.type === "income") {
        acc.income += transaction.total_value || 0;
        acc.profit += transaction.profit_value || 0;
      } else {
        acc.expense += transaction.total_value || 0;
      }
      return acc;
    },
    { income: 0, expense: 0, profit: 0 },
  );

  const reportServicesTotals = reportServicesRaw.reduce(
    (acc, service) => {
      acc.count += 1;
      acc.totalValue += service.value || 0;
      if (service.commission_type === "percentage") {
        acc.totalCommission += (service.value || 0) * ((service.commission_value || 0) / 100);
      } else {
        acc.totalCommission += service.commission_value || 0;
      }
      return acc;
    },
    { count: 0, totalValue: 0, totalCommission: 0 },
  );

  const reportPeriodLabel = (() => {
    if (reportPeriod === "all") return "Todos os períodos";
    const startLabel = reportStartDate ? format(reportStartDate, "dd/MM/yyyy") : "-";
    const endLabel = reportEndDate ? format(reportEndDate, "dd/MM/yyyy") : "-";
    if (reportPeriod === "custom") {
      if (reportStartDate && reportEndDate) return `${startLabel} a ${endLabel}`;
      if (reportStartDate) return `A partir de ${startLabel}`;
      if (reportEndDate) return `Até ${endLabel}`;
      return "Período personalizado";
    }
    return startLabel === endLabel ? startLabel : `${startLabel} a ${endLabel}`;
  })();

  const reportViewLabel = reportView === "leads" ? "Por Lead" : "Por Serviço";
  const reportTypeLabel =
    reportView === "services"
      ? "Serviços"
      : [reportIncludeIncome ? "Receitas" : null, reportIncludeExpense ? "Despesas" : null]
          .filter(Boolean)
          .join(" e ") || "Nenhum tipo selecionado";

  const reportColumnOptions = (reportView === "leads" ? leadReportColumns : serviceReportColumns) as ReportColumn<any>[];
  const reportSelectedColumns = reportView === "leads" ? reportLeadColumns : reportServiceColumns;
  const reportActiveColumns = reportColumnOptions.filter(
    (column) => reportSelectedColumns.includes(column.key) && (!column.adminOnly || isSuperAdmin),
  );
  const reportColumnGroups = reportColumnOptions.reduce(
    (groups, column) => {
      if (column.adminOnly && !isSuperAdmin) return groups;
      let group = groups.find((item) => item.label === column.group);
      if (!group) {
        group = { label: column.group, columns: [] };
        groups.push(group);
      }
      group.columns.push(column);
      return groups;
    },
    [] as Array<{ label: string; columns: ReportColumn<any>[] }>,
  );
  const reportRowData = reportView === "leads" ? reportTransactions : reportServicesRaw;
  const reportDefinition = {
    columns: reportActiveColumns.map((column) => column.label),
    rows: reportActiveColumns.length
      ? reportRowData.map((item) => reportActiveColumns.map((column) => column.getValue(item)))
      : [],
  };

  const reportRowsCount = reportRowData.length;
  const reportColumnsCount = reportActiveColumns.length;
  const reportColumnsLabel = reportColumnsCount === 1 ? "1 coluna" : `${reportColumnsCount} colunas`;
  const reportColumnsSelectedLabel =
    reportColumnsCount === 1 ? "1 selecionada" : `${reportColumnsCount} selecionadas`;
  const hasSelectedColumns = reportColumnsCount > 0;
  const isReportLoading = reportView === "leads" ? isLoadingReportTransactions : isLoadingReportServices;
  const isReportTypeInvalid = reportView === "leads" && !reportIncludeIncome && !reportIncludeExpense;
  const isReportColumnsInvalid = !hasSelectedColumns;
  const isReportInvalid = isReportTypeInvalid || isReportColumnsInvalid;
  const isWideReport = reportColumnsCount > 10;

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const handleExportPdf = () => {
    if (isReportInvalid) {
      const description = isReportTypeInvalid && isReportColumnsInvalid
        ? "Selecione receitas/despesas e pelo menos uma coluna para gerar o relatório."
        : isReportTypeInvalid
          ? "Marque receitas e/ou despesas para gerar o relatório."
          : "Selecione ao menos uma coluna para gerar o relatório.";
      toast({
        title: "Seleção incompleta",
        description,
        variant: "destructive",
      });
      return;
    }

    const hasData = reportRowsCount > 0;
    if (!hasData) {
      toast({
        title: "Sem dados para exportar",
        description: "Ajuste os filtros do relatório antes de exportar.",
        variant: "destructive",
      });
      return;
    }

    const generatedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm");
    const reportTitle =
      reportView === "leads"
        ? "Relatório Financeiro • Por Lead"
        : "Relatório Financeiro • Por Serviço";

    const summaryHtml =
      reportView === "leads"
        ? `
        <div class="summary">
          <div class="card">
            <div class="label">Total Receitas</div>
            <div class="value green">${formatCurrency(reportTotals.income)}</div>
          </div>
          <div class="card">
            <div class="label">Total Despesas</div>
            <div class="value red">${formatCurrency(reportTotals.expense)}</div>
          </div>
          <div class="card">
            <div class="label">Lucro</div>
            <div class="value">${formatCurrency(reportTotals.profit)}</div>
          </div>
          <div class="card">
            <div class="label">Saldo</div>
            <div class="value ${reportTotals.income - reportTotals.expense >= 0 ? "green" : "red"}">
              ${formatCurrency(reportTotals.income - reportTotals.expense)}
            </div>
          </div>
        </div>
      `
        : `
        <div class="summary">
          <div class="card">
            <div class="label">Total Serviços</div>
            <div class="value">${reportServicesTotals.count}</div>
          </div>
          <div class="card">
            <div class="label">Valor Total</div>
            <div class="value">${formatCurrency(reportServicesTotals.totalValue)}</div>
          </div>
          <div class="card">
            <div class="label">Comissões</div>
            <div class="value green">${formatCurrency(reportServicesTotals.totalCommission)}</div>
          </div>
          <div class="card">
            <div class="label">Ticket Médio</div>
            <div class="value">${formatCurrency(reportServicesTotals.count ? reportServicesTotals.totalValue / reportServicesTotals.count : 0)}</div>
          </div>
        </div>
      `;

    const tableHead = `<tr>${reportDefinition.columns
      .map((column) => `<th>${escapeHtml(column)}</th>`)
      .join("")}</tr>`;
    const tableRows = reportDefinition.rows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell ?? ""))}</td>`).join("")}</tr>`,
      )
      .join("");
    const tableFontSize = reportColumnsCount > 12 ? "11px" : "12px";

    const html = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(reportTitle)}</title>
          <style>
            * { box-sizing: border-box; font-family: "Segoe UI", Arial, sans-serif; }
            body { margin: 0; padding: 32px; color: #0f172a; background: #ffffff; }
            h1 { margin: 0 0 6px; font-size: 24px; }
            .meta { color: #64748b; font-size: 13px; margin-bottom: 4px; }
            .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
            .card { border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 14px; background: #f8fafc; }
            .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: #94a3b8; }
            .value { font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 4px; }
            .value.green { color: #16a34a; }
            .value.red { color: #dc2626; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: ${tableFontSize}; }
            th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; padding: 8px; color: #64748b; background: #f1f5f9; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) td { background: #fafafa; }
            @media print {
              body { padding: 20px; }
            }
            @page { size: A4 landscape; margin: 18mm; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(reportTitle)}</h1>
          <div class="meta">Período: ${escapeHtml(reportPeriodLabel)}</div>
          <div class="meta">Tipo: ${escapeHtml(reportTypeLabel)}</div>
          <div class="meta">Gerado em ${escapeHtml(generatedAt)}</div>
          ${summaryHtml}
          <table>
            <thead>${tableHead}</thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=1200,height=900");
    if (!win) {
      toast({
        title: "Não foi possível abrir o relatório",
        description: "Verifique se o bloqueador de pop-up está ativo.",
        variant: "destructive",
      });
      return;
    }

    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  };

  const handleExportExcel = () => {
    if (isReportInvalid) {
      const description = isReportTypeInvalid && isReportColumnsInvalid
        ? "Selecione receitas/despesas e pelo menos uma coluna para gerar o relatório."
        : isReportTypeInvalid
          ? "Marque receitas e/ou despesas para gerar o relatório."
          : "Selecione ao menos uma coluna para gerar o relatório.";
      toast({
        title: "Seleção incompleta",
        description,
        variant: "destructive",
      });
      return;
    }

    const hasData = reportRowsCount > 0;
    if (!hasData) {
      toast({
        title: "Sem dados para exportar",
        description: "Ajuste os filtros do relatório antes de exportar.",
        variant: "destructive",
      });
      return;
    }

    const reportTitle =
      reportView === "leads"
        ? "Relatorio Financeiro - Por Lead"
        : "Relatorio Financeiro - Por Servico";
    const fileStamp = format(new Date(), "yyyyMMdd-HHmm");

    const tableHead = reportDefinition.columns.map((column) => column);
    const rows = reportDefinition.rows;
    const columnSpan = Math.max(1, tableHead.length - 1);

    const rowsHtml = rows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell ?? ""))}</td>`).join("")}</tr>`,
      )
      .join("");

    const tableHtml = `
      <table border="1">
        <tr><th colspan="${tableHead.length}">${escapeHtml(reportTitle)}</th></tr>
        <tr><td>Periodo</td><td colspan="${columnSpan}">${escapeHtml(reportPeriodLabel)}</td></tr>
        <tr><td>Tipo</td><td colspan="${columnSpan}">${escapeHtml(reportTypeLabel)}</td></tr>
        <tr><td colspan="${tableHead.length}"></td></tr>
        <tr>${tableHead.map((head) => `<th>${escapeHtml(head)}</th>`).join("")}</tr>
        ${rowsHtml}
      </table>
    `;

    const blob = new Blob(
      [
        `<!doctype html><html><head><meta charset="utf-8"></head><body>${tableHtml}</body></html>`,
      ],
      { type: "application/vnd.ms-excel" },
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-financeiro-${reportView}-${fileStamp}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
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
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-slate-200"
            onClick={() => setReportOpen(true)}
          >
            <FileText className="h-4 w-4" />
            Relatório
          </Button>
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
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleLeadSort("date")}
                        className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                      >
                        Data
                        {leadSort.key === "date" ? (
                          leadSort.direction === "asc" ? (
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
                        onClick={() => toggleLeadSort("lead")}
                        className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                      >
                        Lead
                        {leadSort.key === "lead" ? (
                          leadSort.direction === "asc" ? (
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
                        onClick={() => toggleLeadSort("type")}
                        className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                      >
                        Tipo
                        {leadSort.key === "type" ? (
                          leadSort.direction === "asc" ? (
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
                        onClick={() => toggleLeadSort("description")}
                        className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                      >
                        Descrição
                        {leadSort.key === "description" ? (
                          leadSort.direction === "asc" ? (
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
                          onClick={() => toggleLeadSort("agency")}
                          className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                        >
                          Agência
                          {leadSort.key === "agency" ? (
                            leadSort.direction === "asc" ? (
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
                        onClick={() => toggleLeadSort("supplier")}
                        className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                      >
                        Fornecedor
                        {leadSort.key === "supplier" ? (
                          leadSort.direction === "asc" ? (
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
                        onClick={() => toggleLeadSort("value")}
                        className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                      >
                        Valor
                        {leadSort.key === "value" ? (
                          leadSort.direction === "asc" ? (
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
                        onClick={() => toggleLeadSort("status")}
                        className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                      >
                        Status
                        {leadSort.key === "status" ? (
                          leadSort.direction === "asc" ? (
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
                        onClick={() => toggleLeadSort("payment")}
                        className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                      >
                        Pagamento
                        {leadSort.key === "payment" ? (
                          leadSort.direction === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
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
                  ) : sortedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 10 : 9} className="text-center py-8 text-muted-foreground">
                        Nenhuma transação encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedTransactions.map((transaction, index) => (
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

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden">
          <div className="border-b bg-gradient-to-br from-[#fff4e6] via-white to-[#fef5e9] px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-slate-900">Relatório Financeiro</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-500">
              Selecione o período e os dados que deseja exportar.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-white">
            <Card className="rounded-2xl border border-slate-200/70 bg-slate-50/70 shadow-none">
              <CardContent className="p-5 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Configurações</p>
                    <p className="text-sm text-slate-600">Defina o tipo de relatório e o período.</p>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-white text-slate-600">
                    {reportViewLabel} • {reportPeriodLabel}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de relatório</Label>
                  <Tabs value={reportView} onValueChange={(val) => setReportView(val as "leads" | "services")}>
                    <TabsList className="flex flex-wrap items-center justify-start gap-4 bg-transparent p-0 border-b border-slate-200 w-full rounded-none h-auto">
                      <TabsTrigger
                        value="leads"
                        className="rounded-none px-1 pb-3 text-sm font-semibold text-slate-500 transition-colors border-b-2 border-transparent shadow-none data-[state=active]:text-[#f06a12] data-[state=active]:border-[#f06a12] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                      >
                        <LayoutList className="h-4 w-4 mr-2" />
                        Por Lead
                      </TabsTrigger>
                      <TabsTrigger
                        value="services"
                        className="rounded-none px-1 pb-3 text-sm font-semibold text-slate-500 transition-colors border-b-2 border-transparent shadow-none data-[state=active]:text-[#f06a12] data-[state=active]:border-[#f06a12] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                      >
                        <Layers className="h-4 w-4 mr-2" />
                        Por Serviço
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label>Período</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { label: "Neste mês", value: "month" },
                      { label: "Neste semestre", value: "semester" },
                      { label: "Neste ano", value: "year" },
                      { label: "Todos", value: "all" },
                      { label: "Personalizado", value: "custom" },
                    ].map((option) => {
                      const isActive = reportPeriod === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setReportPeriod(option.value as typeof reportPeriod)}
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
                  {reportPeriod === "custom" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Início</Label>
                        <Input
                          type="date"
                          value={formatDateInputValue(reportStartDate)}
                          onChange={(e) => setReportStartDate(parseDateInput(e.target.value))}
                          className="h-9 bg-white border-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fim</Label>
                        <Input
                          type="date"
                          value={formatDateInputValue(reportEndDate)}
                          onChange={(e) => setReportEndDate(parseDateInput(e.target.value))}
                          className="h-9 bg-white border-slate-200"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {reportView === "leads" && (
                  <div className="space-y-2">
                    <Label>Incluir</Label>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="report-income"
                          checked={reportIncludeIncome}
                          onCheckedChange={(checked) => setReportIncludeIncome(checked === true)}
                        />
                        <Label htmlFor="report-income" className="font-normal cursor-pointer">
                          Receitas
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="report-expense"
                          checked={reportIncludeExpense}
                          onCheckedChange={(checked) => setReportIncludeExpense(checked === true)}
                        />
                        <Label htmlFor="report-expense" className="font-normal cursor-pointer">
                          Despesas
                        </Label>
                      </div>
                    </div>
                    {!reportIncludeIncome && !reportIncludeExpense && (
                      <p className="text-xs text-amber-600">
                        Selecione pelo menos um tipo para gerar o relatório.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-none">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base text-slate-900">Colunas do relatório</CardTitle>
                    <p className="text-xs text-slate-500">
                      Selecione as informações que deseja visualizar e exportar.
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-600">
                    {reportColumnsSelectedLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {reportColumnGroups.map((group) => (
                    <div key={group.label} className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{group.label}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {group.columns.map((column) => {
                          const columnId = `report-${reportView}-${column.key}`;
                          const isChecked = reportSelectedColumns.includes(column.key);
                          return (
                            <div key={column.key} className="flex items-center gap-2">
                              <Checkbox
                                id={columnId}
                                checked={isChecked}
                                onCheckedChange={(checked) => toggleReportColumn(column.key, checked === true)}
                              />
                              <Label htmlFor={columnId} className="cursor-pointer text-sm font-normal text-slate-600">
                                {column.label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {isReportColumnsInvalid && (
                  <p className="text-xs text-amber-600">
                    Selecione pelo menos uma coluna para gerar o relatório.
                  </p>
                )}
              </CardContent>
            </Card>

            {reportView === "leads" ? (
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Receitas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-green-600">
                      {formatCurrency(reportTotals.income)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Despesas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-red-600">
                      {formatCurrency(reportTotals.expense)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Lucro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-primary">
                      {formatCurrency(reportTotals.profit)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Saldo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-semibold ${reportTotals.income - reportTotals.expense >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(reportTotals.income - reportTotals.expense)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Serviços</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-slate-900">
                      {reportServicesTotals.count}
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Valor Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-primary">
                      {formatCurrency(reportServicesTotals.totalValue)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Comissões</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-green-600">
                      {formatCurrency(reportServicesTotals.totalCommission)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Ticket Médio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-slate-700">
                      {formatCurrency(reportServicesTotals.count ? reportServicesTotals.totalValue / reportServicesTotals.count : 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card className="rounded-2xl border-0 shadow-none bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base text-slate-900">Prévia do relatório</CardTitle>
                    <p className="text-xs text-slate-500">
                      {reportTypeLabel} • {reportPeriodLabel} • {reportColumnsLabel}
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-600">
                    {reportRowsCount} itens
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!hasSelectedColumns ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Selecione ao menos uma coluna para visualizar a prévia do relatório.
                  </div>
                ) : (
                  <div className={`max-h-[320px] overflow-y-auto ${isWideReport ? "overflow-x-auto" : ""}`}>
                    <Table className={`${isWideReport ? "min-w-[1400px] text-xs" : "min-w-[900px]"}`}>
                      <TableHeader className="bg-slate-50/80">
                        <TableRow>
                          {reportDefinition.columns.map((column, index) => (
                            <TableHead key={`${column}-${index}`} className="text-xs uppercase tracking-wide text-slate-500">
                              {column}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isReportLoading ? (
                          <TableRow>
                            <TableCell colSpan={reportDefinition.columns.length} className="text-center py-8">
                              Gerando prévia...
                            </TableCell>
                          </TableRow>
                        ) : reportRowsCount === 0 ? (
                          <TableRow>
                            <TableCell colSpan={reportDefinition.columns.length} className="text-center py-8 text-muted-foreground">
                              Nenhum dado encontrado para o período selecionado
                            </TableCell>
                          </TableRow>
                        ) : (
                          reportDefinition.rows.map((row, rowIndex) => (
                            <TableRow key={`${rowIndex}-${row[0] ?? "row"}`} className={rowIndex % 2 === 0 ? "bg-slate-50/60" : ""}>
                              {row.map((cell, cellIndex) => (
                                <TableCell key={`${rowIndex}-${cellIndex}`} className="whitespace-nowrap">
                                  {cell === "" || cell === null || cell === undefined ? "-" : cell}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="border-t bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {reportRowsCount} registros • {reportColumnsLabel} • {reportPeriodLabel}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleExportExcel}
                disabled={isReportInvalid || isReportLoading}
              >
                <Download className="h-4 w-4" />
                Exportar Excel
              </Button>
              <Button
                className="gap-2"
                onClick={handleExportPdf}
                disabled={isReportInvalid || isReportLoading}
              >
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
