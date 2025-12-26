import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type StatusContato = "salvo" | "contatado" | "aceitou" | "nao_aceitou" | "sem_resposta";

interface Prospect {
  id: string;
  nome_display: string;
  origem: string;
  origem_url: string | null;
  metodo_contato: string;
  contato: string | null;
  status_contato: StatusContato;
  observacao: string | null;
  data_ultimo_contato: string | null;
  created_at: string;
}

interface ProspectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nichoId: string;
  prospect?: Prospect | null;
  onSuccess: () => void;
}

const ORIGENS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "outro", label: "Outro" },
];

const METODOS = [
  { value: "dm", label: "DM" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "outro", label: "Outro" },
];

export function ProspectForm({ open, onOpenChange, nichoId, prospect, onSuccess }: ProspectFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_display: "",
    origem: "instagram",
    origem_url: "",
    metodo_contato: "dm",
    contato: "",
    observacao: "",
  });

  useEffect(() => {
    if (prospect) {
      setFormData({
        nome_display: prospect.nome_display,
        origem: prospect.origem,
        origem_url: prospect.origem_url || "",
        metodo_contato: prospect.metodo_contato,
        contato: prospect.contato || "",
        observacao: prospect.observacao || "",
      });
    } else {
      setFormData({
        nome_display: "",
        origem: "instagram",
        origem_url: "",
        metodo_contato: "dm",
        contato: "",
        observacao: "",
      });
    }
  }, [prospect, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome_display.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nicho_id: nichoId,
        nome_display: formData.nome_display.trim(),
        origem: formData.origem,
        origem_url: formData.origem_url.trim() || null,
        metodo_contato: formData.metodo_contato,
        contato: formData.contato.trim() || null,
        observacao: formData.observacao.trim() || null,
      };

      if (prospect) {
        const { error } = await supabase
          .from("prospects")
          .update(payload)
          .eq("id", prospect.id);

        if (error) throw error;
        toast.success("Prospect atualizado!");
      } else {
        const { error } = await supabase
          .from("prospects")
          .insert(payload);

        if (error) throw error;
        toast.success("Prospect adicionado!");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar prospect:", error);
      toast.error(error.message || "Erro ao salvar prospect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{prospect ? "Editar Prospect" : "Novo Prospect"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome_display">Nome do Perfil *</Label>
            <Input
              id="nome_display"
              value={formData.nome_display}
              onChange={(e) => setFormData({ ...formData, nome_display: e.target.value })}
              placeholder="@fulano ou Nome do Perfil"
            />
          </div>

          {/* Origem */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Origem *</Label>
              <Select
                value={formData.origem}
                onValueChange={(value) => setFormData({ ...formData, origem: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGENS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="origem_url">URL do Perfil</Label>
              <Input
                id="origem_url"
                value={formData.origem_url}
                onChange={(e) => setFormData({ ...formData, origem_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Contato */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Método de Contato</Label>
              <Select
                value={formData.metodo_contato}
                onValueChange={(value) => setFormData({ ...formData, metodo_contato: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contato">Contato</Label>
              <Input
                id="contato"
                value={formData.contato}
                onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                placeholder="@, email, telefone..."
              />
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              placeholder="Ex: Pediu mídia kit, respondeu pedindo valor..."
              rows={2}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : prospect ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
