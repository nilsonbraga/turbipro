import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FinancialTransaction, TransactionInput } from "@/hooks/useFinancialTransactions";
import { Supplier } from "@/hooks/useSuppliers";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  supplier_id: z.string().optional(),
  total_value: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  profit_value: z.coerce.number().optional(),
  document_number: z.string().optional(),
  document_name: z.string().optional(),
  payment_method: z.string().optional(),
  status: z.enum(["pending", "paid", "cancelled", "overdue"]).default("pending"),
  installments: z.coerce.number().min(1).default(1),
  current_installment: z.coerce.number().min(1).default(1),
  launch_date: z.string().min(1, "Data de lançamento é obrigatória"),
  due_date: z.string().optional(),
  payment_date: z.string().optional(),
  details: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: FinancialTransaction | null;
  suppliers: Supplier[];
  onSubmit: (data: TransactionInput) => void;
  isLoading?: boolean;
  defaultType?: "income" | "expense";
}

const PAYMENT_METHODS = [
  { value: "boleto", label: "Boleto" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "debit_card", label: "Cartão de Débito" },
  { value: "pix", label: "PIX" },
  { value: "cash", label: "Dinheiro" },
  { value: "transfer", label: "Transferência" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "paid", label: "Pago" },
  { value: "cancelled", label: "Cancelado" },
  { value: "overdue", label: "Atrasado" },
];

const normalizeDateInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const DatePickerField = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);

  const parseDate = (val?: string) => {
    if (!val) return undefined;
    const [y, m, d] = val.split("-").map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(Date.UTC(y, m - 1, d, 12));
  };

  const dateObj = parseDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateObj ? format(dateObj, "dd/MM/yyyy") : (placeholder || "Selecionar")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateObj}
          onSelect={(day) => {
            onChange(day ? format(day, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

const CATEGORIES = {
  income: [
    { value: "sale", label: "Venda" },
    { value: "commission", label: "Comissão" },
    { value: "other_income", label: "Outras Receitas" },
  ],
  expense: [
    { value: "supplier", label: "Fornecedor" },
    { value: "operational", label: "Operacional" },
    { value: "marketing", label: "Marketing" },
    { value: "personnel", label: "Pessoal" },
    { value: "tax", label: "Impostos" },
    { value: "other_expense", label: "Outras Despesas" },
  ],
};

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  suppliers,
  onSubmit,
  isLoading,
  defaultType = "expense",
}: TransactionDialogProps) {
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType,
      category: "",
      description: "",
      supplier_id: "",
      total_value: 0,
      profit_value: 0,
      document_number: "",
      document_name: "",
      payment_method: "",
      status: "pending",
      installments: 1,
      current_installment: 1,
      launch_date: format(new Date(), "yyyy-MM-dd"),
      due_date: "",
      payment_date: "",
      details: "",
    },
  });

  const watchType = form.watch("type");

  useEffect(() => {
    if (transaction) {
      form.reset({
        type: transaction.type,
        category: transaction.category || "",
        description: transaction.description,
        supplier_id: transaction.supplier_id || "",
        total_value: transaction.total_value,
        profit_value: transaction.profit_value || 0,
        document_number: transaction.document_number || "",
        document_name: transaction.document_name || "",
        payment_method: transaction.payment_method || "",
        status: transaction.status,
        installments: transaction.installments || 1,
        current_installment: transaction.current_installment || 1,
        launch_date: normalizeDateInput(transaction.launch_date),
        due_date: normalizeDateInput(transaction.due_date),
        payment_date: normalizeDateInput(transaction.payment_date),
        details: transaction.details || "",
      });
    } else {
      form.reset({
        type: defaultType,
        category: "",
        description: "",
        supplier_id: "",
        total_value: 0,
        profit_value: 0,
        document_number: "",
        document_name: "",
        payment_method: "",
        status: "pending",
        installments: 1,
        current_installment: 1,
        launch_date: format(new Date(), "yyyy-MM-dd"),
        due_date: "",
        payment_date: "",
        details: "",
      });
    }
  }, [transaction, form, defaultType]);

  const handleSubmit = (data: TransactionFormData) => {
    onSubmit({
      type: data.type,
      category: data.category,
      description: data.description,
      supplier_id: data.supplier_id || undefined,
      total_value: data.total_value,
      profit_value: data.profit_value,
      document_number: data.document_number,
      document_name: data.document_name,
      payment_method: data.payment_method,
      status: data.status,
      installments: data.installments,
      current_installment: data.current_installment,
      launch_date: data.launch_date,
      due_date: data.due_date || undefined,
      payment_date: data.payment_date || undefined,
      details: data.details,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar Transação" : "Nova Transação"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES[watchType]?.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Descrição da transação" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <Select onValueChange={(val) => field.onChange(val === "none" ? "" : val)} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o fornecedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {suppliers.filter(s => s.is_active).map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" min="0" placeholder="0,00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchType === "income" && (
                <FormField
                  control={form.control}
                  name="profit_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lucro</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" placeholder="0,00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcelas</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" placeholder="1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current_installment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcela Atual</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" placeholder="1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="launch_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Lançamento *</FormLabel>
                    <FormControl>
                      <DatePickerField value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento</FormLabel>
                    <FormControl>
                      <DatePickerField value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Pagamento</FormLabel>
                    <FormControl>
                      <DatePickerField value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="document_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome/Razão Social</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome ou Razão Social" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="document_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="000.000.000-00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Informações adicionais..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {transaction ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
