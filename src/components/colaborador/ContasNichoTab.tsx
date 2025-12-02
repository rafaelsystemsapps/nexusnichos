import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

interface ContasNichoTabProps {
  nichoId: string;
}

export function ContasNichoTab({ nichoId }: ContasNichoTabProps) {
  const { user } = useAuth();
  const [contas, setContas] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<any>(null);
  const [formData, setFormData] = useState({
    plataforma: "instagram",
    nome_conta: "",
    url_conta: "",
    status: "ativa",
    observacoes: "",
    data_criacao_conta: "",
  });

  useEffect(() => {
    fetchContas();
  }, [nichoId]);

  const fetchContas = async () => {
    try {
      const { data, error } = await supabase
        .from("contas_redes_sociais")
        .select("*, profiles:responsavel_id(nome)")
        .eq("nicho_id", nichoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContas(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar contas");
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
        data_criacao_conta: formData.data_criacao_conta || null,
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
      data_criacao_conta: "",
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
      data_criacao_conta: conta.data_criacao_conta || "",
    });
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      ativa: "default",
      pausada: "secondary",
      banida: "destructive",
      limitada: "outline",
    };

    return (
      <Badge variant={variants[status] || "default"} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contas de Redes Sociais</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Conta
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
                <Label>Nome da Conta *</Label>
                <Input
                  value={formData.nome_conta}
                  onChange={(e) => setFormData({ ...formData, nome_conta: e.target.value })}
                  placeholder="@usuario"
                  required
                />
              </div>

              <div>
                <Label>URL da Conta</Label>
                <Input
                  value={formData.url_conta}
                  onChange={(e) => setFormData({ ...formData, url_conta: e.target.value })}
                  placeholder="https://..."
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
                <Label>Data de Criação</Label>
                <Input
                  type="date"
                  value={formData.data_criacao_conta}
                  onChange={(e) =>
                    setFormData({ ...formData, data_criacao_conta: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingConta ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome/Conta</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contas.map((conta) => (
            <TableRow key={conta.id}>
              <TableCell className="font-medium">{conta.nome_conta}</TableCell>
              <TableCell className="capitalize">{conta.plataforma}</TableCell>
              <TableCell>{getStatusBadge(conta.status)}</TableCell>
              <TableCell>{conta.profiles?.nome || "-"}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(conta)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
