import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClienteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nichoId: string;
  cliente?: any;
  onSave: () => void;
}

export function ClienteForm({ open, onOpenChange, nichoId, cliente, onSave }: ClienteFormProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "influencer" as "influencer" | "negocio_local",
    status: "rodando" as "rodando" | "pausado" | "finalizado",
    instagram_url: "",
    tiktok_url: "",
    outro_link_label: "",
    outro_link_url: "",
    link_principal: "",
    meta_descricao: "",
    meta_valor: "",
    meta_status: "on_track" as "on_track" | "atencao" | "longe",
    observacao_texto: "",
  });

  useEffect(() => {
    if (cliente) {
      setFormData({
        nome: cliente.nome || "",
        tipo: cliente.tipo || "influencer",
        status: cliente.status || "rodando",
        instagram_url: cliente.instagram_url || "",
        tiktok_url: cliente.tiktok_url || "",
        outro_link_label: cliente.outro_link_label || "",
        outro_link_url: cliente.outro_link_url || "",
        link_principal: cliente.link_principal || "",
        meta_descricao: cliente.meta_descricao || "",
        meta_valor: cliente.meta_valor?.toString() || "",
        meta_status: cliente.meta_status || "on_track",
        observacao_texto: cliente.observacao_texto || "",
      });
    } else {
      setFormData({
        nome: "",
        tipo: "influencer",
        status: "rodando",
        instagram_url: "",
        tiktok_url: "",
        outro_link_label: "",
        outro_link_url: "",
        link_principal: "",
        meta_descricao: "",
        meta_valor: "",
        meta_status: "on_track",
        observacao_texto: "",
      });
    }
  }, [cliente, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nicho_id: nichoId,
        nome: formData.nome.trim(),
        tipo: formData.tipo,
        status: formData.status,
        instagram_url: formData.instagram_url || null,
        tiktok_url: formData.tiktok_url || null,
        outro_link_label: formData.outro_link_label || null,
        outro_link_url: formData.outro_link_url || null,
        link_principal: formData.link_principal || null,
        meta_descricao: formData.meta_descricao || null,
        meta_valor: formData.meta_valor ? parseFloat(formData.meta_valor) : null,
        meta_status: formData.meta_status,
        observacao_texto: formData.observacao_texto || null,
      };

      if (cliente) {
        const { error } = await supabase
          .from("clientes")
          .update(payload)
          .eq("id", cliente.id);
        if (error) throw error;
        toast.success("Cliente atualizado!");
      } else {
        const { error } = await supabase
          .from("clientes")
          .insert(payload);
        if (error) throw error;
        toast.success("Cliente criado!");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identificação */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Identificação</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) => setFormData({ ...formData, tipo: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="influencer">Influenciador</SelectItem>
                    <SelectItem value="negocio_local">Negócio Local</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rodando">Rodando</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Links Rápidos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Instagram URL</Label>
                <Input
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <Label>TikTok URL</Label>
                <Input
                  value={formData.tiktok_url}
                  onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                  placeholder="https://tiktok.com/@..."
                />
              </div>
              <div>
                <Label>Outro Link (Label)</Label>
                <Input
                  value={formData.outro_link_label}
                  onChange={(e) => setFormData({ ...formData, outro_link_label: e.target.value })}
                  placeholder="Ex: Site, YouTube..."
                />
              </div>
              <div>
                <Label>Outro Link (URL)</Label>
                <Input
                  value={formData.outro_link_url}
                  onChange={(e) => setFormData({ ...formData, outro_link_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="col-span-2">
                <Label>Link Principal</Label>
                <Input
                  value={formData.link_principal}
                  onChange={(e) => setFormData({ ...formData, link_principal: e.target.value })}
                  placeholder="Link principal de acesso rápido"
                />
              </div>
            </div>
          </div>

          {/* Meta da Semana */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Meta da Semana</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>Descrição da Meta</Label>
                <Input
                  value={formData.meta_descricao}
                  onChange={(e) => setFormData({ ...formData, meta_descricao: e.target.value })}
                  placeholder="Ex: Alcançar 10k seguidores"
                />
              </div>
              <div>
                <Label>Valor (opcional)</Label>
                <Input
                  type="number"
                  value={formData.meta_valor}
                  onChange={(e) => setFormData({ ...formData, meta_valor: e.target.value })}
                  placeholder="10000"
                />
              </div>
              <div>
                <Label>Status da Meta</Label>
                <Select
                  value={formData.meta_status}
                  onValueChange={(v) => setFormData({ ...formData, meta_status: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_track">No Caminho</SelectItem>
                    <SelectItem value="atencao">Atenção</SelectItem>
                    <SelectItem value="longe">Longe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Observações</h3>
            <Textarea
              value={formData.observacao_texto}
              onChange={(e) => setFormData({ ...formData, observacao_texto: e.target.value })}
              placeholder="Notas estratégicas..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : cliente ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
