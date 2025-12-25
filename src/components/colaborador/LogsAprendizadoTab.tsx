import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { LogAprendizadoForm } from "./LogAprendizadoForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lightbulb } from "lucide-react";
import { toast } from "sonner";

interface LogsAprendizadoTabProps {
  nichoId: string;
}

interface LogAprendizado {
  id: string;
  data: string;
  aprendizado: string;
  created_at: string;
}

export function LogsAprendizadoTab({ nichoId }: LogsAprendizadoTabProps) {
  const [logs, setLogs] = useState<LogAprendizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayLog, setTodayLog] = useState<LogAprendizado | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [nichoId]);

  const fetchLogs = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("logs_aprendizado")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("data", { ascending: false });

      if (error) throw error;

      const allLogs = data || [];
      const logDeHoje = allLogs.find((log) => log.data === today);
      const historico = allLogs.filter((log) => log.data !== today);

      setTodayLog(logDeHoje || null);
      setLogs(historico);
    } catch (error: any) {
      toast.error("Erro ao carregar logs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return format(date, "d MMM", { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-muted/30 rounded-lg animate-pulse" />
        <div className="h-40 bg-muted/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header discreto */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lightbulb className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">
            Logs de Aprendizado
          </span>
        </div>
        <p className="text-sm text-muted-foreground/70">
          O que eu aprendi hoje que muda minha forma de operar?
        </p>
      </div>

      {/* Form do dia atual */}
      <Card className="border-border/30 bg-card/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Hoje
            </span>
          </div>
          <LogAprendizadoForm
            nichoId={nichoId}
            existingLog={todayLog}
            onSave={fetchLogs}
          />
        </CardContent>
      </Card>

      {/* Histórico */}
      {logs.length > 0 && (
        <div className="space-y-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Histórico
          </span>
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0"
              >
                <span className="text-xs text-muted-foreground min-w-[50px]">
                  {formatDate(log.data)}
                </span>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {log.aprendizado}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {logs.length === 0 && !todayLog && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground/60">
            Nenhum aprendizado registrado ainda.
          </p>
        </div>
      )}
    </div>
  );
}
