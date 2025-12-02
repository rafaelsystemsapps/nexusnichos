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
import { Plus, Pencil, Instagram, Youtube, Twitter } from "lucide-react";
import { toast } from "sonner";

interface ContasNichoTabProps {
  nichoId: string;
}

const plataformaIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-5 w-5" />,
  youtube: <Youtube className="h-5 w-5" />,
  twitter: <Twitter className="h-5 w-5" />,
};

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
  });

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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingConta ? "Editar Conta" : "Nova Conta"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    <SelectItem value="twitter">Twitter</SelectItem>
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

              <div>
                <Label>Status *</Label>
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
                <Label>Notas</Label>
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
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(conta)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  {getStatusBadge(conta.status)}
                </div>

                {conta.observacoes && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{conta.observacoes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
