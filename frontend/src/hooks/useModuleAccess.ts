import { useAgencySubscription } from '@/hooks/useAgencySubscription';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useAuth } from '@/contexts/AuthContext';

// Define all available modules
export const ALL_MODULES = [
  { key: 'dashboard', label: 'Dashboard', description: 'Visão geral e métricas' },
  { key: 'leads', label: 'Leads', description: 'Gestão de oportunidades de venda' },
  { key: 'tasks', label: 'Tarefas', description: 'Gerenciamento de tarefas' },
  { key: 'expeditions', label: 'Expedições', description: 'Grupos e expedições' },
  { key: 'itineraries', label: 'Roteiros', description: 'Roteiros personalizados' },
  { key: 'studio', label: 'Studio', description: 'Criação de artes e materiais' },
  { key: 'clients', label: 'Clientes', description: 'Cadastro de clientes' },
  { key: 'partners', label: 'Parceiros', description: 'Cadastro de parceiros' },
  { key: 'suppliers', label: 'Fornecedores', description: 'Cadastro de fornecedores' },
  { key: 'tags', label: 'Tags', description: 'Gerenciamento de tags' },
  { key: 'financial', label: 'Financeiro', description: 'Controle financeiro' },
  { key: 'team', label: 'Time & Operação', description: 'Gestão de equipe' },
  { key: 'calendar', label: 'Calendário', description: 'Agenda e eventos' },
  { key: 'communication', label: 'Comunicação', description: 'Email e WhatsApp' },
] as const;

export type ModuleKey = typeof ALL_MODULES[number]['key'];

export function useModuleAccess() {
  const { isSuperAdmin, agency } = useAuth();
  const { subscription, isLoading: isLoadingSubscription } = useAgencySubscription();
  const { plans, isLoading: isLoadingPlans } = useSubscriptionPlans();

  // Super admin always has access to all modules
  if (isSuperAdmin) {
    return {
      hasAccess: () => true,
      allowedModules: ALL_MODULES.map(m => m.key),
      isLoading: false,
    };
  }

  // Find the agency's current plan
  const currentPlan = plans.find(p => p.id === subscription?.plan_id);
  
  // Get allowed modules from the plan
  const allowedModules: ModuleKey[] = currentPlan?.modules as ModuleKey[] || [];

  const hasAccess = (moduleKey: ModuleKey): boolean => {
    // If no plan or modules not set, allow all (fallback for existing agencies)
    if (!currentPlan || !currentPlan.modules || currentPlan.modules.length === 0) {
      return true;
    }
    return allowedModules.includes(moduleKey);
  };

  return {
    hasAccess,
    allowedModules,
    isLoading: isLoadingSubscription || isLoadingPlans,
  };
}
