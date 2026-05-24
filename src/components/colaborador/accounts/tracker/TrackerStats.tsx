import { useMemo } from "react";
import { AccountTask, TaskDay, currentWeekRef, todayWeekday } from "@/hooks/queries/useAccountTasks";
import { Progress } from "@/components/ui/progress";

interface Props {
  tasks: AccountTask[];
  weekDays: TaskDay[];
  allDays: TaskDay[];
}

export function TrackerStats({ tasks, weekDays, allDays }: Props) {
  const stats = useMemo(() => {
    const weekRef = currentWeekRef();
    const today = todayWeekday();
    const activeTasks = tasks.filter((t) => t.is_active);

    const todayDays = weekDays.filter((d) => d.weekday === today);
    const todaySuccess = todayDays.filter((d) => d.status === "success").length;
    const todayFailed = todayDays.filter((d) => d.status === "failed").length;
    const todayPending = activeTasks.length - todaySuccess - todayFailed;

    const weekSuccess = weekDays.filter((d) => d.status === "success").length;
    const weekFailed = weekDays.filter((d) => d.status === "failed").length;
    const weekMarkable = activeTasks.length * (today + 1);
    const weekRate = weekMarkable > 0 ? Math.round((weekSuccess / weekMarkable) * 100) : 0;

    // Streak: consecutive past days where at least one success exists
    const byDate = new Map<string, { s: number; total: number }>();
    for (const d of allDays) {
      const dateKey = `${d.week_reference}__${d.weekday}`;
      const cur = byDate.get(dateKey) ?? { s: 0, total: 0 };
      cur.total += 1;
      if (d.status === "success") cur.s += 1;
      byDate.set(dateKey, cur);
    }

    const dateFromRef = (ref: string, wd: number) => {
      const [y, m, dd] = ref.split("-").map(Number);
      const x = new Date(y, m - 1, dd);
      x.setDate(x.getDate() + wd);
      return x;
    };

    // Build list of past day keys sorted desc
    const pastKeys: { key: string; date: Date }[] = [];
    for (const k of byDate.keys()) {
      const [ref, wdStr] = k.split("__");
      const date = dateFromRef(ref, Number(wdStr));
      const now = new Date(); now.setHours(0,0,0,0);
      if (date <= now) pastKeys.push({ key: k, date });
    }
    pastKeys.sort((a, b) => b.date.getTime() - a.date.getTime());

    let currentStreak = 0;
    let bestStreak = 0;
    let running = 0;
    for (const { key } of pastKeys) {
      const v = byDate.get(key)!;
      if (v.s > 0) {
        running += 1;
        if (running > bestStreak) bestStreak = running;
      } else {
        if (currentStreak === 0) currentStreak = running === 0 ? 0 : running;
        running = 0;
      }
    }
    // currentStreak = leading run from most recent
    currentStreak = 0;
    for (const { key } of pastKeys) {
      const v = byDate.get(key)!;
      if (v.s > 0) currentStreak += 1; else break;
    }

    const totalAll = allDays.length;
    const totalSuccess = allDays.filter((d) => d.status === "success").length;
    const totalFailed = allDays.filter((d) => d.status === "failed").length;
    const consistency = totalAll > 0 ? Math.round((totalSuccess / totalAll) * 100) : 0;
    const failPct = totalAll > 0 ? Math.round((totalFailed / totalAll) * 100) : 0;

    return {
      todaySuccess, todayFailed, todayPending,
      weekSuccess, weekFailed, weekRate, currentStreak, bestStreak,
      consistency, failPct,
    };
  }, [tasks, weekDays, allDays]);

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="p-3 rounded-lg border border-border/40 bg-card/30">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );

  const Stat = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Card title="Hoje">
        <Stat label="Concluídas" value={stats.todaySuccess} color="text-emerald-400" />
        <Stat label="Pendentes" value={Math.max(stats.todayPending, 0)} />
        <Stat label="Falhas" value={stats.todayFailed} color="text-red-400" />
      </Card>
      <Card title="Semana">
        <Stat label="Verdes" value={stats.weekSuccess} color="text-emerald-400" />
        <Stat label="Vermelhos" value={stats.weekFailed} color="text-red-400" />
        <Stat label="Execução" value={`${stats.weekRate}%`} />
        <Progress value={stats.weekRate} className="h-1.5 mt-1" />
        <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
          <span>Streak: <span className="text-foreground">{stats.currentStreak}d</span></span>
          <span>Melhor: <span className="text-foreground">{stats.bestStreak}d</span></span>
        </div>
      </Card>
      <Card title="Performance">
        <Stat label="Consistência" value={`${stats.consistency}%`} color="text-emerald-400" />
        <Progress value={stats.consistency} className="h-1.5 my-1" />
        <Stat label="Falha" value={`${stats.failPct}%`} color="text-red-400" />
        <Stat label="Execução total" value={`${stats.consistency}%`} />
      </Card>
    </div>
  );
}
