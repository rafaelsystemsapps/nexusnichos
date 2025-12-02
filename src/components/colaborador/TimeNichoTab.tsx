import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Users, Plus, Pencil, Trash2, Phone, Briefcase } from "lucide-react";
import { toast } from "sonner";

interface TimeNichoTabProps {
  nichoId: string;
}

interface MembroTime {
  id: string;
  nome: string;
  funcao: string;
  especialidade: string | null;
  contato: string | null;
  observacoes: string | null;
}

const initialFormData = {
  nome: "",
  funcao: "",
  especialidade: "",
  contato: "",
  observacoes: "",
};

export function TimeNichoTab({ nichoId }: TimeNichoTabProps) {
  const [membros, setMembros] = useState<MembroTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMembro, setSelectedMembro] = useState<MembroTime | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMembros();
  }, [nichoId]);

  const fetchMembros = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("membros_time")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("nome");

      if (error) throw error;
      setMembros(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar membros:", error);
      toast.error("Erro ao carregar membros do time");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedMembro(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (membro: MembroTime) => {
    setSelectedMembro(membro);
    setFormData({
      nome: membro.nome,
      funcao: membro.funcao,
      especialidade: membro.especialidade || "",
      contato: membro.contato || "",
      observacoes: membro.observacoes || "",
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (membro: MembroTime) => {
    setSelectedMembro(membro);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim() || !formData.funcao.trim()) {
      toast.error("Nome e função são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      if (selectedMembro) {
        // Update
        const { error } = await supabase
          .from("membros_time")
          .update({
            nome: formData.nome.trim(),
            funcao: formData.funcao.trim(),
            especialidade: formData.especialidade.trim() || null,
            contato: formData.contato.trim() || null,
            observacoes: formData.observacoes.trim() || null,
          })
          .eq("id", selectedMembro.id);

        if (error) throw error;
        toast.success("Membro atualizado com sucesso");
      } else {
        // Create
        const { error } = await supabase.from("membros_time").insert({
          nicho_id: nichoId,
          nome: formData.nome.trim(),
          funcao: formData.funcao.trim(),
          especialidade: formData.especialidade.trim() || null,
          contato: formData.contato.trim() || null,
          observacoes: formData.observacoes.trim() || null,
        });

        if (error) throw error;
        toast.success("Membro adicionado com sucesso");
      }

      setDialogOpen(false);
      fetchMembros();
    } catch (error: any) {
      console.error("Erro ao salvar membro:", error);
      toast.error("Erro ao salvar membro: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMembro) return;

    try {
      const { error } = await supabase
        .from("membros_time")
        .delete()
        .eq("id", selectedMembro.id);

      if (error) throw error;
      toast.success("Membro removido com sucesso");
      setDeleteDialogOpen(false);
      fetchMembros();
    } catch (error: any) {
      console.error("Erro ao remover membro:", error);
      toast.error("Erro ao remover membro: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Time do Nicho</h2>
          </div>
        </div>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Time</h2>
          <p className="text-sm text-muted-foreground">Membros organizacionais (sem login no sistema)</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Membro
        </Button>
      </div>

      {membros.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              Nenhum membro cadastrado no time.
              <br />
              Adicione membros para organizar sua equipe.
            </p>
            <Button onClick={handleOpenCreate} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Primeiro Membro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {membros.map((membro) => (
            <Card
              key={membro.id}
              className="border-border/50 shadow-premium hover:shadow-premium-lg transition-all duration-200 hover:border-primary/30"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{membro.nome}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(membro)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleOpenDelete(membro)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="w-fit bg-primary/20 text-primary border-0"
                >
                  <Briefcase className="w-3 h-3 mr-1" />
                  {membro.funcao}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {membro.especialidade && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Especialidade:</span>{" "}
                    {membro.especialidade}
                  </p>
                )}
                {membro.contato && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {membro.contato}
                  </p>
                )}
                {membro.observacoes && (
                  <p className="text-sm text-muted-foreground mt-2 pt-2 border-t border-border/50">
                    {membro.observacoes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para criar/editar membro */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedMembro ? "Editar Membro" : "Adicionar Membro"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Nome do membro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="funcao">Função *</Label>
              <Input
                id="funcao"
                value={formData.funcao}
                onChange={(e) =>
                  setFormData({ ...formData, funcao: e.target.value })
                }
                placeholder="Ex: Editor de Vídeo, Roteirista"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="especialidade">Especialidade</Label>
              <Input
                id="especialidade"
                value={formData.especialidade}
                onChange={(e) =>
                  setFormData({ ...formData, especialidade: e.target.value })
                }
                placeholder="Ex: TikTok, Edição Rápida"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contato">Contato</Label>
              <Input
                id="contato"
                value={formData.contato}
                onChange={(e) =>
                  setFormData({ ...formData, contato: e.target.value })
                }
                placeholder="Telefone ou email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                placeholder="Notas adicionais sobre o membro"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : selectedMembro ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{" "}
              <strong>{selectedMembro?.nome}</strong> do time? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
