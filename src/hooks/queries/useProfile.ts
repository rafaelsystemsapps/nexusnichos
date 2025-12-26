import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("nome, avatar_emoji, avatar_color")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 30, // 30 min
  });
}

export function useInvalidateProfile(userId: string | undefined) {
  const queryClient = useQueryClient();
  return () => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    }
  };
}
