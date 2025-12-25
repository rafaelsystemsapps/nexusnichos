import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsIOSMobile } from "@/hooks/use-mobile";

interface AlertasRiscoProps {
  nichoId: string;
}

interface Alerta {
  id: string;
  tipo: "contas_risco" | "execucao_atrasando" | "conta_desativada_sem_acao";
  texto: string;
  cor: "vermelho" | "amarelo";
  rota: string;
}

export function AlertasRisco({ nichoId }: AlertasRiscoProps) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isIOSMobile = useIsIOSMobile();

  useEffect(() => {
    fetchAlertas();
  }, [nichoId]);

  const fetchAlertas = async () => {
    try {
      const alertasCalculados: Alerta[] = [];

      // 1. Contas em risco (limitada ou banida) - ≥2 para alertar
      const { data: contasRisco } = await supabase
        .from("contas_redes_sociais")
        .select("id, status")
        .eq("nicho_id", nichoId)
        .in("status", ["limitada", "banida"]);

      const contasEmRisco = contasRisco?.length || 0;
      if (contasEmRisco >= 2) {
        alertasCalculados.push({
          id: "contas_risco",
          tipo: "contas_risco",
          texto: `${contasEmRisco} contas em risco`,
          cor: "vermelho",
          rota: `/workspace/${nichoId}/contas`,
        });
      }

      // 2. Execução atrasando (≥3 tarefas atrasadas)
      const hoje = new Date().toISOString().split("T")[0];
      
      const { data: semanasData } = await supabase
        .from("semana_logistica")
        .select("id")
        .eq("nicho_id", nichoId);

      const semanaIds = semanasData?.map((s) => s.id) || [];

      if (semanaIds.length > 0) {
        const { data: tarefasAtrasadas } = await supabase
          .from("tarefa_diaria")
          .select("id")
          .in("semana_id", semanaIds)
          .lt("data", hoje)
          .in("status", ["pendente", "em_andamento"]);

        const totalAtrasadas = tarefasAtrasadas?.length || 0;
        if (totalAtrasadas >= 3) {
          alertasCalculados.push({
            id: "execucao_atrasando",
            tipo: "execucao_atrasando",
            texto: "Execução atrasando",
            cor: "amarelo",
            rota: `/workspace/${nichoId}/logistica`,
          });
        }
      }

      // 3. Conta desativada sem ação (banida e sem proxima_acao)
      const { data: contasDesativadas } = await supabase
        .from("contas_redes_sociais")
        .select("id, nome_conta")
        .eq("nicho_id", nichoId)
        .eq("status", "banida")
        .is("proxima_acao", null);

      if (contasDesativadas && contasDesativadas.length > 0) {
        alertasCalculados.push({
          id: "conta_desativada_sem_acao",
          tipo: "conta_desativada_sem_acao",
          texto: "Conta desativada sem ação",
          cor: "vermelho",
          rota: `/workspace/${nichoId}/contas`,
        });
      }

      // Limitar a 3 alertas máximo
      setAlertas(alertasCalculados.slice(0, 3));
    } catch (error) {
      console.error("Erro ao calcular alertas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Se carregando ou sem alertas, não renderiza nada
  if (loading || alertas.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", isIOSMobile ? "space-y-1.5" : "space-y-2")}>
      {alertas.map((alerta) => (
        <div
          key={alerta.id}
          onClick={() => navigate(alerta.rota)}
          className={cn(
            "cursor-pointer rounded-md p-3 border-l-4",
            alerta.cor === "vermelho" 
              ? "bg-red-600 text-white border-red-900" 
              : "bg-amber-500 text-amber-950 border-amber-700"
          )}
        >
          <p className="font-bold uppercase tracking-wide text-sm">
            {alerta.texto}
          </p>
        </div>
      ))}
    </div>
  );
}
