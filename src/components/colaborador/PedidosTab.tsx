import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PedidosResumoCards } from "./PedidosResumoCards";
import { PedidoForm } from "./PedidoForm";
import { PedidosTable } from "./PedidosTable";
import { ProdutosList } from "./ProdutosList";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface PedidosTabProps {
  nichoId: string;
}

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
  cor: string | null;
}

export function PedidosTab({ nichoId }: PedidosTabProps) {
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const fetchPedidos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select(`
          *,
          processado_por:membros_time!processado_por_id(id, nome)
        `)
        .eq("nicho_id", nichoId)
        .order("data_pedido", { ascending: false });

      if (error) throw error;
      setPedidos((data || []) as Pedido[]);
    } catch (error: any) {
      toast.error("Erro ao carregar pedidos: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [nichoId]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // Filtrar pedidos pelo status
  const pedidosFiltrados = useMemo(() => {
    if (filtroStatus === "todos") return pedidos;
    return pedidos.filter((p) => p.status === filtroStatus);
  }, [pedidos, filtroStatus]);

  // Calcular métricas
  const metricas = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const pendentes = pedidos.filter((p) => p.status === "pendente").length;

    const pedidosMes = pedidos.filter((p) => {
      const data = new Date(p.data_pedido + "T00:00:00");
      return data >= startOfMonth && data <= endOfMonth;
    });

    const enviados = pedidosMes.filter((p) => p.status === "enviado").length;
    const valorTotal = pedidosMes.reduce((acc, p) => acc + (p.valor || 0), 0);

    return { pendentes, enviados, valorTotal };
  }, [pedidos]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Pedidos</h2>
        <PedidoForm nichoId={nichoId} onSuccess={fetchPedidos} />
      </div>

      <PedidosResumoCards {...metricas} />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">
          {pedidosFiltrados.length} pedido(s)
        </span>
      </div>

      <PedidosTable
        pedidos={pedidosFiltrados}
        nichoId={nichoId}
        onUpdate={fetchPedidos}
      />

      {/* Produtos Cadastrados */}
      <ProdutosList nichoId={nichoId} />
    </div>
  );
}
