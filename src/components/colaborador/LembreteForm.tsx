import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface LembreteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nichoId: string;
  onSuccess: () => void;
}

export function LembreteForm({ open, onOpenChange, nichoId, onSuccess }: LembreteFormProps) {
  const { user } = useAuth();
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<"alta" | "media" | "baixa">("media");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!descricao.trim()) {
      toast.error("Descreva a tarefa");
      return;
    }

    if (descricao.length > 200) {
      toast.error("Descrição deve ter no máximo 200 caracteres");
      return;
    }

    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from("lembretes_hoje").insert({
        nicho_id: nichoId,
        user_id: user.id,
        descricao: descricao.trim(),
        prioridade,
        status: "pendente",
        data_criacao: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      toast.success("Lembrete criado!");
      setDescricao("");
      setPrioridade("media");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao criar lembrete: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Lembrete de Hoje</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">O que você precisa fazer hoje?</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ação clara e curta..."
              maxLength={200}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {descricao.length}/200
            </p>
          </div>

          <div className="space-y-3">
            <Label>Prioridade</Label>
            <RadioGroup
              value={prioridade}
              onValueChange={(v) => setPrioridade(v as "alta" | "media" | "baixa")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alta" id="alta" />
                <Label htmlFor="alta" className="flex items-center gap-1.5 cursor-pointer">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  Alta
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="media" id="media" />
                <Label htmlFor="media" className="flex items-center gap-1.5 cursor-pointer">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  Média
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="baixa" id="baixa" />
                <Label htmlFor="baixa" className="flex items-center gap-1.5 cursor-pointer">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Baixa
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Criar Lembrete"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
