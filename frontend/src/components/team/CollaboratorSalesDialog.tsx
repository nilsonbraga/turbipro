import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collaborator } from '@/hooks/useCollaborators';
import { DollarSign, TrendingUp, Percent, X } from 'lucide-react';
import { ProposalDetail } from '@/components/proposals/ProposalDetail';
import { apiFetch } from '@/lib/api';
import { BackendProposal, Proposal, mapBackendProposalToFront, proposalInclude } from '@/hooks/useProposals';

interface Sale {
  id: string;
  proposal_id: string;
  proposal_number: number;
  proposal_title: string;
  client_name: string | null;
  sale_value: number;
  profit_value: number;
  commission_amount: number;
  created_at: string;
  period_month: number;
  period_year: number;
}

interface CollaboratorSalesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborator: Collaborator | null;
}

const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function CollaboratorSalesDialog({
  open,
  onOpenChange,
  collaborator,
}: CollaboratorSalesDialogProps) {
  const currentDate = new Date();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totals, setTotals] = useState({ sales: 0, profit: 0, commission: 0 });
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [proposalDetailOpen, setProposalDetailOpen] = useState(false);
  
  // Filters - default to current month
  const [filterMonth, setFilterMonth] = useState<number | null>(currentDate.getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number | null>(currentDate.getFullYear());

  // Generate years for filter (current year and 5 years back)
  const years = Array.from({ length: 6 }, (_, i) => currentDate.getFullYear() - i);

  useEffect(() => {
    if (open && collaborator) {
      loadSales();
    }
  }, [open, collaborator, filterMonth, filterYear]);

  const loadSales = async () => {
    if (!collaborator) return;
    
    setIsLoading(true);
    try {
      const where: Record<string, unknown> = { collaboratorId: collaborator.id };
      if (filterMonth !== null) where.periodMonth = filterMonth;
      if (filterYear !== null) where.periodYear = filterYear;

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        include: JSON.stringify({
          proposal: {
            include: {
              client: { select: { name: true } },
            },
          },
        }),
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/collaboratorCommission?${params.toString()}`);

      const formattedSales: Sale[] = (data || []).map((item: any) => ({
        id: item.id,
        proposal_id: item.proposalId,
        proposal_number: item.proposal?.number || 0,
        proposal_title: item.proposal?.title || '-',
        client_name: item.proposal?.client?.name || null,
        sale_value: Number(item.saleValue || 0),
        profit_value: Number(item.profitValue || 0),
        commission_amount: Number(item.commissionAmount || 0),
        created_at: item.createdAt,
        period_month: item.periodMonth,
        period_year: item.periodYear,
      }));

      setSales(formattedSales);

      const totalSales = formattedSales.reduce((acc, s) => acc + s.sale_value, 0);
      const totalProfit = formattedSales.reduce((acc, s) => acc + s.profit_value, 0);
      const totalCommission = formattedSales.reduce((acc, s) => acc + s.commission_amount, 0);
      setTotals({ sales: totalSales, profit: totalProfit, commission: totalCommission });
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenProposal = async (proposalId: string) => {
    try {
      const params = new URLSearchParams({
        include: JSON.stringify(proposalInclude),
      });
      const data = await apiFetch<BackendProposal>(`/api/proposal/${proposalId}?${params.toString()}`);
      setSelectedProposal(mapBackendProposalToFront(data));
      setProposalDetailOpen(true);
    } catch (error) {
      console.error('Error loading proposal:', error);
    }
  };

  const handleProposalUpdate = (updatedProposal: Proposal) => {
    setSelectedProposal(updatedProposal);
    loadSales();
  };

  const clearFilters = () => {
    setFilterMonth(null);
    setFilterYear(null);
  };

  const hasFilters = filterMonth !== null || filterYear !== null;

  const getFilterLabel = () => {
    if (filterMonth !== null && filterYear !== null) {
      return `${months.find(m => m.value === filterMonth)?.label} ${filterYear}`;
    }
    if (filterMonth !== null) {
      return months.find(m => m.value === filterMonth)?.label;
    }
    if (filterYear !== null) {
      return String(filterYear);
    }
    return 'Todos os períodos';
  };

  if (!collaborator) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendas Fechadas - {collaborator.name}</DialogTitle>
          </DialogHeader>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Select
              value={filterMonth?.toString() || 'all'}
              onValueChange={(value) => setFilterMonth(value === 'all' ? null : Number(value))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos meses</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterYear?.toString() || 'all'}
              onValueChange={(value) => setFilterYear(value === 'all' ? null : Number(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos anos</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}

            <Badge variant="secondary" className="ml-auto">
              {getFilterLabel()}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Vendido</span>
                </div>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totals.sales)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Lucro</span>
                </div>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totals.profit)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Comissão</span>
                </div>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totals.commission)}</p>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Carregando...</div>
          ) : sales.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhuma venda fechada encontrada {hasFilters ? 'para o período selecionado' : 'para este colaborador'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data Fechamento</TableHead>
                  <TableHead className="text-right">Valor Venda</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div>
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleOpenProposal(sale.proposal_id)}
                        >
                          #{sale.proposal_number}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1 truncate max-w-[200px]">
                          {sale.proposal_title}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{sale.client_name || '-'}</TableCell>
                    <TableCell>{formatDate(sale.created_at)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.sale_value)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(sale.profit_value)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatCurrency(sale.commission_amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {selectedProposal && (
        <Dialog open={proposalDetailOpen} onOpenChange={setProposalDetailOpen}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0">
            <ProposalDetail
              proposal={selectedProposal}
              onClose={() => setProposalDetailOpen(false)}
              onEdit={() => setProposalDetailOpen(false)}
              onProposalUpdate={handleProposalUpdate}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
