import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";

export function useNicho(nichoId: string | undefined) {
  const { ready } = useAuthReady();
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
    enabled: ready && !!nichoId,
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
