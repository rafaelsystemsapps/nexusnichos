import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AccountTask, TaskDay, WEEKDAY_LABELS, currentWeekRef } from "@/hooks/queries/useAccountTasks";
import { DayDot } from "./DayDot";

interface Props {
  tasks: AccountTask[];
  allDays: TaskDay[];
}

export function TrackerHistory({ tasks, allDays }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const weeks = useMemo(() => {
    const cur = currentWeekRef();
    const byWeek = new Map<string, TaskDay[]>();
    for (const d of allDays) {
      if (d.week_reference === cur) continue;
      const arr = byWeek.get(d.week_reference) ?? [];
      arr.push(d);
      byWeek.set(d.week_reference, arr);
    }
    return Array.from(byWeek.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 8)
      .map(([ref, days]) => {
        const success = days.filter((d) => d.status === "success").length;
        const failed = days.filter((d) => d.status === "failed").length;
        const total = days.length;
        const rate = total > 0 ? Math.round((success / total) * 100) : 0;
        return { ref, days, success, failed, total, rate };
      });
  }, [allDays]);

  if (weeks.length === 0) return null;

  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    const end = new Date(start); end.setDate(end.getDate() + 6);
    const f = (x: Date) => `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}`;
    return `${f(start)} – ${f(end)}`;
  };

  return (
    <div className="p-3 rounded-lg border border-border/40 bg-card/20">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium w-full"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Semanas anteriores ({weeks.length})
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {weeks.map((w) => (
            <div key={w.ref} className="border border-border/30 rounded-md">
              <button
                type="button"
                onClick={() => setExpanded(expanded === w.ref ? null : w.ref)}
                className="w-full flex items-center justify-between p-2 text-xs hover:bg-card/40"
              >
                <span>{fmt(w.ref)}</span>
                <span className="flex gap-3 text-muted-foreground">
                  <span className="text-emerald-400">✓ {w.success}</span>
                  <span className="text-red-400">✕ {w.failed}</span>
                  <span>{w.rate}%</span>
                </span>
              </button>
              {expanded === w.ref && (
                <div className="p-2 border-t border-border/30 space-y-1">
                  {tasks.map((t) => (
                    <div key={t.id} className="grid grid-cols-[1fr_repeat(7,minmax(28px,1fr))] gap-2 items-center py-1">
                      <span className="text-xs truncate">{t.task_name}</span>
                      {WEEKDAY_LABELS.map((_, wd) => {
                        const d = w.days.find((x) => x.task_id === t.id && x.weekday === wd);
                        return (
                          <div key={wd} className="flex justify-center">
                            <DayDot status={d?.status ?? "pending"} readOnly />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
