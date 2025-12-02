import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface TarefaTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nichoId: string;
  onUpdate: () => void;
}

interface TarefaTemplate {
  id: string;
  titulo: string;
  descricao: string | null;
  ativa: boolean;
  ordem: number;
}

export function TarefaTemplateDialog({
  open,
  onOpenChange,
  nichoId,
  onUpdate,
}: TarefaTemplateDialogProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TarefaTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTitulo, setNewTitulo] = useState("");
  const [newDescricao, setNewDescricao] = useState("");

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, nichoId]);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from("tarefa_templates")
      .select("*")
      .eq("nicho_id", nichoId)
      .order("ordem");

    setTemplates(data || []);
  };

  const handleAddTemplate = async () => {
    if (!newTitulo.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Digite um título para a tarefa",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("tarefa_templates").insert({
        nicho_id: nichoId,
        titulo: newTitulo.trim(),
        descricao: newDescricao.trim() || null,
        ordem: templates.length,
      });

      if (error) throw error;

      setNewTitulo("");
      setNewDescricao("");
      fetchTemplates();
      onUpdate();

      toast({
        title: "Tarefa criada",
        description: "Nova tarefa adicionada com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar tarefa",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tarefa_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      fetchTemplates();
      onUpdate();

      toast({
        title: "Tarefa removida",
        description: "Tarefa removida com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover tarefa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (template: TarefaTemplate) => {
    try {
      const { error } = await supabase
        .from("tarefa_templates")
        .update({ ativa: !template.ativa })
        .eq("id", template.id);

      if (error) throw error;

      fetchTemplates();
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Gerenciar Tarefas Fixas</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new template */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <Label>Nova Tarefa</Label>
            <Input
              placeholder="Título da tarefa"
              value={newTitulo}
              onChange={(e) => setNewTitulo(e.target.value)}
              className="bg-background"
            />
            <Textarea
              placeholder="Descrição (opcional)"
              value={newDescricao}
              onChange={(e) => setNewDescricao(e.target.value)}
              className="bg-background resize-none"
              rows={2}
            />
            <Button
              onClick={handleAddTemplate}
              disabled={loading}
              size="sm"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Tarefa
            </Button>
          </div>

          {/* List of templates */}
          <div className="space-y-2">
            <Label>Tarefas Cadastradas</Label>
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma tarefa cadastrada
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      template.ativa
                        ? "bg-background border-border"
                        : "bg-muted/50 border-border/50 opacity-60"
                    }`}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {template.titulo}
                      </p>
                      {template.descricao && (
                        <p className="text-xs text-muted-foreground truncate">
                          {template.descricao}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(template)}
                      className="text-xs"
                    >
                      {template.ativa ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
