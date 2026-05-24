import { CheckCircle2, Circle, Clock, Pencil, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlannerNote, useToggleNote, useDeleteNote } from "@/hooks/queries/usePlannerNotes";
import { toast } from "sonner";

interface Props {
  nichoId: string;
  note: PlannerNote;
  onEdit: (note: PlannerNote) => void;
}

export function StickyNoteCard({ nichoId, note, onEdit }: Props) {
  const toggleMut = useToggleNote(nichoId);
  const deleteMut = useDeleteNote(nichoId);
  const done = note.status === "concluida";

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleMut.mutateAsync(note);
    } catch (err: any) {
      toast.error(err.message ?? "Erro");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Excluir esta nota?")) return;
    try {
      await deleteMut.mutateAsync(note.id);
      toast.success("Nota removida");
    } catch (err: any) {
      toast.error(err.message ?? "Erro");
    }
  };

  return (
    <div
      onClick={() => onEdit(note)}
      className={cn(
        "group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-sm transition-all cursor-pointer min-h-[140px]",
        "hover:shadow-md hover:-translate-y-0.5 hover:border-primary/40",
        done && "opacity-50",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={handleToggle}
          className={cn(
            "shrink-0 mt-0.5 transition-colors",
            done ? "text-green-500" : "text-muted-foreground hover:text-foreground",
          )}
          aria-label={done ? "Marcar como pendente" : "Marcar como concluída"}
        >
          {done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
        </button>
        <div className="flex-1 min-w-0">
          {note.title && (
            <h4 className={cn("text-sm font-semibold leading-tight", done && "line-through")}>
              {note.title}
            </h4>
          )}
          {note.description && (
            <p className={cn("text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-words", done && "line-through")}>
              {note.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          {note.horario && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {note.horario.slice(0, 5)}
            </span>
          )}
          {note.is_recovered && (
            <span className="flex items-center gap-1 text-primary/80">
              <RotateCcw className="h-3 w-3" />
              recuperada
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(note); }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
            aria-label="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
