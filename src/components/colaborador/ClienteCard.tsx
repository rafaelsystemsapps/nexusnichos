import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Instagram,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Percent,
  DollarSign,
  Smartphone,
  Calendar,
  GripVertical,
  Brain,
} from "lucide-react";
import { TarefaClienteItem } from "./TarefaClienteItem";
import { ClienteForm } from "./ClienteForm";
import { ClienteAppsSection } from "./ClienteAppsSection";
import { useDeleteCliente } from "@/hooks/queries/useClientes";
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

interface ClienteCardProps {
  cliente: any;
  onUpdate: () => void;
  nichoId: string;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function ClienteCard({ cliente, onUpdate, nichoId, dragHandleProps }: ClienteCardProps) {
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [novaTarefa, setNovaTarefa] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingObs, setEditingObs] = useState(false);
  const [obsText, setObsText] = useState(cliente.observacao_texto || "");
  const [savingObs, setSavingObs] = useState(false);

  const deleteCliente = useDeleteCliente(nichoId);

  useEffect(() => {
    fetchTarefas();
  }, [cliente.id]);

  const fetchTarefas = async () => {
    const { data } = await supabase
      .from("tarefas_cliente")
      .select("*")
      .eq("cliente_id", cliente.id)
      .order("ordem", { ascending: true });
    if (data) setTarefas(data);
  };

  const handleAddTarefa = async () => {
    if (!novaTarefa.trim()) return;
    setAddingTask(true);
    try {
      const { error } = await supabase
        .from("tarefas_cliente")
        .insert({
          cliente_id: cliente.id,
          descricao: novaTarefa.trim(),
          ordem: tarefas.length,
        });
      if (error) throw error;
      setNovaTarefa("");
      fetchTarefas();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setAddingTask(false);
    }
  };

  const handleDelete = () => {
    deleteCliente.mutate(cliente.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        onUpdate();
      },
    });
  };

  const handleSaveObs = async () => {
    setSavingObs(true);
    try {
      const { error } = await supabase
        .from("clientes")
        .update({ observacao_texto: obsText })
        .eq("id", cliente.id);
      if (error) throw error;
      setEditingObs(false);
      onUpdate();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setSavingObs(false);
    }
  };

  const tarefasConcluidas = tarefas.filter(t => t.status === "feito").length;
  const progresso = tarefas.length > 0 ? (tarefasConcluidas / tarefas.length) * 100 : 0;

  const tipoStyles = {
    influencer: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    negocio_local: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  const statusStyles = {
    rodando: "bg-emerald-500/20 text-emerald-400",
    pausado: "bg-amber-500/20 text-amber-400",
    finalizado: "bg-muted text-muted-foreground",
  };

  // TikTok icon component
  const TikTokIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  );

  // Calcular tempo de parceria
  const calcularTempoParceria = () => {
    if (!cliente.data_inicio_parceria) return null;
    const inicio = new Date(cliente.data_inicio_parceria);
    const hoje = new Date();
    const diffMs = hoje.getTime() - inicio.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDias < 30) return `${diffDias} dias`;
    const diffMeses = Math.floor(diffDias / 30);
    if (diffMeses < 12) return `${diffMeses} ${diffMeses === 1 ? "mês" : "meses"}`;
    const diffAnos = Math.floor(diffMeses / 12);
    return `${diffAnos} ${diffAnos === 1 ? "ano" : "anos"}`;
  };

  const tempoParceria = calcularTempoParceria();

  const formatarValorContrato = () => {
    if (!cliente.valor_contrato) return null;
    if (cliente.modelo_pagamento === "porcentagem") {
      return `${cliente.valor_contrato}%`;
    }
    return `R$ ${cliente.valor_contrato.toLocaleString("pt-BR")}`;
  };

  const formatarTicket = () => {
    if (cliente.modelo_pagamento !== "porcentagem") return null;
    if (!cliente.ticket_valor) return "Ticket não informado";
    return `Ticket: R$ ${cliente.ticket_valor.toLocaleString("pt-BR")}`;
  };

  return (
    <>
      <Card className={cn(
        "bg-card/50 border-border/50 hover:border-border/80 transition-all",
        cliente.status === "pausado" && "opacity-70"
      )}>
        <CardHeader className="pb-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            {/* Drag Handle */}
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1 -ml-1 -mt-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <GripVertical className="h-5 w-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="font-semibold text-lg truncate">{cliente.nome}</h3>
                <Badge className={cn("text-xs", tipoStyles[cliente.tipo as keyof typeof tipoStyles])}>
                  {cliente.tipo === "influencer" ? "Influencer" : "Negócio Local"}
                </Badge>
                <Badge className={cn("text-xs", statusStyles[cliente.status as keyof typeof statusStyles])}>
                  {cliente.status === "rodando" ? "Rodando" : cliente.status === "pausado" ? "Pausado" : "Finalizado"}
                </Badge>
              </div>

              {/* Links Rápidos */}
              <div className="flex items-center gap-2 flex-wrap">
                {cliente.instagram_url && (
                  <a
                    href={cliente.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 transition-colors"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {cliente.tiktok_url && (
                  <a
                    href={cliente.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors"
                  >
                    <TikTokIcon />
                  </a>
                )}
                {cliente.outro_link_url && (
                  <a
                    href={cliente.outro_link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {cliente.outro_link_label || "Link"}
                  </a>
                )}
                {cliente.link_principal && (
                  <a
                    href={cliente.link_principal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-xs text-primary transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Link Principal
                  </a>
                )}
                {cliente.mapa_mental_url && (
                  <a
                    href={cliente.mapa_mental_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-500/10 hover:bg-violet-500/20 text-xs text-violet-400 transition-colors"
                  >
                    <Brain className="h-3 w-3" />
                    Mapa Mental
                  </a>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditDialogOpen(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Info do Contrato */}
          {(cliente.modelo_pagamento || cliente.app_url || tempoParceria) && (
            <div className="flex items-center gap-3 flex-wrap mt-2 pt-2 border-t border-border/30">
              {cliente.modelo_pagamento && cliente.valor_contrato && (
                <div className="flex items-center gap-1.5 text-sm">
                  {cliente.modelo_pagamento === "porcentagem" ? (
                    <Percent className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                  )}
                  <span className="text-foreground font-medium">{formatarValorContrato()}</span>
                  {cliente.modelo_pagamento === "porcentagem" && (
                    <span className="text-muted-foreground text-xs ml-1">
                      ({formatarTicket()})
                    </span>
                  )}
                </div>
              )}
              {cliente.app_url && (
                <a
                  href={cliente.app_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-sm transition-colors"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  App
                </a>
              )}
              {tempoParceria && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Parceria há {tempoParceria}</span>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Tarefas Semanais */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Tarefas ({tarefasConcluidas}/{tarefas.length})</span>
              {tarefas.length > 0 && (
                <span className="text-xs text-muted-foreground">{Math.round(progresso)}%</span>
              )}
            </div>
            {tarefas.length > 0 && (
              <Progress value={progresso} className="h-1.5 mb-3" />
            )}
            <div className="space-y-1.5">
              {tarefas.map((tarefa) => (
                <TarefaClienteItem key={tarefa.id} tarefa={tarefa} onUpdate={fetchTarefas} />
              ))}
            </div>
            {tarefas.length < 5 && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={novaTarefa}
                  onChange={(e) => setNovaTarefa(e.target.value)}
                  placeholder="Nova tarefa..."
                  className="text-sm h-8"
                  onKeyDown={(e) => e.key === "Enter" && handleAddTarefa()}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  onClick={handleAddTarefa}
                  disabled={addingTask || !novaTarefa.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            {tarefas.length >= 5 && (
              <p className="text-xs text-muted-foreground mt-2">Máximo de 5 tarefas recomendado</p>
            )}
          </div>

          {/* Observações */}
          <div className="pt-2 border-t border-border/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Observações</span>
              {!editingObs && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setEditingObs(true)}>
                  <Pencil className="h-3 w-3 mr-1" />
                  Editar
                </Button>
              )}
            </div>
            {editingObs ? (
              <div className="space-y-2">
                <Textarea
                  value={obsText}
                  onChange={(e) => setObsText(e.target.value)}
                  placeholder="Notas estratégicas..."
                  rows={2}
                  className="text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingObs(false);
                      setObsText(cliente.observacao_texto || "");
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSaveObs} disabled={savingObs}>
                    <Save className="h-3 w-3 mr-1" />
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {cliente.observacao_texto || "Nenhuma observação"}
              </p>
            )}
          </div>

          {/* Domínios */}
          <ClienteAppsSection
            clienteId={cliente.id}
            nichoId={nichoId}
          />
        </CardContent>
      </Card>

      <ClienteForm
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        nichoId={nichoId}
        cliente={cliente}
        onSave={onUpdate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{cliente.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCliente.isPending}
            >
              {deleteCliente.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
