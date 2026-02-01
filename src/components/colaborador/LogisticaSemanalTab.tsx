import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addDays, getWeek, getYear, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, Circle, Clock, XCircle, Trash2, ListChecks, Pencil, ChevronDown, Settings2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { TemplateForm } from "./TemplateForm";

interface Conta {
  id: string;
  nome_conta: string;
  plataforma: string;
}

interface LogisticaSemanalTabProps {
  nichoId: string;
}

interface TarefaTemplate {
  id: string;
  titulo: string;
  descricao: string | null;
  conta_id: string | null;
  ativa: boolean;
  ordem: number;
  vezes_por_semana: number;
  conta?: {
    nome_conta: string;
    plataforma: string;
  } | null;
}

interface TarefaDiaria {
  id: string;
  template_id: string;
  data: string;
  dia_semana: number;
  status: "pendente" | "em_andamento" | "concluida" | "nao_concluida";
  template?: TarefaTemplate;
}

interface SemanaLogistica {
  id: string;
  semana_numero: number;
  ano: number;
  semana_inicio: string;
  semana_fim: string;
  status: string;
}

interface MetricasMes {
  total: number;
  concluida: number;
  pendente: number;
  em_andamento: number;
  nao_concluida: number;
  percentual: number;
}

const STATUS_CONFIG = {
  pendente: { icon: Circle, label: "Pendente", color: "bg-muted text-muted-foreground" },
  em_andamento: { icon: Clock, label: "Em Andamento", color: "bg-yellow-500/20 text-yellow-500" },
  concluida: { icon: CheckCircle2, label: "Concluída", color: "bg-green-500/20 text-green-500" },
  nao_concluida: { icon: XCircle, label: "Não Concluída", color: "bg-destructive/20 text-destructive" },
};

// Status que podem ser selecionados manualmente (sem "nao_concluida" que é automático)
const STATUS_SELECIONAVEIS = ["pendente", "em_andamento", "concluida"] as const;

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function LogisticaSemanalTab({ nichoId }: LogisticaSemanalTabProps) {
  const [loading, setLoading] = useState(true);
  const [semanaAtual, setSemanaAtual] = useState<SemanaLogistica | null>(null);
  const [tarefas, setTarefas] = useState<TarefaDiaria[]>([]);
  const [templates, setTemplates] = useState<TarefaTemplate[]>([]);
  const [allTemplates, setAllTemplates] = useState<TarefaTemplate[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [contaFiltro, setContaFiltro] = useState<string>("todas");
  const [weekOffset, setWeekOffset] = useState(0);
  const [templateParaDeletar, setTemplateParaDeletar] = useState<TarefaTemplate | null>(null);
  
  // Template management states
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TarefaTemplate | null>(null);

  // Navegação mensal e métricas
  const [monthOffset, setMonthOffset] = useState(0);
  const [metricasMes, setMetricasMes] = useState<MetricasMes>({
    total: 0,
    concluida: 0,
    pendente: 0,
    em_andamento: 0,
    nao_concluida: 0,
    percentual: 0,
  });
  const [loadingMetricasMes, setLoadingMetricasMes] = useState(false);

  const getWeekDates = useCallback(() => {
    const hoje = new Date();
    const semanaInicio = startOfWeek(addDays(hoje, weekOffset * 7), { weekStartsOn: 1 });
    const semanaFim = endOfWeek(addDays(hoje, weekOffset * 7), { weekStartsOn: 1 });
    return { semanaInicio, semanaFim };
  }, [weekOffset]);

  const getMonthDates = useCallback(() => {
    const base = new Date();
    const mesReferencia = addMonths(base, monthOffset);
    const inicioMes = startOfMonth(mesReferencia);
    const fimMes = endOfMonth(mesReferencia);
    return { mesReferencia, inicioMes, fimMes };
  }, [monthOffset]);

  const fetchMetricasMes = useCallback(async () => {
    if (!nichoId) return;
    setLoadingMetricasMes(true);

    try {
      const { inicioMes, fimMes } = getMonthDates();
      const inicioStr = format(inicioMes, "yyyy-MM-dd");
      const fimStr = format(fimMes, "yyyy-MM-dd");

      // 1) Buscar semanas do nicho que intersectam com o mês
      const { data: semanasData, error: semanasError } = await supabase
        .from("semana_logistica")
        .select("id")
        .eq("nicho_id", nichoId)
        .or(`semana_inicio.lte.${fimStr},semana_fim.gte.${inicioStr}`);

      if (semanasError) throw semanasError;

      if (!semanasData || semanasData.length === 0) {
        setMetricasMes({ total: 0, concluida: 0, pendente: 0, em_andamento: 0, nao_concluida: 0, percentual: 0 });
        return;
      }

      const semanaIds = semanasData.map((s) => s.id);

      // 2) Buscar tarefas dessas semanas no range de datas do mês
      const { data: tarefasData, error: tarefasError } = await supabase
        .from("tarefa_diaria")
        .select("id, status, data")
        .in("semana_id", semanaIds)
        .gte("data", inicioStr)
        .lte("data", fimStr);

      if (tarefasError) throw tarefasError;

      // 3) Calcular métricas
      const metricas = (tarefasData || []).reduce(
        (acc, t) => {
          acc.total += 1;
          if (t.status === "concluida") acc.concluida += 1;
          else if (t.status === "pendente") acc.pendente += 1;
          else if (t.status === "em_andamento") acc.em_andamento += 1;
          else if (t.status === "nao_concluida") acc.nao_concluida += 1;
          return acc;
        },
        { total: 0, concluida: 0, pendente: 0, em_andamento: 0, nao_concluida: 0, percentual: 0 }
      );

      metricas.percentual = metricas.total > 0 
        ? Math.round((metricas.concluida / metricas.total) * 100 * 10) / 10 
        : 0;

      setMetricasMes(metricas);
    } catch (error: any) {
      toast.error("Erro ao carregar métricas do mês: " + error.message);
    } finally {
      setLoadingMetricasMes(false);
    }
  }, [nichoId, getMonthDates]);

  const fetchData = useCallback(async () => {
    if (!nichoId) return;
    setLoading(true);

    try {
      const { semanaInicio, semanaFim } = getWeekDates();
      const semanaNumero = getWeek(semanaInicio, { weekStartsOn: 1 });
      const ano = getYear(semanaInicio);

      // Buscar ou criar semana logística
      let { data: semana, error: semanaError } = await supabase
        .from("semana_logistica")
        .select("*")
        .eq("nicho_id", nichoId)
        .eq("semana_numero", semanaNumero)
        .eq("ano", ano)
        .maybeSingle();

      if (semanaError) throw semanaError;

      if (!semana) {
        const { data: novaSemana, error: createError } = await supabase
          .from("semana_logistica")
          .insert({
            nicho_id: nichoId,
            semana_numero: semanaNumero,
            ano,
            semana_inicio: format(semanaInicio, "yyyy-MM-dd"),
            semana_fim: format(semanaFim, "yyyy-MM-dd"),
          })
          .select()
          .single();

        // Se der erro de duplicidade, buscar a semana existente
        if (createError) {
          if (createError.code === "23505") {
            const { data: semanaExistente } = await supabase
              .from("semana_logistica")
              .select("*")
              .eq("nicho_id", nichoId)
              .eq("semana_numero", semanaNumero)
              .eq("ano", ano)
              .maybeSingle();
            
            if (semanaExistente) {
              semana = semanaExistente;
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        } else {
          semana = novaSemana;
        }
      }

      setSemanaAtual(semana);

      // Buscar todos os templates (para gerenciamento)
      const { data: allTemplatesData, error: allTemplatesError } = await supabase
        .from("tarefa_templates")
        .select(`
          id,
          titulo,
          descricao,
          conta_id,
          ativa,
          ordem,
          vezes_por_semana,
          conta:conta_id (
            nome_conta,
            plataforma
          )
        `)
        .eq("nicho_id", nichoId)
        .order("ordem");

      if (allTemplatesError) throw allTemplatesError;
      setAllTemplates(allTemplatesData || []);

      // Filtrar apenas ativos para a grid
      setTemplates((allTemplatesData || []).filter(t => t.ativa));

      // Buscar tarefas da semana
      const { data: tarefasData, error: tarefasError } = await supabase
        .from("tarefa_diaria")
        .select(`
          id,
          template_id,
          data,
          dia_semana,
          status
        `)
        .eq("semana_id", semana.id);

      if (tarefasError) throw tarefasError;
      setTarefas(tarefasData || []);

      // Buscar contas para filtro
      const { data: contasData } = await supabase
        .from("contas_redes_sociais")
        .select("id, nome_conta, plataforma")
        .eq("nicho_id", nichoId)
        .order("nome_conta");

      setContas(contasData || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [nichoId, getWeekDates]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchMetricasMes();
  }, [fetchMetricasMes]);

  const gerarTarefasSemana = async () => {
    if (!semanaAtual || templates.length === 0) {
      toast.error("Nenhum template de tarefa configurado");
      return;
    }

    try {
      const { semanaInicio } = getWeekDates();
      const novasTarefas = [];

      for (const template of templates) {
        const vezes = template.vezes_por_semana ?? 7;
        
        if (vezes === 7) {
          // Tarefa diária: 7 tarefas por semana
          for (let dia = 0; dia < 7; dia++) {
            const dataTarefa = addDays(semanaInicio, dia);
            
            const existe = tarefas.some(
              (t) => t.template_id === template.id && t.dia_semana === dia
            );

            if (!existe) {
              novasTarefas.push({
                semana_id: semanaAtual.id,
                template_id: template.id,
                data: format(dataTarefa, "yyyy-MM-dd"),
                dia_semana: dia,
                status: "pendente" as const,
              });
            }
          }
        } else {
          // Tarefa não-diária: gerar 7 tarefas também (uma por dia), mas só pode concluir X vezes
          for (let dia = 0; dia < 7; dia++) {
            const dataTarefa = addDays(semanaInicio, dia);
            
            const existe = tarefas.some(
              (t) => t.template_id === template.id && t.dia_semana === dia
            );

            if (!existe) {
              novasTarefas.push({
                semana_id: semanaAtual.id,
                template_id: template.id,
                data: format(dataTarefa, "yyyy-MM-dd"),
                dia_semana: dia,
                status: "pendente" as const,
              });
            }
          }
        }
      }

      if (novasTarefas.length > 0) {
        const { error } = await supabase.from("tarefa_diaria").insert(novasTarefas);
        if (error) throw error;
        toast.success(`${novasTarefas.length} tarefas criadas!`);
        fetchData();
        fetchMetricasMes(); // Atualizar métricas mensais
      } else {
        toast.info("Todas as tarefas já foram geradas");
      }
    } catch (error: any) {
      toast.error("Erro ao gerar tarefas: " + error.message);
    }
  };

  const atualizarStatus = async (tarefaId: string, novoStatus: TarefaDiaria["status"]) => {
    try {
      const { error } = await supabase
        .from("tarefa_diaria")
        .update({ status: novoStatus })
        .eq("id", tarefaId);

      if (error) throw error;
      
      setTarefas((prev) =>
        prev.map((t) => (t.id === tarefaId ? { ...t, status: novoStatus } : t))
      );
      
      // Atualizar métricas mensais após mudança de status
      fetchMetricasMes();
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  const deletarTemplate = async () => {
    if (!templateParaDeletar) return;
    
    try {
      // Deletar template (as tarefas diárias serão deletadas pela constraint ou manualmente)
      const { error } = await supabase
        .from("tarefa_templates")
        .delete()
        .eq("id", templateParaDeletar.id);

      if (error) throw error;
      
      setTemplates((prev) => prev.filter((t) => t.id !== templateParaDeletar.id));
      setAllTemplates((prev) => prev.filter((t) => t.id !== templateParaDeletar.id));
      setTarefas((prev) => prev.filter((t) => t.template_id !== templateParaDeletar.id));
      toast.success("Template removido com sucesso");
      fetchMetricasMes(); // Atualizar métricas
    } catch (error: any) {
      toast.error("Erro ao remover template: " + error.message);
    } finally {
      setTemplateParaDeletar(null);
    }
  };

  const handleToggleTemplateAtivo = async (template: TarefaTemplate) => {
    const newAtiva = !template.ativa;
    
    // Optimistic update
    setAllTemplates(prev => prev.map(t => 
      t.id === template.id ? { ...t, ativa: newAtiva } : t
    ));
    if (newAtiva) {
      setTemplates(prev => [...prev, { ...template, ativa: newAtiva }]);
    } else {
      setTemplates(prev => prev.filter(t => t.id !== template.id));
    }

    try {
      const { error } = await supabase
        .from("tarefa_templates")
        .update({ ativa: newAtiva })
        .eq("id", template.id);

      if (error) throw error;
      toast.success(newAtiva ? "Template ativado" : "Template desativado");
    } catch (error: any) {
      // Rollback
      setAllTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...t, ativa: !newAtiva } : t
      ));
      if (!newAtiva) {
        setTemplates(prev => [...prev, { ...template, ativa: !newAtiva }]);
      } else {
        setTemplates(prev => prev.filter(t => t.id !== template.id));
      }
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  const handleEditTemplate = (template: TarefaTemplate) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setFormOpen(true);
  };

  const deletarTarefa = async (tarefaId: string) => {
    try {
      const { error } = await supabase
        .from("tarefa_diaria")
        .delete()
        .eq("id", tarefaId);

      if (error) throw error;
      
      setTarefas((prev) => prev.filter((t) => t.id !== tarefaId));
      toast.success("Tarefa removida");
      fetchMetricasMes(); // Atualizar métricas
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  const getTarefaParaDia = (templateId: string, diaSemana: number) => {
    return tarefas.find((t) => t.template_id === templateId && t.dia_semana === diaSemana);
  };

  const templatesFiltrados = contaFiltro === "todas"
    ? templates
    : contaFiltro === "geral"
    ? templates.filter((t) => !t.conta_id)
    : templates.filter((t) => t.conta_id === contaFiltro);

  // Separar templates diários e não-diários
  const templatesDiarios = templatesFiltrados.filter(t => (t.vezes_por_semana ?? 7) === 7);
  const templatesNaoDiarios = templatesFiltrados.filter(t => (t.vezes_por_semana ?? 7) < 7);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const { semanaInicio, semanaFim } = getWeekDates();
  const { mesReferencia } = getMonthDates();

  return (
    <div className="space-y-6">
      {/* Navegação Mensal e Métricas */}
      <div className="space-y-4">
        {/* Barra de navegação do mês */}
        <div className="flex items-center justify-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setMonthOffset((m) => m - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-[180px] justify-center">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-lg font-semibold capitalize">
              {format(mesReferencia, "MMMM yyyy", { locale: ptBR })}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setMonthOffset((m) => m + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setMonthOffset(0)}
            disabled={monthOffset === 0}
          >
            Mês Atual
          </Button>
        </div>

        {/* Card de métricas mensais */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Resumo do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMetricasMes ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <div className="text-2xl font-bold">{metricasMes.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-500/10">
                  <div className="text-2xl font-bold text-green-500">
                    {metricasMes.concluida}
                  </div>
                  <div className="text-xs text-muted-foreground">Concluídas</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-primary/10">
                  <div className="text-2xl font-bold text-primary">
                    {metricasMes.percentual}%
                  </div>
                  <div className="text-xs text-muted-foreground">Conclusão</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                  <div className="text-2xl font-bold text-yellow-500">
                    {metricasMes.pendente + metricasMes.em_andamento}
                  </div>
                  <div className="text-xs text-muted-foreground">Pendentes</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-destructive/10">
                  <div className="text-2xl font-bold text-destructive">
                    {metricasMes.nao_concluida}
                  </div>
                  <div className="text-xs text-muted-foreground">Não Concluídas</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Logística Semanal</h2>
          <p className="text-muted-foreground">
            Semana {semanaAtual?.semana_numero} • {format(semanaInicio, "dd/MM", { locale: ptBR })} - {format(semanaFim, "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setWeekOffset(0)}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={gerarTarefasSemana}>
            <Plus className="h-4 w-4 mr-2" />
            Gerar Tarefas
          </Button>
        </div>
      </div>

      {/* Filtro por conta */}
      <div className="flex items-center gap-4">
        <Select value={contaFiltro} onValueChange={setContaFiltro}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filtrar por conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as contas</SelectItem>
            <SelectItem value="geral">Geral (sem conta)</SelectItem>
            {contas.map((conta) => (
              <SelectItem key={conta.id} value={conta.id}>
                @{conta.nome_conta} ({conta.plataforma})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Seção colapsável de Templates de Tarefas */}
      <Collapsible open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <Card className="bg-card/50 border-border/50">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Settings2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Templates de Tarefas</CardTitle>
                    <CardDescription className="text-xs">Configure as tarefas que aparecem na Logística Semanal</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {allTemplates.filter(t => t.ativa).length} ativos
                  </Badge>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", templatesOpen && "rotate-180")} />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              <div className="flex justify-end">
                <Button onClick={handleNewTemplate} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Novo
                </Button>
              </div>
              {allTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListChecks className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum template configurado</p>
                  <p className="text-sm">Crie templates para organizar suas tarefas semanais</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        template.ativa 
                          ? "bg-surface/50 border-border/30" 
                          : "bg-muted/20 border-border/20 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Switch
                          checked={template.ativa}
                          onCheckedChange={() => handleToggleTemplateAtivo(template)}
                          className="shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`font-medium truncate ${!template.ativa && "text-muted-foreground"}`}>
                            {template.titulo}
                            {(template.vezes_por_semana ?? 7) < 7 && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {template.vezes_por_semana}x/sem
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {template.conta 
                              ? `@${template.conta.nome_conta} (${template.conta.plataforma})`
                              : "Geral"
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTemplate(template)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setTemplateParaDeletar(template)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Grid de tarefas */}
      {templatesFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ListChecks className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Nenhum template de tarefa ativo</p>
            <p className="text-sm">Ative templates acima para gerar tarefas</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 font-medium text-muted-foreground w-[200px]">Tarefa</th>
                  {DIAS_SEMANA.map((dia, i) => (
                    <th key={dia} className="text-center p-4 font-medium text-muted-foreground">
                      <div>{dia}</div>
                      <div className="text-xs">
                        {format(addDays(semanaInicio, i), "dd/MM")}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Templates diários */}
                {templatesDiarios.map((template) => (
                  <tr key={template.id} className="border-b border-border/30 hover:bg-muted/30 group">
                    <td className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{template.titulo}</div>
                          {template.conta && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              @{template.conta.nome_conta}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={() => setTemplateParaDeletar(template)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    {DIAS_SEMANA.map((_, diaIndex) => {
                      const tarefa = getTarefaParaDia(template.id, diaIndex);
                      const StatusIcon = tarefa ? STATUS_CONFIG[tarefa.status].icon : Circle;
                      const statusConfig = tarefa ? STATUS_CONFIG[tarefa.status] : STATUS_CONFIG.pendente;

                      return (
                        <td key={diaIndex} className="text-center p-2">
                          {tarefa ? (
                            <Select
                              value={tarefa.status}
                              onValueChange={(v) => atualizarStatus(tarefa.id, v as TarefaDiaria["status"])}
                            >
                              <SelectTrigger className={cn("w-full h-10 border-none", statusConfig.color)}>
                                <StatusIcon className="h-4 w-4" />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_SELECIONAVEIS.map((key) => {
                                  const config = STATUS_CONFIG[key];
                                  return (
                                    <SelectItem key={key} value={key}>
                                      <div className="flex items-center gap-2">
                                        <config.icon className="h-4 w-4" />
                                        {config.label}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="h-10 flex items-center justify-center text-muted-foreground/30">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Templates não-diários (1-6x por semana) */}
                {templatesNaoDiarios.map((template) => {
                  const vezes = template.vezes_por_semana ?? 1;
                  const tarefasDoTemplate = tarefas.filter(
                    (t) => t.template_id === template.id && t.dia_semana >= 0
                  );
                  const concluidas = tarefasDoTemplate.filter(t => t.status === "concluida").length;
                  const limitAtingido = concluidas >= vezes;

                  return (
                    <tr key={template.id} className="border-b border-border/30 hover:bg-muted/30 group">
                      <td className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {template.titulo}
                              <Badge 
                                variant={limitAtingido ? "default" : "secondary"} 
                                className={cn("text-xs", limitAtingido && "bg-green-500/20 text-green-500")}
                              >
                                {concluidas}/{vezes}
                              </Badge>
                            </div>
                            {template.conta && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                @{template.conta.nome_conta}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={() => setTemplateParaDeletar(template)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      {DIAS_SEMANA.map((_, diaIndex) => {
                        const tarefa = getTarefaParaDia(template.id, diaIndex);
                        const StatusIcon = tarefa ? STATUS_CONFIG[tarefa.status].icon : Circle;
                        const statusConfig = tarefa ? STATUS_CONFIG[tarefa.status] : STATUS_CONFIG.pendente;
                        const estaConcluida = tarefa?.status === "concluida";
                        const podeMarcarConcluida = !limitAtingido || estaConcluida;

                        return (
                          <td key={diaIndex} className="text-center p-2">
                            {tarefa ? (
                              <Select
                                value={tarefa.status}
                                onValueChange={(v) => {
                                  // Se está tentando marcar como concluída e já atingiu o limite
                                  if (v === "concluida" && !podeMarcarConcluida) {
                                    toast.info(`Limite de ${vezes}x por semana atingido!`);
                                    return;
                                  }
                                  atualizarStatus(tarefa.id, v as TarefaDiaria["status"]);
                                }}
                              >
                                <SelectTrigger 
                                  className={cn(
                                    "w-full h-10 border-none", 
                                    statusConfig.color,
                                    limitAtingido && !estaConcluida && "opacity-40"
                                  )}
                                >
                                  <StatusIcon className="h-4 w-4" />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_SELECIONAVEIS.map((key) => {
                                    const config = STATUS_CONFIG[key];
                                    const disabled = key === "concluida" && !podeMarcarConcluida;
                                    return (
                                      <SelectItem 
                                        key={key} 
                                        value={key}
                                        disabled={disabled}
                                      >
                                        <div className={cn("flex items-center gap-2", disabled && "opacity-50")}>
                                          <config.icon className="h-4 w-4" />
                                          {config.label}
                                          {disabled && " (limite)"}
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="h-10 flex items-center justify-center text-muted-foreground/30">
                                —
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmação para deletar template */}
      <AlertDialog open={!!templateParaDeletar} onOpenChange={(open) => !open && setTemplateParaDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover template de tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o template "{templateParaDeletar?.titulo}"? 
              Isso também removerá todas as tarefas associadas desta semana.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deletarTemplate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template Form Modal */}
      <TemplateForm
        open={formOpen}
        onOpenChange={setFormOpen}
        nichoId={nichoId}
        template={editingTemplate}
        contas={contas}
        onSuccess={fetchData}
      />
    </div>
  );
}
