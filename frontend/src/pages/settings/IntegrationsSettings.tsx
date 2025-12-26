import { Settings2 } from 'lucide-react';
import { ResendConfigCard } from '@/components/settings/ResendConfigCard';

export default function IntegrationsSettings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings2 className="w-6 h-6" />
          Integrações
        </h1>
        <p className="text-muted-foreground">Configure integrações com serviços externos</p>
      </div>

      <ResendConfigCard />
    </div>
  );
}
