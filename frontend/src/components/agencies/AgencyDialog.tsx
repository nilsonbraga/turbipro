import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, Key, Users, CreditCard } from 'lucide-react';
import { Agency, AgencyInput, CreateAgencyWithUserInput } from '@/hooks/useAgencies';
import { useSuperAdminAgencyUsers, AgencyUser } from '@/hooks/useSuperAdminAgencyUsers';
import { AgencySubscriptionTab } from './AgencySubscriptionTab';
import { AgencySubscription } from '@/hooks/useAgencySubscription';

interface AgencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agency?: Agency | null;
  subscription?: AgencySubscription | null;
  onSubmit: (data: CreateAgencyWithUserInput & { id?: string }) => void;
  isLoading?: boolean;
}

export function AgencyDialog({ open, onOpenChange, agency, subscription, onSubmit, isLoading }: AgencyDialogProps) {
  const [formData, setFormData] = useState<AgencyInput>({
    name: '',
    cnpj: '',
    phone: '',
    email: '',
    address: '',
    is_active: true,
  });

  // New user form for creating agency
  const [newAdminUser, setNewAdminUser] = useState({
    name: '',
    email: '',
    password: '',
  });

  // User management state
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'agent' as 'super_admin' | 'admin' | 'agent' });
  const [userToDelete, setUserToDelete] = useState<AgencyUser | null>(null);
  const [userToChangePassword, setUserToChangePassword] = useState<AgencyUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const {
    users,
    isLoading: isLoadingUsers,
    createUser,
    updateRole,
    deleteUser,
    updatePassword,
    isCreating: isCreatingUser,
    isDeleting,
    isUpdatingPassword,
  } = useSuperAdminAgencyUsers(agency?.id ?? null);

  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name,
        cnpj: agency.cnpj || '',
        phone: agency.phone || '',
        email: agency.email || '',
        address: agency.address || '',
        is_active: agency.is_active,
      });
    } else {
      setFormData({
        name: '',
        cnpj: '',
        phone: '',
        email: '',
        address: '',
        is_active: true,
      });
      setNewAdminUser({ name: '', email: '', password: '' });
    }
    setShowNewUserForm(false);
    setNewUser({ name: '', email: '', password: '', role: 'agent' });
  }, [agency, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (agency) {
      onSubmit({ ...formData, id: agency.id });
    } else {
      // Include admin user data if provided
      const submitData: CreateAgencyWithUserInput = { ...formData };
      if (newAdminUser.email && newAdminUser.password && newAdminUser.name) {
        submitData.adminUser = {
          name: newAdminUser.name,
          email: newAdminUser.email,
          password: newAdminUser.password,
        };
      }
      onSubmit(submitData);
    }
    onOpenChange(false);
  };

  const handleCreateUser = async () => {
    if (!agency?.id || !newUser.email || !newUser.password || !newUser.name) return;

    try {
      await createUser({
        email: newUser.email,
        password: newUser.password,
        name: newUser.name,
        role: newUser.role,
        agency_id: agency.id,
      });
      setNewUser({ name: '', email: '', password: '', role: 'agent' });
      setShowNewUserForm(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const handleUpdatePassword = async () => {
    if (!userToChangePassword || !newPassword) return;

    try {
      await updatePassword({ userId: userToChangePassword.id, password: newPassword });
      setUserToChangePassword(null);
      setNewPassword('');
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden">
          <div className="max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-100 bg-gradient-to-br from-[#fff1e0] via-white to-[#fef5e9]">
              <DialogHeader className="p-6 space-y-2">
                <DialogTitle className="text-2xl font-semibold text-slate-900">
                  {agency ? 'Editar Agência' : 'Nova Agência'}
                </DialogTitle>
                <p className="text-sm text-slate-600">
                  {agency
                    ? 'Atualize os dados, usuários e assinatura da agência.'
                    : 'Cadastre uma nova agência e, se quiser, crie o usuário administrador.'}
                </p>
              </DialogHeader>
            </div>

            <div className="p-6">
              {agency ? (
                <Tabs defaultValue="info" className="w-full">
                <TabsList className="flex flex-wrap items-center justify-start gap-4 bg-transparent p-0 border-b border-slate-200 w-full rounded-none h-auto">
                  <TabsTrigger
                    value="info"
                    className="rounded-none px-1 pb-3 text-sm font-semibold text-slate-500 transition-colors border-b-2 border-transparent shadow-none data-[state=active]:text-[#f06a12] data-[state=active]:border-[#f06a12] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Informações
                  </TabsTrigger>
                  <TabsTrigger
                    value="users"
                    className="flex items-center gap-2 rounded-none px-1 pb-3 text-sm font-semibold text-slate-500 transition-colors border-b-2 border-transparent shadow-none data-[state=active]:text-[#f06a12] data-[state=active]:border-[#f06a12] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <Users className="w-4 h-4" />
                    Usuários ({users.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="subscription"
                    className="flex items-center gap-2 rounded-none px-1 pb-3 text-sm font-semibold text-slate-500 transition-colors border-b-2 border-transparent shadow-none data-[state=active]:text-[#f06a12] data-[state=active]:border-[#f06a12] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <CreditCard className="w-4 h-4" />
                    Assinatura
                  </TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="mt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
                        <CardContent className="p-5 space-y-4">
                          <AgencyFormFields formData={formData} setFormData={setFormData} />
                        </CardContent>
                      </Card>
                      <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Salvar
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>

                  <TabsContent value="users" className="mt-6 space-y-4">
                    <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm text-muted-foreground">
                            Gerencie os usuários desta agência
                          </p>
                          <Button size="sm" onClick={() => setShowNewUserForm(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Usuário
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {showNewUserForm && (
                      <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
                        <CardContent className="p-5 space-y-4">
                          <h4 className="font-medium">Novo Usuário</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Nome *</Label>
                              <Input
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                placeholder="Nome completo"
                                className="h-10 bg-white border-slate-200"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Email *</Label>
                              <Input
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder="email@exemplo.com"
                                className="h-10 bg-white border-slate-200"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Senha *</Label>
                              <Input
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                placeholder="Mínimo 6 caracteres"
                                className="h-10 bg-white border-slate-200"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Perfil</Label>
                              <Select
                                value={newUser.role}
                                onValueChange={(value: 'super_admin' | 'admin' | 'agent') => setNewUser({ ...newUser, role: value })}
                              >
                                <SelectTrigger className="h-10 bg-white border-slate-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="super_admin">Super Administrador</SelectItem>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                  <SelectItem value="agent">Vendedor</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => setShowNewUserForm(false)}>
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleCreateUser}
                              disabled={isCreatingUser || !newUser.email || !newUser.password || !newUser.name || newUser.password.length < 6}
                            >
                              {isCreatingUser && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Criar Usuário
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {isLoadingUsers ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : users.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum usuário cadastrado nesta agência
                      </div>
                    ) : (
                      <Card className="rounded-2xl border-0 shadow-none bg-white overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-50/80">
                            <TableRow>
                              <TableHead className="text-xs uppercase tracking-wide text-slate-500">Usuário</TableHead>
                              <TableHead className="text-xs uppercase tracking-wide text-slate-500">Perfil</TableHead>
                              <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.map((user, index) => (
                              <TableRow key={user.id} className={index % 2 === 0 ? 'bg-slate-50/60 hover:bg-slate-50' : 'hover:bg-slate-50'}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{user.name || 'Sem nome'}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={user.role}
                                    onValueChange={(value: 'super_admin' | 'admin' | 'agent') => updateRole({ userId: user.id, role: value })}
                                  >
                                    <SelectTrigger className="w-[160px] h-9 bg-white border-slate-200">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="super_admin">Super Admin</SelectItem>
                                      <SelectItem value="admin">Administrador</SelectItem>
                                      <SelectItem value="agent">Vendedor</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setUserToChangePassword(user)}
                                      title="Alterar senha"
                                    >
                                      <Key className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setUserToDelete(user)}
                                      className="text-destructive hover:text-destructive"
                                      title="Remover usuário"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="subscription" className="mt-6">
                    <AgencySubscriptionTab agencyId={agency.id} subscription={subscription} />
                  </TabsContent>
                </Tabs>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
                    <CardContent className="p-5 space-y-4">
                      <h3 className="font-medium text-sm text-muted-foreground">Dados da Agência</h3>
                      <AgencyFormFields formData={formData} setFormData={setFormData} />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
                    <CardContent className="p-5 space-y-4">
                      <h3 className="font-medium text-sm text-muted-foreground">
                        Usuário Administrador (opcional)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Crie um usuário administrador para esta agência
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="admin-name">Nome</Label>
                          <Input
                            id="admin-name"
                            value={newAdminUser.name}
                            onChange={(e) => setNewAdminUser({ ...newAdminUser, name: e.target.value })}
                            placeholder="Nome do administrador"
                            className="h-10 bg-white border-slate-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-email">Email</Label>
                          <Input
                            id="admin-email"
                            type="email"
                            value={newAdminUser.email}
                            onChange={(e) => setNewAdminUser({ ...newAdminUser, email: e.target.value })}
                            placeholder="admin@agencia.com"
                            className="h-10 bg-white border-slate-200"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-password">Senha</Label>
                        <Input
                          id="admin-password"
                          type="password"
                          value={newAdminUser.password}
                          onChange={(e) => setNewAdminUser({ ...newAdminUser, password: e.target.value })}
                          placeholder="Mínimo 6 caracteres"
                          className="h-10 bg-white border-slate-200"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Criar
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o usuário "{userToDelete?.name || userToDelete?.email}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <Dialog open={!!userToChangePassword} onOpenChange={() => { setUserToChangePassword(null); setNewPassword(''); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Defina uma nova senha para {userToChangePassword?.name || userToChangePassword?.email}
            </p>
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUserToChangePassword(null); setNewPassword(''); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdatePassword}
              disabled={isUpdatingPassword || newPassword.length < 6}
            >
              {isUpdatingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AgencyFormFields({
  formData,
  setFormData,
}: {
  formData: AgencyInput;
  setFormData: (data: AgencyInput) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="h-10 bg-white border-slate-200"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input
          id="cnpj"
          value={formData.cnpj}
          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
          className="h-10 bg-white border-slate-200"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="h-10 bg-white border-slate-200"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="h-10 bg-white border-slate-200"
        />
      </div>
    </div>
      <div className="space-y-2">
      <Label htmlFor="address">Endereço</Label>
      <Input
        id="address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        className="h-10 bg-white border-slate-200"
      />
    </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Ativa</Label>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>
    </>
  );
}
