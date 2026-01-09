import { useState } from 'react';
import { usePartners, Partner } from '@/hooks/usePartners';
import { useAuth } from '@/contexts/AuthContext';
import { PartnerDialog } from '@/components/partners/PartnerDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, MoreHorizontal, Mail, Phone, Edit, Trash2, Plane, Hotel, Car, Package, Handshake, Loader2 } from 'lucide-react';

const partnerTypeLabels: Record<string, string> = {
  airline: 'Companhia Aérea',
  hotel: 'Hotel',
  car_rental: 'Locadora',
  tour_operator: 'Operadora',
  other: 'Outro',
};

const partnerTypeIcons: Record<string, typeof Plane> = {
  airline: Plane,
  hotel: Hotel,
  car_rental: Car,
  tour_operator: Package,
  other: Handshake,
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export default function Partners() {
  const { agency, isSuperAdmin } = useAuth();
  const { partners, isLoading, createPartner, updatePartner, deletePartner, isCreating, isUpdating, isDeleting } = usePartners();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);

  const filteredPartners = partners.filter(partner => {
    const searchLower = searchTerm.toLowerCase();
    return (
      partner.name.toLowerCase().includes(searchLower) ||
      (partner.email?.toLowerCase().includes(searchLower))
    );
  });

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setDialogOpen(true);
  };

  const handleDelete = (partner: Partner) => {
    setPartnerToDelete(partner);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (partnerToDelete) {
      deletePartner(partnerToDelete.id);
      setDeleteDialogOpen(false);
      setPartnerToDelete(null);
    }
  };

  const handleSubmit = (data: any) => {
    if (data.id) {
      updatePartner(data);
    } else {
      createPartner(data);
    }
    setEditingPartner(null);
  };

  if (!agency && !isSuperAdmin) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Você precisa estar vinculado a uma agência para ver os parceiros.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Parceiros</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus fornecedores e parceiros</p>
        </div>
        <Button size="sm" onClick={() => { setEditingPartner(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Parceiro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                <p className="text-2xl font-semibold">{partners.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Handshake className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Aéreas</p>
                <p className="text-2xl font-semibold text-blue-600">
                  {partners.filter(p => p.type === 'airline').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Plane className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Hotéis</p>
                <p className="text-2xl font-semibold text-emerald-600">
                  {partners.filter(p => p.type === 'hotel').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Hotel className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Locadoras</p>
                <p className="text-2xl font-semibold text-orange-600">
                  {partners.filter(p => p.type === 'car_rental').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border-0 shadow-none bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wide text-slate-500">Parceiro</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-slate-500">Tipo</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-slate-500">Contato</TableHead>
                <TableHead className="text-xs uppercase tracking-wide text-slate-500">Desde</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum parceiro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredPartners.map((partner, index) => {
                  const Icon = partnerTypeIcons[partner.type || 'other'] || Handshake;
                  return (
                    <TableRow
                      key={partner.id}
                      className={index % 2 === 0 ? 'bg-slate-50/60 hover:bg-slate-50' : 'hover:bg-slate-50'}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-medium text-slate-900">{partner.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-600">
                          {partnerTypeLabels[partner.type || 'other'] || 'Outro'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {partner.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{partner.email}</span>
                            </div>
                          )}
                          {partner.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{partner.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-500">{formatDate(partner.created_at)}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(partner)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(partner)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <PartnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        partner={editingPartner}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Parceiro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o parceiro "{partnerToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
