import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays } from "date-fns";

interface TarefaFila {
  id: string;
  data: string;
  status: string;
  template_titulo: string;
  conta_nome?: string;
  dias_atraso?: number;
}

interface ContaAcao {
  id: string;
  nome_conta: string;
  plataforma: string;
  status: string;
  proxima_acao: string | null;
}

export function useDashboardTarefas(nichoId: string) {
  return useQuery({
    queryKey: ["dashboard-tarefas", nichoId],
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0];

      // Buscar semanas do nicho
      const { data: semanasData } = await supabase
        .from("semana_logistica")
        .select("id")
        .eq("nicho_id", nichoId);

      const semanaIds = semanasData?.map(s => s.id) || [];
      
      let atrasadas: TarefaFila[] = [];
      let hojeList: TarefaFila[] = [];

      if (semanaIds.length > 0) {
        // Tarefas atrasadas
        const { data: atrasadasData } = await supabase
          .from("tarefa_diaria")
          .select(`
            id,
            data,
            status,
            tarefa_templates!inner(titulo, conta_id, contas_redes_sociais(nome_conta))
          `)
          .in("semana_id", semanaIds)
          .lt("data", hoje)
          .in("status", ["pendente", "em_andamento"])
          .order("data", { ascending: true });

        atrasadas = (atrasadasData || []).map((t: any) => ({
          id: t.id,
          data: t.data,
          status: t.status,
          template_titulo: t.tarefa_templates?.titulo || "Tarefa",
          conta_nome: t.tarefa_templates?.contas_redes_sociais?.nome_conta,
          dias_atraso: differenceInDays(new Date(), new Date(t.data)),
        }));

        // Tarefas de hoje
        const { data: hojeData } = await supabase
          .from("tarefa_diaria")
          .select(`
            id,
            data,
            status,
            tarefa_templates!inner(titulo, ordem, conta_id, contas_redes_sociais(nome_conta))
          `)
          .in("semana_id", semanaIds)
          .eq("data", hoje)
          .neq("status", "concluida")
          .order("tarefa_templates(ordem)", { ascending: true });

        hojeList = (hojeData || []).map((t: any) => ({
          id: t.id,
          data: t.data,
          status: t.status,
          template_titulo: t.tarefa_templates?.titulo || "Tarefa",
          conta_nome: t.tarefa_templates?.contas_redes_sociais?.nome_conta,
        }));
      }

      // Contas precisando ação
      const { data: contasData } = await supabase
        .from("contas_redes_sociais")
        .select("id, nome_conta, plataforma, status, proxima_acao")
        .eq("nicho_id", nichoId)
        .in("status", ["limitada", "banida"])
        .order("nome_conta");

      return {
        tarefasAtrasadas: atrasadas,
        tarefasHoje: hojeList,
        contasAcao: (contasData || []) as ContaAcao[],
      };
    },
    staleTime: 1000 * 30, // 30 sec
    gcTime: 1000 * 60 * 5, // 5 min
  });
}

export function useInvalidateDashboardTarefas(nichoId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["dashboard-tarefas", nichoId] });
}
