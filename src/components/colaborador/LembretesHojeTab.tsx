import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Bell, BellOff, Clock, MapPin, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { LembreteForm } from "./LembreteForm";
import { LembreteItem } from "./LembreteItem";
import { useAvisoPendencia } from "@/hooks/useAvisoPendencia";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

type Visualizacao = "hoje" | "amanha";

export function LembretesHojeTab({ nichoId }: LembretesHojeTabProps) {
  const [lembretesHoje, setLembretesHoje] = useState<Lembrete[]>([]);
  const [lembretesAmanha, setLembretesAmanha] = useState<Lembrete[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [visualizacao, setVisualizacao] = useState<Visualizacao>("hoje");

  const { desktopNotificationsEnabled, toggleDesktopNotifications } = useAvisoPendencia({
    nichoId,
    enabled: true,
  });

  const hoje = new Date();
  const amanha = addDays(hoje, 1);
  const hojeISO = format(hoje, "yyyy-MM-dd");
  const amanhaISO = format(amanha, "yyyy-MM-dd");

  useEffect(() => {
    fetchLembretes();
  }, [nichoId]);

  const fetchLembretes = async () => {
    try {
      // Fetch lembretes de hoje e amanhã
      const { data, error } = await supabase
        .from("lembretes_hoje")
        .select("*")
        .eq("nicho_id", nichoId)
        .in("data_criacao", [hojeISO, amanhaISO])
        .order("prioridade", { ascending: true });

      if (error) throw error;

      const sortByPrioridade = (items: Lembrete[]) => {
        return items.sort((a, b) => {
          const order = { alta: 0, media: 1, baixa: 2 };
          return (order[a.prioridade as keyof typeof order] || 1) - (order[b.prioridade as keyof typeof order] || 1);
        });
      };

      const todayItems = sortByPrioridade((data || []).filter(l => l.data_criacao === hojeISO));
      const tomorrowItems = sortByPrioridade((data || []).filter(l => l.data_criacao === amanhaISO));

      setLembretesHoje(todayItems);
      setLembretesAmanha(tomorrowItems);
    } catch (error: any) {
      toast.error("Erro ao carregar lembretes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const lembretes = visualizacao === "hoje" ? lembretesHoje : lembretesAmanha;
  const concluidas = lembretes.filter((l) => l.status === "concluida").length;
  const total = lembretes.length;

  const lembretesPorPrioridade = {
    alta: lembretes.filter((l) => l.prioridade === "alta"),
    media: lembretes.filter((l) => l.prioridade === "media"),
    baixa: lembretes.filter((l) => l.prioridade === "baixa"),
  };

  const countHoje = lembretesHoje.length;
  const countAmanha = lembretesAmanha.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Bell className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Lembretes</h2>
            <p className="text-sm text-muted-foreground">
              O que você disse que faria?
            </p>
          </div>
        </div>

        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lembrete
        </Button>
      </div>

      {/* Tabs Hoje/Amanhã */}
      <div className="flex gap-2">
        <Button
          variant={visualizacao === "hoje" ? "default" : "outline"}
          size="sm"
          onClick={() => setVisualizacao("hoje")}
          className={cn(
            "gap-2",
            visualizacao === "hoje" && "bg-amber-500 hover:bg-amber-600"
          )}
        >
          <MapPin className="h-4 w-4" />
          Hoje
          {countHoje > 0 && (
            <span className={cn(
              "ml-1 px-1.5 py-0.5 text-xs rounded-full",
              visualizacao === "hoje" 
                ? "bg-white/20 text-white" 
                : "bg-amber-500/10 text-amber-500"
            )}>
              {countHoje}
            </span>
          )}
        </Button>
        <Button
          variant={visualizacao === "amanha" ? "default" : "outline"}
          size="sm"
          onClick={() => setVisualizacao("amanha")}
          className={cn(
            "gap-2",
            visualizacao === "amanha" && "bg-blue-500 hover:bg-blue-600"
          )}
        >
          <CalendarDays className="h-4 w-4" />
          Amanhã
          {countAmanha > 0 && (
            <span className={cn(
              "ml-1 px-1.5 py-0.5 text-xs rounded-full",
              visualizacao === "amanha" 
                ? "bg-white/20 text-white" 
                : "bg-blue-500/10 text-blue-500"
            )}>
              {countAmanha}
            </span>
          )}
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
                  {visualizacao === "hoje" ? "Hoje" : `Amanhã (${format(amanha, "dd/MM", { locale: ptBR })})`}: <span className="font-medium text-foreground">{concluidas}/{total}</span> concluídas
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      visualizacao === "hoje" ? "bg-emerald-500" : "bg-blue-500"
                    )}
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
                <LembreteItem 
                  key={lembrete.id} 
                  lembrete={lembrete} 
                  onUpdate={fetchLembretes}
                  isAmanha={visualizacao === "amanha"}
                />
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
                <LembreteItem 
                  key={lembrete.id} 
                  lembrete={lembrete} 
                  onUpdate={fetchLembretes}
                  isAmanha={visualizacao === "amanha"}
                />
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
                <LembreteItem 
                  key={lembrete.id} 
                  lembrete={lembrete} 
                  onUpdate={fetchLembretes}
                  isAmanha={visualizacao === "amanha"}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && total === 0 && (
          <Card className="bg-card/30 border-border/30 border-dashed">
            <CardContent className="py-12 text-center">
              {visualizacao === "hoje" ? (
                <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              ) : (
                <CalendarDays className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              )}
              <p className="text-muted-foreground mb-4">
                {visualizacao === "hoje" 
                  ? "Nenhum lembrete para hoje." 
                  : "Nenhum lembrete agendado para amanhã."}
              </p>
              <Button variant="outline" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Lembrete
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Notification Toggle - só mostra em "hoje" */}
      {visualizacao === "hoje" && (
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
      )}

      {/* Form Modal */}
      <LembreteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        nichoId={nichoId}
        onSuccess={fetchLembretes}
        defaultDate={visualizacao}
      />
    </div>
  );
}
