import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, DollarSign, User, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export function NichosTab() {
  const [nichos, setNichos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNicho, setEditingNicho] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    observacoes: "",
    financeiro_habilitado: false,
    // Campos do usuário (apenas para criação)
    usuario_nome: "",
    usuario_email: "",
    usuario_senha: "",
  });

  useEffect(() => {
    fetchNichos();
  }, []);

  const fetchNichos = async () => {
    try {
      const { data, error } = await supabase
        .from("nichos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNichos(data || []);
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
        // Apenas atualiza o nicho (não cria usuário ao editar)
        const { error } = await supabase
          .from("nichos")
          .update({
            nome: formData.nome,
            descricao: formData.descricao,
            observacoes: formData.observacoes,
            financeiro_habilitado: formData.financeiro_habilitado,
          })
          .eq("id", editingNicho.id);

        if (error) throw error;
        toast.success("Nicho atualizado!");
      } else {
        // Validar campos do usuário
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

        // 1. Criar o nicho primeiro
        const { data: nichoData, error: nichoError } = await supabase
          .from("nichos")
          .insert({
            nome: formData.nome,
            descricao: formData.descricao,
            observacoes: formData.observacoes,
            financeiro_habilitado: formData.financeiro_habilitado,
          })
          .select()
          .single();

        if (nichoError) throw nichoError;

        // 2. Criar o usuário vinculado ao nicho
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
          // Rollback: deletar o nicho criado
          await supabase.from("nichos").delete().eq("id", nichoData.id);
          throw new Error(userData?.error || userError?.message || "Erro ao criar usuário");
        }

        toast.success(
          `Nicho "${formData.nome}" criado com sucesso!\n\nCredenciais de acesso:\nEmail: ${formData.usuario_email}\nSenha: ${formData.usuario_senha}`,
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

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      observacoes: "",
      financeiro_habilitado: false,
      usuario_nome: "",
      usuario_email: "",
      usuario_senha: "",
    });
    setEditingNicho(null);
  };

  const openEditDialog = (nicho: any) => {
    setEditingNicho(nicho);
    setFormData({
      nome: nicho.nome,
      descricao: nicho.descricao || "",
      observacoes: nicho.observacoes || "",
      financeiro_habilitado: nicho.financeiro_habilitado || false,
      usuario_nome: "",
      usuario_email: "",
      usuario_senha: "",
    });
    setDialogOpen(true);
  };

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
                {editingNicho ? "Editar Nicho" : "Criar Novo Nicho"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dados do Nicho */}
              <div>
                <Label htmlFor="nome">Nome do Nicho *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="financeiro">Módulo Financeiro</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar controle de transações e faturamento
                  </p>
                </div>
                <Switch
                  id="financeiro"
                  checked={formData.financeiro_habilitado}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, financeiro_habilitado: checked })
                  }
                />
              </div>

              {/* Campos do Usuário - apenas ao criar */}
              {!editingNicho && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>Usuário da Workspace</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Crie as credenciais de acesso para este nicho
                    </p>

                    <div>
                      <Label htmlFor="usuario_nome" className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        Nome do Usuário *
                      </Label>
                      <Input
                        id="usuario_nome"
                        value={formData.usuario_nome}
                        onChange={(e) => setFormData({ ...formData, usuario_nome: e.target.value })}
                        placeholder="Nome completo"
                        required={!editingNicho}
                      />
                    </div>

                    <div>
                      <Label htmlFor="usuario_email" className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        Email de Acesso *
                      </Label>
                      <Input
                        id="usuario_email"
                        type="email"
                        value={formData.usuario_email}
                        onChange={(e) => setFormData({ ...formData, usuario_email: e.target.value })}
                        placeholder="email@exemplo.com"
                        required={!editingNicho}
                      />
                    </div>

                    <div>
                      <Label htmlFor="usuario_senha" className="flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        Senha de Acesso *
                      </Label>
                      <Input
                        id="usuario_senha"
                        type="password"
                        value={formData.usuario_senha}
                        onChange={(e) => setFormData({ ...formData, usuario_senha: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                        required={!editingNicho}
                      />
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : editingNicho ? "Atualizar" : "Criar Nicho e Usuário"}
              </Button>
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
            <Card key={nicho.id} className="border-border/50 shadow-premium hover:shadow-premium-lg transition-all duration-200 hover:border-primary/20">
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
              <CardContent>
                {nicho.descricao && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{nicho.descricao}</p>
                )}
                {nicho.financeiro_habilitado && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-primary">
                    <DollarSign className="h-3 w-3" />
                    <span>Módulo Financeiro Ativo</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
