import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface MembroTime {
  id: string;
  nome: string;
  funcao: string;
}

interface Produto {
  id: string;
  nome: string;
  preco_venda_padrao: number;
  ativa: boolean;
}

interface Pedido {
  id: string;
  pedido_id: string;
  cliente_nome: string | null;
  produto: string | null;
  valor: number | null;
  status: "pendente" | "enviado" | "cancelado";
  observacoes: string | null;
  data_pedido: string;
  processado_por_id: string | null;
}

interface PedidoFormProps {
  nichoId: string;
  pedido?: Pedido | null;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function PedidoForm({ nichoId, pedido, onSuccess, trigger }: PedidoFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [membros, setMembros] = useState<MembroTime[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selectedProduto, setSelectedProduto] = useState<string>("");
  const [formData, setFormData] = useState({
    pedido_id: "",
    cliente_nome: "",
    produto: "",
    valor: "",
    status: "pendente" as "pendente" | "enviado" | "cancelado",
    observacoes: "",
    data_pedido: new Date().toISOString().split("T")[0],
    processado_por_id: "",
  });

  useEffect(() => {
    if (open) {
      fetchMembros();
      fetchProdutos();
    }
  }, [open, nichoId]);

  useEffect(() => {
    if (pedido) {
      setFormData({
        pedido_id: pedido.pedido_id,
        cliente_nome: pedido.cliente_nome || "",
        produto: pedido.produto || "",
        valor: pedido.valor?.toString() || "",
        status: pedido.status,
        observacoes: pedido.observacoes || "",
        data_pedido: pedido.data_pedido,
        processado_por_id: pedido.processado_por_id || "",
      });
      setSelectedProduto("");
    } else {
      setFormData({
        pedido_id: "",
        cliente_nome: "",
        produto: "",
        valor: "",
        status: "pendente",
        observacoes: "",
        data_pedido: new Date().toISOString().split("T")[0],
        processado_por_id: "",
      });
      setSelectedProduto("");
    }
  }, [pedido, open]);

  const fetchMembros = async () => {
    const { data } = await supabase
      .from("membros_time")
      .select("id, nome, funcao")
      .eq("nicho_id", nichoId)
      .order("nome");
    if (data) setMembros(data);
  };

  const fetchProdutos = async () => {
    const { data } = await supabase
      .from("produtos")
      .select("id, nome, preco_venda_padrao, ativa")
      .eq("nicho_id", nichoId)
      .eq("ativa", true)
      .order("nome");
    if (data) setProdutos(data);
  };

  const handleProdutoChange = (produtoId: string) => {
    setSelectedProduto(produtoId);
    
    if (produtoId && produtoId !== "manual") {
      const produto = produtos.find(p => p.id === produtoId);
      if (produto) {
        setFormData(prev => ({
          ...prev,
          produto: produto.nome,
          valor: produto.preco_venda_padrao.toString(),
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pedido_id.trim()) {
      toast.error("ID do pedido é obrigatório");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nicho_id: nichoId,
        pedido_id: formData.pedido_id.trim(),
        cliente_nome: formData.cliente_nome.trim() || null,
        produto: formData.produto.trim() || null,
        valor: formData.valor ? parseFloat(formData.valor) : null,
        status: formData.status,
        observacoes: formData.observacoes.trim() || null,
        data_pedido: formData.data_pedido,
        data_envio: formData.status === "enviado" ? new Date().toISOString() : null,
        processado_por_id: formData.processado_por_id || null,
      };

      if (pedido) {
        const { error } = await supabase
          .from("pedidos")
          .update(payload)
          .eq("id", pedido.id);

        if (error) throw error;
        toast.success("Pedido atualizado!");
      } else {
        const { error } = await supabase.from("pedidos").insert(payload);

        if (error) throw error;
        toast.success("Pedido registrado!");
      }

      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pedido
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{pedido ? "Editar Pedido" : "Novo Pedido"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pedido_id">ID do Pedido *</Label>
              <Input
                id="pedido_id"
                value={formData.pedido_id}
                onChange={(e) =>
                  setFormData({ ...formData, pedido_id: e.target.value })
                }
                placeholder="Ex: 12345"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_pedido">Data do Pedido</Label>
              <Input
                id="data_pedido"
                type="date"
                value={formData.data_pedido}
                onChange={(e) =>
                  setFormData({ ...formData, data_pedido: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente_nome">Nome do Cliente</Label>
            <Input
              id="cliente_nome"
              value={formData.cliente_nome}
              onChange={(e) =>
                setFormData({ ...formData, cliente_nome: e.target.value })
              }
              placeholder="Nome do cliente"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="produto">Produto</Label>
              {produtos.length > 0 && (
                <Select value={selectedProduto} onValueChange={handleProdutoChange}>
                  <SelectTrigger className="mb-2">
                    <SelectValue placeholder="Selecionar cadastrado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Digitar manualmente</SelectItem>
                    {produtos.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Input
                id="produto"
                value={formData.produto}
                onChange={(e) =>
                  setFormData({ ...formData, produto: e.target.value })
                }
                placeholder="Nome do produto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) =>
                  setFormData({ ...formData, valor: e.target.value })
                }
                placeholder="0,00"
                className={produtos.length > 0 ? "mt-[52px]" : ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "pendente" | "enviado" | "cancelado") =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="processado_por">Processado Por</Label>
            <Select
              value={formData.processado_por_id}
              onValueChange={(value) =>
                setFormData({ ...formData, processado_por_id: value === "none" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um membro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {membros.map((membro) => (
                  <SelectItem key={membro.id} value={membro.id}>
                    {membro.nome} - {membro.funcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) =>
                setFormData({ ...formData, observacoes: e.target.value })
              }
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : pedido ? "Salvar" : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
