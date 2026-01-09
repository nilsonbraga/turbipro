import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <User className="w-5 h-5" />
          Perfil
        </h1>
        <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Seu Perfil</CardTitle>
          <CardDescription>Informações pessoais e segurança da conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-200 bg-slate-50">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground bg-slate-100">
                      Foto
                    </div>
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
                  className="h-10 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={user?.email || ''}
                  type="email"
                  disabled
                  className={cn('h-10 bg-slate-100 border-slate-200 text-slate-600')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="h-10 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Esquema de cores</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-9 rounded-full px-4 text-xs font-semibold transition-colors',
                      themePreference === 'light'
                        ? 'bg-[#f06a12] text-white border-transparent'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    )}
                    onClick={() => setThemePreference('light')}
                  >
                    <Sun className="w-4 h-4 mr-2" /> Claro
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-9 rounded-full px-4 text-xs font-semibold transition-colors',
                      themePreference === 'dark'
                        ? 'bg-[#f06a12] text-white border-transparent'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    )}
                    onClick={() => setThemePreference('dark')}
                  >
                    <Moon className="w-4 h-4 mr-2" /> Escuro
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="text-slate-700" />
              <div>
                <h3 className="font-medium text-slate-900">Segurança</h3>
                <p className="text-sm text-muted-foreground">Altere a senha da sua conta</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
              Alterar Senha
            </Button>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-sm">
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
                className="h-10 bg-white border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Senha</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite novamente a nova senha"
                className="h-10 bg-white border-slate-200"
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
