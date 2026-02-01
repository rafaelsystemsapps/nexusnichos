import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCreateCliente, useUpdateCliente } from "@/hooks/queries/useClientes";

interface Aplicativo {
  id: string;
  nome: string;
}

interface ClienteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nichoId: string;
  cliente?: any;
  onSave: () => void;
}

export function ClienteForm({ open, onOpenChange, nichoId, cliente, onSave }: ClienteFormProps) {
  const [aplicativos, setAplicativos] = useState<Aplicativo[]>([]);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "influencer" as "influencer" | "negocio_local",
    status: "rodando" as "rodando" | "pausado" | "finalizado",
    instagram_url: "",
    tiktok_url: "",
    outro_link_label: "",
    outro_link_url: "",
    mapa_mental_url: "",
    observacao_texto: "",
    modelo_pagamento: "" as "" | "porcentagem" | "valor_fixo",
    valor_contrato: "",
    ticket_valor: "",
    app_url: "",
    app_id: "",
    data_inicio_parceria: "",
  });

  const createCliente = useCreateCliente(nichoId);
  const updateCliente = useUpdateCliente(nichoId);

  useEffect(() => {
    const fetchAplicativos = async () => {
      const { data } = await supabase
        .from("aplicativos")
        .select("id, nome")
        .eq("nicho_id", nichoId)
        .order("nome");
      if (data) setAplicativos(data);
    };
    if (open) fetchAplicativos();
  }, [nichoId, open]);

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
        mapa_mental_url: cliente.mapa_mental_url || "",
        observacao_texto: cliente.observacao_texto || "",
        modelo_pagamento: cliente.modelo_pagamento || "",
        valor_contrato: cliente.valor_contrato?.toString() || "",
        ticket_valor: cliente.ticket_valor?.toString() || "",
        app_url: cliente.app_url || "",
        app_id: cliente.app_id || "",
        data_inicio_parceria: cliente.data_inicio_parceria || "",
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
        mapa_mental_url: "",
        observacao_texto: "",
        modelo_pagamento: "",
        valor_contrato: "",
        ticket_valor: "",
        app_url: "",
        app_id: "",
        data_inicio_parceria: "",
      });
    }
  }, [cliente, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações obrigatórias
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    
    if (!formData.instagram_url.trim()) {
      toast.error("Instagram é obrigatório");
      return;
    }
    
    if (!formData.modelo_pagamento) {
      toast.error("Modelo de pagamento é obrigatório");
      return;
    }

    // Validações condicionais do pagamento
    if (formData.modelo_pagamento === "valor_fixo") {
      const valor = parseFloat(formData.valor_contrato);
      if (!valor || valor <= 0) {
        toast.error("Valor mensal é obrigatório e deve ser maior que 0");
        return;
      }
    }

    if (formData.modelo_pagamento === "porcentagem") {
      const percentual = parseFloat(formData.valor_contrato);
      if (!percentual || percentual <= 0 || percentual > 100) {
        toast.error("Percentual deve estar entre 0 e 100");
        return;
      }
      const ticket = parseFloat(formData.ticket_valor);
      if (!ticket || ticket <= 0) {
        toast.error("Ticket é obrigatório e deve ser maior que 0");
        return;
      }
    }

    const payload = {
      nicho_id: nichoId,
      nome: formData.nome.trim(),
      tipo: formData.tipo,
      status: formData.status,
      instagram_url: formData.instagram_url || null,
      tiktok_url: formData.tiktok_url || null,
      outro_link_label: formData.outro_link_label || null,
      outro_link_url: formData.outro_link_url || null,
      mapa_mental_url: formData.mapa_mental_url || null,
      observacao_texto: formData.observacao_texto || null,
      modelo_pagamento: formData.modelo_pagamento || null,
      valor_contrato: formData.valor_contrato ? parseFloat(formData.valor_contrato) : null,
      ticket_valor: formData.modelo_pagamento === "porcentagem" && formData.ticket_valor 
        ? parseFloat(formData.ticket_valor) 
        : null,
      app_url: formData.app_url || null,
      app_id: formData.app_id || null,
      data_inicio_parceria: formData.data_inicio_parceria || null,
    };

    if (cliente) {
      updateCliente.mutate(
        { id: cliente.id, ...payload },
        {
          onSuccess: () => {
            onSave();
            onOpenChange(false);
          },
        }
      );
    } else {
      createCliente.mutate(payload, {
        onSuccess: () => {
          onSave();
          onOpenChange(false);
        },
      });
    }
  };

  const isSaving = createCliente.isPending || updateCliente.isPending;

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
                <Label>Instagram URL *</Label>
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
                <Label>Mapa Mental URL</Label>
                <Input
                  value={formData.mapa_mental_url}
                  onChange={(e) => setFormData({ ...formData, mapa_mental_url: e.target.value })}
                  placeholder="https://tldraw.com/... ou https://docs.google.com/..."
                />
              </div>
            </div>
          </div>

          {/* Contrato */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Contrato</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Modelo de Pagamento *</Label>
                <Select
                  value={formData.modelo_pagamento}
                  onValueChange={(v) => setFormData({ 
                    ...formData, 
                    modelo_pagamento: v as any,
                    // Limpar ticket se mudar para valor_fixo
                    ticket_valor: v === "valor_fixo" ? "" : formData.ticket_valor
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="valor_fixo">Valor Fixo</SelectItem>
                    <SelectItem value="porcentagem">Porcentagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.modelo_pagamento === "valor_fixo" && (
                <div>
                  <Label>Valor Mensal (R$) *</Label>
                  <Input
                    type="number"
                    value={formData.valor_contrato}
                    onChange={(e) => setFormData({ ...formData, valor_contrato: e.target.value })}
                    placeholder="500"
                  />
                </div>
              )}

              {formData.modelo_pagamento === "porcentagem" && (
                <>
                  <div>
                    <Label>Percentual (%) *</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.valor_contrato}
                      onChange={(e) => setFormData({ ...formData, valor_contrato: e.target.value })}
                      placeholder="20"
                    />
                  </div>
                  <div>
                    <Label>Ticket (R$) *</Label>
                    <Input
                      type="number"
                      value={formData.ticket_valor}
                      onChange={(e) => setFormData({ ...formData, ticket_valor: e.target.value })}
                      placeholder="150"
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Aplicativo Vinculado</Label>
                <Select
                  value={formData.app_id}
                  onValueChange={(v) => setFormData({ ...formData, app_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um app..." />
                  </SelectTrigger>
                  <SelectContent>
                    {aplicativos.map((app) => (
                      <SelectItem key={app.id} value={app.id}>{app.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>URL do App</Label>
                <Input
                  value={formData.app_url}
                  onChange={(e) => setFormData({ ...formData, app_url: e.target.value })}
                  placeholder="https://app.exemplo.com"
                />
              </div>
              <div>
                <Label>Data de Inicio da Parceria</Label>
                <Input
                  type="date"
                  value={formData.data_inicio_parceria}
                  onChange={(e) => setFormData({ ...formData, data_inicio_parceria: e.target.value })}
                />
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
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : cliente ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
