import { useState } from "react";
import { useRoutineItems, useCreateRoutineItem, useToggleRoutineItem, useDeleteRoutineItem } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [
  "Postar story",
  "Subir vídeo",
  "Responder DMs",
  "Revisar bio",
  "Revisar campanha",
  "Revisar perfil",
  "Aquecer conta",
  "Validar login",
];

interface Props {
  accountId: string;
  nichoId: string;
}

export function AccountRoutineChecklist({ accountId, nichoId }: Props) {
  const { data: items = [] } = useRoutineItems(accountId);
  const createMut = useCreateRoutineItem();
  const toggleMut = useToggleRoutineItem();
  const deleteMut = useDeleteRoutineItem();
  const [newTitle, setNewTitle] = useState("");

  const addItem = async (title: string) => {
    const t = title.trim();
    if (!t) return;
    await createMut.mutateAsync({ account_id: accountId, nicho_id: nichoId, title: t });
    setNewTitle("");
  };

  return (
    <div className="space-y-3 p-4 rounded-lg border border-border/40 bg-card/30">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Checklist Operacional</h3>
        <span className="text-xs text-muted-foreground">
          {items.filter((i) => i.status === "concluida").length}/{items.length}
        </span>
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group py-1">
            <Checkbox
              checked={item.status === "concluida"}
              onCheckedChange={() => toggleMut.mutate(item)}
            />
            <span className={cn("text-sm flex-1", item.status === "concluida" && "line-through text-muted-foreground")}>
              {item.title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100"
              onClick={() => deleteMut.mutate({ id: item.id, account_id: accountId })}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">Adicione itens à rotina diária desta conta.</p>
        )}
      </div>

      <div className="flex gap-1">
        <Input
          placeholder="Novo item..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(newTitle))}
          className="h-8"
        />
        <Button size="sm" onClick={() => addItem(newTitle)} disabled={!newTitle.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 pt-1">
        {PRESETS.filter((p) => !items.some((i) => i.title === p)).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => addItem(p)}
            className="text-[11px] px-2 py-0.5 rounded border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/40"
          >
            + {p}
          </button>
        ))}
      </div>
    </div>
  );
}
