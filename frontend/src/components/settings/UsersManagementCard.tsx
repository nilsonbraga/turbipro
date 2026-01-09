import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useAgencyUsers, AgencyUser } from '@/hooks/useAgencyUsers';
import { useCollaborators } from '@/hooks/useCollaborators';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, Users, Trash2, Shield, User, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAgencies } from '@/hooks/useAgencies';

export function UsersManagementCard() {
  const { agencies } = useAgencies();
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');

  const { users, isLoading, createUser, updateUserRole, deleteUser, isDeleting, isCreating } = useAgencyUsers(selectedAgencyId || null);
  const { collaborators, isLoading: loadingCollaborators } = useCollaborators({}, selectedAgencyId || null);
  const { user: currentUser, agency, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AgencyUser | null>(null);
  const [userToEdit, setUserToEdit] = useState<AgencyUser | null>(null);

  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'agent' | 'super_admin'>('agent');

  // Get list of user_ids that already have access
  const existingUserIds = users.map(u => u.id);
  
  // Filter collaborators that don't have access yet (user_id not in existing users)
  const availableCollaborators = collaborators.filter(c => 
    c.email && (!c.user_id || !existingUserIds.includes(c.user_id))
  );

  const handleOpenDialog = () => {
    setSelectedCollaboratorId('');
    setPassword('');
    setRole('agent');
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (agencyUser: AgencyUser) => {
    setUserToEdit(agencyUser);
    setRole(agencyUser.role);
    setEditDialogOpen(true);
  };

  const handleCreateUser = async () => {
    const targetAgencyId = isSuperAdmin ? selectedAgencyId || agency?.id : agency?.id;
    if (!selectedCollaboratorId || !targetAgencyId) {
      toast({ title: 'Selecione a agência e o colaborador', variant: 'destructive' });
      return;
    }

    const selectedCollaborator = collaborators.find(c => c.id === selectedCollaboratorId);
    if (!selectedCollaborator || !selectedCollaborator.email) {
      toast({ title: 'Colaborador inválido', description: 'O colaborador precisa ter um email cadastrado.', variant: 'destructive' });
      return;
    }

    try {
      await createUser({
        email: selectedCollaborator.email,
        password,
        name: selectedCollaborator.name,
        role,
        collaborator_id: selectedCollaborator.id,
      });

      queryClient.invalidateQueries({ queryKey: ['agency-users'] });
      queryClient.invalidateQueries({ queryKey: ['collaborators'] });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Erro ao criar usuário', description: err.message, variant: 'destructive' });
    }
  };

  const handleEditUser = () => {
    if (userToEdit) {
      updateUserRole({ userId: userToEdit.id, role });
      setEditDialogOpen(false);
      setUserToEdit(null);
    }
  };

  const handleDeleteClick = (user: AgencyUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleRoleChange = (userId: string, newRole: 'admin' | 'agent' | 'super_admin') => {
    updateUserRole({ userId, role: newRole });
  };

  if (isLoading || loadingCollaborators) {
    return (
      <Card className="rounded-2xl border-0 shadow-none bg-white">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-2xl border-0 shadow-none bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Usuários da Agência
              </CardTitle>
              <CardDescription>
                Gerencie os usuários que têm acesso à sua agência
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isSuperAdmin && (
                <Select
                  value={selectedAgencyId || 'all'}
                  onValueChange={(val) => setSelectedAgencyId(val === 'all' ? '' : val)}
                >
                  <SelectTrigger className="w-[220px] h-9 bg-white border-slate-200">
                    <SelectValue placeholder="Filtrar por agência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as agências</SelectItem>
                    {agencies.map((ag) => (
                      <SelectItem key={ag.id} value={ag.id}>
                        {ag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={handleOpenDialog} disabled={!isSuperAdmin && !agency}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum usuário cadastrado além de você.
            </p>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wide text-slate-500">Nome</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-slate-500">Email</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-slate-500">Perfil</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((agencyUser, index) => (
                  <TableRow key={agencyUser.id} className={index % 2 === 0 ? 'bg-slate-50/60 hover:bg-slate-50' : 'hover:bg-slate-50'}>
                    <TableCell className="font-medium">
                      {agencyUser.name || 'Sem nome'}
                    </TableCell>
                    <TableCell>{agencyUser.email}</TableCell>
                    <TableCell>
                      <Select
                        value={agencyUser.role}
                        onValueChange={(value: 'admin' | 'agent' | 'super_admin') =>
                          handleRoleChange(agencyUser.id, value)
                        }
                        disabled={!isSuperAdmin && agencyUser.role === 'super_admin'}
                      >
                        <SelectTrigger className="w-[150px] h-9 bg-white border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {isSuperAdmin && (
                            <SelectItem value="super_admin">
                              <div className="flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                Super Admin
                              </div>
                            </SelectItem>
                          )}
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="w-3 h-3" />
                              Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="agent">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3" />
                              Agente
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditDialog(agencyUser)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {agencyUser.id !== currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(agencyUser)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog - Select from Collaborators */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Selecionar Colaborador</Label>
              <Select value={selectedCollaboratorId} onValueChange={setSelectedCollaboratorId}>
                <SelectTrigger className="h-10 bg-white border-slate-200">
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {availableCollaborators.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhum colaborador disponível
                    </div>
                  ) : (
                    availableCollaborators.map((collab) => (
                      <SelectItem key={collab.id} value={collab.id}>
                        <div className="flex flex-col">
                          <span>{collab.name}</span>
                          <span className="text-xs text-muted-foreground">{collab.email}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {availableCollaborators.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Todos os colaboradores já possuem acesso. Cadastre novos colaboradores em "Time & Operação" primeiro.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Senha Inicial</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="h-10 bg-white border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select value={role} onValueChange={(v: 'admin' | 'agent') => setRole(v)}>
                <SelectTrigger className="h-10 bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Admin - Acesso completo
                    </div>
                  </SelectItem>
                  <SelectItem value="agent">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Agente - Gerenciar propostas
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={isCreating || !selectedCollaboratorId || password.length < 6}
            >
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={userToEdit?.name || ''} disabled className="h-10 bg-slate-100 border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={userToEdit?.email || ''} disabled className="h-10 bg-slate-100 border-slate-200" />
            </div>
            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select value={role} onValueChange={(v: 'admin' | 'agent') => setRole(v)}>
                <SelectTrigger className="h-10 bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Admin - Acesso completo
                    </div>
                  </SelectItem>
                  <SelectItem value="agent">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Agente - Gerenciar propostas
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{userToDelete?.name || userToDelete?.email}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
