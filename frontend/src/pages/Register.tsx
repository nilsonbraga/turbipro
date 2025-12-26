import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { Plane, Loader2, Clock } from 'lucide-react';
import { z } from 'zod';

const registerSchema = z.object({
  agencyName: z.string().min(2, 'Nome da agência deve ter pelo menos 2 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [agencyName, setAgencyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();
  
  const platformName = settings.platform_name || 'TravelCRM';
  const trialDays = parseInt(settings.trial_days || '7', 10);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = registerSchema.safeParse({ agencyName, name, email, password });
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
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name,
          },
        },
      });

      if (authError) {
        let message = authError.message || 'Erro ao criar conta';

        if (authError.message?.includes('User already registered')) {
          message = 'Este email já está cadastrado. Use o login em vez de criar outra conta.';
        } else if (authError.message?.includes('For security purposes, you can only request this after')) {
          message = 'Você acabou de solicitar cadastro para este email. Verifique sua caixa de entrada ou aguarde alguns segundos antes de tentar novamente.';
        }

        toast({
          title: 'Erro ao criar conta',
          description: message,
          variant: 'destructive',
        });
        return;
      }

      if (!authData.user) {
        toast({
          title: 'Erro',
          description: 'Erro ao criar usuário',
          variant: 'destructive',
        });
        return;
      }

      // 2. Configure agency, role, subscription and defaults via edge function
      const { data: trialData, error: trialError } = await supabase.functions.invoke('create-trial-agency', {
        body: {
          user_id: authData.user.id,
          agency_name: agencyName,
          email,
          user_name: name,
          trial_days: trialDays,
        },
      });

      if (trialError || (trialData as any)?.error) {
        console.error('Error creating trial agency:', trialError || (trialData as any)?.error);
        const description = (trialError || (trialData as any)?.error)?.message ||
          'Erro ao configurar agência e teste grátis';
        toast({
          title: 'Erro ao criar conta',
          description,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Conta criada com sucesso!',
        description: `Você tem ${trialDays} dias de teste grátis.`,
      });

      // Navigate to home - user should be logged in
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            Crie sua conta e teste gratuitamente
          </CardDescription>
          <div className="flex items-center justify-center gap-2 mt-2 text-primary">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{trialDays} dias de teste grátis</span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agencyName">Nome da Agência</Label>
              <Input
                id="agencyName"
                type="text"
                placeholder="Minha Agência de Viagens"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Seu Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
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
                  Criando conta...
                </>
              ) : (
                'Começar Teste Grátis'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground text-center">
            Já tem uma conta?
          </p>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/auth">Fazer login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
