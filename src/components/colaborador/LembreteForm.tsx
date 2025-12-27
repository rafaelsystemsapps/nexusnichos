import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, MapPin } from "lucide-react";

interface LembreteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nichoId: string;
  onSuccess: () => void;
  defaultDate?: "hoje" | "amanha";
}

export function LembreteForm({ open, onOpenChange, nichoId, onSuccess, defaultDate = "hoje" }: LembreteFormProps) {
  const { user } = useAuth();
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<"alta" | "media" | "baixa">("media");
  const [dataLembrete, setDataLembrete] = useState<"hoje" | "amanha">(defaultDate);
  const [saving, setSaving] = useState(false);

  const hoje = new Date();
  const amanha = addDays(hoje, 1);

  const getDataFormatada = (date: Date) => format(date, "dd/MM", { locale: ptBR });
  const getDataISO = (tipo: "hoje" | "amanha") => {
    const date = tipo === "hoje" ? hoje : amanha;
    return format(date, "yyyy-MM-dd");
  };

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
        data_criacao: getDataISO(dataLembrete),
      });

      if (error) throw error;

      toast.success(dataLembrete === "hoje" ? "Lembrete criado para hoje!" : "Lembrete agendado para amanhã!");
      setDescricao("");
      setPrioridade("media");
      setDataLembrete(defaultDate);
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
          <DialogTitle>Novo Lembrete</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">O que você precisa fazer?</Label>
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

          {/* Data do Lembrete */}
          <div className="space-y-3">
            <Label>Para quando?</Label>
            <RadioGroup
              value={dataLembrete}
              onValueChange={(v) => setDataLembrete(v as "hoje" | "amanha")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hoje" id="data-hoje" />
                <Label htmlFor="data-hoje" className="flex items-center gap-1.5 cursor-pointer">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  Hoje ({getDataFormatada(hoje)})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="amanha" id="data-amanha" />
                <Label htmlFor="data-amanha" className="flex items-center gap-1.5 cursor-pointer">
                  <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                  Amanhã ({getDataFormatada(amanha)})
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Prioridade */}
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
