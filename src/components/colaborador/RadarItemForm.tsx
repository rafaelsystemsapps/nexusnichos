import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RadarItem {
  id: string;
  nicho_id: string;
  tema: string;
  plataforma: string;
  status_termico: string;
  data_validade: string | null;
  observacao: string | null;
}

interface RadarItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nichoId: string;
  item: RadarItem | null;
  onSuccess: () => void;
}

const PLATAFORMAS = ["TikTok", "Instagram", "YouTube", "Facebook", "Twitter", "LinkedIn", "Outros"];

export function RadarItemForm({
  open,
  onOpenChange,
  nichoId,
  item,
  onSuccess,
}: RadarItemFormProps) {
  const [tema, setTema] = useState("");
  const [plataforma, setPlataforma] = useState("TikTok");
  const [statusTermico, setStatusTermico] = useState<"quente" | "morno" | "morto">("morno");
  const [dataValidade, setDataValidade] = useState<Date | undefined>(undefined);
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = !!item;

  useEffect(() => {
    if (open) {
      if (item) {
        setTema(item.tema);
        setPlataforma(item.plataforma);
        setStatusTermico((item.status_termico as "quente" | "morno" | "morto") || "morno");
        setDataValidade(item.data_validade ? new Date(item.data_validade) : undefined);
        setObservacao(item.observacao || "");
      } else {
        setTema("");
        setPlataforma("TikTok");
        setStatusTermico("morno");
        setDataValidade(undefined);
        setObservacao("");
      }
    }
  }, [open, item]);

  const handleSubmit = async () => {
    if (!tema.trim()) {
      toast.error("O tema é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const data = {
        nicho_id: nichoId,
        tema: tema.trim(),
        plataforma,
        status_termico: statusTermico,
        data_validade: dataValidade ? format(dataValidade, "yyyy-MM-dd") : null,
        observacao: observacao.trim() || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("radar_oportunidades")
          .update(data)
          .eq("id", item.id);

        if (error) throw error;
        toast.success("Item atualizado");
      } else {
        const { error } = await supabase
          .from("radar_oportunidades")
          .insert(data);

        if (error) throw error;
        toast.success("Item adicionado ao radar");
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Oportunidade" : "Nova Oportunidade"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tema */}
          <div className="space-y-2">
            <Label htmlFor="tema">Tema / Modelo / Ativo</Label>
            <Input
              id="tema"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex: Trend de dança, Meme do momento..."
              maxLength={100}
            />
          </div>

          {/* Plataforma */}
          <div className="space-y-2">
            <Label>Plataforma</Label>
            <Select value={plataforma} onValueChange={setPlataforma}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATAFORMAS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Térmico */}
          <div className="space-y-2">
            <Label>Status Térmico</Label>
            <div className="flex gap-2">
              {(["quente", "morno", "morto"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusTermico(status)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                    statusTermico === status
                      ? status === "quente"
                        ? "border-emerald-500 bg-emerald-500/20"
                        : status === "morno"
                        ? "border-amber-500 bg-amber-500/20"
                        : "border-red-500 bg-red-500/20"
                      : "border-border/50 hover:border-border"
                  )}
                >
                  <span className="text-xl">
                    {status === "quente" ? "🟢" : status === "morno" ? "🟡" : "🔴"}
                  </span>
                  <span className="text-sm font-medium capitalize">{status}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Data de Validade */}
          <div className="space-y-2">
            <Label>Validade Percebida (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataValidade && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataValidade
                    ? format(dataValidade, "dd 'de' MMMM", { locale: ptBR })
                    : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataValidade}
                  onSelect={setDataValidade}
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {dataValidade && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDataValidade(undefined)}
                className="text-xs text-muted-foreground"
              >
                Limpar data
              </Button>
            )}
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Input
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Nota curta..."
              maxLength={150}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Salvando..." : isEditing ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
