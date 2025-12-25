import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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
  frequencia?: string;
}

interface TemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nichoId: string;
  template: Template | null;
  contas: Conta[];
  onSuccess: () => void;
}

export function TemplateForm({ open, onOpenChange, nichoId, template, contas, onSuccess }: TemplateFormProps) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [contaId, setContaId] = useState<string>("geral");
  const [frequencia, setFrequencia] = useState<string>("diaria");
  const [ativa, setAtiva] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setTitulo(template.titulo);
      setDescricao(template.descricao || "");
      setContaId(template.conta_id || "geral");
      setFrequencia(template.frequencia || "diaria");
      setAtiva(template.ativa);
    } else {
      setTitulo("");
      setDescricao("");
      setContaId("geral");
      setFrequencia("diaria");
      setAtiva(true);
    }
  }, [template, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    setSaving(true);

    try {
      const data = {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        conta_id: contaId === "geral" ? null : contaId,
        frequencia,
        ativa,
        nicho_id: nichoId,
      };

      if (template) {
        const { error } = await supabase
          .from("tarefa_templates")
          .update(data)
          .eq("id", template.id);

        if (error) throw error;
        toast.success("Template atualizado!");
      } else {
        const { error } = await supabase
          .from("tarefa_templates")
          .insert(data);

        if (error) throw error;
        toast.success("Template criado!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{template ? "Editar Template" : "Novo Template de Tarefa"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Postar 5 vídeos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes opcionais da tarefa..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conta">Conta Associada</Label>
            <Select value={contaId} onValueChange={setContaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Geral (todas as contas)</SelectItem>
                {contas.map((conta) => (
                  <SelectItem key={conta.id} value={conta.id}>
                    @{conta.nome_conta} ({conta.plataforma})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequencia">Frequência</Label>
            <Select value={frequencia} onValueChange={setFrequencia}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diaria">Diária (7x por semana)</SelectItem>
                <SelectItem value="semanal">Semanal (1x por semana)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {frequencia === "semanal" 
                ? "Uma única tarefa para completar durante toda a semana"
                : "Uma tarefa para cada dia da semana"
              }
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-surface/50 border border-border/30">
            <Label htmlFor="ativa" className="cursor-pointer">Template ativo</Label>
            <Switch
              id="ativa"
              checked={ativa}
              onCheckedChange={setAtiva}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : template ? "Salvar" : "Criar Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
