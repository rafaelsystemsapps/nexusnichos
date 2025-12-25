import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Bell, BellOff, Clock } from "lucide-react";
import { toast } from "sonner";
import { LembreteForm } from "./LembreteForm";
import { LembreteItem } from "./LembreteItem";
import { useAvisoPendencia } from "@/hooks/useAvisoPendencia";

interface LembretesHojeTabProps {
  nichoId: string;
}

interface Lembrete {
  id: string;
  descricao: string;
  prioridade: string;
  status: string;
  data_criacao: string;
}

export function LembretesHojeTab({ nichoId }: LembretesHojeTabProps) {
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const { desktopNotificationsEnabled, toggleDesktopNotifications } = useAvisoPendencia({
    nichoId,
    enabled: true,
  });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchLembretes();
  }, [nichoId]);

  const fetchLembretes = async () => {
    try {
      const { data, error } = await supabase
        .from("lembretes_hoje")
        .select("*")
        .eq("nicho_id", nichoId)
        .eq("data_criacao", today)
        .order("prioridade", { ascending: true });

      if (error) throw error;

      // Ordenar por prioridade: alta > media > baixa
      const sorted = (data || []).sort((a, b) => {
        const order = { alta: 0, media: 1, baixa: 2 };
        return (order[a.prioridade as keyof typeof order] || 1) - (order[b.prioridade as keyof typeof order] || 1);
      });

      setLembretes(sorted);
    } catch (error: any) {
      toast.error("Erro ao carregar lembretes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const concluidas = lembretes.filter((l) => l.status === "concluida").length;
  const total = lembretes.length;

  const lembretesPorPrioridade = {
    alta: lembretes.filter((l) => l.prioridade === "alta"),
    media: lembretes.filter((l) => l.prioridade === "media"),
    baixa: lembretes.filter((l) => l.prioridade === "baixa"),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Bell className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Lembretes de Hoje</h2>
            <p className="text-sm text-muted-foreground">
              O que você disse que faria hoje?
            </p>
          </div>
        </div>

        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lembrete
        </Button>
      </div>

      {/* Stats */}
      {total > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Hoje: <span className="font-medium text-foreground">{concluidas}/{total}</span> concluídas
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: total > 0 ? `${(concluidas / total) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {total > 0 ? Math.round((concluidas / total) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lembretes List */}
      <div className="space-y-6">
        {/* Alta Prioridade */}
        {lembretesPorPrioridade.alta.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Alta Prioridade
              </h3>
            </div>
            <div className="space-y-2">
              {lembretesPorPrioridade.alta.map((lembrete) => (
                <LembreteItem key={lembrete.id} lembrete={lembrete} onUpdate={fetchLembretes} />
              ))}
            </div>
          </div>
        )}

        {/* Média Prioridade */}
        {lembretesPorPrioridade.media.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Média Prioridade
              </h3>
            </div>
            <div className="space-y-2">
              {lembretesPorPrioridade.media.map((lembrete) => (
                <LembreteItem key={lembrete.id} lembrete={lembrete} onUpdate={fetchLembretes} />
              ))}
            </div>
          </div>
        )}

        {/* Baixa Prioridade */}
        {lembretesPorPrioridade.baixa.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Baixa Prioridade
              </h3>
            </div>
            <div className="space-y-2">
              {lembretesPorPrioridade.baixa.map((lembrete) => (
                <LembreteItem key={lembrete.id} lembrete={lembrete} onUpdate={fetchLembretes} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && total === 0 && (
          <Card className="bg-card/30 border-border/30 border-dashed">
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum lembrete para hoje.
              </p>
              <Button variant="outline" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Lembrete
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Notification Toggle */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {desktopNotificationsEnabled ? (
              <Bell className="h-4 w-4 text-amber-500" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            Aviso às 22h30
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Receber notificação no desktop se houver pendências
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Um aviso único, às 22h30, para verificar o que ficou pendente.
              </p>
            </div>
            <Switch
              checked={desktopNotificationsEnabled}
              onCheckedChange={toggleDesktopNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Modal */}
      <LembreteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        nichoId={nichoId}
        onSuccess={fetchLembretes}
      />
    </div>
  );
}
