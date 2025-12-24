import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [nichos, setNichos] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nome: "",
    role: "colaborador",
    nicho_id: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsuarios();
    fetchNichos();
  }, []);

  const fetchUsuarios = async () => {
    try {
      // Buscar profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar roles separadamente
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Buscar nichos dos usuários separadamente
      const { data: userNichos, error: nichosError } = await supabase
        .from("user_nichos")
        .select("user_id, nicho_id");

      if (nichosError) throw nichosError;

      // Buscar nomes dos nichos
      const { data: nichosData } = await supabase
        .from("nichos")
        .select("id, nome");

      // Combinar dados
      const combinedUsers = profiles?.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id) || [],
        user_nichos: userNichos?.filter(n => n.user_id === profile.id).map(un => ({
          ...un,
          nichos: nichosData?.find(n => n.id === un.nicho_id) || null
        })) || [],
      })) || [];

      setUsuarios(combinedUsers);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários");
    }
  };

  const fetchNichos = async () => {
    const { data } = await supabase.from("nichos").select("*");
    setNichos(data || []);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Update user role
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", editingUser.id);

        await supabase.from("user_roles").insert([{
          user_id: editingUser.id,
          role: formData.role as "admin" | "colaborador",
        }]);

        // Update nicho - primeiro remove existente
        await supabase
          .from("user_nichos")
          .delete()
          .eq("user_id", editingUser.id);

        // Se colaborador, adiciona novo nicho
        if (formData.role === "colaborador" && formData.nicho_id) {
          await supabase.from("user_nichos").insert({
            user_id: editingUser.id,
            nicho_id: formData.nicho_id,
          });
        }

        toast.success("Usuário atualizado!");
      } else {
        // Criar novo usuário via Edge Function
        const { data, error } = await supabase.functions.invoke("create-user", {
          body: {
            email: formData.email,
            password: formData.password,
            nome: formData.nome,
            role: formData.role,
            nicho_id: formData.role === "colaborador" ? formData.nicho_id : undefined,
          },
        });

        if (error) {
          throw new Error(error.message || "Erro ao criar usuário");
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        toast.success("Usuário criado com sucesso!");
      }

      setDialogOpen(false);
      resetForm();
      fetchUsuarios();
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error);
      toast.error("Erro: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userToDelete.id },
      });

      if (error) {
        throw new Error(error.message || "Erro ao excluir usuário");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("Usuário excluído com sucesso!");
      fetchUsuarios();
    } catch (error: any) {
      console.error("Erro ao excluir usuário:", error);
      toast.error("Erro: " + error.message);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const openDeleteDialog = (user: any) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      nome: "",
      role: "colaborador",
      nicho_id: "",
    });
    setEditingUser(null);
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      nome: user.nome,
      role: user.user_roles?.[0]?.role || "colaborador",
      nicho_id: user.user_nichos?.[0]?.nicho_id || "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciar Usuários</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Editar Usuário" : "Criar Novo Usuário"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>

              {!editingUser && (
                <div>
                  <Label>Senha *</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              )}

              <div>
                <Label>Tipo *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === "colaborador" && (
                <div>
                  <Label>Nicho *</Label>
                  <Select
                    value={formData.nicho_id}
                    onValueChange={(value) => setFormData({ ...formData, nicho_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um nicho" />
                    </SelectTrigger>
                    <SelectContent>
                      {nichos.map((nicho) => (
                        <SelectItem key={nicho.id} value={nicho.id}>
                          {nicho.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : editingUser ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border/50 shadow-premium overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface hover:bg-surface">
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold">Nicho</TableHead>
              <TableHead className="font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado. Crie o primeiro!
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((user) => (
                <TableRow key={user.id} className="hover:bg-surface-hover transition-colors">
                  <TableCell className="font-medium">{user.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="capitalize">
                    {user.user_roles?.[0]?.role || "-"}
                  </TableCell>
                  <TableCell>{user.user_nichos?.[0]?.nichos?.nome || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(user)}
                        className="hover:bg-primary/20"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(user)}
                        className="hover:bg-destructive/20 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.nome}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
