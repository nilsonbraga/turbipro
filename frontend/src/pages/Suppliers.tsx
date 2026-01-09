import { useState, useMemo } from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/contexts/AuthContext";
import { useAgencies } from "@/hooks/useAgencies";
import { useSuppliers, Supplier, SupplierInput } from "@/hooks/useSuppliers";
import { SupplierDialog } from "@/components/financial/SupplierDialog";
import { useToast } from "@/hooks/use-toast";

export default function Suppliers() {
  const { agency, isSuperAdmin } = useAuth();
  const { agencies } = useAgencies();
  const { suppliers, createSupplier, updateSupplier, deleteSupplier, isCreating } = useSuppliers();
  const { toast } = useToast();

  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState<{
    key: "name" | "document" | "email" | "phone" | "address" | "status";
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });

  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    let filtered = suppliers;

    // Filter by agency for super admin
    if (isSuperAdmin && selectedAgencyId) {
      filtered = filtered.filter(s => s.agency_id === selectedAgencyId);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.document?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter(s => s.is_active === isActive);
    }

    return filtered;
  }, [suppliers, isSuperAdmin, selectedAgencyId, searchQuery, statusFilter]);

  const toggleSort = (key: "name" | "document" | "email" | "phone" | "address" | "status") => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const sortedSuppliers = useMemo(() => {
    const sorted = [...filteredSuppliers].sort((a, b) => {
      if (sort.key === "document") {
        return (a.document || "").localeCompare(b.document || "", "pt-BR", { sensitivity: "base" });
      }
      if (sort.key === "email") {
        return (a.email || "").localeCompare(b.email || "", "pt-BR", { sensitivity: "base" });
      }
      if (sort.key === "phone") {
        return (a.phone || "").localeCompare(b.phone || "", "pt-BR", { sensitivity: "base" });
      }
      if (sort.key === "address") {
        return (a.address || "").localeCompare(b.address || "", "pt-BR", { sensitivity: "base" });
      }
      if (sort.key === "status") {
        return Number(a.is_active) - Number(b.is_active);
      }
      return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
    });
    return sort.direction === "asc" ? sorted : sorted.reverse();
  }, [filteredSuppliers, sort]);

  const handleCreateSupplier = (data: SupplierInput) => {
    const agencyId = isSuperAdmin && selectedAgencyId ? selectedAgencyId : agency?.id;
    if (!agencyId) {
      toast({ title: "Selecione uma agência para criar o fornecedor", variant: "destructive" });
      return;
    }
    createSupplier({ ...data, agency_id: agencyId });
    setSupplierDialogOpen(false);
  };

  const handleUpdateSupplier = (data: SupplierInput) => {
    if (!editingSupplier) return;
    updateSupplier({ ...data, id: editingSupplier.id });
    setEditingSupplier(null);
    setSupplierDialogOpen(false);
  };

  const handleDelete = () => {
    if (!supplierToDelete) return;
    deleteSupplier(supplierToDelete);
    setSupplierToDelete(null);
    setDeleteDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus fornecedores e parceiros comerciais
          </p>
        </div>
        <Button size="sm" onClick={() => {
          setEditingSupplier(null);
          setSupplierDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Total de Fornecedores</div>
            <div className="text-2xl font-semibold">{filteredSuppliers.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Fornecedores Ativos</div>
            <div className="text-2xl font-semibold text-emerald-600">
              {filteredSuppliers.filter(s => s.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Fornecedores Inativos</div>
            <div className="text-2xl font-semibold text-slate-500">
              {filteredSuppliers.filter(s => !s.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
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

            <div className="relative w-full max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou documento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "Todos", value: "all" },
                { label: "Ativos", value: "active" },
                { label: "Inativos", value: "inactive" },
              ].map((option) => {
                const isActive = statusFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#f06a12] text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card className="rounded-2xl border-0 shadow-none bg-white overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                  >
                    Nome
                    {sort.key === "name" ? (
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
                    onClick={() => toggleSort("document")}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                  >
                    CPF/CNPJ
                    {sort.key === "document" ? (
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
                    onClick={() => toggleSort("email")}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                  >
                    Email
                    {sort.key === "email" ? (
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
                    onClick={() => toggleSort("phone")}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                  >
                    Telefone
                    {sort.key === "phone" ? (
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
                    onClick={() => toggleSort("address")}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                  >
                    Endereço
                    {sort.key === "address" ? (
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
                    onClick={() => toggleSort("status")}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                  >
                    Status
                    {sort.key === "status" ? (
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
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Nenhum fornecedor encontrado</p>
                    <p className="text-sm">Adicione um novo fornecedor para começar</p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedSuppliers.map((supplier, index) => (
                  <TableRow
                    key={supplier.id}
                    className={index % 2 === 0 ? 'bg-slate-50/60 hover:bg-slate-50' : 'hover:bg-slate-50'}
                  >
                    <TableCell className="font-medium text-slate-900">{supplier.name}</TableCell>
                    <TableCell className="text-slate-600">{supplier.document || "-"}</TableCell>
                    <TableCell className="text-slate-600">{supplier.email || "-"}</TableCell>
                    <TableCell className="text-slate-600">{supplier.phone || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-slate-600">{supplier.address || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={supplier.is_active ? 'rounded-full bg-emerald-100 text-emerald-700' : 'rounded-full bg-slate-100 text-slate-600'}
                      >
                        {supplier.is_active ? "Ativo" : "Inativo"}
                      </Badge>
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
                            setEditingSupplier(supplier);
                            setSupplierDialogOpen(true);
                          }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSupplierToDelete(supplier.id);
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

      {/* Supplier Dialog */}
      <SupplierDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        supplier={editingSupplier}
        onSubmit={editingSupplier ? handleUpdateSupplier : handleCreateSupplier}
        isLoading={isCreating}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
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
    </div>
  );
}
