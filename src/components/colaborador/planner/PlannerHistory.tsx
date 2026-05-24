import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useHistory } from "@/hooks/queries/usePlannerNotes";
import { cn } from "@/lib/utils";

interface Props {
  nichoId: string;
}

export function PlannerHistory({ nichoId }: Props) {
  const { data: days = [] } = useHistory(nichoId, 30);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (days.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Sem histórico ainda.</p>;
  }

  const toggle = (day: string) => {
    const next = new Set(expanded);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    setExpanded(next);
  };

  return (
    <div className="space-y-2">
      {days.map((d) => {
        const isOpen = expanded.has(d.day);
        return (
          <div key={d.day} className="rounded-lg border border-border bg-card">
            <button
              onClick={() => toggle(d.day)}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3 text-sm">
                <span className="font-semibold">
                  {format(new Date(d.day + "T00:00:00"), "dd 'de' MMM", { locale: ptBR })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {d.criadas} criadas · {d.concluidas} concluídas · {d.pendentes} pendentes
                  {d.recuperadas > 0 && ` · ${d.recuperadas} recuperadas`}
                </span>
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isOpen && (
              <div className="border-t border-border px-3 py-2 space-y-1">
                {d.notes.map((n) => (
                  <div key={n.id} className="flex items-center gap-2 text-xs py-1">
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      n.status === "concluida" ? "bg-green-500" : "bg-muted-foreground",
                    )} />
                    <span className={cn("flex-1 truncate", n.status === "concluida" && "line-through opacity-60")}>
                      {n.title || n.description || "(sem título)"}
                    </span>
                    {n.is_recovered && (
                      <span className="text-[10px] text-primary/80">recuperada</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
