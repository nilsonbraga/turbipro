import { useState, useEffect } from 'react';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, CreditCard, Eye, EyeOff } from 'lucide-react';

export function StripeConfigCard() {
  const { settings, updateSetting, isUpdating } = usePlatformSettings();
  const [stripeKey, setStripeKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setStripeKey(settings.stripe_secret_key || '');
  }, [settings.stripe_secret_key]);

  const handleSave = () => {
    updateSetting({ key: 'stripe_secret_key', value: stripeKey });
  };

  const isConfigured = !!settings.stripe_secret_key && settings.stripe_secret_key.startsWith('sk_');

  return (
    <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-5 h-5" />
              Configuração do Stripe
            </CardTitle>
            <CardDescription>
              Configure a chave secreta do Stripe para processamento de pagamentos
            </CardDescription>
          </div>
          <Badge variant={isConfigured ? 'default' : 'secondary'}>
            {isConfigured ? 'Configurado' : 'Não configurado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="stripeKey">Chave Secreta do Stripe</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="stripeKey"
                type={showKey ? 'text' : 'password'}
                value={stripeKey}
                onChange={(e) => setStripeKey(e.target.value)}
                placeholder="sk_live_..."
                className="h-10 bg-white border-slate-200 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Encontre sua chave secreta em{' '}
            <a 
              href="https://dashboard.stripe.com/apikeys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              dashboard.stripe.com/apikeys
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
