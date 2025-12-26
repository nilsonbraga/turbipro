import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info, ExternalLink } from 'lucide-react';
import { useAgencyResendConfig, ResendConfigInput } from '@/hooks/useAgencyResendConfig';

export function ResendConfigCard() {
  const { config, isLoading, saveConfig, isSaving } = useAgencyResendConfig();

  const [apiKey, setApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');

  useEffect(() => {
    if (config) {
      setFromEmail(config.from_email || '');
      setFromName(config.from_name || '');
    }
  }, [config]);

  const handleSave = () => {
    const data: ResendConfigInput = {
      from_email: fromEmail,
      from_name: fromName,
    };

    if (apiKey) {
      data.api_key = apiKey;
    }

    saveConfig(data);
    setApiKey(''); // Clear API key field after save
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Email (Resend)</CardTitle>
        <CardDescription>
          Configure o Resend para envio de emails da sua agência
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <p className="mb-2">
              Para usar o Resend, você precisa criar uma conta gratuita em{' '}
              <a 
                href="https://resend.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                resend.com <ExternalLink className="h-3 w-3" />
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              1. Crie uma conta no Resend<br />
              2. Adicione e verifique seu domínio em{' '}
              <a 
                href="https://resend.com/domains" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                resend.com/domains
              </a><br />
              3. Crie uma API Key em{' '}
              <a 
                href="https://resend.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                resend.com/api-keys
              </a><br />
              4. Cole a API Key abaixo
            </p>
          </AlertDescription>
        </Alert>

        {config?.is_configured && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <Info className="h-4 w-4 text-green-600" />
            <AlertDescription className="ml-2 text-green-700 dark:text-green-300">
              Resend configurado e pronto para uso!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder={config?.api_key_encrypted ? '••••••••••••••••' : 're_xxxxxxxx'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            {config?.api_key_encrypted && (
              <p className="text-sm text-muted-foreground">
                Deixe em branco para manter a chave atual
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromName">Nome do Remetente</Label>
            <Input
              id="fromName"
              placeholder="Minha Agência de Viagens"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromEmail">Email do Remetente</Label>
            <Input
              id="fromEmail"
              type="email"
              placeholder="contato@seudominio.com"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Use um email do domínio verificado no Resend
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={isSaving || !fromEmail}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configuração'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
