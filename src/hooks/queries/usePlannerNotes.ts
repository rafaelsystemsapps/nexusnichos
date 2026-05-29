import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { useAuthReady } from "@/hooks/useAuthReady";

export type PlannerNote = {
  id: string;
  user_id: string;
  nicho_id: string;
  title: string | null;
  description: string | null;
  status: "pendente" | "concluida";
  due_day: string; // yyyy-mm-dd
  horario: string | null;
  completed_at: string | null;
  recovered_from: string | null;
  is_recovered: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export const todayStr = () => format(new Date(), "yyyy-MM-dd");

const keys = {
  day: (nichoId: string, day: string) => ["planner", nichoId, "day", day] as const,
  pendingPrev: (nichoId: string, today: string) => ["planner", nichoId, "pending-prev", today] as const,
  week: (nichoId: string, today: string) => ["planner", nichoId, "week", today] as const,
  history: (nichoId: string, from: string, to: string) => ["planner", nichoId, "history", from, to] as const,
};

function invalidateAll(qc: ReturnType<typeof useQueryClient>, nichoId: string) {
  qc.invalidateQueries({ queryKey: ["planner", nichoId] });
}

export function useNotesByDay(nichoId: string, day: string = todayStr()) {
  const { ready } = useAuthReady();
  return useQuery({
    queryKey: keys.day(nichoId, day),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planner_notes")
        .select("*")
        .eq("nicho_id", nichoId)
        .eq("due_day", day)
        .eq("archived", false)
        .order("horario", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PlannerNote[];
    },
    enabled: !!nichoId,
  });
}

export function usePendingFromPreviousDays(nichoId: string, today: string = todayStr()) {
  return useQuery({
    queryKey: keys.pendingPrev(nichoId, today),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planner_notes")
        .select("*")
        .eq("nicho_id", nichoId)
        .eq("status", "pendente")
        .eq("archived", false)
        .lt("due_day", today)
        .order("due_day", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as PlannerNote[];
    },
    enabled: !!nichoId,
  });
}

export function useWeekStats(nichoId: string, today: string = todayStr()) {
  return useQuery({
    queryKey: keys.week(nichoId, today),
    queryFn: async () => {
      const from = format(subDays(new Date(), 6), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("planner_notes")
        .select("status,is_recovered,due_day")
        .eq("nicho_id", nichoId)
        .eq("archived", false)
        .gte("due_day", from)
        .lte("due_day", today);
      if (error) throw error;
      const rows = data ?? [];
      const concluidas = rows.filter((r) => r.status === "concluida").length;
      const recuperadas = rows.filter((r) => r.is_recovered).length;
      const total = rows.length;
      const produtividade = total > 0 ? Math.round((concluidas / total) * 100) : 0;
      return { concluidas, recuperadas, total, produtividade };
    },
    enabled: !!nichoId,
  });
}

export function useHistory(nichoId: string, days = 30) {
  const today = todayStr();
  const from = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
  return useQuery({
    queryKey: keys.history(nichoId, from, today),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planner_notes")
        .select("*")
        .eq("nicho_id", nichoId)
        .eq("archived", false)
        .gte("due_day", from)
        .lte("due_day", today)
        .order("due_day", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as PlannerNote[];
      const byDay = new Map<string, PlannerNote[]>();
      rows.forEach((r) => {
        const arr = byDay.get(r.due_day) ?? [];
        arr.push(r);
        byDay.set(r.due_day, arr);
      });
      return Array.from(byDay.entries()).map(([day, notes]) => ({
        day,
        notes,
        criadas: notes.length,
        concluidas: notes.filter((n) => n.status === "concluida").length,
        pendentes: notes.filter((n) => n.status === "pendente").length,
        recuperadas: notes.filter((n) => n.is_recovered).length,
      }));
    },
    enabled: !!nichoId,
  });
}

export function useCreateNote(nichoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title?: string | null;
      description?: string | null;
      horario?: string | null;
      due_day?: string;
      recovered_from?: string | null;
      is_recovered?: boolean;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      if (!user_id) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("planner_notes")
        .insert({
          user_id,
          nicho_id: nichoId,
          title: payload.title ?? null,
          description: payload.description ?? null,
          horario: payload.horario ?? null,
          due_day: payload.due_day ?? todayStr(),
          recovered_from: payload.recovered_from ?? null,
          is_recovered: payload.is_recovered ?? false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as PlannerNote;
    },
    onSuccess: () => invalidateAll(qc, nichoId),
  });
}

export function useUpdateNote(nichoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<PlannerNote, "title" | "description" | "horario" | "status" | "completed_at" | "archived">>;
    }) => {
      const { data, error } = await supabase
        .from("planner_notes")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as PlannerNote;
    },
    onSuccess: () => invalidateAll(qc, nichoId),
  });
}

export function useToggleNote(nichoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: PlannerNote) => {
      const isDone = note.status === "concluida";
      const { data, error } = await supabase
        .from("planner_notes")
        .update({
          status: isDone ? "pendente" : "concluida",
          completed_at: isDone ? null : new Date().toISOString(),
        })
        .eq("id", note.id)
        .select()
        .single();
      if (error) throw error;
      return data as PlannerNote;
    },
    onSuccess: () => invalidateAll(qc, nichoId),
  });
}

export function useDeleteNote(nichoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("planner_notes").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => invalidateAll(qc, nichoId),
  });
}

export function useRecoverNotes(nichoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notes: PlannerNote[]) => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user?.id;
      if (!user_id) throw new Error("Não autenticado");
      const today = todayStr();
      const payload = notes.map((n) => ({
        user_id,
        nicho_id: nichoId,
        title: n.title,
        description: n.description,
        horario: n.horario,
        due_day: today,
        recovered_from: n.id,
        is_recovered: true,
      }));
      const { data, error } = await supabase.from("planner_notes").insert(payload).select();
      if (error) throw error;
      return data as PlannerNote[];
    },
    onSuccess: () => invalidateAll(qc, nichoId),
  });
}
