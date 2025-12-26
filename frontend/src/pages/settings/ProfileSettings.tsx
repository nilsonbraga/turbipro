import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { User, Save, Shield, Loader2, Sun, Moon, Upload } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ProfileSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [profileName, setProfileName] = useState(profile?.name || '');
  const [profilePhone, setProfilePhone] = useState(profile?.phone || '');
  const [themePreference, setThemePreference] = useState<'dark' | 'light'>(
    (profile?.theme_preference as 'dark' | 'light' | undefined) || 'dark'
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || '');
      setProfilePhone(profile.phone || '');
      setThemePreference((profile.theme_preference as 'dark' | 'light' | undefined) || 'dark');
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile]);

  const isDark = themePreference === 'dark';
  const surfaceCard = useMemo(
    () => (isDark ? 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white' : 'bg-white text-slate-900'),
    [isDark]
  );
  const subtleCard = isDark ? 'bg-white/5 border border-emerald-500/20' : 'bg-emerald-50/80 border border-emerald-100';

  const handleSave = async () => {
    if (!profile?.id) return;

    setIsSaving(true);
    try {
      await apiFetch(`/api/profile/${profile.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          themePreference,
          avatarUrl: avatarFile ?? avatarPreview,
          updatedAt: new Date().toISOString(),
        }),
      });
      toast({ title: 'Perfil atualizado com sucesso!' });
      await refreshProfile();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }

    setIsChangingPassword(true);
    try {
      if (!user?.id) throw new Error('Usuário não encontrado');
      await apiFetch(`/auth/users/${user.id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password: newPassword }),
      });

      toast({ title: 'Senha alterada com sucesso!' });
      setPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ title: 'Erro ao alterar senha', description: error.message, variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarChange = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setAvatarFile(result);
    };
    reader.readAsDataURL(file);
  };

  // Pré-visualiza o tema localmente enquanto o usuário alterna
  useEffect(() => {
    const root = document.documentElement;
    if (themePreference === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themePreference]);

  return (
    <div className={`p-6 space-y-6 ${isDark ? 'bg-[#0c1613]' : 'bg-emerald-50/40'}`}>
      <div className={`rounded-3xl border ${isDark ? 'border-emerald-500/20' : 'border-emerald-100'} ${surfaceCard} p-6 shadow-xl`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="w-6 h-6" />
              Perfil
            </h1>
            <p className={isDark ? 'text-white/70' : 'text-slate-600'}>Gerencie suas informações pessoais</p>
          </div>
        </div>
      </div>

      <Card className={`border ${isDark ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-emerald-950' : 'border-emerald-100 bg-white'}`}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : 'text-slate-900'}>Seu Perfil</CardTitle>
          <CardDescription className={isDark ? 'text-white/70' : ''}>Informações pessoais e segurança da conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-20 h-20 rounded-full overflow-hidden border-2 ${isDark ? 'border-emerald-400/60' : 'border-emerald-300'}`}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground bg-muted">Foto</div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Foto de perfil</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Enviar foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                    />
                  </label>
                </Button>
                {avatarPreview && (
                  <Button variant="ghost" size="sm" onClick={() => { setAvatarPreview(null); setAvatarFile(null); }}>
                    Remover
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Use uma imagem quadrada para melhor resultado.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} type="email" disabled className={cn('bg-muted', isDark && 'bg-white/10 text-white/80')} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className={isDark ? 'bg-white/5 border-white/10 text-white' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Esquema de cores</Label>
              <div className={`flex rounded-lg p-2 border ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-emerald-50/70'}`}>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    'flex-1 border transition-colors',
                    themePreference === 'light'
                      ? 'bg-white text-emerald-700 border-emerald-200'
                      : isDark
                        ? 'text-white border-transparent hover:bg-white/10'
                        : 'text-emerald-800 border-transparent hover:bg-emerald-100'
                  )}
                  onClick={() => setThemePreference('light')}
                >
                  <Sun className="w-4 h-4 mr-2" /> Claro
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    'flex-1 border transition-colors',
                    themePreference === 'dark'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : isDark
                        ? 'text-white border-transparent hover:bg-white/10'
                        : 'text-emerald-800 border-transparent hover:bg-emerald-100'
                  )}
                  onClick={() => setThemePreference('dark')}
                >
                  <Moon className="w-4 h-4 mr-2" /> Escuro
                </Button>
              </div>
            </div>
          </div>

          <Separator className={isDark ? 'border-white/10' : ''} />

          <div className={`${subtleCard} rounded-xl p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />
                <div>
                  <h3 className="font-medium">Segurança</h3>
                  <p className="text-sm text-muted-foreground">Altere a senha da sua conta</p>
                </div>
              </div>
              <Button variant={isDark ? 'secondary' : 'outline'} onClick={() => setPasswordDialogOpen(true)}>
                Alterar Senha
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-400/60"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Senha</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite novamente a nova senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword || !newPassword || !confirmPassword}>
              {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Alterar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
