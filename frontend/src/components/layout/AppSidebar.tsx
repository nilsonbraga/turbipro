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
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// Define navigation items with their module keys
interface NavItem {
  title: string;
  url: string;
  icon: any;
  moduleKey?: ModuleKey;
}

// Main navigation - organized logically
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

const adminNavItems: NavItem[] = [
  { title: 'Agências', url: '/agencies', icon: Building2 },
];

// Settings navigation items - separate pages
const settingsNavItems: NavItem[] = [
  { title: 'Agência', url: '/settings/agency', icon: Building2 },
  { title: 'Perfil', url: '/settings/profile', icon: User },
];

const settingsAdminNavItems: NavItem[] = [
  { title: 'Usuários', url: '/settings/users', icon: Users },
];

const settingsAllNavItems: NavItem[] = [
  { title: 'Notificações', url: '/settings/notifications', icon: Bell },
  { title: 'Pipeline', url: '/settings/pipeline', icon: Palette },
];

const settingsIntegrationsNavItems: NavItem[] = [
  { title: 'Integrações', url: '/settings/integrations', icon: Settings2 },
];

const settingsSuperAdminNavItems: NavItem[] = [
  { title: 'Plataforma', url: '/settings/platform', icon: Globe },
  { title: 'Planos & Assinaturas', url: '/settings/plans', icon: CreditCard },
];

// Map of available icons for the platform
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
  const [collapsed, setCollapsed] = useState(false);
  
  const isAdmin = role === 'admin' || isSuperAdmin;

  const platformName = settings.platform_name || 'TravelCRM';
  const platformIconKey = (settings.platform_icon || 'plane').toLowerCase();
  const platformIconUrl = settings.platform_icon_url || agency?.logo_url || null;
  const PlatformIcon = iconMap[platformIconKey] || Plane;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter items based on module access
  const filterByAccess = (items: NavItem[]) => {
    return items.filter(item => !item.moduleKey || hasAccess(item.moduleKey));
  };

  // Check if communication module is accessible
  const hasCommunicationAccess = hasAccess('communication');

  const renderNavItems = (items: NavItem[]) => {
    return filterByAccess(items).map((item) => (
      <NavLink
        key={item.url}
        to={item.url}
        end={item.url === '/'}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
          collapsed && "justify-center px-2"
        )}
        activeClassName="bg-sidebar-accent text-sidebar-foreground"
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span>{item.title}</span>}
      </NavLink>
    ));
  };

  const renderSection = (label: string, items: NavItem[]) => {
    const filteredItems = filterByAccess(items);
    if (filteredItems.length === 0) return null;

    return (
      <>
        <Separator className="my-3 bg-sidebar-border" />
        <p className={cn("px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2", collapsed && "hidden")}>
          {label}
        </p>
        {renderNavItems(items)}
      </>
    );
  };

  // Build settings items based on role
  const buildSettingsItems = () => {
    let items = [...settingsNavItems];
    if (isAdmin) {
      items = [...items, ...settingsAdminNavItems];
    }
    items = [...items, ...settingsAllNavItems];
    if (isAdmin) {
      items = [...items, ...settingsIntegrationsNavItems];
    }
    if (isSuperAdmin) {
      items = [...items, ...settingsSuperAdminNavItems];
    }
    return items;
  };

  return (
    <aside 
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        {platformIconUrl ? (
          <img 
            src={platformIconUrl} 
            alt={platformName} 
            className="w-10 h-10 object-contain"
          />
        ) : (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <PlatformIcon className="w-6 h-6 text-primary-foreground" />
          </div>
        )}
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{platformName}</h1>
            {agency && (
              <p className="text-xs text-sidebar-foreground/70 truncate">{agency.name}</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Core */}
        {renderNavItems(coreNavItems)}

        {/* Products */}
        {renderSection('Produtos', productNavItems)}

        {/* Registers */}
        {renderSection('Cadastros', registerNavItems)}

        {/* Management */}
        {renderSection('Gestão', managementNavItems)}

        {/* Communication */}
        {hasCommunicationAccess && (
          <>
            <Separator className="my-3 bg-sidebar-border" />
            <p className={cn("px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2", collapsed && "hidden")}>
              Comunicação
            </p>
            {communicationNavItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                  collapsed && "justify-center px-2"
                )}
                activeClassName="bg-sidebar-accent text-sidebar-foreground"
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            ))}
          </>
        )}

        {/* Admin */}
        {isSuperAdmin && (
          <>
            <Separator className="my-3 bg-sidebar-border" />
            <p className={cn("px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2", collapsed && "hidden")}>
              Admin
            </p>
            {adminNavItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                  collapsed && "justify-center px-2"
                )}
                activeClassName="bg-sidebar-accent text-sidebar-foreground"
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            ))}
          </>
        )}

        {/* Configuration */}
        <Separator className="my-3 bg-sidebar-border" />
        <p className={cn("px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2", collapsed && "hidden")}>
          Configurações
        </p>
        {buildSettingsItems().map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed && "justify-center px-2"
            )}
            activeClassName="bg-sidebar-accent text-sidebar-foreground"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            !collapsed && "justify-start"
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="ml-2">Recolher</span>}
        </Button>
      </div>

      {/* User profile */}
      <div className={cn("p-3 border-t border-sidebar-border", collapsed && "flex flex-col items-center")}>
        <div className={cn("flex items-center gap-3", collapsed && "flex-col")}>
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {profile?.name ? getInitials(profile.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.name || 'Usuário'}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
