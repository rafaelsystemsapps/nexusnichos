import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface FerramentaTrabalho {
  id: string;
  nicho_id: string;
  nome: string;
  valor: number;
  periodicidade: "mensal" | "anual";
  categoria: string | null;
  ativo: boolean;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

export type FerramentaTrabalhoInsert = Omit<FerramentaTrabalho, "id" | "created_at" | "updated_at">;
export type FerramentaTrabalhoUpdate = Partial<FerramentaTrabalhoInsert>;

export function useFerramentasTrabalho(nichoId: string | undefined) {
  return useQuery({
    queryKey: ["ferramentas-trabalho", nichoId],
    queryFn: async () => {
      if (!nichoId) return [];
      
      const { data, error } = await supabase
        .from("ferramentas_trabalho")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("nome");

      if (error) throw error;
      return data as FerramentaTrabalho[];
    },
    enabled: !!nichoId,
  });
}

export function useCreateFerramentaTrabalho() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ferramenta: FerramentaTrabalhoInsert) => {
      const { data, error } = await supabase
        .from("ferramentas_trabalho")
        .insert(ferramenta)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ferramentas-trabalho", variables.nicho_id] });
      toast({ title: "Ferramenta adicionada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao adicionar ferramenta", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateFerramentaTrabalho() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nichoId, ...updates }: FerramentaTrabalhoUpdate & { id: string; nichoId: string }) => {
      const { data, error } = await supabase
        .from("ferramentas_trabalho")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ferramentas-trabalho", variables.nichoId] });
      toast({ title: "Ferramenta atualizada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar ferramenta", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteFerramentaTrabalho() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nichoId }: { id: string; nichoId: string }) => {
      const { error } = await supabase
        .from("ferramentas_trabalho")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ferramentas-trabalho", variables.nichoId] });
      toast({ title: "Ferramenta removida com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao remover ferramenta", description: error.message, variant: "destructive" });
    },
  });
}

// Helper para calcular custo mensal total
export function calcularCustoMensalFerramentas(ferramentas: FerramentaTrabalho[]): number {
  return ferramentas
    .filter((f) => f.ativo)
    .reduce((acc, f) => {
      const valorMensal = f.periodicidade === "anual" ? f.valor / 12 : f.valor;
      return acc + valorMensal;
    }, 0);
}
