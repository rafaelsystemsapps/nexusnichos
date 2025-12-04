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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, GripVertical, Instagram, Youtube, Twitter, Music2, Hash, MessageCircle } from "lucide-react";

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
  conta_id: string | null;
}

interface Conta {
  id: string;
  nome_conta: string;
  plataforma: string;
}

const plataformaIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  tiktok: <Music2 className="h-4 w-4" />,
  threads: <Hash className="h-4 w-4" />,
  facebook: <MessageCircle className="h-4 w-4" />,
};

export function TarefaTemplateDialog({
  open,
  onOpenChange,
  nichoId,
  onUpdate,
}: TarefaTemplateDialogProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TarefaTemplate[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTitulo, setNewTitulo] = useState("");
  const [newDescricao, setNewDescricao] = useState("");
  const [newContaId, setNewContaId] = useState<string>("geral");

  useEffect(() => {
    if (open) {
      fetchTemplates();
      fetchContas();
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

  const fetchContas = async () => {
    const { data } = await supabase
      .from("contas_redes_sociais")
      .select("id, nome_conta, plataforma")
      .eq("nicho_id", nichoId)
      .eq("status", "ativa")
      .order("nome_conta");

    setContas(data || []);
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
        conta_id: newContaId === "geral" ? null : newContaId,
      });

      if (error) throw error;

      setNewTitulo("");
      setNewDescricao("");
      setNewContaId("geral");
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

  const getContaName = (contaId: string | null) => {
    if (!contaId) return "Geral";
    const conta = contas.find(c => c.id === contaId);
    return conta ? conta.nome_conta : "Geral";
  };

  const getContaIcon = (contaId: string | null) => {
    if (!contaId) return null;
    const conta = contas.find(c => c.id === contaId);
    return conta ? plataformaIcons[conta.plataforma] : null;
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
            <div>
              <Label className="text-xs text-muted-foreground">Vincular a uma conta (opcional)</Label>
              <Select value={newContaId} onValueChange={setNewContaId}>
                <SelectTrigger className="bg-background mt-1">
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">
                    <span className="text-muted-foreground">📋 Geral (todas as contas)</span>
                  </SelectItem>
                  {contas.map((conta) => (
                    <SelectItem key={conta.id} value={conta.id}>
                      <div className="flex items-center gap-2">
                        {plataformaIcons[conta.plataforma]}
                        <span>{conta.nome_conta}</span>
                        <span className="text-xs text-muted-foreground capitalize">({conta.plataforma})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {template.titulo}
                        </p>
                        {template.conta_id && (
                          <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {getContaIcon(template.conta_id)}
                            <span className="truncate max-w-[80px]">{getContaName(template.conta_id)}</span>
                          </span>
                        )}
                      </div>
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
