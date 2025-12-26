import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { User, Save, Shield, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function ProfileSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [profileName, setProfileName] = useState(profile?.name || '');
  const [profilePhone, setProfilePhone] = useState(profile?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || '');
      setProfilePhone(profile.phone || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.id) return;
    
    setIsSaving(true);
    try {
      await apiFetch(`/api/profile/${profile.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="w-6 h-6" />
          Perfil
        </h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seu Perfil</CardTitle>
          <CardDescription>
            Informações pessoais e segurança da conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} type="email" disabled className="bg-muted" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input 
                value={profilePhone} 
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Segurança
            </h3>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
              Alterar Senha
            </Button>
          </div>

          <Separator />

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
