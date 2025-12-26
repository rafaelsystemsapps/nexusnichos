import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useNicho(nichoId: string | undefined) {
  return useQuery({
    queryKey: ["nicho", nichoId],
    queryFn: async () => {
      if (!nichoId) return null;
      const { data, error } = await supabase
        .from("nichos")
        .select("*")
        .eq("id", nichoId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!nichoId,
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 30, // 30 min
  });
}

export function useInvalidateNicho(nichoId: string | undefined) {
  const queryClient = useQueryClient();
  return () => {
    if (nichoId) {
      queryClient.invalidateQueries({ queryKey: ["nicho", nichoId] });
    }
  };
}
