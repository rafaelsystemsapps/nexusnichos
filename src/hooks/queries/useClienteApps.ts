import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CategoriaClienteApp = "dominio" | "assinatura" | "licenca" | "outro";

export interface ClienteApp {
  id: string;
  cliente_id: string;
  nicho_id: string;
  nome_app: string;
  tipo_custo: "recorrente" | "estrutura";
  valor: number;
  periodicidade: "mensal" | "anual" | "unico";
  rateio: "exclusivo" | "compartilhado";
  observacao: string | null;
  mapa_mental_url: string | null;
  ativo: boolean;
  categoria: CategoriaClienteApp;
  created_at: string;
  updated_at: string;
}

export type ClienteAppInsert = Omit<ClienteApp, "id" | "created_at" | "updated_at">;
export type ClienteAppUpdate = Partial<ClienteAppInsert> & { id: string };

// Hook para buscar apps de um cliente
export function useClienteApps(clienteId: string) {
  return useQuery({
    queryKey: ["cliente-apps", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_apps")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ClienteApp[];
    },
    enabled: !!clienteId,
  });
}

// Hook para criar app
export function useCreateClienteApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (app: ClienteAppInsert) => {
      const { data, error } = await supabase
        .from("client_apps")
        .insert(app)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cliente-apps", variables.cliente_id] });
      queryClient.invalidateQueries({ queryKey: ["all-cliente-apps", variables.nicho_id] });
      toast.success("App adicionado");
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar app: " + error.message);
    },
  });
}

// Hook para atualizar app
export function useUpdateClienteApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ClienteAppUpdate) => {
      const { data, error } = await supabase
        .from("client_apps")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cliente-apps", data.cliente_id] });
      queryClient.invalidateQueries({ queryKey: ["all-cliente-apps", data.nicho_id] });
      toast.success("App atualizado");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar app: " + error.message);
    },
  });
}

// Hook para deletar app
export function useDeleteClienteApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clienteId, nichoId }: { id: string; clienteId: string; nichoId: string }) => {
      const { error } = await supabase
        .from("client_apps")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { clienteId, nichoId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["cliente-apps", result.clienteId] });
      queryClient.invalidateQueries({ queryKey: ["all-cliente-apps", result.nichoId] });
      toast.success("App removido");
    },
    onError: (error: any) => {
      toast.error("Erro ao remover app: " + error.message);
    },
  });
}

// Função de cálculo de custo mensal
export function calcularCustoMensal(apps: ClienteApp[]): number {
  return apps
    .filter((a) => a.ativo)
    .reduce((acc, a) => {
      if (a.periodicidade === "mensal") return acc + a.valor;
      if (a.periodicidade === "anual") return acc + a.valor / 12;
      return acc; // único não conta no mensal
    }, 0);
}
