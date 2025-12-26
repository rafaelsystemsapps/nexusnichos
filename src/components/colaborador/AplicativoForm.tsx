import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AplicativoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nichoId: string;
  aplicativo?: any;
  onSave: () => void;
}

export function AplicativoForm({ open, onOpenChange, nichoId, aplicativo, onSave }: AplicativoFormProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipo_app: "guia",
    status: "ideia",
    tecnologias: "",
    url_producao: "",
    url_repositorio: "",
    data_criacao: new Date().toISOString().split("T")[0],
    data_lancamento: "",
  });

  useEffect(() => {
    if (aplicativo) {
      setFormData({
        nome: aplicativo.nome || "",
        descricao: aplicativo.descricao || "",
        tipo_app: aplicativo.tipo_app || "guia",
        status: aplicativo.status || "ideia",
        tecnologias: aplicativo.tecnologias || "",
        url_producao: aplicativo.url_producao || "",
        url_repositorio: aplicativo.url_repositorio || "",
        data_criacao: aplicativo.data_criacao || new Date().toISOString().split("T")[0],
        data_lancamento: aplicativo.data_lancamento || "",
      });
    } else {
      setFormData({
        nome: "",
        descricao: "",
        tipo_app: "guia",
        status: "ideia",
        tecnologias: "",
        url_producao: "",
        url_repositorio: "",
        data_criacao: new Date().toISOString().split("T")[0],
        data_lancamento: "",
      });
    }
  }, [aplicativo, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast.error("Nome e obrigatorio");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nicho_id: nichoId,
        nome: formData.nome.trim(),
        descricao: formData.descricao || null,
        tipo_app: formData.tipo_app,
        status: formData.status,
        tecnologias: formData.tecnologias || null,
        url_producao: formData.url_producao || null,
        url_repositorio: formData.url_repositorio || null,
        data_criacao: formData.data_criacao || null,
        data_lancamento: formData.data_lancamento || null,
      };

      if (aplicativo) {
        const { error } = await supabase
          .from("aplicativos")
          .update(payload)
          .eq("id", aplicativo.id);
        if (error) throw error;
        toast.success("Aplicativo atualizado!");
      } else {
        const { error } = await supabase
          .from("aplicativos")
          .insert(payload);
        if (error) throw error;
        toast.success("Aplicativo criado!");
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{aplicativo ? "Editar Aplicativo" : "Novo Aplicativo"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome do aplicativo"
            />
          </div>

          <div>
            <Label>Descricao</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva a ideia do aplicativo..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select
                value={formData.tipo_app}
                onValueChange={(v) => setFormData({ ...formData, tipo_app: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guia">Guia Digital</SelectItem>
                  <SelectItem value="gestao">Gestao</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ideia">Ideia</SelectItem>
                  <SelectItem value="desenvolvimento">Em Desenvolvimento</SelectItem>
                  <SelectItem value="lancado">Lancado</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Tecnologias</Label>
            <Input
              value={formData.tecnologias}
              onChange={(e) => setFormData({ ...formData, tecnologias: e.target.value })}
              placeholder="React, Supabase, Tailwind..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>URL de Producao</Label>
              <Input
                value={formData.url_producao}
                onChange={(e) => setFormData({ ...formData, url_producao: e.target.value })}
                placeholder="https://app.exemplo.com"
              />
            </div>
            <div>
              <Label>URL do Repositorio</Label>
              <Input
                value={formData.url_repositorio}
                onChange={(e) => setFormData({ ...formData, url_repositorio: e.target.value })}
                placeholder="https://github.com/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Criacao</Label>
              <Input
                type="date"
                value={formData.data_criacao}
                onChange={(e) => setFormData({ ...formData, data_criacao: e.target.value })}
              />
            </div>
            <div>
              <Label>Data de Lancamento</Label>
              <Input
                type="date"
                value={formData.data_lancamento}
                onChange={(e) => setFormData({ ...formData, data_lancamento: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : aplicativo ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
