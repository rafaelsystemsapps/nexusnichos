import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateTask } from "@/hooks/queries/useAccountTasks";

const PRESETS = ["Postar 3 vídeos", "Revisar anúncios", "Responder comentários", "Subir stories", "Revisar DMs"];

interface Props {
  accountId: string;
  nichoId: string;
}

export function AddTaskInline({ accountId, nichoId }: Props) {
  const [name, setName] = useState("");
  const createMut = useCreateTask();

  const add = (n: string) => {
    const v = n.trim();
    if (!v) return;
    createMut.mutate({ account_id: accountId, nicho_id: nichoId, task_name: v });
    setName("");
  };

  return (
    <div className="space-y-2 pt-2">
      <div className="flex gap-1">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(name))}
          placeholder="+ Adicionar Tarefa"
          className="h-8"
        />
        <Button size="sm" onClick={() => add(name)} disabled={!name.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => add(p)}
            className="text-[11px] px-2 py-0.5 rounded border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/40"
          >
            + {p}
          </button>
        ))}
      </div>
    </div>
  );
}
