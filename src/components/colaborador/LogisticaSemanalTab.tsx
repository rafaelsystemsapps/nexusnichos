import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, History, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, getWeek, getYear, subWeeks, addWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TarefaTemplateDialog } from "./TarefaTemplateDialog";
import { LogisticaHistoricoDialog } from "./LogisticaHistoricoDialog";
import { cn } from "@/lib/utils";

interface LogisticaSemanalTabProps {
  nichoId: string;
}

interface TarefaTemplate {
  id: string;
  titulo: string;
  descricao: string | null;
  ativa: boolean;
  ordem: number;
}

interface SemanaLogistica {
  id: string;
  semana_inicio: string;
  semana_fim: string;
  semana_numero: number;
  ano: number;
  status: string;
}

interface TarefaDiaria {
  id: string;
  semana_id: string;
  template_id: string;
  dia_semana: number;
  data: string;
  status: "pendente" | "em_andamento" | "concluida" | "nao_concluida";
}

const DIAS_SEMANA = [
  { short: "DOM", full: "DOMINGO" },
  { short: "SEG", full: "SEGUNDA" },
  { short: "TER", full: "TERÇA" },
  { short: "QUA", full: "QUARTA" },
  { short: "QUI", full: "QUINTA" },
  { short: "SEX", full: "SEXTA" },
  { short: "SAB", full: "SÁBADO" },
];

const STATUS_CONFIG = {
  pendente: { 
    label: "Não iniciada", 
    bgColor: "bg-zinc-700/80", 
    textColor: "text-zinc-300",
    dotColor: "bg-zinc-400"
  },
  em_andamento: { 
    label: "Em andamento", 
    bgColor: "bg-amber-500/20", 
    textColor: "text-amber-400",
    dotColor: "bg-amber-400"
  },
  concluida: { 
    label: "Concluído", 
    bgColor: "bg-emerald-500/20", 
    textColor: "text-emerald-400",
    dotColor: "bg-emerald-400"
  },
  nao_concluida: { 
    label: "Não concluída", 
    bgColor: "bg-red-500/20", 
    textColor: "text-red-400",
    dotColor: "bg-red-400"
  },
};

type StatusKey = keyof typeof STATUS_CONFIG;

export function LogisticaSemanalTab({ nichoId }: LogisticaSemanalTabProps) {
  const { role } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === "admin";

  const [templates, setTemplates] = useState<TarefaTemplate[]>([]);
  const [semanas, setSemanas] = useState<SemanaLogistica[]>([]);
  const [semanaAtual, setSemanaAtual] = useState<SemanaLogistica | null>(null);
  const [tarefas, setTarefas] = useState<TarefaDiaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [nichoId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: templatesData } = await supabase
        .from("tarefa_templates")
        .select("*")
        .eq("nicho_id", nichoId)
        .eq("ativa", true)
        .order("ordem");

      setTemplates(templatesData || []);

      const { data: semanasData } = await supabase
        .from("semana_logistica")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("semana_inicio", { ascending: false });

      setSemanas(semanasData || []);

      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // Start on Sunday
      const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
      const weekNumber = getWeek(today, { weekStartsOn: 0 });
      const year = getYear(today);

      let currentWeek = semanasData?.find(
        (s) => s.semana_numero === weekNumber && s.ano === year
      );

      if (!currentWeek) {
        const { data: newWeek, error: weekError } = await supabase
          .from("semana_logistica")
          .insert({
            nicho_id: nichoId,
            semana_inicio: format(weekStart, "yyyy-MM-dd"),
            semana_fim: format(weekEnd, "yyyy-MM-dd"),
            semana_numero: weekNumber,
            ano: year,
            status: "ativa",
          })
          .select()
          .single();

        if (weekError) throw weekError;
        currentWeek = newWeek;

        if (templatesData && templatesData.length > 0 && currentWeek) {
          const dailyTasks = [];
          for (const template of templatesData) {
            for (let day = 0; day < 7; day++) {
              dailyTasks.push({
                semana_id: currentWeek.id,
                template_id: template.id,
                dia_semana: day,
                data: format(addDays(weekStart, day), "yyyy-MM-dd"),
                status: "pendente" as const,
              });
            }
          }

          await supabase.from("tarefa_diaria").insert(dailyTasks);
        }

        setSemanas([currentWeek, ...(semanasData || [])]);
      }

      setSemanaAtual(currentWeek || null);

      if (currentWeek) {
        await fetchTarefas(currentWeek.id);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTarefas = async (semanaId: string) => {
    const { data } = await supabase
      .from("tarefa_diaria")
      .select("*")
      .eq("semana_id", semanaId);

    setTarefas(data || []);
  };

  const handleSemanaChange = async (semanaId: string) => {
    const semana = semanas.find((s) => s.id === semanaId);
    if (semana) {
      setSemanaAtual(semana);
      await fetchTarefas(semanaId);
    }
  };

  const handleStatusChange = async (
    tarefaId: string,
    newStatus: StatusKey
  ) => {
    try {
      const { error } = await supabase
        .from("tarefa_diaria")
        .update({ status: newStatus })
        .eq("id", tarefaId);

      if (error) throw error;

      setTarefas((prev) =>
        prev.map((t) => (t.id === tarefaId ? { ...t, status: newStatus } : t))
      );
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getTarefa = (templateId: string, diaSemana: number) => {
    return tarefas.find(
      (t) => t.template_id === templateId && t.dia_semana === diaSemana
    );
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (!semanaAtual) return;
    const currentIndex = semanas.findIndex(s => s.id === semanaAtual.id);
    const newIndex = direction === 'prev' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < semanas.length) {
      handleSemanaChange(semanas[newIndex].id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-4">
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[160px] text-center">
              Semana {semanaAtual?.semana_numero} • {semanaAtual?.ano}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <span className="text-xs text-muted-foreground">
            {semanaAtual &&
              `${format(new Date(semanaAtual.semana_inicio), "dd MMM", { locale: ptBR })} - ${format(new Date(semanaAtual.semana_fim), "dd MMM", { locale: ptBR })}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoricoDialogOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <History className="h-4 w-4" />
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTemplateDialogOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tasks Grid */}
      {templates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-4">Nenhuma tarefa cadastrada</p>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTemplateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar tarefa
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[200px]">
                  Nome da Tarefa
                </th>
                {DIAS_SEMANA.map((dia, index) => (
                  <th
                    key={dia.short}
                    className="text-center py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[130px]"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="opacity-50">✦</span>
                      {dia.full}
                    </div>
                  </th>
                ))}
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr 
                  key={template.id} 
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-sm">▸</span>
                      <span className="text-sm font-medium text-foreground uppercase">
                        {template.titulo}
                      </span>
                    </div>
                  </td>
                  {DIAS_SEMANA.map((_, dayIndex) => {
                    const tarefa = getTarefa(template.id, dayIndex);
                    const status = (tarefa?.status || "pendente") as StatusKey;
                    const config = STATUS_CONFIG[status];

                    return (
                      <td key={dayIndex} className="py-2 px-2 text-center">
                        {tarefa ? (
                          <Select
                            value={tarefa.status}
                            onValueChange={(value) =>
                              handleStatusChange(tarefa.id, value as StatusKey)
                            }
                          >
                            <SelectTrigger 
                              className={cn(
                                "h-7 text-xs border-0 justify-center gap-1.5 px-2.5 rounded-md",
                                config.bgColor,
                                config.textColor,
                                "hover:opacity-80 transition-opacity"
                              )}
                            >
                              <span className={cn("w-1.5 h-1.5 rounded-full", config.dotColor)} />
                              <span className="font-medium">{config.label}</span>
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border min-w-[140px]">
                              {(Object.entries(STATUS_CONFIG) as [StatusKey, typeof STATUS_CONFIG[StatusKey]][]).map(([key, cfg]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dotColor)} />
                                    <span>{cfg.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 px-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Task Row */}
      {isAdmin && templates.length > 0 && (
        <button
          onClick={() => setTemplateDialogOpen(true)}
          className="w-full py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors flex items-center gap-2 px-3 rounded-md"
        >
          <Plus className="h-4 w-4" />
          Nova tarefa
        </button>
      )}

      {/* Dialogs */}
      <TarefaTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        nichoId={nichoId}
        onUpdate={fetchData}
      />

      <LogisticaHistoricoDialog
        open={historicoDialogOpen}
        onOpenChange={setHistoricoDialogOpen}
        semanas={semanas.filter((s) => s.status === "finalizada")}
      />
    </div>
  );
}
