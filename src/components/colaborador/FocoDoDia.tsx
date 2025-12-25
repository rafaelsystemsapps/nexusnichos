import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Target, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsIOSMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface FocoDoDiaProps {
  nichoId: string;
}

export function FocoDoDia({ nichoId }: FocoDoDiaProps) {
  const [foco, setFoco] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isIOSMobile = useIsIOSMobile();

  useEffect(() => {
    fetchFoco();
  }, [nichoId]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const fetchFoco = async () => {
    const { data } = await supabase
      .from("nichos")
      .select("foco_do_dia")
      .eq("id", nichoId)
      .single();

    if (data?.foco_do_dia) {
      setFoco(data.foco_do_dia);
    }
  };

  const handleStartEdit = () => {
    setEditValue(foco);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editValue === foco) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("nichos")
        .update({ foco_do_dia: editValue || null })
        .eq("id", nichoId);

      if (error) throw error;

      setFoco(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao salvar foco:", error);
      toast.error("Erro ao salvar foco do dia");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  return (
    <div 
      className={cn(
        "rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm",
        isIOSMobile ? "p-3" : "p-4",
        "transition-all duration-200"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Target className={cn(
          "text-primary/70",
          isIOSMobile ? "h-4 w-4" : "h-4 w-4"
        )} />
        <span className={cn(
          "text-muted-foreground font-medium uppercase tracking-wide",
          isIOSMobile ? "text-[10px]" : "text-xs"
        )}>
          Foco do Dia
        </span>
      </div>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={saving}
          placeholder="Qual é o foco da operação hoje?"
          className={cn(
            "w-full bg-transparent border-none outline-none",
            "text-foreground placeholder:text-muted-foreground/50",
            "font-medium",
            isIOSMobile ? "text-base" : "text-lg",
            saving && "opacity-50"
          )}
        />
      ) : (
        <div
          onClick={handleStartEdit}
          className={cn(
            "cursor-pointer group flex items-center gap-2",
            "hover:opacity-80 transition-opacity"
          )}
        >
          {foco ? (
            <p className={cn(
              "text-foreground font-medium flex-1",
              isIOSMobile ? "text-base" : "text-lg"
            )}>
              {foco}
            </p>
          ) : (
            <p className={cn(
              "text-muted-foreground/50 italic flex-1",
              isIOSMobile ? "text-base" : "text-lg"
            )}>
              Qual é o foco da operação hoje?
            </p>
          )}
          <Pencil className={cn(
            "text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors",
            "h-3.5 w-3.5 shrink-0"
          )} />
        </div>
      )}
    </div>
  );
}
