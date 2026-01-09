import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

export interface FinancialTransaction {
  id: string;
  agency_id: string;
  type: "income" | "expense";
  category?: string;
  description: string;
  supplier_id?: string;
  proposal_id?: string;
  client_id?: string;
  total_value: number;
  profit_value?: number;
  document_number?: string;
  document_name?: string;
  payment_method?: string;
  status: "pending" | "paid" | "cancelled" | "overdue";
  installments?: number;
  current_installment?: number;
  launch_date: string;
  due_date?: string;
  payment_date?: string;
  details?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  suppliers?: {
    id: string;
    name: string;
  };
  clients?: {
    id: string;
    name: string;
    cpf?: string;
  };
  proposals?: {
    id: string;
    number: number;
    title: string;
  };
  agencies?: {
    id: string;
    name: string;
  };
}

export interface TransactionInput {
  type: "income" | "expense";
  category?: string;
  description: string;
  supplier_id?: string;
  proposal_id?: string;
  client_id?: string;
  total_value: number;
  profit_value?: number;
  document_number?: string;
  document_name?: string;
  payment_method?: string;
  status?: "pending" | "paid" | "cancelled" | "overdue";
  installments?: number;
  current_installment?: number;
  launch_date: string;
  due_date?: string;
  payment_date?: string;
  details?: string;
}

interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  agencyId?: string;
  type?: "income" | "expense";
  status?: string;
  dueToday?: boolean;
  enabled?: boolean;
}

export function useFinancialTransactions(filters: TransactionFilters = {}) {
  const { toast } = useToast();
  const { user, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const mapBackendToFront = (t: any): FinancialTransaction => {
    const proposal = t.proposal ?? t.proposals;

    return {
    id: t.id,
    agency_id: t.agencyId,
    type: t.type,
    category: t.category ?? undefined,
    description: t.description,
    supplier_id: t.supplierId ?? undefined,
    proposal_id: t.proposalId ?? undefined,
    client_id: t.clientId ?? undefined,
    total_value: Number(t.totalValue || 0),
    profit_value: t.profitValue !== null ? Number(t.profitValue) : undefined,
    document_number: t.documentNumber ?? undefined,
    document_name: t.documentName ?? undefined,
    payment_method: t.paymentMethod ?? undefined,
    status: (t.status as any) ?? "pending",
    installments: t.installments ?? undefined,
    current_installment: t.currentInstallment ?? undefined,
    launch_date: t.launchDate,
    due_date: t.dueDate ?? undefined,
    payment_date: t.paymentDate ?? undefined,
    details: t.details ?? undefined,
    created_by: t.createdById ?? undefined,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    suppliers: t.supplier ? { id: t.supplier.id, name: t.supplier.name } : undefined,
    clients: t.client ? { id: t.client.id, name: t.client.name, cpf: t.client.cpf } : undefined,
    proposals: proposal
      ? { id: proposal.id, number: proposal.number, title: proposal.title }
      : undefined,
    agencies: t.agency ? { id: t.agency.id, name: t.agency.name } : undefined,
    };
  };

  const toISODateString = (value?: string) => {
    if (!value) return null;
    const date = new Date(value);
    return date.toISOString();
  };

  const mapFrontToBackend = (input: TransactionInput, agencyId?: string, userId?: string) => ({
    agencyId,
    type: input.type,
    category: input.category ?? null,
    description: input.description,
    supplierId: input.supplier_id ?? null,
    proposalId: input.proposal_id ?? null,
    clientId: input.client_id ?? null,
    totalValue: input.total_value,
    profitValue: input.profit_value ?? null,
    documentNumber: input.document_number ?? null,
    documentName: input.document_name ?? null,
    paymentMethod: input.payment_method ?? null,
    status: input.status ?? "pending",
    installments: input.installments ?? 1,
    currentInstallment: input.current_installment ?? 1,
    launchDate: toISODateString(input.launch_date),
    dueDate: toISODateString(input.due_date),
    paymentDate: toISODateString(input.payment_date),
    details: input.details ?? null,
    createdById: userId ?? null,
  });

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ["financial_transactions", user?.id, filters],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (filters.startDate || filters.endDate) {
        where.launchDate = {};
        if (filters.startDate) {
          const start = new Date(filters.startDate);
          start.setHours(0, 0, 0, 0);
          (where.launchDate as any).gte = start.toISOString();
        }
        if (filters.endDate) {
          const end = new Date(filters.endDate);
          end.setHours(23, 59, 59, 999);
          (where.launchDate as any).lte = end.toISOString();
        }
      }
      if (filters.dueToday) {
        const now = new Date();
        const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
        const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
        where.dueDate = {
          gte: start.toISOString(),
          lte: end.toISOString(),
        };
      }
      if (filters.agencyId && isSuperAdmin) {
        where.agencyId = filters.agencyId;
      }
      if (filters.type) {
        where.type = filters.type;
      }
      if (filters.status) {
        where.status = filters.status;
      }

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        include: JSON.stringify({
          supplier: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, cpf: true } },
          proposal: { select: { id: true, number: true, title: true } },
          agency: { select: { id: true, name: true } },
        }),
        orderBy: JSON.stringify({ launchDate: "desc" }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/financialTransaction?${params.toString()}`);
      return (data || []).map(mapBackendToFront);
    },
    enabled: !!user && (filters.enabled ?? true),
  });

  const createMutation = useMutation({
    mutationFn: async (input: TransactionInput & { agency_id: string }) => {
      const payload = mapFrontToBackend(input, input.agency_id, user?.id);
      const created = await apiFetch<any>(`/api/financialTransaction`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_transactions"] });
      toast({ title: "Transação criada com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar transação", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: TransactionInput & { id: string }) => {
      const payload = {
        ...mapFrontToBackend(input),
        updatedAt: new Date().toISOString(),
      };
      const updated = await apiFetch<any>(`/api/financialTransaction/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_transactions"] });
      toast({ title: "Transação atualizada com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar transação", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/financialTransaction/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_transactions"] });
      toast({ title: "Transação excluída com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir transação", description: error.message, variant: "destructive" });
    },
  });

  // Calculate totals (excluding cancelled transactions)
  const totals = transactions.reduce(
    (acc, t) => {
      // Skip cancelled transactions from totals
      if (t.status === "cancelled") return acc;
      
      if (t.type === "income") {
        acc.totalIncome += Number(t.total_value) || 0;
        acc.totalProfit += Number(t.profit_value) || 0;
      } else {
        acc.totalExpense += Number(t.total_value) || 0;
      }
      return acc;
    },
    { totalIncome: 0, totalExpense: 0, totalProfit: 0 }
  );

  return {
    transactions,
    isLoading,
    error,
    totals,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutate,
    deleteTransaction: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
