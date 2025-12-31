const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';
const TOKEN_KEY = 'auth_token';

type ApiOptions = RequestInit & { skipAuth?: boolean };

export type AuthPayload = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    phone: string | null;
    isActive: boolean;
    role: 'super_admin' | 'admin' | 'agent';
  };
  profile: {
    id: string;
    agencyId: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    themePreference?: 'light' | 'dark';
  } | null;
  agency: {
    id: string;
    name: string;
    cnpj: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    logoUrl: string | null;
    websiteUrl?: string | null;
    instagramHandle?: string | null;
    isActive: boolean;
  } | null;
};

export const getAuthToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const buildUrl = (path: string) => `${API_BASE_URL.replace(/\/$/, '')}${path}`;

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = options.skipAuth ? null : getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = (payload as any)?.message || response.statusText || 'Erro na requisição';
    throw new Error(message);
  }

  return payload as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<AuthPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    }),
  me: () => apiFetch<AuthPayload>('/auth/me'),
};
