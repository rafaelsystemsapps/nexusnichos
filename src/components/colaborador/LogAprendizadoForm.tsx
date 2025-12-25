import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check } from "lucide-react";
import { toast } from "sonner";

interface LogAprendizadoFormProps {
  nichoId: string;
  existingLog: {
    id: string;
    aprendizado: string;
  } | null;
  onSave: () => void;
}

export function LogAprendizadoForm({ nichoId, existingLog, onSave }: LogAprendizadoFormProps) {
  const [aprendizado, setAprendizado] = useState(existingLog?.aprendizado || "");
  const [isEditing, setIsEditing] = useState(!existingLog);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!aprendizado.trim()) {
      toast.error("Digite um aprendizado");
      return;
    }

    setIsSaving(true);

    try {
      if (existingLog) {
        // Atualizar log existente
        const { error } = await supabase
          .from("logs_aprendizado")
          .update({ aprendizado: aprendizado.trim() })
          .eq("id", existingLog.id);

        if (error) throw error;
        toast.success("Aprendizado atualizado");
      } else {
        // Criar novo log (upsert para garantir 1 por dia)
        const { error } = await supabase
          .from("logs_aprendizado")
          .upsert(
            {
              nicho_id: nichoId,
              aprendizado: aprendizado.trim(),
              data: new Date().toISOString().split("T")[0],
            },
            { onConflict: "nicho_id,data" }
          );

        if (error) throw error;
        toast.success("Aprendizado registrado");
      }

      setIsEditing(false);
      onSave();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Modo visualização
  if (!isEditing && existingLog) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-foreground flex-1">{existingLog.aprendizado}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  // Modo edição
  return (
    <div className="flex items-center gap-2">
      <Input
        value={aprendizado}
        onChange={(e) => setAprendizado(e.target.value)}
        placeholder="Escreva seu aprendizado do dia..."
        className="flex-1 bg-background/50 border-border/30 text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSave();
          }
        }}
      />
      <Button
        size="sm"
        onClick={handleSave}
        disabled={isSaving || !aprendizado.trim()}
        className="px-3"
      >
        <Check className="h-4 w-4" />
      </Button>
      {existingLog && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setAprendizado(existingLog.aprendizado);
            setIsEditing(false);
          }}
          className="text-muted-foreground"
        >
          Cancelar
        </Button>
      )}
    </div>
  );
}
