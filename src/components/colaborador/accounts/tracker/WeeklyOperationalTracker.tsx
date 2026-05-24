import { useEffect, useMemo, useState } from "react";
import {
  useAccountTasks, useTaskDays, useAllTaskDays, useAutoFailPastPendings,
  currentWeekRef, WEEKDAY_LABELS, todayWeekday,
} from "@/hooks/queries/useAccountTasks";
import { TrackerHeader, FilterKey } from "./TrackerHeader";
import { TaskRow } from "./TaskRow";
import { AddTaskInline } from "./AddTaskInline";
import { TrackerStats } from "./TrackerStats";
import { TrackerHistory } from "./TrackerHistory";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { History } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  accountId: string;
  nichoId: string;
}

export function WeeklyOperationalTracker({ accountId, nichoId }: Props) {
  const weekRef = currentWeekRef();
  const today = todayWeekday();
  const { data: tasks = [] } = useAccountTasks(accountId);
  const { data: weekDays = [] } = useTaskDays(accountId, weekRef);
  const { data: allDays = [] } = useAllTaskDays(accountId);

  useAutoFailPastPendings(accountId, nichoId, tasks, weekDays);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  // Tick at midnight to refresh
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((v) => v + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.task_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "active" && !t.is_active) return false;
      if (filter === "inactive" && t.is_active) return false;
      if (filter === "week_success") {
        const has = weekDays.some((d) => d.task_id === t.id && d.status === "success");
        if (!has) return false;
      }
      if (filter === "week_failed") {
        const has = weekDays.some((d) => d.task_id === t.id && d.status === "failed");
        if (!has) return false;
      }
      return true;
    });
  }, [tasks, weekDays, filter, search]);

  return (
    <div className="space-y-5 p-5 md:p-6 rounded-lg border border-border/40 bg-card/30">
      {/* Micro briefing */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground/80">Como funciona</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Adicione tarefas recorrentes e marque sua execução durante a semana.
          Pendências ajudam a visualizar o que ainda precisa ser feito por conta.
        </p>
      </div>

      <TrackerHeader filter={filter} onFilter={setFilter} search={search} onSearch={setSearch} />

      <div>
        <div className="grid grid-cols-[1fr_repeat(7,minmax(36px,1fr))_auto] gap-2 px-2 pb-1 border-b border-border/30 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span>Tarefa</span>
          {WEEKDAY_LABELS.map((l, i) => (
            <span key={l} className={cn("text-center", i === today && "text-primary font-medium")}>{l}</span>
          ))}
          <span className="w-7" />
        </div>

        <div className="divide-y divide-border/20">
          {filtered.map((t) => (
            <TaskRow key={t.id} task={t} days={weekDays} nichoId={nichoId} />
          ))}
        </div>

        {filtered.length === 0 && tasks.length > 0 && (
          <p className="text-xs text-muted-foreground py-3 px-2">Nenhuma tarefa para esse filtro.</p>
        )}
        {tasks.length === 0 && (
          <p className="text-xs text-muted-foreground py-3 px-2">
            Adicione sua primeira tarefa operacional recorrente abaixo.
          </p>
        )}

        <AddTaskInline accountId={accountId} nichoId={nichoId} />
      </div>

      <TrackerStats tasks={tasks} weekDays={weekDays} allDays={allDays} />

      {tasks.length > 0 && (
        <div className="flex justify-end pt-1">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                <History className="h-3.5 w-3.5 mr-1.5" /> Ver histórico
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Histórico de execução</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <TrackerHistory tasks={tasks} allDays={allDays} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}

