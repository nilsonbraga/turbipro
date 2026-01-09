import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  MapPin,
  Edit,
  Trash2,
  Loader2,
  Users,
  MessageCircle,
  Eye,
  KanbanSquare,
  CheckSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useTasks, useTaskColumns } from "@/hooks/useTasks";
import { useProposals } from "@/hooks/useProposals";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { useCollaborators } from "@/hooks/useCollaborators";
import {
  useFavoriteDestinations,
  FavoriteDestination,
} from "@/hooks/useFavoriteDestinations";
import { useClients } from "@/hooks/useClients";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { ProposalDialog } from "@/components/proposals/ProposalDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function FavoriteDestinations() {
  const { agency, isSuperAdmin, isAdmin } = useAuth();
  const { clients, isLoading: isLoadingClients } = useClients();
  const { stages } = usePipelineStages();
  const { collaborators } = useCollaborators();
  const { columns } = useTaskColumns();
  const { createTask } = useTasks();
  const { createProposal } = useProposals();
  const {
    destinations,
    isLoading,
    createDestination,
    updateDestination,
    deleteDestination,
    isCreating,
    isUpdating,
    isDeleting,
  } = useFavoriteDestinations({ includeClients: true });

  const [destinationFilter, setDestinationFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<FavoriteDestination | null>(null);
  const [destinationName, setDestinationName] = useState("");
  const [destinationNotes, setDestinationNotes] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [destinationToDelete, setDestinationToDelete] = useState<FavoriteDestination | null>(null);
  const [viewClientsOpen, setViewClientsOpen] = useState(false);
  const [viewDestination, setViewDestination] = useState<FavoriteDestination | null>(null);
  const [viewClientSearch, setViewClientSearch] = useState("");
  const [tableSort, setTableSort] = useState<{
    key: "name" | "clients";
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });
  const [viewSort, setViewSort] = useState<{
    key: "name" | "email" | "phone";
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskPrefill, setTaskPrefill] = useState<{ title: string; description: string } | null>(null);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [leadPrefill, setLeadPrefill] = useState<{ title: string; notes: string } | null>(null);

  const filteredDestinations = useMemo(() => {
    return destinations.filter((destination) => {
      if (destinationFilter !== "all" && destination.id !== destinationFilter) {
        return false;
      }
      if (clientFilter !== "all") {
        const match = (destination.clients || []).some((client) => client.id === clientFilter);
        if (!match) return false;
      }
      return true;
    });
  }, [destinations, destinationFilter, clientFilter]);

  const destinationOptions = useMemo(
    () => [
      { value: "all", label: "Todos os destinos" },
      ...destinations.map((destination) => ({
        value: destination.id,
        label: destination.name,
      })),
    ],
    [destinations],
  );

  const clientOptions = useMemo(
    () => [
      { value: "all", label: "Todos os clientes" },
      ...clients.map((client) => ({
        value: client.id,
        label: client.name,
      })),
    ],
    [clients],
  );

  const totalAssociations = destinations.reduce(
    (acc, destination) => acc + (destination.clients?.length ?? 0),
    0,
  );

  const openCreateDialog = () => {
    setEditingDestination(null);
    setDestinationName("");
    setDestinationNotes("");
    setSelectedClientIds([]);
    setClientSearch("");
    setDialogOpen(true);
  };

  const openEditDialog = (destination: FavoriteDestination) => {
    setEditingDestination(destination);
    setDestinationName(destination.name);
    setDestinationNotes(destination.notes ?? "");
    setSelectedClientIds(destination.clients?.map((client) => client.id) ?? []);
    setClientSearch("");
    setDialogOpen(true);
  };

  const openViewClients = (destination: FavoriteDestination) => {
    setViewDestination(destination);
    setViewClientSearch("");
    setViewClientsOpen(true);
  };

  const toggleTableSort = (key: "name" | "clients") => {
    setTableSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const toggleViewSort = (key: "name" | "email" | "phone") => {
    setViewSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const handleSubmit = () => {
    if (!destinationName.trim()) return;
    const payload = {
      name: destinationName.trim(),
      notes: destinationNotes.trim() || null,
      client_ids: selectedClientIds,
    };

    if (editingDestination) {
      updateDestination({ id: editingDestination.id, ...payload });
    } else {
      createDestination(payload);
    }

    setDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!destinationToDelete) return;
    deleteDestination(destinationToDelete.id);
    setDestinationToDelete(null);
    setDeleteDialogOpen(false);
  };

  const filteredClients = clients.filter((client) => {
    if (!clientSearch.trim()) return true;
    const term = clientSearch.toLowerCase();
    return (
      client.name.toLowerCase().includes(term) ||
      (client.email ?? "").toLowerCase().includes(term)
    );
  });

  const toggleClientSelection = (clientId: string, checked: boolean) => {
    setSelectedClientIds((current) => {
      if (checked) {
        return current.includes(clientId) ? current : [...current, clientId];
      }
      return current.filter((id) => id !== clientId);
    });
  };

  const handleSelectAllClients = () => {
    if (!filteredClients.length) return;
    setSelectedClientIds((current) => {
      const next = new Set(current);
      filteredClients.forEach((client) => next.add(client.id));
      return Array.from(next);
    });
  };

  const handleClearSelection = () => {
    setSelectedClientIds([]);
  };

  const formatWhatsappLink = (phone?: string | null) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;
    const withCountry = digits.length <= 11 && !digits.startsWith("55") ? `55${digits}` : digits;
    return `https://wa.me/${withCountry}`;
  };

  const viewClients = useMemo(() => {
    const list = viewDestination?.clients ?? [];
    const term = viewClientSearch.trim().toLowerCase();
    const filtered = term
      ? list.filter((client) => {
          const email = client.email?.toLowerCase() ?? "";
          const phone = client.phone?.toLowerCase() ?? "";
          return (
            client.name.toLowerCase().includes(term) ||
            email.includes(term) ||
            phone.includes(term)
          );
        })
      : list;
    const sorted = [...filtered].sort((a, b) => {
      if (viewSort.key === "email") {
        return (a.email ?? "").localeCompare(b.email ?? "", "pt-BR", { sensitivity: "base" });
      }
      if (viewSort.key === "phone") {
        return (a.phone ?? "").localeCompare(b.phone ?? "", "pt-BR", { sensitivity: "base" });
      }
      return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
    });
    return viewSort.direction === "asc" ? sorted : sorted.reverse();
  }, [viewDestination, viewClientSearch, viewSort]);

  const sortedDestinations = useMemo(() => {
    const sorted = [...filteredDestinations].sort((a, b) => {
      if (tableSort.key === "clients") {
        return (a.clients?.length ?? 0) - (b.clients?.length ?? 0);
      }
      return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
    });
    return tableSort.direction === "asc" ? sorted : sorted.reverse();
  }, [filteredDestinations, tableSort]);

  const buildDestinationSummary = (destination: FavoriteDestination) => {
    const lines: string[] = [`Destino: ${destination.name}`];
    if (destination.notes) {
      lines.push(`Observações: ${destination.notes}`);
    }
    const clientList = destination.clients ?? [];
    lines.push(`Clientes associados: ${clientList.length}`);
    if (clientList.length > 0) {
      lines.push(`Clientes: ${clientList.map((client) => client.name).join(", ")}`);
    }
    return lines.join("\n");
  };

  const handleCreateTask = (destination: FavoriteDestination) => {
    setTaskPrefill({
      title: `Destino favorito: ${destination.name}`,
      description: buildDestinationSummary(destination),
    });
    setTaskDialogOpen(true);
  };

  const handleCreateLead = (destination: FavoriteDestination) => {
    setLeadPrefill({
      title: `Destino favorito: ${destination.name}`,
      notes: buildDestinationSummary(destination),
    });
    setLeadDialogOpen(true);
  };

  const handleSaveTask = (data: any) => {
    createTask.mutate(data);
    setTaskDialogOpen(false);
    setTaskPrefill(null);
  };

  const handleSaveLead = (data: any) => {
    createProposal(data);
    setLeadDialogOpen(false);
    setLeadPrefill(null);
  };

  if (!agency && !isSuperAdmin) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">
          Você precisa estar vinculado a uma agência para ver os destinos favoritos.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Destinos Favoritos</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre destinos e associe clientes rapidamente
          </p>
        </div>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Destino
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Destinos cadastrados
                </p>
                <p className="text-2xl font-semibold">{destinations.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Associações com clientes
                </p>
                <p className="text-2xl font-semibold">{totalAssociations}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="w-full max-w-[260px]">
          <Combobox
            options={destinationOptions}
            value={destinationFilter}
            onValueChange={setDestinationFilter}
            placeholder="Selecionar destino"
            searchPlaceholder="Buscar destino..."
            emptyText="Nenhum destino encontrado"
            buttonClassName="h-9 w-full bg-white"
            contentClassName="w-[280px]"
          />
        </div>
        <div className="w-full max-w-[260px]">
          <Combobox
            options={clientOptions}
            value={clientFilter}
            onValueChange={setClientFilter}
            placeholder="Selecionar cliente"
            searchPlaceholder="Buscar cliente..."
            emptyText="Nenhum cliente encontrado"
            buttonClassName="h-9 w-full bg-white"
            contentClassName="w-[280px]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredDestinations.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-8 text-center text-muted-foreground">
            Nenhum destino favorito cadastrado
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-0 shadow-none bg-white overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleTableSort("name")}
                      className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                    >
                      Destino
                      {tableSort.key === "name" ? (
                        tableSort.direction === "asc" ? (
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
                      onClick={() => toggleTableSort("clients")}
                      className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                    >
                      Clientes
                      {tableSort.key === "clients" ? (
                        tableSort.direction === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-slate-500 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDestinations.map((destination, index) => (
                  <TableRow
                    key={destination.id}
                    className={index % 2 === 0 ? "bg-slate-50/60 hover:bg-slate-50" : "hover:bg-slate-50"}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-900">{destination.name}</span>
                        {destination.notes ? (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {destination.notes}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem observações cadastradas.</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-600">
                          {(destination.clients?.length ?? 0)} clientes
                        </Badge>
                        {destination.clients && destination.clients.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {destination.clients.slice(0, 2).map((client) => (
                              <Badge
                                key={client.id}
                                variant="secondary"
                                className="rounded-full bg-slate-50 text-slate-600"
                              >
                                {client.name}
                              </Badge>
                            ))}
                            {destination.clients.length > 2 && (
                              <Badge variant="secondary" className="rounded-full bg-slate-50 text-slate-500">
                                +{destination.clients.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider delayDuration={0}>
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openViewClients(destination)}
                                aria-label="Ver clientes"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver clientes</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleCreateTask(destination)}
                                aria-label="Criar tarefa"
                              >
                                <CheckSquare className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Criar tarefa</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleCreateLead(destination)}
                                aria-label="Criar lead"
                              >
                                <KanbanSquare className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Criar lead</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDialog(destination)}
                                aria-label="Editar destino"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar destino</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => {
                                  setDestinationToDelete(destination);
                                  setDeleteDialogOpen(true);
                                }}
                                aria-label="Remover destino"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remover destino</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] h-[80vh] p-0 overflow-hidden flex flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/60">
              <DialogHeader className="space-y-1">
                <DialogTitle>{editingDestination ? "Editar destino favorito" : "Novo destino favorito"}</DialogTitle>
              </DialogHeader>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-4">
              <div className="space-y-2">
                <Label>Nome do destino</Label>
                <Input
                  placeholder="Ex: Paris, Fernando de Noronha..."
                  value={destinationName}
                  onChange={(e) => setDestinationName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Destaques, preferências, detalhes..."
                  value={destinationNotes}
                  onChange={(e) => setDestinationNotes(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Clientes associados</Label>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar clientes..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="pl-9 h-8 bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllClients}
                        disabled={isLoadingClients || filteredClients.length === 0}
                      >
                        Selecionar todos
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSelection}
                        disabled={selectedClientIds.length === 0}
                      >
                        Limpar seleção
                      </Button>
                    </div>
                  </div>
                  {isLoadingClients ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando clientes...
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
                      {filteredClients.map((client) => {
                        const checked = selectedClientIds.includes(client.id);
                        return (
                          <label key={client.id} className="flex items-center gap-2 text-sm text-slate-700">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => toggleClientSelection(client.id, value === true)}
                            />
                            <span className="flex-1">{client.name}</span>
                            {client.email && (
                              <span className="text-xs text-slate-400">{client.email}</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {selectedClientIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedClientIds.map((clientId) => {
                        const client = clients.find((item) => item.id === clientId);
                        if (!client) return null;
                        return (
                          <Badge key={client.id} variant="secondary" className="rounded-full bg-white text-slate-600">
                            {client.name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="px-6 pb-6 pt-3 border-t border-slate-100 flex-shrink-0">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingDestination ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewClientsOpen}
        onOpenChange={(open) => {
          setViewClientsOpen(open);
          if (!open) {
            setViewDestination(null);
            setViewClientSearch("");
          }
        }}
      >
        <DialogContent className="max-w-3xl w-[95vw] h-[85vh] p-0 overflow-hidden flex flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/60 flex-shrink-0">
              <DialogHeader className="space-y-1">
                <DialogTitle>
                  Clientes do destino {viewDestination?.name ? `• ${viewDestination.name}` : ""}
                </DialogTitle>
              </DialogHeader>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
              {!viewDestination || !viewDestination.clients || viewDestination.clients.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum cliente associado a este destino.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-600">
                      {viewClients.length} clientes associados
                    </Badge>
                    <div className="relative w-full max-w-[260px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar cliente..."
                        value={viewClientSearch}
                        onChange={(e) => setViewClientSearch(e.target.value)}
                        className="pl-9 h-8 bg-white"
                      />
                    </div>
                  </div>
                  {viewClients.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-muted-foreground">
                      Nenhum cliente encontrado para esta busca.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50/80">
                          <TableRow>
                            <TableHead>
                              <button
                                type="button"
                                onClick={() => toggleViewSort("name")}
                                className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                              >
                                Cliente
                                {viewSort.key === "name" ? (
                                  viewSort.direction === "asc" ? (
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
                                onClick={() => toggleViewSort("email")}
                                className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                              >
                                Email
                                {viewSort.key === "email" ? (
                                  viewSort.direction === "asc" ? (
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
                                onClick={() => toggleViewSort("phone")}
                                className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-700"
                              >
                                Telefone
                                {viewSort.key === "phone" ? (
                                  viewSort.direction === "asc" ? (
                                    <ArrowUp className="h-3 w-3" />
                                  ) : (
                                    <ArrowDown className="h-3 w-3" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-3 w-3" />
                                )}
                              </button>
                            </TableHead>
                            <TableHead className="text-xs uppercase tracking-wide text-slate-500">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewClients.map((client) => {
                            const whatsappUrl = formatWhatsappLink(client.phone ?? null);
                            return (
                              <TableRow key={client.id}>
                                <TableCell className="font-medium text-slate-900">{client.name}</TableCell>
                                <TableCell className="text-slate-600">{client.email || "-"}</TableCell>
                                <TableCell className="text-slate-600">{client.phone || "-"}</TableCell>
                                <TableCell>
                                  {whatsappUrl ? (
                                    <Button asChild variant="outline" size="sm">
                                      <a href={whatsappUrl} target="_blank" rel="noreferrer">
                                        <MessageCircle className="h-4 w-4" />
                                        WhatsApp
                                      </a>
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-slate-400">Sem telefone</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter className="px-6 pb-6 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setViewClientsOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        columns={columns}
        defaultColumnId={columns[0]?.id}
        agencyId={agency?.id ?? null}
        onSave={handleSaveTask}
        isLoading={createTask.isPending}
        prefillData={taskPrefill}
      />

      <ProposalDialog
        open={leadDialogOpen}
        onOpenChange={setLeadDialogOpen}
        clients={clients || []}
        stages={stages}
        collaborators={collaborators
          .filter((collaborator) => collaborator.status === "active")
          .map((collaborator) => ({ id: collaborator.id, name: collaborator.name }))}
        isAdmin={isAdmin || isSuperAdmin}
        onSubmit={handleSaveLead}
        proposal={leadPrefill ? ({ title: leadPrefill.title, notes: leadPrefill.notes } as any) : null}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir destino favorito</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o destino "{destinationToDelete?.name}"? As associações com clientes serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
