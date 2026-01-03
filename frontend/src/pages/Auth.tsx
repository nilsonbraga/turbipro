import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { SignInPage, Testimonial } from '@/components/ui/sign-in';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { settings } = usePlatformSettings();
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const platformName = settings.platform_name || 'Tourbine';

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');
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

  const testimonials: Testimonial[] = [
    {
      avatarSrc: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=facearea&facepad=2&q=80',
      name: 'Marina Costa',
      handle: '@marinaviagens',
      text: 'Centralizamos vendas, propostas e financeiro sem perder o ritmo.',
    },
    {
      avatarSrc: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=facearea&facepad=2&q=80',
      name: 'Lucas Oliveira',
      handle: '@lucastrips',
      text: 'Menos planilhas e mais controle da operação completa.',
    },
    {
      avatarSrc: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=facearea&facepad=2&q=80',
      name: 'Fernanda Lima',
      handle: '@fernandatours',
      text: 'Tudo conectado: vendas, comissões e operação em um só lugar.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <SignInPage
        title={
          <span className="inline-flex items-center gap-3">
            <img src="/name-logo.png" alt={platformName} className="h-10 w-auto" />
            <span className="sr-only">{platformName}</span>
          </span>
        }
        description="Centralize operações e impulsiona a sua agência"
        heroImageSrc="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=2160&q=80"
        testimonials={testimonials}
        onSignIn={handleLogin}
        onGoogleSignIn={() =>
          toast({
            title: 'Em breve',
            description: 'Login com Google será liberado em breve.',
          })
        }
        onResetPassword={() =>
          toast({
            title: 'Recuperação de senha',
            description: 'Fale com o suporte para redefinir sua senha.',
          })
        }
        onCreateAccount={() => {
          if (trialEnabled) {
            navigate('/registrar');
            return;
          }
          navigate('/planos');
        }}
      />
      {trialEnabled && (
        <p className="text-center text-sm text-muted-foreground pb-6">
          Teste grátis por {trialDays} dias disponível para novas agências.
        </p>
      )}
    </div>
  );
}
