import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Clock, CalendarClock, AlertCircle } from "lucide-react";
import { useIsIOSMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FocoDoDia } from "./FocoDoDia";
import { AlertasRisco } from "./AlertasRisco";
import { useDashboardTarefas, useInvalidateDashboardTarefas } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";

interface DashboardNichoTabProps {
  nichoId: string;
  alertasHabilitado?: boolean;
}

export function DashboardNichoTab({ nichoId, alertasHabilitado = false }: DashboardNichoTabProps) {
  const { data, isLoading: loading } = useDashboardTarefas(nichoId);
  const invalidateTarefas = useInvalidateDashboardTarefas(nichoId);
  const queryClient = useQueryClient();
  
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const isIOSMobile = useIsIOSMobile();

  const tarefasAtrasadas = data?.tarefasAtrasadas || [];
  const tarefasHoje = data?.tarefasHoje || [];
  const contasAcao = data?.contasAcao || [];

  const handleConcluirTarefa = async (tarefaId: string) => {
    setCompletingTask(tarefaId);
    try {
      // Optimistic update
      queryClient.setQueryData(["dashboard-tarefas", nichoId], (old: any) => ({
        ...old,
        tarefasAtrasadas: old?.tarefasAtrasadas?.filter((t: any) => t.id !== tarefaId) || [],
        tarefasHoje: old?.tarefasHoje?.filter((t: any) => t.id !== tarefaId) || [],
      }));

      const { error } = await supabase
        .from("tarefa_diaria")
        .update({ status: "concluida" })
        .eq("id", tarefaId);

      if (error) throw error;
      toast.success("Tarefa concluída!");
    } catch (error) {
      console.error("Erro ao concluir tarefa:", error);
      toast.error("Erro ao concluir tarefa");
      invalidateTarefas();
    } finally {
      setCompletingTask(null);
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === "limitada") return "Risco";
    if (status === "banida") return "Desativada";
    return status;
  };

  const totalPendentes = tarefasAtrasadas.length + tarefasHoje.length + contasAcao.length;

  if (loading) {
    return (
      <div className="space-y-6 tab-content">
        <div className="h-24 rounded-lg skeleton-pulse bg-muted" />
        <div className="h-64 rounded-lg skeleton-pulse bg-muted" />
      </div>
    );
  }

  return (
    <div className={cn("tab-content", isIOSMobile ? "space-y-4" : "space-y-6")}>
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
