import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo } from "react";

export type DayStatus = "pending" | "success" | "failed";

export interface AccountTask {
  id: string;
  account_id: string;
  nicho_id: string;
  user_id: string;
  task_name: string;
  is_active: boolean;
  created_at: string;
}

export interface TaskDay {
  id: string;
  task_id: string;
  account_id: string;
  nicho_id: string;
  week_reference: string; // YYYY-MM-DD (Monday)
  weekday: number; // 0=Mon..6=Sun
  status: DayStatus;
  completed_at: string | null;
}

// Monday-based weekday (0..6)
export function weekdayMon(d: Date) {
  const dow = d.getDay(); // 0=Sun..6=Sat
  return (dow + 6) % 7;
}

export function weekStartMonday(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const diff = weekdayMon(x);
  x.setDate(x.getDate() - diff);
  return x;
}

export function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function currentWeekRef() {
  return toDateStr(weekStartMonday(new Date()));
}

export function todayWeekday() {
  return weekdayMon(new Date());
}

export const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function useAccountTasks(accountId: string | undefined) {
  return useQuery({
    queryKey: ["account_tasks", accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("account_tasks")
        .select("*")
        .eq("account_id", accountId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as AccountTask[];
    },
  });
}

export function useTaskDays(accountId: string | undefined, weekRef: string) {
  return useQuery({
    queryKey: ["account_task_days", accountId, weekRef],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("account_task_days")
        .select("*")
        .eq("account_id", accountId)
        .eq("week_reference", weekRef);
      if (error) throw error;
      return (data || []) as TaskDay[];
    },
  });
}

export function useAllTaskDays(accountId: string | undefined) {
  return useQuery({
    queryKey: ["account_task_days_all", accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("account_task_days")
        .select("*")
        .eq("account_id", accountId)
        .order("week_reference", { ascending: false });
      if (error) throw error;
      return (data || []) as TaskDay[];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { account_id: string; nicho_id: string; task_name: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Não autenticado");
      const { error } = await (supabase as any).from("account_tasks").insert({
        account_id: input.account_id,
        nicho_id: input.nicho_id,
        user_id: uid,
        task_name: input.task_name,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["account_tasks", v.account_id] });
      qc.invalidateQueries({ queryKey: ["accounts_op_status"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; account_id: string; task_name?: string; is_active?: boolean }) => {
      const patch: any = {};
      if (input.task_name !== undefined) patch.task_name = input.task_name;
      if (input.is_active !== undefined) patch.is_active = input.is_active;
      const { error } = await (supabase as any).from("account_tasks").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["account_tasks", v.account_id] });
      qc.invalidateQueries({ queryKey: ["accounts_op_status"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; account_id: string }) => {
      await (supabase as any).from("account_task_days").delete().eq("task_id", input.id);
      const { error } = await (supabase as any).from("account_tasks").delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["account_tasks", v.account_id] });
      qc.invalidateQueries({ queryKey: ["account_task_days", v.account_id] });
      qc.invalidateQueries({ queryKey: ["account_task_days_all", v.account_id] });
      qc.invalidateQueries({ queryKey: ["accounts_op_status"] });
    },
  });
}

export function useSetDayStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      task_id: string;
      account_id: string;
      nicho_id: string;
      week_reference: string;
      weekday: number;
      status: DayStatus;
      existingId?: string;
    }) => {
      if (input.existingId) {
        const { error } = await (supabase as any)
          .from("account_task_days")
          .update({
            status: input.status,
            completed_at: input.status === "success" ? new Date().toISOString() : null,
          })
          .eq("id", input.existingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("account_task_days").insert({
          task_id: input.task_id,
          account_id: input.account_id,
          nicho_id: input.nicho_id,
          week_reference: input.week_reference,
          weekday: input.weekday,
          status: input.status,
          completed_at: input.status === "success" ? new Date().toISOString() : null,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["account_task_days", v.account_id, v.week_reference] });
      qc.invalidateQueries({ queryKey: ["account_task_days_all", v.account_id] });
      qc.invalidateQueries({ queryKey: ["accounts_op_status"] });
    },
  });
}

// Auto-fail past pendings in current week
export function useAutoFailPastPendings(
  accountId: string | undefined,
  nichoId: string,
  tasks: AccountTask[],
  days: TaskDay[],
) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!accountId || tasks.length === 0) return;
    const weekRef = currentWeekRef();
    const today = todayWeekday();
    if (today === 0) return; // Monday: no past days in current week

    (async () => {
      const inserts: any[] = [];
      const updates: string[] = [];

      for (const task of tasks) {
        if (!task.is_active) continue;
        for (let wd = 0; wd < today; wd++) {
          const existing = days.find(
            (d) => d.task_id === task.id && d.week_reference === weekRef && d.weekday === wd,
          );
          if (!existing) {
            inserts.push({
              task_id: task.id,
              account_id: accountId,
              nicho_id: nichoId,
              week_reference: weekRef,
              weekday: wd,
              status: "failed",
            });
          } else if (existing.status === "pending") {
            updates.push(existing.id);
          }
        }
      }

      if (inserts.length === 0 && updates.length === 0) return;

      if (inserts.length > 0) {
        await (supabase as any).from("account_task_days").insert(inserts);
      }
      if (updates.length > 0) {
        await (supabase as any)
          .from("account_task_days")
          .update({ status: "failed" })
          .in("id", updates);
      }
      qc.invalidateQueries({ queryKey: ["account_task_days", accountId, weekRef] });
      qc.invalidateQueries({ queryKey: ["account_task_days_all", accountId] });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, tasks, days]);
}

export type OperationalStatus = "pending" | "completed" | "neutral";

/**
 * Derives today's operational status per account in a niche.
 * One batched query for active tasks + today's task_days.
 */
export function useAccountsOperationalStatus(nichoId: string | undefined) {
  return useQuery({
    queryKey: ["accounts_op_status", nichoId, currentWeekRef(), todayWeekday()],
    enabled: !!nichoId,
    staleTime: 30_000,
    queryFn: async () => {
      const weekRef = currentWeekRef();
      const today = todayWeekday();

      const { data: tasks, error: tErr } = await (supabase as any)
        .from("account_tasks")
        .select("id, account_id, is_active")
        .eq("nicho_id", nichoId)
        .eq("is_active", true);
      if (tErr) throw tErr;

      const taskList = (tasks || []) as { id: string; account_id: string }[];
      const map = new Map<string, OperationalStatus>();
      if (taskList.length === 0) return map;

      const taskIds = taskList.map((t) => t.id);
      const { data: days, error: dErr } = await (supabase as any)
        .from("account_task_days")
        .select("task_id, account_id, status")
        .eq("week_reference", weekRef)
        .eq("weekday", today)
        .in("task_id", taskIds);
      if (dErr) throw dErr;

      const dayList = (days || []) as { task_id: string; account_id: string; status: DayStatus }[];

      const byAccount = new Map<string, string[]>();
      for (const t of taskList) {
        const arr = byAccount.get(t.account_id) || [];
        arr.push(t.id);
        byAccount.set(t.account_id, arr);
      }

      for (const [accountId, tIds] of byAccount.entries()) {
        let hasPending = false;
        let allSuccess = true;
        for (const tid of tIds) {
          const day = dayList.find((d) => d.task_id === tid && d.account_id === accountId);
          const status = day?.status ?? "pending";
          if (status === "pending") hasPending = true;
          if (status !== "success") allSuccess = false;
        }
        if (hasPending) map.set(accountId, "pending");
        else if (allSuccess) map.set(accountId, "completed");
        else map.set(accountId, "neutral");
      }

      return map;
    },
  });
}

