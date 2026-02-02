import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClienteAppConsolidado {
  id: string;
  cliente_id: string;
  nome_app: string;
  valor: number;
  periodicidade: string;
  ativo: boolean;
}

export interface ClienteComCustos {
  cliente_id: string;
  cliente_nome: string;
  cliente_status: string;
  valor_contrato: number | null;
  modelo_pagamento: string | null;
  ticket_valor: number | null;
  dominios: ClienteAppConsolidado[];
  custo_mensal: number;
}

export function useAllClienteApps(nichoId: string) {
  return useQuery({
    queryKey: ["all-cliente-apps", nichoId],
    queryFn: async () => {
      // Buscar todos os domínios do nicho
      const { data: apps, error: appsError } = await supabase
        .from("client_apps")
        .select("id, cliente_id, nome_app, valor, periodicidade, ativo")
        .eq("nicho_id", nichoId)
        .eq("ativo", true);

      if (appsError) throw appsError;

      // Buscar todos os clientes do nicho
      const { data: clientes, error: clientesError } = await supabase
        .from("clientes")
        .select("id, nome, status, valor_contrato, modelo_pagamento, ticket_valor")
        .eq("nicho_id", nichoId);

      if (clientesError) throw clientesError;

      // Agrupar domínios por cliente e calcular custos
      const clientesComCustos: ClienteComCustos[] = clientes.map((cliente) => {
        const clienteDominios = apps.filter((app) => app.cliente_id === cliente.id);
        
        // Calcular custo mensal
        const custoMensal = clienteDominios.reduce((acc, app) => {
          if (app.periodicidade === "mensal") return acc + app.valor;
          if (app.periodicidade === "anual") return acc + app.valor / 12;
          return acc; // único não conta no mensal
        }, 0);

        return {
          cliente_id: cliente.id,
          cliente_nome: cliente.nome,
          cliente_status: cliente.status,
          valor_contrato: cliente.valor_contrato,
          modelo_pagamento: cliente.modelo_pagamento,
          ticket_valor: cliente.ticket_valor,
          dominios: clienteDominios,
          custo_mensal: custoMensal,
        };
      });

      // Calcular totais
      const totais = {
        custo_mensal_total: clientesComCustos.reduce((acc, c) => acc + c.custo_mensal, 0),
        total_dominios: apps.length,
        clientes_com_dominios: clientesComCustos.filter((c) => c.dominios.length > 0).length,
      };

      return {
        clientes: clientesComCustos,
        totais,
      };
    },
    enabled: !!nichoId,
  });
}
