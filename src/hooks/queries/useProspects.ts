import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProspects(nichoId: string) {
  return useQuery({
    queryKey: ["prospects", nichoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prospects")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2, // 2 min
    gcTime: 1000 * 60 * 10, // 10 min
  });
}

export function useInvalidateProspects(nichoId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["prospects", nichoId] });
}
