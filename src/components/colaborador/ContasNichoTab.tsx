import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Instagram, Youtube, Twitter, Music2, MessageCircle, Hash } from "lucide-react";
import { toast } from "sonner";
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

interface ContasNichoTabProps {
  nichoId: string;
}

const plataformaIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-5 w-5" />,
  youtube: <Youtube className="h-5 w-5" />,
  twitter: <Twitter className="h-5 w-5" />,
  tiktok: <Music2 className="h-5 w-5" />,
  threads: <Hash className="h-5 w-5" />,
  facebook: <MessageCircle className="h-5 w-5" />,
};

const TIPOS_CONTEUDO = [
  "Dark",
  "Achadinhos", 
  "Humor",
  "Lifestyle",
  "Educacional",
  "Reviews",
  "Trends",
  "Outro"
];

const STATUS_AQUECIMENTO = [
  { value: "aquecida", label: "Aquecida", color: "bg-emerald-500/20 text-emerald-400" },
  { value: "media", label: "Média", color: "bg-amber-500/20 text-amber-400" },
  { value: "fria", label: "Fria", color: "bg-blue-500/20 text-blue-400" },
  { value: "inativa", label: "Inativa", color: "bg-zinc-500/20 text-zinc-400" },
];

export function ContasNichoTab({ nichoId }: ContasNichoTabProps) {
  const { user } = useAuth();
  const [contas, setContas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<any>(null);
  const [formData, setFormData] = useState({
    plataforma: "instagram",
    nome_conta: "",
    url_conta: "",
    status: "ativa",
    observacoes: "",
    tipo_conteudo: "",
    media_videos: 0,
    status_aquecimento: "media",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contaToDelete, setContaToDelete] = useState<any>(null);

  useEffect(() => {
    fetchContas();
  }, [nichoId]);

  const fetchContas = async () => {
    try {
      const { data, error } = await supabase
        .from("contas_redes_sociais")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContas(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        plataforma: formData.plataforma as any,
        nome_conta: formData.nome_conta,
        url_conta: formData.url_conta || null,
        status: formData.status as any,
        observacoes: formData.observacoes || null,
        nicho_id: nichoId,
        responsavel_id: user?.id || null,
        tipo_conteudo: formData.tipo_conteudo || null,
        media_videos: formData.media_videos || 0,
        status_aquecimento: formData.status_aquecimento || "media",
      };

      if (editingConta) {
        const { error } = await supabase
          .from("contas_redes_sociais")
          .update(payload)
          .eq("id", editingConta.id);

        if (error) throw error;
        toast.success("Conta atualizada!");
      } else {
        const { error } = await supabase.from("contas_redes_sociais").insert([payload]);

        if (error) throw error;
        toast.success("Conta criada!");
      }

      setDialogOpen(false);
      resetForm();
      fetchContas();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      plataforma: "instagram",
      nome_conta: "",
      url_conta: "",
      status: "ativa",
      observacoes: "",
      tipo_conteudo: "",
      media_videos: 0,
      status_aquecimento: "media",
    });
    setEditingConta(null);
  };

  const openEditDialog = (conta: any) => {
    setEditingConta(conta);
    setFormData({
      plataforma: conta.plataforma,
      nome_conta: conta.nome_conta,
      url_conta: conta.url_conta || "",
      status: conta.status,
      observacoes: conta.observacoes || "",
      tipo_conteudo: conta.tipo_conteudo || "",
      media_videos: conta.media_videos || 0,
      status_aquecimento: conta.status_aquecimento || "media",
    });
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      ativa: { variant: "default", label: "Ativa" },
      pausada: { variant: "secondary", label: "Pausada" },
      banida: { variant: "destructive", label: "Banida" },
      limitada: { variant: "outline", label: "Limitada" },
    };

    const { variant, label } = config[status] || { variant: "default", label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getAquecimentoBadge = (status: string) => {
    const config = STATUS_AQUECIMENTO.find(s => s.value === status);
    if (!config) return null;
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const handleDelete = async () => {
    if (!contaToDelete) return;
    
    try {
      const { error } = await supabase
        .from("contas_redes_sociais")
        .delete()
        .eq("id", contaToDelete.id);

      if (error) throw error;
      toast.success("Conta excluída!");
      fetchContas();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    } finally {
      setDeleteDialogOpen(false);
      setContaToDelete(null);
    }
  };

  const openDeleteDialog = (conta: any) => {
    setContaToDelete(conta);
    setDeleteDialogOpen(true);
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
          <h2 className="text-2xl font-bold">Contas do Nicho</h2>
          <p className="text-sm text-muted-foreground">Gerencie as contas de redes sociais</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingConta ? "Editar Conta" : "Nova Conta"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Plataforma *</Label>
                  <Select
                    value={formData.plataforma}
                    onValueChange={(value) => setFormData({ ...formData, plataforma: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="threads">Threads</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>@ da Conta *</Label>
                  <Input
                    value={formData.nome_conta}
                    onChange={(e) => setFormData({ ...formData, nome_conta: e.target.value })}
                    placeholder="@usuario"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status da Conta *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="pausada">Pausada</SelectItem>
                      <SelectItem value="banida">Banida</SelectItem>
                      <SelectItem value="limitada">Limitada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Status Aquecimento</Label>
                  <Select
                    value={formData.status_aquecimento}
                    onValueChange={(value) => setFormData({ ...formData, status_aquecimento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_AQUECIMENTO.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Conteúdo</Label>
                  <Select
                    value={formData.tipo_conteudo}
                    onValueChange={(value) => setFormData({ ...formData, tipo_conteudo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_CONTEUDO.map(tipo => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Média de Vídeos/Semana</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.media_videos}
                    onChange={(e) => setFormData({ ...formData, media_videos: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações sobre a conta..."
                />
              </div>

              <Button type="submit" className="w-full">
                {editingConta ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {contas.length === 0 ? (
        <Card className="border-border/50 shadow-premium">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma conta cadastrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contas.map((conta) => (
            <Card key={conta.id} className="border-border/50 shadow-premium hover:shadow-premium-lg transition-all">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-surface">
                      {plataformaIcons[conta.plataforma] || (
                        <span className="text-xs font-medium capitalize">{conta.plataforma}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{conta.nome_conta}</p>
                      <p className="text-xs text-muted-foreground capitalize">{conta.plataforma}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(conta)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                      onClick={() => openDeleteDialog(conta)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(conta.status)}
                  {conta.status_aquecimento && getAquecimentoBadge(conta.status_aquecimento)}
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  {conta.tipo_conteudo && (
                    <span className="px-2 py-0.5 rounded bg-muted">{conta.tipo_conteudo}</span>
                  )}
                  {conta.media_videos > 0 && (
                    <span>{conta.media_videos} vídeos/sem</span>
                  )}
                </div>

                {conta.observacoes && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{conta.observacoes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conta <strong>{contaToDelete?.nome_conta}</strong>? 
              Esta ação não pode ser desfeita e as tarefas vinculadas perderão a referência.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
