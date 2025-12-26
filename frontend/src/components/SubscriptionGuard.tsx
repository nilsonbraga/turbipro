import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgencySubscription } from '@/hooks/useAgencySubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { user, agency, isLoading: authLoading, isSuperAdmin, role, logout } = useAuth();
  const { subscription, isLoading: subLoading, hasActiveSubscription, daysUntilExpiration } = useAgencySubscription();

  console.log('SubscriptionGuard auth state', { userId: user?.id, role, isSuperAdmin, hasAgency: !!agency });

  // Wait for auth to fully load before checking anything
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Super admin bypasses all subscription and agency checks - they don't need an agency
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Still loading subscription data (only for non-super-admins)
  if (subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
  };

  // User not associated with any agency
  if (!agency) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Sem agência vinculada</CardTitle>
            <CardDescription>
              Sua conta não está vinculada a nenhuma agência. Entre em contato com o administrador.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={handleLogout} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Entrar com outra conta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No active subscription - redirect to plans page
  if (!hasActiveSubscription) {
    const statusMessage = subscription?.status === 'past_due' 
      ? 'Sua assinatura está com pagamento pendente e o período de carência expirou.'
      : subscription?.status === 'canceled'
      ? 'Sua assinatura foi cancelada.'
      : 'Sua agência não possui uma assinatura ativa.';

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Assinatura Inativa</CardTitle>
            <CardDescription>{statusMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Para continuar usando o sistema, escolha um plano de assinatura.
            </p>
            <Button asChild className="w-full">
              <Link to="/planos">Ver planos disponíveis</Link>
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Entrar com outra conta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show warning banner if subscription is expiring soon (within 7 days)
  const showWarning = daysUntilExpiration !== null && daysUntilExpiration <= 7 && daysUntilExpiration > 0;

  return (
    <>
      {showWarning && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-center">
          <p className="text-sm text-destructive">
            <AlertTriangle className="inline h-4 w-4 mr-1" />
            Sua assinatura expira em {daysUntilExpiration} dia{daysUntilExpiration !== 1 ? 's' : ''}. 
            <Link to="/planos" className="underline ml-1">Renove agora</Link>
          </p>
        </div>
      )}
      {children}
    </>
  );
}