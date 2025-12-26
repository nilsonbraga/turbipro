import { useParams } from 'react-router-dom';
import { usePublicProposal } from '@/hooks/usePublicProposalLinks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plane, Hotel, Car, Package, Map, Ship, Shield, Bus, Calendar, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const serviceIcons: Record<string, typeof Plane> = {
  flight: Plane,
  hotel: Hotel,
  car: Car,
  package: Package,
  tour: Map,
  cruise: Ship,
  insurance: Shield,
  transfer: Bus,
  other: Package,
};

const serviceLabels: Record<string, string> = {
  flight: 'Voo',
  hotel: 'Hotel',
  car: 'Carro',
  package: 'Pacote',
  tour: 'Roteiro',
  cruise: 'Cruzeiro',
  insurance: 'Seguro',
  transfer: 'Transfer',
  other: 'Outro',
};

export default function PublicProposal() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = usePublicProposal(token || null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">😕</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Proposta não encontrada</h2>
            <p className="text-muted-foreground">
              Este link pode ter expirado ou a proposta não está mais disponível.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { proposal, services, agency } = data;
  const totalServices = services.reduce((sum: number, s: any) => sum + (s.value || 0), 0);
  const discountValue = (totalServices * (proposal.discount || 0)) / 100;
  const finalValue = totalServices - discountValue;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                {agency?.name || 'Agência de Viagens'}
              </p>
              <h1 className="text-xl font-bold">{proposal.title}</h1>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Proposta #{proposal.number}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Client Info */}
        {proposal.clients && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Preparada para
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{proposal.clients.name}</p>
              {proposal.clients.email && (
                <p className="text-muted-foreground">{proposal.clients.email}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Services */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Serviços Inclusos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum serviço adicionado nesta proposta
              </p>
            ) : (
              services.map((service: any) => {
                const Icon = serviceIcons[service.type] || Package;
                return (
                  <div key={service.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">
                          {serviceLabels[service.type] || service.type}
                        </Badge>
                      </div>
                      <p className="font-medium">{service.description || 'Sem descrição'}</p>
                      {(service.origin || service.destination) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.origin} {service.origin && service.destination && '→'} {service.destination}
                        </p>
                      )}
                      {(service.start_date || service.end_date) && (
                        <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{service.start_date && formatDate(service.start_date)}</span>
                          {service.end_date && service.start_date !== service.end_date && (
                            <>
                              <span>→</span>
                              <span>{formatDate(service.end_date)}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-semibold">{formatCurrency(service.value || 0)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {proposal.notes && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{proposal.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Totals */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="opacity-80">Subtotal</span>
                <span>{formatCurrency(totalServices)}</span>
              </div>
              {(proposal.discount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="opacity-80">Desconto ({proposal.discount}%)</span>
                  <span>-{formatCurrency(discountValue)}</span>
                </div>
              )}
              <Separator className="bg-primary-foreground/20" />
              <div className="flex justify-between text-2xl font-bold">
                <span>Valor Total</span>
                <span>{formatCurrency(finalValue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Proposta válida por 7 dias</p>
          <p className="mt-1">
            {agency?.email && `Entre em contato: ${agency.email}`}
            {agency?.phone && ` | ${agency.phone}`}
          </p>
        </div>
      </main>
    </div>
  );
}
