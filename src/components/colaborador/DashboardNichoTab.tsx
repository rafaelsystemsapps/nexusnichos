import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Clock, CalendarClock, AlertCircle } from "lucide-react";
import { useIsIOSMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { FocoDoDia } from "./FocoDoDia";
import { AlertasRisco } from "./AlertasRisco";

interface DashboardNichoTabProps {
  nichoId: string;
  alertasHabilitado?: boolean;
}

interface TarefaFila {
  id: string;
  data: string;
  status: string;
  template_titulo: string;
  conta_nome?: string;
  dias_atraso?: number;
}

interface ContaAcao {
  id: string;
  nome_conta: string;
  plataforma: string;
  status: string;
  proxima_acao: string | null;
}

export function DashboardNichoTab({ nichoId, alertasHabilitado = false }: DashboardNichoTabProps) {
  const [tarefasAtrasadas, setTarefasAtrasadas] = useState<TarefaFila[]>([]);
  const [tarefasHoje, setTarefasHoje] = useState<TarefaFila[]>([]);
  const [contasAcao, setContasAcao] = useState<ContaAcao[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const isIOSMobile = useIsIOSMobile();

  useEffect(() => {
    fetchFilaExecucao();
  }, [nichoId]);

  const fetchFilaExecucao = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];

      // Buscar semanas do nicho para pegar os IDs
      const { data: semanasData } = await supabase
        .from("semana_logistica")
        .select("id")
        .eq("nicho_id", nichoId);

      const semanaIds = semanasData?.map(s => s.id) || [];

      if (semanaIds.length > 0) {
        // Tarefas atrasadas (data < hoje e não concluídas)
        const { data: atrasadasData } = await supabase
          .from("tarefa_diaria")
          .select(`
            id,
            data,
            status,
            tarefa_templates!inner(titulo, conta_id, contas_redes_sociais(nome_conta))
          `)
          .in("semana_id", semanaIds)
          .lt("data", hoje)
          .in("status", ["pendente", "em_andamento"])
          .order("data", { ascending: true });

        const atrasadas: TarefaFila[] = (atrasadasData || []).map((t: any) => ({
          id: t.id,
          data: t.data,
          status: t.status,
          template_titulo: t.tarefa_templates?.titulo || "Tarefa",
          conta_nome: t.tarefa_templates?.contas_redes_sociais?.nome_conta,
          dias_atraso: differenceInDays(new Date(), new Date(t.data)),
        }));
        setTarefasAtrasadas(atrasadas);

        // Tarefas de hoje (não concluídas)
        const { data: hojeData } = await supabase
          .from("tarefa_diaria")
          .select(`
            id,
            data,
            status,
            tarefa_templates!inner(titulo, ordem, conta_id, contas_redes_sociais(nome_conta))
          `)
          .in("semana_id", semanaIds)
          .eq("data", hoje)
          .neq("status", "concluida")
          .order("tarefa_templates(ordem)", { ascending: true });

        const hojeList: TarefaFila[] = (hojeData || []).map((t: any) => ({
          id: t.id,
          data: t.data,
          status: t.status,
          template_titulo: t.tarefa_templates?.titulo || "Tarefa",
          conta_nome: t.tarefa_templates?.contas_redes_sociais?.nome_conta,
        }));
        setTarefasHoje(hojeList);
      } else {
        setTarefasAtrasadas([]);
        setTarefasHoje([]);
      }

      // Contas precisando de ação (limitada = risco, banida = caída)
      const { data: contasData } = await supabase
        .from("contas_redes_sociais")
        .select("id, nome_conta, plataforma, status, proxima_acao")
        .eq("nicho_id", nichoId)
        .in("status", ["limitada", "banida"])
        .order("nome_conta");

      setContasAcao(contasData || []);
    } catch (error) {
      console.error("Erro ao carregar fila de execução:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConcluirTarefa = async (tarefaId: string) => {
    setCompletingTask(tarefaId);
    try {
      const { error } = await supabase
        .from("tarefa_diaria")
        .update({ status: "concluida" })
        .eq("id", tarefaId);

      if (error) throw error;

      // Remove da lista local
      setTarefasAtrasadas(prev => prev.filter(t => t.id !== tarefaId));
      setTarefasHoje(prev => prev.filter(t => t.id !== tarefaId));
      
      toast.success("Tarefa concluída!");
    } catch (error) {
      console.error("Erro ao concluir tarefa:", error);
      toast.error("Erro ao concluir tarefa");
    } finally {
      setCompletingTask(null);
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === "limitada") return "Risco";
    if (status === "banida") return "Caída";
    return status;
  };

  const totalPendentes = tarefasAtrasadas.length + tarefasHoje.length + contasAcao.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn(isIOSMobile ? "space-y-4" : "space-y-6")}>
      {/* Foco do Dia - Sempre visível no topo */}
      <FocoDoDia nichoId={nichoId} />

      {/* Alertas de Risco - Abaixo do Foco, acima da Fila */}
      {alertasHabilitado && <AlertasRisco nichoId={nichoId} />}

      {/* Fila de Execução HOJE */}
      <Card className={cn(
        "border-border/50",
        isIOSMobile ? "ios-card" : "shadow-premium"
      )}>
        <CardHeader className={cn(isIOSMobile ? "p-3 pb-2" : "pb-3")}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            isIOSMobile ? "text-base" : "text-lg"
          )}>
            <CalendarClock className={cn(
              "text-primary",
              isIOSMobile ? "h-4 w-4" : "h-5 w-5"
            )} />
            Fila de Execução HOJE
          </CardTitle>
        </CardHeader>
        <CardContent className={isIOSMobile ? "p-3 pt-0" : undefined}>
          {totalPendentes === 0 ? (
            <div className={cn(
              "flex flex-col items-center justify-center py-8 text-center",
              isIOSMobile ? "py-6" : "py-8"
            )}>
              <CheckCircle className={cn(
                "text-green-500 mb-2",
                isIOSMobile ? "h-10 w-10" : "h-12 w-12"
              )} />
              <p className={cn(
                "font-medium text-green-600",
                isIOSMobile ? "text-base" : "text-lg"
              )}>
                Fila limpa! Você está em dia.
              </p>
              <p className={cn(
                "text-muted-foreground",
                isIOSMobile ? "text-xs" : "text-sm"
              )}>
                Sem tarefas atrasadas ou pendentes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Atrasadas */}
              {tarefasAtrasadas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className={cn(
                      "font-medium text-destructive",
                      isIOSMobile ? "text-sm" : "text-sm"
                    )}>
                      ATRASADAS ({tarefasAtrasadas.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {tarefasAtrasadas.map((tarefa) => (
                      <div
                        key={tarefa.id}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3",
                          isIOSMobile && "p-2.5"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium truncate",
                            isIOSMobile ? "text-sm" : "text-sm"
                          )}>
                            {tarefa.template_titulo}
                          </p>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className={cn(
                              "text-destructive font-medium",
                              isIOSMobile ? "text-xs" : "text-xs"
                            )}>
                              {tarefa.dias_atraso === 1 ? "Ontem" : `${tarefa.dias_atraso} dias`}
                            </span>
                            {tarefa.conta_nome && (
                              <span className={isIOSMobile ? "text-xs" : "text-xs"}>
                                @{tarefa.conta_nome}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConcluirTarefa(tarefa.id)}
                          disabled={completingTask === tarefa.id}
                          className={cn(
                            "shrink-0",
                            isIOSMobile ? "h-8 px-2 text-xs" : "h-8"
                          )}
                        >
                          {completingTask === tarefa.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Concluir
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hoje */}
              {tarefasHoje.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className={cn(
                      "font-medium text-yellow-600",
                      isIOSMobile ? "text-sm" : "text-sm"
                    )}>
                      HOJE ({tarefasHoje.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {tarefasHoje.map((tarefa) => (
                      <div
                        key={tarefa.id}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3",
                          isIOSMobile && "p-2.5"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium truncate",
                            isIOSMobile ? "text-sm" : "text-sm"
                          )}>
                            {tarefa.template_titulo}
                          </p>
                          {tarefa.conta_nome && (
                            <span className={cn(
                              "text-muted-foreground",
                              isIOSMobile ? "text-xs" : "text-xs"
                            )}>
                              @{tarefa.conta_nome}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConcluirTarefa(tarefa.id)}
                          disabled={completingTask === tarefa.id}
                          className={cn(
                            "shrink-0",
                            isIOSMobile ? "h-8 px-2 text-xs" : "h-8"
                          )}
                        >
                          {completingTask === tarefa.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Concluir
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contas precisando ação */}
              {contasAcao.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className={cn(
                      "font-medium text-orange-600",
                      isIOSMobile ? "text-sm" : "text-sm"
                    )}>
                      CONTAS PRECISANDO AÇÃO ({contasAcao.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {contasAcao.map((conta) => (
                      <div
                        key={conta.id}
                        className={cn(
                          "rounded-lg border border-orange-500/30 bg-orange-500/5 p-3",
                          isIOSMobile && "p-2.5"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            conta.status === "banida" 
                              ? "text-destructive" 
                              : "text-yellow-600",
                            "font-medium",
                            isIOSMobile ? "text-xs" : "text-xs"
                          )}>
                            {conta.status === "banida" ? "🔴" : "🟡"} [{getStatusLabel(conta.status)}]
                          </span>
                          <span className={cn(
                            "font-medium",
                            isIOSMobile ? "text-sm" : "text-sm"
                          )}>
                            @{conta.nome_conta}
                          </span>
                          <span className={cn(
                            "text-muted-foreground capitalize",
                            isIOSMobile ? "text-xs" : "text-xs"
                          )}>
                            {conta.plataforma}
                          </span>
                        </div>
                        {conta.proxima_acao && (
                          <p className={cn(
                            "text-muted-foreground pl-5",
                            isIOSMobile ? "text-xs" : "text-sm"
                          )}>
                            → {conta.proxima_acao}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
