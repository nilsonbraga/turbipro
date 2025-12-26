import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, setAuthToken, getAuthToken, AuthPayload } from '@/lib/api';

type AppRole = 'super_admin' | 'admin' | 'agent';

interface Profile {
  id: string;
  agency_id: string | null;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  theme_preference?: 'light' | 'dark';
}

interface Agency {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
}

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  role: AppRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  profile: Profile | null;
  agency: Agency | null;
  role: AppRole | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'super_admin' || role === 'admin';

  const mapProfile = (profilePayload: AuthPayload['profile']): Profile | null => {
    if (!profilePayload) return null;
    return {
      id: profilePayload.id,
      agency_id: profilePayload.agencyId,
      name: profilePayload.name,
      email: profilePayload.email,
      avatar_url: profilePayload.avatarUrl,
      phone: profilePayload.phone,
      theme_preference: (profilePayload as any).themePreference ?? (profilePayload as any).theme_preference,
    };
  };

  const mapAgency = (agencyPayload: AuthPayload['agency']): Agency | null => {
    if (!agencyPayload) return null;
    return {
      id: agencyPayload.id,
      name: agencyPayload.name,
      cnpj: agencyPayload.cnpj,
      email: agencyPayload.email,
      phone: agencyPayload.phone,
      address: agencyPayload.address,
      logo_url: agencyPayload.logoUrl,
      is_active: agencyPayload.isActive,
    };
  };

  const applyAuthPayload = (payload: AuthPayload) => {
    setAuthToken(payload.token);
    setToken(payload.token);
    setUser({
      id: payload.user.id,
      email: payload.user.email,
      name: payload.user.name,
      avatar_url: payload.user.avatarUrl,
      phone: payload.user.phone,
      is_active: payload.user.isActive,
      role: payload.user.role,
    });
    setRole(payload.user.role);
    setProfile(mapProfile(payload.profile));
    setAgency(mapAgency(payload.agency));
  };

  const refreshProfile = async () => {
    const currentToken = getAuthToken();
    if (!currentToken) return;
    const data = await authApi.me();
    applyAuthPayload(data);
  };

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    applyAuthPayload(data);
  };

  const logout = async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    setProfile(null);
    setAgency(null);
    setRole(null);
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const existingToken = getAuthToken();
      if (!existingToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const data = await authApi.me();
        if (!isMounted) return;
        applyAuthPayload(data);
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error);
        if (isMounted) {
          await logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // aplica classe global de tema conforme preferência do perfil
  useEffect(() => {
    const theme = (profile?.theme_preference as 'light' | 'dark' | undefined) || 'light';
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [profile?.theme_preference]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      profile, 
      agency, 
      role, 
      isLoading, 
      isSuperAdmin, 
      isAdmin, 
      login,
      logout,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
