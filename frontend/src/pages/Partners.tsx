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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parceiros</h1>
          <p className="text-muted-foreground">Gerencie seus fornecedores e parceiros</p>
        </div>
        <Button onClick={() => { setEditingPartner(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Parceiro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Handshake className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{partners.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Plane className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {partners.filter(p => p.type === 'airline').length}
                </p>
                <p className="text-sm text-muted-foreground">Aéreas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Hotel className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {partners.filter(p => p.type === 'hotel').length}
                </p>
                <p className="text-sm text-muted-foreground">Hotéis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Car className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {partners.filter(p => p.type === 'car_rental').length}
                </p>
                <p className="text-sm text-muted-foreground">Locadoras</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parceiro</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Desde</TableHead>
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
                filteredPartners.map((partner) => {
                  const Icon = partnerTypeIcons[partner.type || 'other'] || Handshake;
                  return (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-medium">{partner.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {partnerTypeLabels[partner.type || 'other'] || 'Outro'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {partner.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span>{partner.email}</span>
                            </div>
                          )}
                          {partner.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span>{partner.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{formatDate(partner.created_at)}</span>
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
