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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Produto {
  id: string;
  nome: string;
  preco_custo_padrao: number;
  preco_venda_padrao: number;
  descricao: string | null;
  ativa: boolean;
}

interface ProdutoFormProps {
  nichoId: string;
  produto?: Produto | null;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function ProdutoForm({ nichoId, produto, onSuccess, trigger }: ProdutoFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    preco_custo_padrao: "",
    preco_venda_padrao: "",
    descricao: "",
    ativa: true,
  });

  useEffect(() => {
    if (produto) {
      setFormData({
        nome: produto.nome,
        preco_custo_padrao: produto.preco_custo_padrao?.toString() || "0",
        preco_venda_padrao: produto.preco_venda_padrao?.toString() || "0",
        descricao: produto.descricao || "",
        ativa: produto.ativa,
      });
    } else {
      setFormData({
        nome: "",
        preco_custo_padrao: "",
        preco_venda_padrao: "",
        descricao: "",
        ativa: true,
      });
    }
  }, [produto, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast.error("Nome do produto é obrigatório");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nicho_id: nichoId,
        nome: formData.nome.trim(),
        preco_custo_padrao: parseFloat(formData.preco_custo_padrao) || 0,
        preco_venda_padrao: parseFloat(formData.preco_venda_padrao) || 0,
        descricao: formData.descricao.trim() || null,
        ativa: formData.ativa,
      };

      if (produto) {
        const { error } = await supabase
          .from("produtos")
          .update(payload)
          .eq("id", produto.id);

        if (error) throw error;
        toast.success("Produto atualizado!");
      } else {
        const { error } = await supabase.from("produtos").insert(payload);

        if (error) throw error;
        toast.success("Produto cadastrado!");
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
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{produto ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Produto *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Curso de Marketing Digital"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco_custo">Preço de Custo (R$)</Label>
              <Input
                id="preco_custo"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_custo_padrao}
                onChange={(e) =>
                  setFormData({ ...formData, preco_custo_padrao: e.target.value })
                }
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preco_venda">Preço de Venda (R$)</Label>
              <Input
                id="preco_venda"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_venda_padrao}
                onChange={(e) =>
                  setFormData({ ...formData, preco_venda_padrao: e.target.value })
                }
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              placeholder="Descrição opcional do produto..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ativa">Produto Ativo</Label>
            <Switch
              id="ativa"
              checked={formData.ativa}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, ativa: checked })
              }
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
              {loading ? "Salvando..." : produto ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
