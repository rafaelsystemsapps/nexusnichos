import { useNotesByDay, useWeekStats, todayStr } from "@/hooks/queries/usePlannerNotes";

interface Props {
  nichoId: string;
}

function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-bold leading-tight">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

export function PlannerStats({ nichoId }: Props) {
  const today = todayStr();
  const { data: todayNotes = [] } = useNotesByDay(nichoId, today);
  const { data: week } = useWeekStats(nichoId, today);

  const criadasHoje = todayNotes.length;
  const concluidasHoje = todayNotes.filter((n) => n.status === "concluida").length;
  const pendentesHoje = todayNotes.filter((n) => n.status === "pendente").length;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Hoje</div>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Criadas" value={criadasHoje} />
          <StatCard label="Concluídas" value={concluidasHoje} />
          <StatCard label="Pendentes" value={pendentesHoje} />
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Semana</div>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Concluídas" value={week?.concluidas ?? 0} />
          <StatCard label="Recuperadas" value={week?.recuperadas ?? 0} />
          <StatCard label="Produtividade" value={`${week?.produtividade ?? 0}%`} />
        </div>
      </div>
    </div>
  );
}
