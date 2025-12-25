import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LembreteItemProps {
  lembrete: {
    id: string;
    descricao: string;
    prioridade: string;
    status: string;
  };
  onUpdate: () => void;
}

const PRIORIDADE_CONFIG = {
  alta: {
    color: "bg-red-500",
    border: "border-red-500/30",
    bg: "bg-red-500/5",
  },
  media: {
    color: "bg-yellow-500",
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/5",
  },
  baixa: {
    color: "bg-blue-500",
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
  },
};

export function LembreteItem({ lembrete, onUpdate }: LembreteItemProps) {
  const [loading, setLoading] = useState(false);

  const config = PRIORIDADE_CONFIG[lembrete.prioridade as keyof typeof PRIORIDADE_CONFIG] || PRIORIDADE_CONFIG.media;
  const isConcluida = lembrete.status === "concluida";
  const isEncerrada = lembrete.status === "encerrada";

  const handleConcluir = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("lembretes_hoje")
        .update({ status: "concluida" })
        .eq("id", lembrete.id);

      if (error) throw error;
      toast.success("Lembrete concluído!");
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao concluir: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("lembretes_hoje")
        .delete()
        .eq("id", lembrete.id);

      if (error) throw error;
      toast.success("Lembrete removido");
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border transition-all",
        isConcluida && "opacity-60",
        isEncerrada && "opacity-40 bg-muted/30",
        !isConcluida && !isEncerrada && config.bg,
        config.border
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={cn("w-3 h-3 rounded-full shrink-0", config.color)} />
        <span
          className={cn(
            "text-sm truncate",
            isConcluida && "line-through text-muted-foreground"
          )}
        >
          {lembrete.descricao}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-3">
        {isConcluida ? (
          <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
            <Check className="h-3.5 w-3.5" />
            Concluída
          </span>
        ) : isEncerrada ? (
          <span className="text-xs text-muted-foreground">Encerrada</span>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleConcluir}
            disabled={loading}
            className="h-8 px-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
          >
            <Check className="h-4 w-4 mr-1" />
            Concluir
          </Button>
        )}

        <Button
          size="icon"
          variant="ghost"
          onClick={handleDelete}
          disabled={loading}
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
