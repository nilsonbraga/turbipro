import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomItineraries } from '@/hooks/useCustomItineraries';
import { useAgencies } from '@/hooks/useAgencies';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Copy, 
  ExternalLink,
  Map,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  FileEdit,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import ItineraryDialog from '@/components/itineraries/ItineraryDialog';

export default function Itineraries() {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [agencyFilter, setAgencyFilter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { agencies } = useAgencies();
  const { itineraries, isLoading, deleteItinerary, isDeleting } = useCustomItineraries(agencyFilter);

  const filteredItineraries = itineraries.filter(itinerary =>
    itinerary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    itinerary.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    itinerary.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyUrl = (token: string, requiresToken: boolean, accessToken: string | null) => {
    const baseUrl = `${window.location.origin}/roteiro/${token}`;
    const url = requiresToken && accessToken ? `${baseUrl}?access=${accessToken}` : baseUrl;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado!' });
  };

  const handleEdit = (itinerary: any) => {
    navigate(`/itineraries/${itinerary.id}`);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteItinerary(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
      sent: { label: 'Enviado', className: 'bg-blue-100 text-blue-800' },
      approved: { label: 'Aprovado', className: 'bg-green-100 text-green-800' },
      revision: { label: 'Em Revisão', className: 'bg-yellow-100 text-yellow-800' },
    };
    const variant = variants[status] || variants.draft;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), "dd 'de' MMM, yyyy", { locale: ptBR });
  };

  // Stats
  const totalItineraries = itineraries.length;
  const approvedCount = itineraries.filter(i => i.status === 'approved').length;
  const sentCount = itineraries.filter(i => i.status === 'sent').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Roteiros Personalizados</h1>
          <p className="text-muted-foreground">
            Crie roteiros detalhados dia a dia para seus clientes
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Roteiro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Map className="w-4 h-4" />
              Total de Roteiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItineraries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Send className="w-4 h-4" />
              Enviados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{sentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Aprovados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileEdit className="w-4 h-4" />
              Rascunhos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {itineraries.filter(i => i.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {isSuperAdmin && (
          <Select value={agencyFilter || 'all'} onValueChange={(v) => setAgencyFilter(v === 'all' ? null : v)}>
            <SelectTrigger className="w-full md:w-[250px]">
              <SelectValue placeholder="Todas as agências" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as agências</SelectItem>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar roteiros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredItineraries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum roteiro encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredItineraries.map((itinerary) => (
                <TableRow key={itinerary.id}>
                  <TableCell className="font-medium">{itinerary.title}</TableCell>
                  <TableCell>{itinerary.client?.name || '-'}</TableCell>
                  <TableCell>
                    {itinerary.destination && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {itinerary.destination}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {itinerary.start_date && (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {formatDate(itinerary.start_date)}
                        {itinerary.end_date && ` - ${formatDate(itinerary.end_date)}`}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(itinerary.status)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyUrl(itinerary.public_token, itinerary.requires_token, itinerary.access_token)}
                        title="Copiar link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/roteiro/${itinerary.public_token}`, '_blank')}
                        title="Visualizar"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(itinerary)}
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(itinerary.id)}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Dialog */}
      <ItineraryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir roteiro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dias e itens do roteiro serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
