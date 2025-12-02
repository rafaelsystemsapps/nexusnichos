import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Copy, Hash, MessageSquare, Sparkles, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface BibliotecaNichoTabProps {
  nichoId: string;
}

const categoriaConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  legenda: { label: "Legendas", icon: <MessageSquare className="h-4 w-4" /> },
  hashtag: { label: "Hashtags", icon: <Hash className="h-4 w-4" /> },
  cta: { label: "CTAs", icon: <Sparkles className="h-4 w-4" /> },
  guia_identidade: { label: "Guia de Identidade", icon: <BookOpen className="h-4 w-4" /> },
};

export function BibliotecaNichoTab({ nichoId }: BibliotecaNichoTabProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("legenda");
  const [formData, setFormData] = useState({
    categoria: "legenda",
    titulo: "",
    conteudo: "",
  });

  useEffect(() => {
    fetchItems();
  }, [nichoId]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("biblioteca_nicho")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar biblioteca");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim() || !formData.conteudo.trim()) {
      toast.error("Preencha título e conteúdo");
      return;
    }

    try {
      const payload = {
        categoria: formData.categoria,
        titulo: formData.titulo,
        conteudo: formData.conteudo,
        nicho_id: nichoId,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("biblioteca_nicho")
          .update(payload)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Item atualizado!");
      } else {
        const { error } = await supabase.from("biblioteca_nicho").insert([payload]);

        if (error) throw error;
        toast.success("Item criado!");
      }

      setDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      const { error } = await supabase
        .from("biblioteca_nicho")
        .delete()
        .eq("id", deletingItem.id);

      if (error) throw error;
      toast.success("Item removido!");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      fetchItems();
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const resetForm = () => {
    setFormData({
      categoria: activeTab,
      titulo: "",
      conteudo: "",
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({
      categoria: item.categoria,
      titulo: item.titulo,
      conteudo: item.conteudo,
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (item: any) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const openNewDialog = () => {
    resetForm();
    setFormData((prev) => ({ ...prev, categoria: activeTab }));
    setDialogOpen(true);
  };

  const getItemsByCategory = (categoria: string) => {
    return items.filter((item) => item.categoria === categoria);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Biblioteca do Nicho</h2>
          <p className="text-sm text-muted-foreground">Legendas, hashtags, CTAs e guias</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Categoria *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legenda">Legenda</SelectItem>
                    <SelectItem value="hashtag">Hashtags</SelectItem>
                    <SelectItem value="cta">CTA</SelectItem>
                    <SelectItem value="guia_identidade">Guia de Identidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Título *</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Nome identificador"
                  required
                />
              </div>

              <div>
                <Label>Conteúdo *</Label>
                <Textarea
                  value={formData.conteudo}
                  onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                  placeholder="Conteúdo da biblioteca..."
                  rows={6}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                {editingItem ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          {Object.entries(categoriaConfig).map(([key, config]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-1.5">
              {config.icon}
              <span className="hidden sm:inline">{config.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(categoriaConfig).map((categoria) => (
          <TabsContent key={categoria} value={categoria} className="mt-6">
            {getItemsByCategory(categoria).length === 0 ? (
              <Card className="border-border/50 shadow-premium">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Nenhum item em {categoriaConfig[categoria].label.toLowerCase()}.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {getItemsByCategory(categoria).map((item) => (
                  <Card key={item.id} className="border-border/50 shadow-premium">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{item.titulo}</CardTitle>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(item.conteudo)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDeleteDialog(item)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                        {item.conteudo}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
