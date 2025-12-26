import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { Plane, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const { settings } = usePlatformSettings();
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const platformName = settings.platform_name || 'TravelCRM';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: 'Erro de validação',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso',
      });
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ocorreu um erro inesperado';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const trialEnabled = settings.trial_enabled === 'true';
  const trialDays = parseInt(settings.trial_days || '7', 10);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-xl p-3">
              <Plane className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{platformName}</CardTitle>
          <CardDescription>
            Sistema de gestão para agências de turismo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {trialEnabled && (
            <Button variant="default" className="w-full" asChild>
              <Link to="/registrar">
                Teste grátis por {trialDays} dias
              </Link>
            </Button>
          )}
          <div className="w-full border-t pt-3">
            <p className="text-sm text-muted-foreground text-center mb-2">
              Já conhece nossos planos?
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/planos">Ver planos e assinar</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
