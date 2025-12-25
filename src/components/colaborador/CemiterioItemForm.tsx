import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Ban, TrendingDown, Wind, RefreshCw } from "lucide-react";

interface CemiterioItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nichoId: string;
  onSuccess: () => void;
}

const MOTIVOS = [
  { value: "banido", label: "Banido", icon: Ban },
  { value: "saturado", label: "Saturado", icon: TrendingDown },
  { value: "perdeu_tracao", label: "Perdeu tração", icon: Wind },
  { value: "substituido", label: "Substituído", icon: RefreshCw },
];

export function CemiterioItemForm({ open, onOpenChange, nichoId, onSuccess }: CemiterioItemFormProps) {
  const [nome, setNome] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setNome("");
    setMotivo("");
    setObservacao("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || !motivo) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("cemiterio").insert({
        nicho_id: nichoId,
        nome: nome.trim(),
        motivo,
        observacao: observacao.trim() || null,
        data_encerramento: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      toast.success("Item arquivado no cemitério");
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-muted-foreground">
              Arquivar no Cemitério
            </DialogTitle>
            <DialogDescription>
              Registre um ativo, ideia ou modelo encerrado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome do ativo */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do ativo / ideia *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Conta TikTok principal, Modelo de script X..."
                maxLength={100}
              />
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo do encerramento *</Label>
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex items-center gap-2">
                        <m.icon className="h-4 w-4 text-muted-foreground" />
                        {m.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Observação */}
            <div className="space-y-2">
              <Label htmlFor="observacao">Observação (opcional)</Label>
              <Input
                id="observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Uma linha de contexto..."
                maxLength={150}
              />
              <p className="text-xs text-muted-foreground/50">
                Máximo 150 caracteres
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Arquivar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
