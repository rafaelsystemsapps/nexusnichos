import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addDays, getWeek, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, Circle, Clock, XCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogisticaSemanalTabProps {
  nichoId: string;
}

interface TarefaTemplate {
  id: string;
  titulo: string;
  descricao: string | null;
  conta_id: string | null;
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

const STATUS_CONFIG = {
  pendente: { icon: Circle, label: "Pendente", color: "bg-muted text-muted-foreground" },
  em_andamento: { icon: Clock, label: "Em Andamento", color: "bg-yellow-500/20 text-yellow-500" },
  concluida: { icon: CheckCircle2, label: "Concluída", color: "bg-green-500/20 text-green-500" },
  nao_concluida: { icon: XCircle, label: "Não Concluída", color: "bg-destructive/20 text-destructive" },
};

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function LogisticaSemanalTab({ nichoId }: LogisticaSemanalTabProps) {
  const [loading, setLoading] = useState(true);
  const [semanaAtual, setSemanaAtual] = useState<SemanaLogistica | null>(null);
  const [tarefas, setTarefas] = useState<TarefaDiaria[]>([]);
  const [templates, setTemplates] = useState<TarefaTemplate[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [contaFiltro, setContaFiltro] = useState<string>("todas");
  const [weekOffset, setWeekOffset] = useState(0);
  const [templateParaDeletar, setTemplateParaDeletar] = useState<TarefaTemplate | null>(null);

  const getWeekDates = useCallback(() => {
    const hoje = new Date();
    const semanaInicio = startOfWeek(addDays(hoje, weekOffset * 7), { weekStartsOn: 1 });
    const semanaFim = endOfWeek(addDays(hoje, weekOffset * 7), { weekStartsOn: 1 });
    return { semanaInicio, semanaFim };
  }, [weekOffset]);

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

        if (createError) throw createError;
        semana = novaSemana;
      }

      setSemanaAtual(semana);

      // Buscar templates ativos
      const { data: templatesData, error: templatesError } = await supabase
        .from("tarefa_templates")
        .select(`
          id,
          titulo,
          descricao,
          conta_id,
          conta:conta_id (
            nome_conta,
            plataforma
          )
        `)
        .eq("nicho_id", nichoId)
        .eq("ativa", true)
        .order("ordem");

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

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

  const gerarTarefasSemana = async () => {
    if (!semanaAtual || templates.length === 0) {
      toast.error("Nenhum template de tarefa configurado");
      return;
    }

    try {
      const { semanaInicio } = getWeekDates();
      const novasTarefas = [];

      for (const template of templates) {
        for (let dia = 0; dia < 7; dia++) {
          const dataTarefa = addDays(semanaInicio, dia);
          
          // Verificar se já existe
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

      if (novasTarefas.length > 0) {
        const { error } = await supabase.from("tarefa_diaria").insert(novasTarefas);
        if (error) throw error;
        toast.success(`${novasTarefas.length} tarefas criadas!`);
        fetchData();
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
      setTarefas((prev) => prev.filter((t) => t.template_id !== templateParaDeletar.id));
      toast.success("Template removido com sucesso");
    } catch (error: any) {
      toast.error("Erro ao remover template: " + error.message);
    } finally {
      setTemplateParaDeletar(null);
    }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const { semanaInicio, semanaFim } = getWeekDates();

  return (
    <div className="space-y-6">
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

      {/* Grid de tarefas */}
      {templatesFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum template de tarefa configurado. Configure templates em Configurações.
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
                {templatesFiltrados.map((template) => (
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
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <config.icon className="h-4 w-4" />
                                      {config.label}
                                    </div>
                                  </SelectItem>
                                ))}
                                <div
                                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm text-destructive hover:bg-destructive/10 outline-none"
                                  onClick={() => deletarTarefa(tarefa.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Remover
                                  </div>
                                </div>
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
    </div>
  );
}
