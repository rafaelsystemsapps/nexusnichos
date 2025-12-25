import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, GripVertical, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface TarefaClienteItemProps {
  tarefa: {
    id: string;
    descricao: string;
    status: "pendente" | "feito";
    responsavel: string | null;
  };
  onUpdate: () => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

export function TarefaClienteItem({ tarefa, onUpdate, isDragging, dragHandleProps }: TarefaClienteItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleStatus = async () => {
    setIsUpdating(true);
    try {
      const newStatus = tarefa.status === "pendente" ? "feito" : "pendente";
      const { error } = await supabase
        .from("tarefas_cliente")
        .update({ status: newStatus })
        .eq("id", tarefa.id);

      if (error) throw error;
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("tarefas_cliente")
        .delete()
        .eq("id", tarefa.id);

      if (error) throw error;
      toast.success("Tarefa removida");
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg border transition-all group",
        isDragging && "shadow-lg bg-primary/5 border-primary/30",
        tarefa.status === "feito" 
          ? "bg-emerald-500/5 border-emerald-500/20" 
          : "bg-surface/30 border-border/30"
      )}
    >
      <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <Checkbox
        checked={tarefa.status === "feito"}
        onCheckedChange={handleToggleStatus}
        disabled={isUpdating}
        className={cn(
          tarefa.status === "feito" && "bg-emerald-500 border-emerald-500"
        )}
      />
      
      <span className={cn(
        "flex-1 text-sm",
        tarefa.status === "feito" && "line-through text-muted-foreground"
      )}>
        {tarefa.descricao}
      </span>

      {tarefa.responsavel && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          {tarefa.responsavel}
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
