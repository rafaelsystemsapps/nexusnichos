import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateNote, useUpdateNote, PlannerNote } from "@/hooks/queries/usePlannerNotes";
import { toast } from "sonner";

interface Props {
  nichoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: PlannerNote | null;
}

export function StickyNoteEditor({ nichoId, open, onOpenChange, note }: Props) {
  const isEditing = !!note;
  const [title, setTitle] = useState(note?.title ?? "");
  const [description, setDescription] = useState(note?.description ?? "");
  const [horario, setHorario] = useState(note?.horario?.slice(0, 5) ?? "");

  const createMut = useCreateNote(nichoId);
  const updateMut = useUpdateNote(nichoId);
  const loading = createMut.isPending || updateMut.isPending;

  // Reset on open/note change
  const handleOpenChange = (o: boolean) => {
    if (o) {
      setTitle(note?.title ?? "");
      setDescription(note?.description ?? "");
      setHorario(note?.horario?.slice(0, 5) ?? "");
    }
    onOpenChange(o);
  };

  const handleSave = async () => {
    if (!title.trim() && !description.trim()) {
      toast.error("Adicione um título ou descrição");
      return;
    }
    try {
      if (isEditing && note) {
        await updateMut.mutateAsync({
          id: note.id,
          patch: {
            title: title.trim() || null,
            description: description.trim() || null,
            horario: horario || null,
          },
        });
        toast.success("Nota atualizada");
      } else {
        await createMut.mutateAsync({
          title: title.trim() || null,
          description: description.trim() || null,
          horario: horario || null,
        });
        toast.success("Nota criada");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar nota" : "Nova nota"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input
            placeholder="Título curto (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            placeholder="Descrição da nota..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Horário</label>
            <Input
              type="time"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className="w-32"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : isEditing ? "Salvar" : "Criar nota"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
