import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Video, Image, FileText, Link, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConteudoBrutoTabProps {
  nichoId: string;
}

const tipoIcons: Record<string, React.ReactNode> = {
  video: <Video className="h-5 w-5" />,
  imagem: <Image className="h-5 w-5" />,
  texto: <FileText className="h-5 w-5" />,
  link: <Link className="h-5 w-5" />,
};

export function ConteudoBrutoTab({ nichoId }: ConteudoBrutoTabProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    tipo: "video",
    titulo: "",
    descricao: "",
    url_arquivo: "",
  });

  useEffect(() => {
    fetchItems();
  }, [nichoId]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("conteudo_bruto")
        .select("*, profiles:responsavel_id(nome)")
        .eq("nicho_id", nichoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar conteúdos brutos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        tipo: formData.tipo,
        titulo: formData.titulo || null,
        descricao: formData.descricao || null,
        url_arquivo: formData.url_arquivo || null,
        nicho_id: nichoId,
        responsavel_id: user?.id || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("conteudo_bruto")
          .update(payload)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Item atualizado!");
      } else {
        const { error } = await supabase.from("conteudo_bruto").insert([payload]);

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
        .from("conteudo_bruto")
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

  const resetForm = () => {
    setFormData({
      tipo: "video",
      titulo: "",
      descricao: "",
      url_arquivo: "",
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({
      tipo: item.tipo,
      titulo: item.titulo || "",
      descricao: item.descricao || "",
      url_arquivo: item.url_arquivo || "",
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (item: any) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      video: "bg-red-500/10 text-red-500",
      imagem: "bg-blue-500/10 text-blue-500",
      texto: "bg-green-500/10 text-green-500",
      link: "bg-purple-500/10 text-purple-500",
    };

    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${colors[tipo] || ""}`}>
        {tipoIcons[tipo]}
        <span className="capitalize">{tipo}</span>
      </div>
    );
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
          <h2 className="text-2xl font-bold">Conteúdo Bruto / Ideias</h2>
          <p className="text-sm text-muted-foreground">Uploads, referências e notas rápidas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
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
                <Label>Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Vídeo</SelectItem>
                    <SelectItem value="imagem">Imagem</SelectItem>
                    <SelectItem value="texto">Texto</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Título</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Descrição breve"
                />
              </div>

              <div>
                <Label>URL / Arquivo</Label>
                <Input
                  value={formData.url_arquivo}
                  onChange={(e) => setFormData({ ...formData, url_arquivo: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Descrição / Notas</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Detalhes, ideias, referências..."
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingItem ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <Card className="border-border/50 shadow-premium">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum conteúdo bruto adicionado.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione vídeos brutos, prints, referências ou notas rápidas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="border-border/50 shadow-premium hover:shadow-premium-lg transition-all">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  {getTipoBadge(item.tipo)}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDeleteDialog(item)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {item.titulo && (
                  <h3 className="font-medium text-sm mb-2 line-clamp-2">{item.titulo}</h3>
                )}

                {item.descricao && (
                  <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{item.descricao}</p>
                )}

                {item.url_arquivo && (
                  <a
                    href={item.url_arquivo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline truncate block mb-3"
                  >
                    {item.url_arquivo}
                  </a>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                  <span>{item.profiles?.nome || "Sem responsável"}</span>
                  <span>{format(new Date(item.created_at), "dd/MM/yy", { locale: ptBR })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
