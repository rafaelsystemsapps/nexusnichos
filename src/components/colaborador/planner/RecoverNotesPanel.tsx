import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { usePendingFromPreviousDays, useRecoverNotes, PlannerNote } from "@/hooks/queries/usePlannerNotes";
import { toast } from "sonner";

interface Props {
  nichoId: string;
}

export function RecoverNotesPanel({ nichoId }: Props) {
  const { data: pending = [] } = usePendingFromPreviousDays(nichoId);
  const recoverMut = useRecoverNotes(nichoId);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (pending.length === 0) return null;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleRecover = async (notes: PlannerNote[]) => {
    if (notes.length === 0) return;
    try {
      await recoverMut.mutateAsync(notes);
      toast.success(`${notes.length} nota(s) recuperada(s) para hoje`);
      setSelected(new Set());
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao recuperar");
    }
  };

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold">
            {pending.length} nota(s) não concluída(s) de dias anteriores
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRecover(pending.filter((n) => selected.has(n.id)))}
              disabled={selected.size === 0 || recoverMut.isPending}
            >
              Recuperar selecionadas ({selected.size})
            </Button>
            <Button
              size="sm"
              onClick={() => handleRecover(pending)}
              disabled={recoverMut.isPending}
            >
              Recuperar todas
            </Button>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {pending.map((n) => (
              <label
                key={n.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-muted/40 cursor-pointer"
              >
                <Checkbox
                  checked={selected.has(n.id)}
                  onCheckedChange={() => toggle(n.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">
                    {n.title || n.description || "(sem título)"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {format(new Date(n.due_day + "T00:00:00"), "dd 'de' MMM", { locale: ptBR })}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.preventDefault(); handleRecover([n]); }}
                  disabled={recoverMut.isPending}
                >
                  Recuperar
                </Button>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
