import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2 } from "lucide-react";

interface MembroTime {
  id: string;
  nome: string;
  funcao: string;
}

interface Transacao {
  id: string;
  produto_nome: string;
  preco_custo: number;
  preco_venda: number;
  data_transacao: string;
  membro_time?: MembroTime | null;
}

interface TransacoesTableProps {
  transacoes: Transacao[];
  onDelete?: () => void;
}

export function TransacoesTable({ transacoes, onDelete }: TransacoesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("transacoes_financeiras")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Transação removida!");
      onDelete?.();
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (transacoes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma transação registrada ainda.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border border-border/50 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Produto/Serviço</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="text-right">Preço Venda</TableHead>
              <TableHead className="text-right">Preço Custo</TableHead>
              <TableHead className="text-right">Lucro Líquido</TableHead>
              {onDelete && <TableHead className="w-10"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transacoes.map((transacao) => {
              const lucro = transacao.preco_venda - transacao.preco_custo;
              return (
                <TableRow key={transacao.id}>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(transacao.data_transacao + "T00:00:00"), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {transacao.produto_nome}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {transacao.membro_time?.nome || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(transacao.preco_venda)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(transacao.preco_custo)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      lucro >= 0 ? "text-green-500" : "text-destructive"
                    }`}
                  >
                    {formatCurrency(lucro)}
                  </TableCell>
                  {onDelete && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(transacao.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A transação será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
