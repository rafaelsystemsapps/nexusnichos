import { useState } from "react";
import { MoreVertical, Pause, Play, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DayDot } from "./DayDot";
import {
  AccountTask, TaskDay, DayStatus,
  useSetDayStatus, useUpdateTask, useDeleteTask,
  currentWeekRef, todayWeekday, WEEKDAY_LABELS,
} from "@/hooks/queries/useAccountTasks";
import { cn } from "@/lib/utils";

interface Props {
  task: AccountTask;
  days: TaskDay[];
  nichoId: string;
}

const nextStatus = (s: DayStatus): DayStatus =>
  s === "pending" ? "success" : s === "success" ? "failed" : "pending";

export function TaskRow({ task, days, nichoId }: Props) {
  const weekRef = currentWeekRef();
  const today = todayWeekday();
  const setDay = useSetDayStatus();
  const updateMut = useUpdateTask();
  const deleteMut = useDeleteTask();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(task.task_name);

  const dayFor = (wd: number) => days.find((d) => d.task_id === task.id && d.weekday === wd && d.week_reference === weekRef);

  const handleClick = (wd: number) => {
    if (wd > today) return;
    const existing = dayFor(wd);
    const status: DayStatus = existing ? nextStatus(existing.status) : "success";
    setDay.mutate({
      task_id: task.id,
      account_id: task.account_id,
      nicho_id: nichoId,
      week_reference: weekRef,
      weekday: wd,
      status,
      existingId: existing?.id,
    });
  };

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === task.task_name) { setEditing(false); setName(task.task_name); return; }
    updateMut.mutate({ id: task.id, account_id: task.account_id, task_name: trimmed });
    setEditing(false);
  };

  return (
    <div className={cn(
      "grid grid-cols-[1fr_repeat(7,minmax(32px,1fr))_auto] items-center gap-2 py-2 px-2 rounded-md hover:bg-card/40 group",
      !task.is_active && "opacity-50",
    )}>
      <div className="min-w-0 flex items-center gap-2">
        {editing ? (
          <Input
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === "Enter" && saveName()}
            className="h-7 text-sm"
          />
        ) : (
          <span className="text-sm truncate">{task.task_name}</span>
        )}
      </div>
      {WEEKDAY_LABELS.map((_, wd) => {
        const d = dayFor(wd);
        const status: DayStatus = d?.status ?? "pending";
        return (
          <div key={wd} className="flex justify-center">
            <DayDot
              status={status}
              isToday={wd === today}
              isFuture={wd > today}
              onClick={() => handleClick(wd)}
            />
          </div>
        );
      })}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100">
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5 mr-2" /> Renomear
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateMut.mutate({ id: task.id, account_id: task.account_id, is_active: !task.is_active })}>
            {task.is_active ? <><Pause className="h-3.5 w-3.5 mr-2" /> Pausar</> : <><Play className="h-3.5 w-3.5 mr-2" /> Ativar</>}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => deleteMut.mutate({ id: task.id, account_id: task.account_id })}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Remover
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
