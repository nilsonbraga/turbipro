import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  Tags,
  KanbanSquare,
  Calendar,
  LogOut,
  Plane,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  CheckSquare,
  Compass,
  DollarSign,
  Palette,
  UsersRound,
  Truck,
  Map,
  Bell,
  Settings2,
  Globe,
  CreditCard,
  User,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { useModuleAccess, ModuleKey } from '@/hooks/useModuleAccess';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useThemePreference } from '@/hooks/useThemePreference';

interface NavItem {
  title: string;
  url: string;
  icon: any;
  moduleKey?: ModuleKey;
}

const coreNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, moduleKey: 'dashboard' },
  { title: 'Leads', url: '/leads', icon: KanbanSquare, moduleKey: 'leads' },
  { title: 'Tarefas', url: '/tasks', icon: CheckSquare, moduleKey: 'tasks' },
  { title: 'Calendário', url: '/calendar', icon: Calendar, moduleKey: 'calendar' },
];

const productNavItems: NavItem[] = [
  { title: 'Expedições', url: '/expeditions', icon: Compass, moduleKey: 'expeditions' },
  { title: 'Roteiros', url: '/itineraries', icon: Map, moduleKey: 'itineraries' },
  { title: 'Studio', url: '/studio', icon: Palette, moduleKey: 'studio' },
];

const registerNavItems: NavItem[] = [
  { title: 'Clientes', url: '/clients', icon: Users, moduleKey: 'clients' },
  { title: 'Parceiros', url: '/partners', icon: Handshake, moduleKey: 'partners' },
  { title: 'Fornecedores', url: '/suppliers', icon: Truck, moduleKey: 'suppliers' },
  { title: 'Tags', url: '/tags', icon: Tags, moduleKey: 'tags' },
];

const managementNavItems: NavItem[] = [
  { title: 'Financeiro', url: '/financial', icon: DollarSign, moduleKey: 'financial' },
  { title: 'Time & Operação', url: '/team', icon: UsersRound, moduleKey: 'team' },
];

const communicationNavItems: NavItem[] = [
  { title: 'Email', url: '/email', icon: Mail },
  { title: 'WhatsApp', url: '/whatsapp', icon: MessageSquare },
];

const adminNavItems: NavItem[] = [{ title: 'Agências', url: '/agencies', icon: Building2 }];

const settingsNavItems: NavItem[] = [
  { title: 'Agência', url: '/settings/agency', icon: Building2 },
  { title: 'Perfil', url: '/settings/profile', icon: User },
];

const settingsAdminNavItems: NavItem[] = [{ title: 'Usuários', url: '/settings/users', icon: Users }];
const settingsAllNavItems: NavItem[] = [
  { title: 'Notificações', url: '/settings/notifications', icon: Bell },
  { title: 'Pipeline', url: '/settings/pipeline', icon: Palette },
];
const settingsIntegrationsNavItems: NavItem[] = [{ title: 'Integrações', url: '/settings/integrations', icon: Settings2 }];
const settingsSuperAdminNavItems: NavItem[] = [
  { title: 'Plataforma', url: '/settings/platform', icon: Globe },
  { title: 'Planos & Assinaturas', url: '/settings/plans', icon: CreditCard },
];

const iconMap: Record<string, any> = {
  plane: Plane,
  building2: Building2,
  users: Users,
  handshake: Handshake,
  calendar: Calendar,
  mail: Mail,
  tags: Tags,
  layoutdashboard: LayoutDashboard,
  kanbansquare: KanbanSquare,
  palette: Palette,
};

export function AppSidebar() {
  const { user, profile, agency, isSuperAdmin, role, logout } = useAuth();
  const { settings } = usePlatformSettings();
  const { hasAccess } = useModuleAccess();
  useThemePreference(); // mantém sincronizado, mas força palette abaixo
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = role === 'admin' || isSuperAdmin;
  const platformName = settings.platform_name || 'Tourbine';
  const platformIconKey = (settings.platform_icon || 'plane').toLowerCase();
  const platformIconUrl = settings.platform_icon_url || '/t-logo.png';
  const PlatformIcon = iconMap[platformIconKey] || Plane;

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const filterByAccess = (items: NavItem[]) => items.filter((item) => !item.moduleKey || hasAccess(item.moduleKey));
  const hasCommunicationAccess = hasAccess('communication');

  const renderNavItems = (items: NavItem[]) =>
    filterByAccess(items).map((item) => (
      <NavLink
        key={item.url}
        to={item.url}
        end={item.url === '/'}
        className={cn(
          'group flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-colors duration-200',
          'text-slate-500 hover:text-slate-900 hover:bg-slate-50',
          collapsed && 'justify-center px-2'
        )}
        activeClassName={cn('bg-slate-100 text-slate-900 shadow-none')}
      >
        <item.icon className="w-4 h-4 flex-shrink-0 transition-colors duration-200 text-current" />
        {!collapsed && <span>{item.title}</span>}
      </NavLink>
    ));

  const renderSection = (label: string, items: NavItem[]) => {
    const filtered = filterByAccess(items);
    if (!filtered.length) return null;
    return (
      <>
        <Separator className="my-3 bg-slate-200/40" />
        <p className={cn('px-3 text-[10px] font-medium uppercase tracking-[0.18em] mt-3 pt-2 mb-2 text-slate-400', collapsed && 'hidden')}>
          {label}
        </p>
        {renderNavItems(items)}
      </>
    );
  };

  const buildSettingsItems = () => {
    let items = [...settingsNavItems];
    if (isAdmin) items = [...items, ...settingsAdminNavItems, ...settingsIntegrationsNavItems];
    items = [...items, ...settingsAllNavItems];
    if (isSuperAdmin) items = [...items, ...settingsSuperAdminNavItems];
    return items;
  };

  return (
    <aside
      className={cn(
        "flex flex-col font-['Poppins'] transition-all duration-500 shadow-sm",
        collapsed ? 'w-16' : 'w-64',
        'rounded-2xl bg-white text-slate-900'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4">
        {platformIconUrl ? (
          <img src={platformIconUrl} alt={platformName} className="w-10 h-10 object-contain" />
        ) : (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[hsl(var(--primary-start)/0.2)] text-[hsl(var(--primary-start))]">
            <PlatformIcon className="w-6 h-6" />
          </div>
        )}
        {!collapsed && (
          <div className="flex-1 min-w-0 h-10 flex flex-col justify-center items-start">
            <img
              src="/name-logo.png"
              alt={platformName}
              className="h-6 w-auto max-w-[160px] object-contain block -ml-1"
            />
            {agency && <p className="text-xs leading-tight truncate text-slate-500">{agency.name}</p>}
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {renderNavItems(coreNavItems)}
        {renderSection('Produtos', productNavItems)}
        {renderSection('Cadastros', registerNavItems)}
        {renderSection('Gestão', managementNavItems)}
        {hasCommunicationAccess && renderSection('Comunicação', communicationNavItems)}
        {isSuperAdmin && renderSection('Admin', adminNavItems)}
        {renderSection('Configurações', buildSettingsItems())}
      </nav>

      <div className="p-3 border-t border-slate-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full justify-center transition-colors duration-300 text-slate-500 hover:text-slate-900 hover:bg-slate-50',
            !collapsed && 'justify-start'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="ml-2">Recolher</span>}
        </Button>
      </div>

      <div className={cn('p-3 border-t border-slate-200', collapsed && 'flex flex-col items-center')}>
        <div className={cn('flex items-center gap-3', collapsed && 'flex-col')}>
          <Avatar className="w-9 h-9">
            <AvatarFallback className="text-sm bg-[hsl(var(--primary-start)/0.2)] text-[hsl(var(--primary-start))]">
              {profile?.name ? getInitials(profile.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-slate-900">{profile?.name || 'Usuário'}</p>
              <p className="text-xs truncate text-slate-500">{user?.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="transition-colors duration-300 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
