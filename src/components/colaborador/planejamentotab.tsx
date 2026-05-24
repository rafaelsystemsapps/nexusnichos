import { useState, useEffect } from "react";
import { Plus, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useNotesByDay, todayStr, PlannerNote } from "@/hooks/queries/usePlannerNotes";
import { StickyNoteCard } from "./planner/StickyNoteCard";
import { StickyNoteEditor } from "./planner/StickyNoteEditor";
import { RecoverNotesPanel } from "./planner/RecoverNotesPanel";
import { PlannerStats } from "./planner/PlannerStats";
import { PlannerHistory } from "./planner/PlannerHistory";

interface PlanejamentoTabProps {
  nichoId: string;
}

export function PlanejamentoTab({ nichoId }: PlanejamentoTabProps) {
  const [today, setToday] = useState(todayStr());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PlannerNote | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: notes = [], isLoading } = useNotesByDay(nichoId, today);

  // Rollover: detectar mudança de dia
  useEffect(() => {
    const interval = setInterval(() => {
      const now = todayStr();
      if (now !== today) setToday(now);
    }, 60_000);
    return () => clearInterval(interval);
  }, [today]);

  const pendentes = notes.filter((n) => n.status === "pendente");
  const concluidas = notes.filter((n) => n.status === "concluida");

  const openNew = () => {
    setEditingNote(null);
    setEditorOpen(true);
  };

  const openEdit = (note: PlannerNote) => {
    setEditingNote(note);
    setEditorOpen(true);
  };

  const dataFormatada = format(new Date(today + "T00:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold capitalize">{dataFormatada}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pendentes.length} pendente{pendentes.length !== 1 ? "s" : ""} · {concluidas.length} concluída{concluidas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Nota
        </Button>
      </div>

      {/* Recuperação */}
      <RecoverNotesPanel nichoId={nichoId} />

      {/* Board */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-12">Carregando...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">Nenhuma nota hoje. Comece pelo +</p>
          <Button variant="outline" onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar primeira nota
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {pendentes.map((n) => (
            <StickyNoteCard key={n.id} nichoId={nichoId} note={n} onEdit={openEdit} />
          ))}
          {concluidas.map((n) => (
            <StickyNoteCard key={n.id} nichoId={nichoId} note={n} onEdit={openEdit} />
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="pt-4 border-t border-border">
        <PlannerStats nichoId={nichoId} />
      </div>

      {/* Histórico */}
      <div>
        <button
          onClick={() => setShowHistory((s) => !s)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <History className="h-3.5 w-3.5" />
          {showHistory ? "Ocultar histórico" : "Ver histórico (30 dias)"}
        </button>
        {showHistory && (
          <div className="mt-3">
            <PlannerHistory nichoId={nichoId} />
          </div>
        )}
      </div>

      <StickyNoteEditor
        nichoId={nichoId}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        note={editingNote}
      />
    </div>
  );
}
