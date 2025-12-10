import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PedidoForm } from "./PedidoForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Send } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MembroTime {
  id: string;
  nome: string;
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
  data_envio: string | null;
  processado_por_id: string | null;
  processado_por?: MembroTime | null;
}

interface PedidosTableProps {
  pedidos: Pedido[];
  nichoId: string;
  onUpdate: () => void;
}

export function PedidosTable({ pedidos, nichoId, onUpdate }: PedidosTableProps) {
  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">Pendente</Badge>;
      case "enviado":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">Enviado</Badge>;
      case "cancelado":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleMarcarEnviado = async (pedido: Pedido) => {
    try {
      const { error } = await supabase
        .from("pedidos")
        .update({ 
          status: "enviado",
          data_envio: new Date().toISOString()
        })
        .eq("id", pedido.id);

      if (error) throw error;
      toast.success("Pedido marcado como enviado!");
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("pedidos").delete().eq("id", id);

      if (error) throw error;
      toast.success("Pedido excluído!");
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  if (pedidos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
        <p>Nenhum pedido encontrado</p>
        <p className="text-sm mt-1">Registre seu primeiro pedido</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Processado Por</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido) => (
            <TableRow key={pedido.id}>
              <TableCell className="font-medium">#{pedido.pedido_id}</TableCell>
              <TableCell>{pedido.cliente_nome || "-"}</TableCell>
              <TableCell>{pedido.produto || "-"}</TableCell>
              <TableCell>{formatCurrency(pedido.valor)}</TableCell>
              <TableCell>{formatDate(pedido.data_pedido)}</TableCell>
              <TableCell>{getStatusBadge(pedido.status)}</TableCell>
              <TableCell>{pedido.processado_por?.nome || "-"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {pedido.status === "pendente" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMarcarEnviado(pedido)}
                      title="Marcar como enviado"
                      className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  <PedidoForm
                    nichoId={nichoId}
                    pedido={pedido}
                    onSuccess={onUpdate}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O pedido #{pedido.pedido_id} será excluído permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(pedido.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
