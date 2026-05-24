import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, User, Mail, Lock, UserX, ChevronLeft, ChevronRight, Copy, FlaskRound, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface NichoWithUser {
  id: string;
  nome: string;
  descricao: string | null;
  observacoes: string | null;
  contas_habilitado: boolean;
  applab_habilitado: boolean;
  created_at: string | null;
  updated_at: string | null;
  usuario?: {
    id: string;
    nome: string;
    email: string;
  } | null;
}

export function NichosTab() {
  const [nichos, setNichos] = useState<NichoWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNicho, setEditingNicho] = useState<NichoWithUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; nome: string; nichoNome: string } | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isCopyingCredentials, setIsCopyingCredentials] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    observacoes: "",
    contas_habilitado: true,
    applab_habilitado: false,
    usuario_nome: "",
    usuario_email: "",
    usuario_senha: "",
  });

  useEffect(() => {
    fetchNichos();
  }, []);

  const fetchNichos = async () => {
    try {
      const { data: nichosData, error: nichosError } = await supabase
        .from("nichos")
        .select("*")
        .order("created_at", { ascending: false });

      if (nichosError) throw nichosError;

      const { data: userNichosData, error: userNichosError } = await supabase
        .from("user_nichos")
        .select("nicho_id, user_id");

      if (userNichosError) throw userNichosError;

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome, email");

      if (profilesError) throw profilesError;

      const nichosWithUsers: NichoWithUser[] = (nichosData || []).map((nicho: any) => {
        const userNicho = userNichosData?.find((un) => un.nicho_id === nicho.id);
        const profile = userNicho
          ? profilesData?.find((p) => p.id === userNicho.user_id)
          : null;

        return {
          id: nicho.id,
          nome: nicho.nome,
          descricao: nicho.descricao,
          observacoes: nicho.observacoes,
          contas_habilitado: nicho.contas_habilitado ?? true,
          applab_habilitado: nicho.applab_habilitado ?? false,
          created_at: nicho.created_at,
          updated_at: nicho.updated_at,
          usuario: profile
            ? { id: profile.id, nome: profile.nome, email: profile.email }
            : null,
        };
      });

      setNichos(nichosWithUsers);
    } catch (error: any) {
      toast.error("Erro ao carregar nichos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingNicho) {
        const { error } = await supabase
          .from("nichos")
          .update({
            nome: formData.nome,
            descricao: formData.descricao,
            observacoes: formData.observacoes,
            contas_habilitado: formData.contas_habilitado,
            applab_habilitado: formData.applab_habilitado,
          })
          .eq("id", editingNicho.id);

        if (error) throw error;
        toast.success("Nicho atualizado!");
      } else {
        if (!formData.usuario_nome || !formData.usuario_email || !formData.usuario_senha) {
          toast.error("Preencha todos os campos do usuário da workspace");
          setIsSubmitting(false);
          return;
        }

        if (formData.usuario_senha.length < 6) {
          toast.error("A senha deve ter pelo menos 6 caracteres");
          setIsSubmitting(false);
          return;
        }

        const { data: nichoData, error: nichoError } = await supabase
          .from("nichos")
          .insert({
            nome: formData.nome,
            descricao: formData.descricao,
            observacoes: formData.observacoes,
            contas_habilitado: formData.contas_habilitado,
            applab_habilitado: formData.applab_habilitado,
          })
          .select()
          .single();

        if (nichoError) throw nichoError;

        const { data: userData, error: userError } = await supabase.functions.invoke("create-user", {
          body: {
            email: formData.usuario_email,
            password: formData.usuario_senha,
            nome: formData.usuario_nome,
            role: "colaborador",
            nicho_id: nichoData.id,
          },
        });

        if (userError || userData?.error) {
          await supabase.from("nichos").delete().eq("id", nichoData.id);
          throw new Error(userData?.error || userError?.message || "Erro ao criar usuário");
        }

        toast.success(
          `Nicho "${formData.nome}" criado com sucesso!\n\nEmail: ${formData.usuario_email}\nSenha: ${formData.usuario_senha}`,
          { duration: 10000 }
        );
      }

      setDialogOpen(false);
      resetForm();
      fetchNichos();
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error("Erro: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!editingNicho?.usuario || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("reset-password", {
        body: { user_id: editingNicho.usuario.id, new_password: newPassword },
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Erro ao alterar senha");
      }

      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
    } catch (error: any) {
      toast.error("Erro ao alterar senha: " + error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este nicho? Isso também removerá os usuários vinculados.")) return;

    try {
      const { error } = await supabase.from("nichos").delete().eq("id", id);
      if (error) throw error;
      toast.success("Nicho deletado!");
      fetchNichos();
    } catch (error: any) {
      toast.error("Erro ao deletar: " + error.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userToDelete.id },
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Erro ao excluir usuário");
      }

      toast.success(`Usuário "${userToDelete.nome}" excluído com sucesso!`);
      setUserToDelete(null);
      fetchNichos();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleCopyCredentials = async (nicho: NichoWithUser) => {
    if (!nicho.usuario) return;
    setIsCopyingCredentials(nicho.id);
    const newPass = generatePassword();

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("reset-password", {
        body: { user_id: nicho.usuario.id, new_password: newPass },
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Erro ao gerar nova senha");
      }

      const credentials = `Email: ${nicho.usuario.email}\nSenha: ${newPass}`;
      await navigator.clipboard.writeText(credentials);
      toast.success("Credenciais copiadas! Nova senha gerada.", { duration: 5000 });
    } catch (error: any) {
      toast.error("Erro ao copiar credenciais: " + error.message);
    } finally {
      setIsCopyingCredentials(null);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      observacoes: "",
      contas_habilitado: true,
      applab_habilitado: false,
      usuario_nome: "",
      usuario_email: "",
      usuario_senha: "",
    });
    setEditingNicho(null);
    setCurrentStep(1);
    setNewPassword("");
  };

  const getTotalSteps = () => {
    if (!editingNicho) return 3;
    if (editingNicho.usuario) return 3;
    return 2;
  };

  const canProceed = () => {
    if (currentStep === 1) return formData.nome.trim() !== "";
    if (currentStep === 2) return true;
    if (currentStep === 3 && !editingNicho) {
      return formData.usuario_nome.trim() !== "" &&
             formData.usuario_email.trim() !== "" &&
             formData.usuario_senha.length >= 6;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < getTotalSteps() && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const openEditDialog = (nicho: NichoWithUser) => {
    setEditingNicho(nicho);
    setFormData({
      nome: nicho.nome,
      descricao: nicho.descricao || "",
      observacoes: nicho.observacoes || "",
      contas_habilitado: nicho.contas_habilitado !== false,
      applab_habilitado: nicho.applab_habilitado || false,
      usuario_nome: "",
      usuario_email: "",
      usuario_senha: "",
    });
    setDialogOpen(true);
  };

  if (loading) {
    return <p className="text-muted-foreground">Carregando nichos...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciar Nichos</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Nicho
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingNicho ? "Editar Nicho" : `Criar Novo Nicho - Etapa ${currentStep} de ${getTotalSteps()}`}
              </DialogTitle>
            </DialogHeader>

            <div className="flex gap-2 mb-4">
              {Array.from({ length: getTotalSteps() }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i + 1 <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold">Identificação</h3>
                    <p className="text-sm text-muted-foreground">Defina o nome do nicho</p>
                  </div>
                  <div>
                    <Label htmlFor="nome">Nome do Nicho *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Nicho de Pets, Fitness, etc."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descreva brevemente o nicho"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">Módulos</h3>
                    <p className="text-sm text-muted-foreground">Ative os recursos do nicho</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="contas" className="text-sm flex items-center gap-2">
                          <UserCheck className="h-3 w-3" />
                          Controle de Contas
                        </Label>
                        <p className="text-xs text-muted-foreground">Gerenciamento de redes sociais</p>
                      </div>
                      <Switch
                        id="contas"
                        checked={formData.contas_habilitado}
                        onCheckedChange={(checked) => setFormData({ ...formData, contas_habilitado: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="applab" className="text-sm flex items-center gap-2">
                          <FlaskRound className="h-3 w-3" />
                          AppLab
                        </Label>
                        <p className="text-xs text-muted-foreground">Laboratório operacional de apps</p>
                      </div>
                      <Switch
                        id="applab"
                        checked={formData.applab_habilitado}
                        onCheckedChange={(checked) => setFormData({ ...formData, applab_habilitado: checked })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && !editingNicho && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">Usuário da Workspace</h3>
                    <p className="text-sm text-muted-foreground">Crie as credenciais de acesso</p>
                  </div>
                  <div>
                    <Label htmlFor="usuario_nome" className="flex items-center gap-2">
                      <User className="w-3 h-3" /> Nome do Usuário *
                    </Label>
                    <Input
                      id="usuario_nome"
                      value={formData.usuario_nome}
                      onChange={(e) => setFormData({ ...formData, usuario_nome: e.target.value })}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="usuario_email" className="flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Email de Acesso *
                    </Label>
                    <Input
                      id="usuario_email"
                      type="email"
                      value={formData.usuario_email}
                      onChange={(e) => setFormData({ ...formData, usuario_email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="usuario_senha" className="flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Senha de Acesso *
                    </Label>
                    <Input
                      id="usuario_senha"
                      type="password"
                      value={formData.usuario_senha}
                      onChange={(e) => setFormData({ ...formData, usuario_senha: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && editingNicho && editingNicho.usuario && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">Gerenciar Usuário</h3>
                    <p className="text-sm text-muted-foreground">Altere a senha do usuário vinculado</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4 text-primary" />
                      <span>Usuário Atual</span>
                    </div>
                    <p className="text-sm font-medium">{editingNicho.usuario.nome}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {editingNicho.usuario.email}
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label htmlFor="nova_senha" className="flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Nova Senha
                    </Label>
                    <Input
                      id="nova_senha"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={handleChangePassword}
                      disabled={isChangingPassword || newPassword.length < 6}
                    >
                      {isChangingPassword ? "Alterando..." : "Alterar Senha"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                  </Button>
                )}
                {currentStep < getTotalSteps() ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1"
                    disabled={!canProceed()}
                  >
                    Próximo <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button type="submit" className="flex-1" disabled={isSubmitting || !canProceed()}>
                    {isSubmitting ? "Salvando..." : editingNicho ? "Atualizar" : "Criar Nicho"}
                  </Button>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {nichos.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">
            Nenhum nicho encontrado. Crie o primeiro!
          </p>
        ) : (
          nichos.map((nicho) => (
            <Card key={nicho.id} className="border-border/50 shadow-premium hover:shadow-premium-lg transition-all duration-200 hover:border-primary/20 flex flex-col">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span className="text-lg">{nicho.nome}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(nicho)}
                      className="h-8 w-8 hover:bg-surface-hover"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(nicho.id)}
                      className="h-8 w-8 hover:bg-destructive/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                  {nicho.descricao && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{nicho.descricao}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {nicho.contas_habilitado && (
                      <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                        <UserCheck className="h-3 w-3" />
                        <span>Contas</span>
                      </div>
                    )}
                    {nicho.applab_habilitado && (
                      <div className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full">
                        <FlaskRound className="h-3 w-3" />
                        <span>AppLab</span>
                      </div>
                    )}
                  </div>

                  <Separator />
                  {nicho.usuario ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-primary" />
                        <span>Usuário Vinculado</span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                        <p className="text-sm font-medium">{nicho.usuario.nome}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {nicho.usuario.email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground flex items-center gap-2 py-2">
                      <User className="h-4 w-4" />
                      <span>Nenhum usuário vinculado</span>
                    </div>
                  )}
                </div>

                {nicho.usuario && (
                  <div className="mt-4 pt-4 border-t border-border/30 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleCopyCredentials(nicho)}
                      disabled={isCopyingCredentials === nicho.id}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {isCopyingCredentials === nicho.id ? "Gerando..." : "Copiar Credenciais"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive hover:bg-destructive/10"
                      onClick={() => setUserToDelete({ id: nicho.usuario!.id, nome: nicho.usuario!.nome, nichoNome: nicho.nome })}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Excluir Usuário
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{userToDelete?.nome}</strong> do nicho <strong>{userToDelete?.nichoNome}</strong>?
              <br />
              Esta ação removerá completamente o usuário do sistema e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingUser}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeletingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingUser ? "Excluindo..." : "Excluir Usuário"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
