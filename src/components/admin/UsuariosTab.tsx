import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";
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

  useEffect(() => {
    fetchUsuarios();
    fetchNichos();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles(role),
          user_nichos(nicho_id, nichos(nome))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsuarios(profiles || []);
    } catch (error: any) {
      toast.error("Erro ao carregar usuários");
    }
  };

  const fetchNichos = async () => {
    const { data } = await supabase.from("nichos").select("*");
    setNichos(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

        // Update nicho if colaborador
        if (formData.role === "colaborador" && formData.nicho_id) {
          await supabase
            .from("user_nichos")
            .delete()
            .eq("user_id", editingUser.id);

          await supabase.from("user_nichos").insert({
            user_id: editingUser.id,
            nicho_id: formData.nicho_id,
          });
        }

        toast.success("Usuário atualizado!");
      } else {
        // Create new user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { nome: formData.nome },
          },
        });

        if (authError) throw authError;

        if (authData.user) {
          // Add role
          await supabase.from("user_roles").insert([{
            user_id: authData.user.id,
            role: formData.role as "admin" | "colaborador",
          }]);

          // Add nicho if colaborador
          if (formData.role === "colaborador" && formData.nicho_id) {
            await supabase.from("user_nichos").insert({
              user_id: authData.user.id,
              nicho_id: formData.nicho_id,
            });
          }
        }

        toast.success("Usuário criado!");
      }

      setDialogOpen(false);
      resetForm();
      fetchUsuarios();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    }
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

              <Button type="submit" className="w-full">
                {editingUser ? "Atualizar" : "Criar"}
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
            {usuarios.map((user) => (
              <TableRow key={user.id} className="hover:bg-surface-hover transition-colors">
                <TableCell className="font-medium">{user.nome}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="capitalize">
                  {user.user_roles?.[0]?.role || "-"}
                </TableCell>
                <TableCell>{user.user_nichos?.[0]?.nichos?.nome || "-"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(user)}
                    className="hover:bg-primary/20"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
