import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClienteAppConsolidado {
  id: string;
  cliente_id: string;
  nome_app: string;
  valor: number;
  tipo_custo: string;
  periodicidade: string;
  rateio: string;
  ativo: boolean;
  observacao: string | null;
}

export interface ClienteComCustos {
  cliente_id: string;
  cliente_nome: string;
  cliente_status: string;
  valor_contrato: number | null;
  modelo_pagamento: string | null;
  ticket_valor: number | null;
  apps: ClienteAppConsolidado[];
  custo_mensal: number;
  custo_estrutural: number;
  margem_bruta: number;
}

export function useAllClienteApps(nichoId: string) {
  return useQuery({
    queryKey: ["all-cliente-apps", nichoId],
    queryFn: async () => {
      // Buscar todos os client_apps do nicho
      const { data: apps, error: appsError } = await supabase
        .from("client_apps")
        .select("*")
        .eq("nicho_id", nichoId)
        .eq("ativo", true);

      if (appsError) throw appsError;

      // Buscar todos os clientes do nicho (incluindo ticket_valor)
      const { data: clientes, error: clientesError } = await supabase
        .from("clientes")
        .select("id, nome, status, valor_contrato, modelo_pagamento, ticket_valor")
        .eq("nicho_id", nichoId);

      if (clientesError) throw clientesError;

      // Agrupar apps por cliente e calcular custos
      const clientesComCustos: ClienteComCustos[] = clientes.map((cliente) => {
        const clienteApps = apps.filter((app) => app.cliente_id === cliente.id);
        
        // Calcular custo mensal (recorrente)
        const custoMensal = clienteApps
          .filter((app) => app.tipo_custo === "recorrente")
          .reduce((acc, app) => {
            let valorMensal = app.valor;
            if (app.periodicidade === "anual") {
              valorMensal = app.valor / 12;
            }
            return acc + valorMensal;
          }, 0);

        // Calcular custo estrutural (único)
        const custoEstrutural = clienteApps
          .filter((app) => app.tipo_custo === "estrutural")
          .reduce((acc, app) => acc + app.valor, 0);

        // Calcular margem bruta (só para valor_fixo)
        let margemBruta = 0;
        if (cliente.valor_contrato && cliente.modelo_pagamento === "valor_fixo") {
          margemBruta = cliente.valor_contrato - custoMensal;
        }

        return {
          cliente_id: cliente.id,
          cliente_nome: cliente.nome,
          cliente_status: cliente.status,
          valor_contrato: cliente.valor_contrato,
          modelo_pagamento: cliente.modelo_pagamento,
          ticket_valor: cliente.ticket_valor,
          apps: clienteApps,
          custo_mensal: custoMensal,
          custo_estrutural: custoEstrutural,
          margem_bruta: margemBruta,
        };
      });

      // Calcular totais
      const totais = {
        custo_mensal_total: clientesComCustos.reduce((acc, c) => acc + c.custo_mensal, 0),
        custo_estrutural_total: clientesComCustos.reduce((acc, c) => acc + c.custo_estrutural, 0),
        margem_bruta_total: clientesComCustos.reduce((acc, c) => acc + c.margem_bruta, 0),
        total_apps: apps.length,
        clientes_com_apps: clientesComCustos.filter((c) => c.apps.length > 0).length,
      };

      return {
        clientes: clientesComCustos,
        totais,
      };
    },
    enabled: !!nichoId,
  });
}
