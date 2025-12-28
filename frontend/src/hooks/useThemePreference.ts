import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useThemePreference() {
  const { profile } = useAuth();

  const theme = useMemo<'light' | 'dark'>(() => {
    const pref = (profile?.theme_preference as 'light' | 'dark' | undefined) || null;
    if (pref === 'dark') return 'dark';
    // fallback para classe global do documento (quando usuário já alternou no dashboard)
    if (document.documentElement.classList.contains('dark')) return 'dark';
    return 'light';
  }, [profile?.theme_preference]);

  return {
    theme,
    isDark: theme === 'dark',
  };
}
