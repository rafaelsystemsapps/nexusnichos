import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, History, ClipboardList } from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, getWeek, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TarefaTemplateDialog } from "./TarefaTemplateDialog";
import { LogisticaHistoricoDialog } from "./LogisticaHistoricoDialog";

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

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente", color: "bg-muted text-muted-foreground" },
  { value: "em_andamento", label: "Em andamento", color: "bg-primary/20 text-primary" },
  { value: "concluida", label: "Concluída", color: "bg-green-500/20 text-green-500" },
  { value: "nao_concluida", label: "Não concluída", color: "bg-destructive/20 text-destructive" },
];

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
      // Fetch templates
      const { data: templatesData } = await supabase
        .from("tarefa_templates")
        .select("*")
        .eq("nicho_id", nichoId)
        .eq("ativa", true)
        .order("ordem");

      setTemplates(templatesData || []);

      // Fetch all weeks for this niche
      const { data: semanasData } = await supabase
        .from("semana_logistica")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("semana_inicio", { ascending: false });

      setSemanas(semanasData || []);

      // Check if current week exists, if not create it
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const weekNumber = getWeek(today, { weekStartsOn: 1 });
      const year = getYear(today);

      let currentWeek = semanasData?.find(
        (s) => s.semana_numero === weekNumber && s.ano === year
      );

      if (!currentWeek) {
        // Create current week
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

        // Create daily tasks for each template
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

      // Fetch tasks for current week
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
    newStatus: "pendente" | "em_andamento" | "concluida" | "nao_concluida"
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

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find((o) => o.value === status);
    return option || STATUS_OPTIONS[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Logística Semanal</h2>
            <p className="text-sm text-muted-foreground">
              Acompanhe as tarefas diárias do time
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHistoricoDialogOpen(true)}
          >
            <History className="h-4 w-4 mr-2" />
            Histórico
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={() => setTemplateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Gerenciar Tarefas
            </Button>
          )}
        </div>
      </div>

      {/* Week Selector */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg">
                Semana {semanaAtual?.semana_numero} • {semanaAtual?.ano}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {semanaAtual &&
                  `${format(new Date(semanaAtual.semana_inicio), "dd/MM", { locale: ptBR })} - ${format(new Date(semanaAtual.semana_fim), "dd/MM/yyyy", { locale: ptBR })}`}
              </p>
            </div>

            <Select
              value={semanaAtual?.id || ""}
              onValueChange={handleSemanaChange}
            >
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder="Selecionar semana" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {semanas.map((semana) => (
                  <SelectItem key={semana.id} value={semana.id}>
                    Semana {semana.semana_numero}/{semana.ano}
                    {semana.status === "ativa" && " (Atual)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma tarefa cadastrada</p>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setTemplateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeira tarefa
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground min-w-[150px]">
                      Tarefa
                    </th>
                    {DIAS_SEMANA.map((dia, index) => {
                      const date = semanaAtual
                        ? addDays(new Date(semanaAtual.semana_inicio), index)
                        : new Date();
                      return (
                        <th
                          key={dia}
                          className="text-center py-3 px-1 text-sm font-medium text-muted-foreground min-w-[100px]"
                        >
                          <div>{dia}</div>
                          <div className="text-xs opacity-70">
                            {format(date, "dd/MM")}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id} className="border-b border-border/50">
                      <td className="py-3 px-2">
                        <span className="text-sm font-medium text-foreground">
                          {template.titulo}
                        </span>
                        {template.descricao && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {template.descricao}
                          </p>
                        )}
                      </td>
                      {DIAS_SEMANA.map((_, dayIndex) => {
                        const tarefa = getTarefa(template.id, dayIndex);
                        const statusOption = getStatusBadge(tarefa?.status || "pendente");

                        return (
                          <td key={dayIndex} className="py-2 px-1 text-center">
                            {tarefa ? (
                              <Select
                                value={tarefa.status}
                                onValueChange={(value) =>
                                  handleStatusChange(
                                    tarefa.id,
                                    value as TarefaDiaria["status"]
                                  )
                                }
                              >
                                <SelectTrigger className="h-8 text-xs border-0 bg-transparent">
                                  <Badge
                                    variant="secondary"
                                    className={`${statusOption.color} text-xs`}
                                  >
                                    {statusOption.label.split(" ")[0]}
                                  </Badge>
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                  {STATUS_OPTIONS.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      <Badge
                                        variant="secondary"
                                        className={`${option.color} text-xs`}
                                      >
                                        {option.label}
                                      </Badge>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
