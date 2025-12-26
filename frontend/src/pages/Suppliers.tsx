import { useState, useMemo } from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  Search,
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie seus fornecedores e parceiros comerciais
          </p>
        </div>
        <Button onClick={() => {
          setEditingSupplier(null);
          setSupplierDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
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

            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou documento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Nenhum fornecedor encontrado</p>
                    <p className="text-sm">Adicione um novo fornecedor para começar</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.document || "-"}</TableCell>
                    <TableCell>{supplier.email || "-"}</TableCell>
                    <TableCell>{supplier.phone || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{supplier.address || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={supplier.is_active ? "default" : "secondary"}>
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

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total de Fornecedores</div>
            <div className="text-2xl font-bold">{filteredSuppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Fornecedores Ativos</div>
            <div className="text-2xl font-bold text-green-600">
              {filteredSuppliers.filter(s => s.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Fornecedores Inativos</div>
            <div className="text-2xl font-bold text-muted-foreground">
              {filteredSuppliers.filter(s => !s.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

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
