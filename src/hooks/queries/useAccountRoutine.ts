import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface RoutineItem {
  id: string;
  account_id: string;
  nicho_id: string;
  title: string;
  status: "pendente" | "concluida";
  completed_at: string | null;
  order: number;
  recurring: boolean;
}

const todayStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export function useRoutineItems(accountId: string | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["routine", accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("account_routine_items")
        .select("*")
        .eq("account_id", accountId)
        .order("order", { ascending: true });
      if (error) throw error;
      return (data || []) as RoutineItem[];
    },
  });

  // Daily reset for recurring items
  useEffect(() => {
    if (!query.data || !accountId) return;
    const today = todayStr();
    const toReset = query.data.filter(
      (i) => i.recurring && i.status === "concluida" && i.completed_at && i.completed_at.slice(0, 10) < today
    );
    if (toReset.length === 0) return;
    (async () => {
      await (supabase as any)
        .from("account_routine_items")
        .update({ status: "pendente", completed_at: null })
        .in("id", toReset.map((i) => i.id));
      qc.invalidateQueries({ queryKey: ["routine", accountId] });
    })();
  }, [query.data, accountId, qc]);

  return query;
}

export function useCreateRoutineItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { account_id: string; nicho_id: string; title: string; recurring?: boolean }) => {
      const { error } = await (supabase as any).from("account_routine_items").insert({
        account_id: input.account_id,
        nicho_id: input.nicho_id,
        title: input.title,
        recurring: input.recurring ?? true,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["routine", vars.account_id] }),
  });
}

export function useToggleRoutineItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: RoutineItem) => {
      const newStatus = item.status === "concluida" ? "pendente" : "concluida";
      const { error } = await (supabase as any)
        .from("account_routine_items")
        .update({
          status: newStatus,
          completed_at: newStatus === "concluida" ? new Date().toISOString() : null,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: (_, item) => {
      qc.invalidateQueries({ queryKey: ["routine", item.account_id] });
      qc.invalidateQueries({ queryKey: ["account_logs", item.account_id] });
    },
  });
}

export function useDeleteRoutineItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; account_id: string }) => {
      const { error } = await (supabase as any).from("account_routine_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["routine", vars.account_id] }),
  });
}
