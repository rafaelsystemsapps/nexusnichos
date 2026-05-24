import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AccountLog {
  id: string;
  account_id: string;
  nicho_id: string;
  user_id: string;
  action_type: string;
  description: string | null;
  created_at: string;
}

export function useAccountLogs(accountId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ["account_logs", accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("account_logs")
        .select("*")
        .eq("account_id", accountId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as AccountLog[];
    },
  });
}

export function useCreateAccountLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      account_id: string;
      nicho_id: string;
      action_type: string;
      description?: string | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      if (!user_id) throw new Error("Não autenticado");
      const { error } = await (supabase as any).from("account_logs").insert({
        account_id: input.account_id,
        nicho_id: input.nicho_id,
        user_id,
        action_type: input.action_type,
        description: input.description || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["account_logs", vars.account_id] }),
  });
}
