import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionPlans() {
  const { plans, isLoading } = useSubscriptionPlans();
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();
  
  const platformName = settings.platform_name || 'Tourbine';
  const activePlans = plans?.filter(p => p.is_active) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-xl p-2">
              <Plane className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">{platformName}</span>
          </div>
          <Button variant="outline" onClick={() => navigate('/auth')}>
            Já tenho conta
          </Button>
        </div>
      </header>

      {/* Hero */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Escolha o plano ideal para sua agência
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Gerencie clientes, propostas e comissões de forma profissional. 
          Comece agora e transforme sua agência de turismo.
        </p>
      </div>

      {/* Plans */}
      <div className="container mx-auto px-4 pb-16">
        {activePlans.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Nenhum plano disponível no momento. Entre em contato conosco.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {activePlans.map((plan) => (
              <Card key={plan.id} className="relative flex flex-col">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {formatCurrency(plan.price_monthly)}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    {plan.price_yearly > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        ou {formatCurrency(plan.price_yearly)}/ano 
                        <Badge variant="secondary" className="ml-2">
                          Economize {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%
                        </Badge>
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 flex-1">
                    {plan.max_users && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Até {plan.max_users} usuários</span>
                      </div>
                    )}
                    {plan.max_clients && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Até {plan.max_clients} clientes</span>
                      </div>
                    )}
                    {plan.max_proposals && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Até {plan.max_proposals} propostas</span>
                      </div>
                    )}
                    {!plan.max_users && !plan.max_clients && !plan.max_proposals && (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">Uso ilimitado</span>
                      </div>
                    )}
                  </div>

                  <Button className="w-full mt-6" onClick={() => navigate('/auth')}>
                    Começar agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {platformName}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
