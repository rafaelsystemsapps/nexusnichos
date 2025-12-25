import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DollarSign, Settings, ListChecks, Plus, Pencil, Trash2, Package, Radio, Archive } from "lucide-react";
import { TemplateForm } from "./TemplateForm";
import { ProdutosList } from "./ProdutosList";
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

interface Conta {
  id: string;
  nome_conta: string;
  plataforma: string;
}

interface Template {
  id: string;
  titulo: string;
  descricao: string | null;
  conta_id: string | null;
  ativa: boolean;
  ordem: number;
  conta?: Conta | null;
}

interface ConfiguracoesNichoTabProps {
  nichoId: string;
  nicho: {
    financeiro_habilitado: boolean;
    pedidos_habilitado?: boolean;
    radar_habilitado?: boolean;
    cemiterio_habilitado?: boolean;
  };
  onConfigUpdate: () => void;
}

export function ConfiguracoesNichoTab({ nichoId, nicho, onConfigUpdate }: ConfiguracoesNichoTabProps) {
  const [financeiroHabilitado, setFinanceiroHabilitado] = useState(nicho.financeiro_habilitado);
  const [pedidosHabilitado, setPedidosHabilitado] = useState(nicho.pedidos_habilitado ?? false);
  const [radarHabilitado, setRadarHabilitado] = useState(nicho.radar_habilitado ?? false);
  const [cemiterioHabilitado, setCemiterioHabilitado] = useState(nicho.cemiterio_habilitado ?? false);
  const [saving, setSaving] = useState(false);
  
  // Templates state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  useEffect(() => {
    setFinanceiroHabilitado(nicho.financeiro_habilitado);
    setPedidosHabilitado(nicho.pedidos_habilitado ?? false);
    setRadarHabilitado(nicho.radar_habilitado ?? false);
    setCemiterioHabilitado(nicho.cemiterio_habilitado ?? false);
  }, [nicho.financeiro_habilitado, nicho.pedidos_habilitado, nicho.radar_habilitado, nicho.cemiterio_habilitado]);

  useEffect(() => {
    fetchTemplatesAndContas();
  }, [nichoId]);

  const fetchTemplatesAndContas = async () => {
    setLoadingTemplates(true);
    try {
      const [templatesRes, contasRes] = await Promise.all([
        supabase
          .from("tarefa_templates")
          .select("*")
          .eq("nicho_id", nichoId)
          .order("ordem", { ascending: true }),
        supabase
          .from("contas_redes_sociais")
          .select("id, nome_conta, plataforma")
          .eq("nicho_id", nichoId)
      ]);

      if (templatesRes.error) throw templatesRes.error;
      if (contasRes.error) throw contasRes.error;

      const contasData = contasRes.data || [];
      setContas(contasData);

      // Map conta info to templates
      const templatesWithConta = (templatesRes.data || []).map(t => ({
        ...t,
        conta: contasData.find(c => c.id === t.conta_id) || null
      }));
      setTemplates(templatesWithConta);
    } catch (error: any) {
      toast.error("Erro ao carregar templates: " + error.message);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleToggleFinanceiro = async (enabled: boolean) => {
    setSaving(true);
    setFinanceiroHabilitado(enabled);

    try {
      const { error } = await supabase
        .from("nichos")
        .update({ financeiro_habilitado: enabled })
        .eq("id", nichoId);

      if (error) throw error;

      toast.success(enabled ? "Módulo Financeiro ativado!" : "Módulo Financeiro desativado!");
      onConfigUpdate();
    } catch (error: any) {
      setFinanceiroHabilitado(!enabled);
      toast.error("Erro ao salvar configuração: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePedidos = async (enabled: boolean) => {
    setSaving(true);
    setPedidosHabilitado(enabled);

    try {
      const { error } = await supabase
        .from("nichos")
        .update({ pedidos_habilitado: enabled })
        .eq("id", nichoId);

      if (error) throw error;

      toast.success(enabled ? "Módulo Pedidos ativado!" : "Módulo Pedidos desativado!");
      onConfigUpdate();
    } catch (error: any) {
      setPedidosHabilitado(!enabled);
      toast.error("Erro ao salvar configuração: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRadar = async (enabled: boolean) => {
    setSaving(true);
    setRadarHabilitado(enabled);

    try {
      const { error } = await supabase
        .from("nichos")
        .update({ radar_habilitado: enabled })
        .eq("id", nichoId);

      if (error) throw error;

      toast.success(enabled ? "Radar de Oportunidades ativado!" : "Radar de Oportunidades desativado!");
      onConfigUpdate();
    } catch (error: any) {
      setRadarHabilitado(!enabled);
      toast.error("Erro ao salvar configuração: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCemiterio = async (enabled: boolean) => {
    setSaving(true);
    setCemiterioHabilitado(enabled);

    try {
      const { error } = await supabase
        .from("nichos")
        .update({ cemiterio_habilitado: enabled })
        .eq("id", nichoId);

      if (error) throw error;

      toast.success(enabled ? "Módulo Cemitério ativado!" : "Módulo Cemitério desativado!");
      onConfigUpdate();
    } catch (error: any) {
      setCemiterioHabilitado(!enabled);
      toast.error("Erro ao salvar configuração: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTemplateAtivo = async (template: Template) => {
    const newAtiva = !template.ativa;
    
    // Optimistic update
    setTemplates(prev => prev.map(t => 
      t.id === template.id ? { ...t, ativa: newAtiva } : t
    ));

    try {
      const { error } = await supabase
        .from("tarefa_templates")
        .update({ ativa: newAtiva })
        .eq("id", template.id);

      if (error) throw error;
      toast.success(newAtiva ? "Template ativado" : "Template desativado");
    } catch (error: any) {
      // Rollback
      setTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...t, ativa: !newAtiva } : t
      ));
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setFormOpen(true);
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setFormOpen(true);
  };

  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    try {
      const { error } = await supabase
        .from("tarefa_templates")
        .delete()
        .eq("id", templateToDelete.id);

      if (error) throw error;
      
      setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
      toast.success("Template excluído");
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Configurações do Workspace</h2>
          <p className="text-sm text-muted-foreground">Personalize as funcionalidades do seu nicho</p>
        </div>
      </div>

      {/* Módulos */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Módulos</CardTitle>
          <CardDescription>Ative ou desative módulos do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-surface/50 border border-border/30">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <Label htmlFor="financeiro" className="text-base font-medium cursor-pointer">
                  Módulo Financeiro
                </Label>
                <p className="text-sm text-muted-foreground">
                  Registre vendas e acompanhe o faturamento do seu nicho
                </p>
              </div>
            </div>
            <Switch
              id="financeiro"
              checked={financeiroHabilitado}
              onCheckedChange={handleToggleFinanceiro}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-surface/50 border border-border/30">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Package className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <Label htmlFor="pedidos" className="text-base font-medium cursor-pointer">
                  Módulo Pedidos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Gerencie pedidos e acompanhe envios
                </p>
              </div>
            </div>
            <Switch
              id="pedidos"
              checked={pedidosHabilitado}
              onCheckedChange={handleTogglePedidos}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-surface/50 border border-border/30">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Radio className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <Label htmlFor="radar" className="text-base font-medium cursor-pointer">
                  Radar de Oportunidades
                </Label>
                <p className="text-sm text-muted-foreground">
                  Monitore tendências e oportunidades do mercado
                </p>
              </div>
            </div>
            <Switch
              id="radar"
              checked={radarHabilitado}
              onCheckedChange={handleToggleRadar}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/20">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-muted/30">
                <Archive className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <Label htmlFor="cemiterio" className="text-base font-medium cursor-pointer text-muted-foreground">
                  Módulo Cemitério
                </Label>
                <p className="text-sm text-muted-foreground/70">
                  Arquivo morto de ativos e ideias encerradas
                </p>
              </div>
            </div>
            <Switch
              id="cemiterio"
              checked={cemiterioHabilitado}
              onCheckedChange={handleToggleCemiterio}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-surface/30 border border-border/20 opacity-50">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-muted/50">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-medium text-muted-foreground">
                  Mais módulos em breve...
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Calendário, Biblioteca, Relatórios e mais
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates de Tarefas */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ListChecks className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Templates de Tarefas</CardTitle>
                <CardDescription>Configure as tarefas que aparecem na Logística Semanal</CardDescription>
              </div>
            </div>
            <Button onClick={handleNewTemplate} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTemplates ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListChecks className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Nenhum template configurado</p>
              <p className="text-sm">Crie templates para organizar suas tarefas semanais</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
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
                      onClick={() => handleDeleteClick(template)}
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
      </Card>

      {/* Produtos Cadastrados */}
      <ProdutosList nichoId={nichoId} />
      {/* Template Form Modal */}
      <TemplateForm
        open={formOpen}
        onOpenChange={setFormOpen}
        nichoId={nichoId}
        template={editingTemplate}
        contas={contas}
        onSuccess={fetchTemplatesAndContas}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              O template "{templateToDelete?.titulo}" será excluído permanentemente.
              As tarefas já geradas não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
