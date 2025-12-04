import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FinanceiroResumoCards } from "./FinanceiroResumoCards";
import { TransacaoForm } from "./TransacaoForm";
import { TransacoesTable } from "./TransacoesTable";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface FinanceiroTabProps {
  nichoId: string;
}

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
  membro_time: MembroTime | null;
}

export function FinanceiroTab({ nichoId }: FinanceiroTabProps) {
  const [loading, setLoading] = useState(true);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [resumo, setResumo] = useState({
    faturamentoMensal: 0,
    lucroMensal: 0,
    transacoesMes: 0,
    faturamentoTotal: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      // Buscar todas as transações do nicho com dados do membro responsável
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select(`
          id,
          produto_nome,
          preco_custo,
          preco_venda,
          data_transacao,
          membro_time:membro_time_id (
            id,
            nome,
            funcao
          )
        `)
        .eq("nicho_id", nichoId)
        .order("data_transacao", { ascending: false });

      if (error) throw error;

      const todasTransacoes = (data || []) as Transacao[];
      setTransacoes(todasTransacoes);

      // Calcular resumos
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const transacoesMes = todasTransacoes.filter((t) => {
        const data = new Date(t.data_transacao + "T00:00:00");
        return data >= startOfMonth && data <= endOfMonth;
      });

      const faturamentoMensal = transacoesMes.reduce(
        (acc, t) => acc + Number(t.preco_venda),
        0
      );
      const custoMensal = transacoesMes.reduce(
        (acc, t) => acc + Number(t.preco_custo),
        0
      );
      const lucroMensal = faturamentoMensal - custoMensal;

      const faturamentoTotal = todasTransacoes.reduce(
        (acc, t) => acc + Number(t.preco_venda),
        0
      );

      setResumo({
        faturamentoMensal,
        lucroMensal,
        transacoesMes: transacoesMes.length,
        faturamentoTotal,
      });
    } catch (error: any) {
      toast.error("Erro ao carregar dados financeiros: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [nichoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
        <h2 className="text-3xl font-bold tracking-tight">Performance Financeira</h2>
        <TransacaoForm nichoId={nichoId} onSuccess={fetchData} />
      </div>

      <FinanceiroResumoCards {...resumo} />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Transações Recentes</h3>
        <TransacoesTable transacoes={transacoes.slice(0, 20)} />
      </div>
    </div>
  );
}
