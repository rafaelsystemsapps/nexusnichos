import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useClientes(nichoId: string) {
  return useQuery({
    queryKey: ["clientes", nichoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2, // 2 min
    gcTime: 1000 * 60 * 10, // 10 min
  });
}

export function useUpdateClienteOrdem(nichoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; ordem: number }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("clientes")
          .update({ ordem: update.ordem })
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar ordem: " + error.message);
      queryClient.invalidateQueries({ queryKey: ["clientes", nichoId] });
    },
  });
}

export function useInvalidateClientes(nichoId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["clientes", nichoId] });
}
