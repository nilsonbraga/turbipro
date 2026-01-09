import { Users } from 'lucide-react';
import { UsersManagementCard } from '@/components/settings/UsersManagementCard';

export default function UsersSettings() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5" />
          Usuários
        </h1>
        <p className="text-sm text-muted-foreground">Gerencie os usuários da sua agência</p>
      </div>

      <UsersManagementCard />
    </div>
  );
}
