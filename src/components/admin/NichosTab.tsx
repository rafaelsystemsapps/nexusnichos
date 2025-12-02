import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function NichosTab() {
  const [nichos, setNichos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNicho, setEditingNicho] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    observacoes: "",
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

    try {
      if (editingNicho) {
        const { error } = await supabase
          .from("nichos")
          .update(formData)
          .eq("id", editingNicho.id);

        if (error) throw error;
        toast.success("Nicho atualizado!");
      } else {
        const { error } = await supabase.from("nichos").insert(formData);

        if (error) throw error;
        toast.success("Nicho criado!");
      }

      setDialogOpen(false);
      resetForm();
      fetchNichos();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este nicho?")) return;

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
    setFormData({ nome: "", descricao: "", observacoes: "" });
    setEditingNicho(null);
  };

  const openEditDialog = (nicho: any) => {
    setEditingNicho(nicho);
    setFormData({
      nome: nicho.nome,
      descricao: nicho.descricao || "",
      observacoes: nicho.observacoes || "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Nichos</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Nicho
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingNicho ? "Editar Nicho" : "Criar Novo Nicho"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
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

              <Button type="submit" className="w-full">
                {editingNicho ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {nichos.map((nicho) => (
          <Card key={nicho.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{nicho.nome}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(nicho)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(nicho.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nicho.descricao && (
                <p className="text-sm text-muted-foreground">{nicho.descricao}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
