import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";
import { Package, Pencil, Trash2 } from "lucide-react";
import { ProdutoForm } from "./ProdutoForm";

interface Produto {
  id: string;
  nome: string;
  preco_custo_padrao: number;
  preco_venda_padrao: number;
  descricao: string | null;
  ativa: boolean;
}

interface ProdutosListProps {
  nichoId: string;
}

export function ProdutosList({ nichoId }: ProdutosListProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("nome");

      if (error) throw error;
      setProdutos(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar produtos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, [nichoId]);

  const handleToggleAtivo = async (produto: Produto) => {
    const newAtiva = !produto.ativa;
    setProdutos((prev) =>
      prev.map((p) => (p.id === produto.id ? { ...p, ativa: newAtiva } : p))
    );

    try {
      const { error } = await supabase
        .from("produtos")
        .update({ ativa: newAtiva })
        .eq("id", produto.id);

      if (error) throw error;
      toast.success(newAtiva ? "Produto ativado" : "Produto desativado");
    } catch (error: any) {
      setProdutos((prev) =>
        prev.map((p) => (p.id === produto.id ? { ...p, ativa: !newAtiva } : p))
      );
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("produtos")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Produto removido!");
      fetchProdutos();
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    } finally {
      setDeleteId(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Produtos Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Produtos Cadastrados
            </CardTitle>
            <ProdutoForm nichoId={nichoId} onSuccess={fetchProdutos} />
          </div>
        </CardHeader>
        <CardContent>
          {produtos.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Nenhum produto cadastrado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {produtos.map((produto) => (
                <div
                  key={produto.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    produto.ativa ? "bg-card" : "bg-muted/50 opacity-60"
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{produto.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      Custo: {formatCurrency(produto.preco_custo_padrao)} | Venda:{" "}
                      {formatCurrency(produto.preco_venda_padrao)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={produto.ativa}
                      onCheckedChange={() => handleToggleAtivo(produto)}
                    />
                    <ProdutoForm
                      nichoId={nichoId}
                      produto={produto}
                      onSuccess={fetchProdutos}
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(produto.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O produto será removido permanentemente.
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
    </>
  );
}
