import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, Pin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRIORIDADE_CONFIG = {
  alta: {
    bg: "bg-red-100 dark:bg-red-950",
    border: "border-red-400",
    text: "text-red-700 dark:text-red-300",
    label: "Alta",
    emoji: "🔴",
  },
  media: {
    bg: "bg-yellow-100 dark:bg-yellow-950",
    border: "border-yellow-400",
    text: "text-yellow-700 dark:text-yellow-300",
    label: "Média",
    emoji: "🟡",
  },
  baixa: {
    bg: "bg-blue-100 dark:bg-blue-950",
    border: "border-blue-400",
    text: "text-blue-700 dark:text-blue-300",
    label: "Baixa",
    emoji: "🔵",
  },
};

interface Lembrete {
  id: string;
  descricao: string;
  prioridade: string;
  status: string;
}

export function LembretePopup() {
  const { id } = useParams<{ id: string }>();
  const [lembrete, setLembrete] = useState<Lembrete | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLembrete();
    }
  }, [id]);

  const fetchLembrete = async () => {
    try {
      const { data, error } = await supabase
        .from("lembretes_hoje")
        .select("id, descricao, prioridade, status")
        .eq("id", id)
        .single();

      if (error) throw error;
      setLembrete(data);
    } catch (error: any) {
      toast.error("Erro ao carregar lembrete");
    } finally {
      setLoading(false);
    }
  };

  const handleConcluir = async () => {
    if (!lembrete) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("lembretes_hoje")
        .update({ status: "concluida" })
        .eq("id", lembrete.id);

      if (error) throw error;
      toast.success("Lembrete concluído!");
      
      // Fecha o popup após concluir
      setTimeout(() => window.close(), 500);
    } catch (error: any) {
      toast.error("Erro ao concluir: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    window.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!lembrete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <p className="text-muted-foreground">Lembrete não encontrado</p>
      </div>
    );
  }

  const config = PRIORIDADE_CONFIG[lembrete.prioridade as keyof typeof PRIORIDADE_CONFIG] || PRIORIDADE_CONFIG.media;
  const isConcluida = lembrete.status === "concluida";

  return (
    <div className={cn(
      "min-h-screen flex flex-col p-4 border-4",
      config.bg,
      config.border
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Lembrete</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleClose}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col">
        <p className={cn(
          "text-lg font-medium leading-relaxed mb-4",
          isConcluida && "line-through opacity-60"
        )}>
          {config.emoji} {lembrete.descricao}
        </p>

        <div className={cn(
          "text-sm font-medium px-2 py-1 rounded-full w-fit mb-4",
          config.text,
          config.bg
        )}>
          Prioridade: {config.label}
        </div>

        <div className="border-t border-border/50 my-3" />

        {/* Dica de fixação */}
        <div className="text-xs text-muted-foreground bg-background/50 rounded-lg p-3 mb-4">
          <p className="font-medium mb-1">💡 Dica para fixar no topo:</p>
          <ul className="space-y-0.5 ml-4 list-disc">
            <li><strong>Windows:</strong> Use PowerToys ou apps "Always on Top"</li>
            <li><strong>Mac:</strong> Use Afloat ou Stage Manager</li>
            <li><strong>Linux:</strong> Clique direito na barra → "Always on Top"</li>
          </ul>
        </div>

        {/* Botão de ação */}
        <div className="mt-auto">
          {isConcluida ? (
            <div className="text-center py-3 rounded-lg bg-emerald-500/10 text-emerald-600 font-medium flex items-center justify-center gap-2">
              <Check className="h-5 w-5" />
              Concluído!
            </div>
          ) : (
            <Button
              onClick={handleConcluir}
              disabled={saving}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              {saving ? "Concluindo..." : "Concluir Lembrete"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}