import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

const PLATAFORMAS = [
  "TikTok",
  "Instagram",
  "YouTube",
  "Facebook",
  "Twitter",
  "LinkedIn",
  "Outros",
];

interface TesteRapidoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nichoId: string;
  testeId?: string;
  onSuccess: () => void;
  mode?: "criar" | "decidir";
}

export function TesteRapidoForm({
  open,
  onOpenChange,
  nichoId,
  testeId,
  onSuccess,
  mode = "criar",
}: TesteRapidoFormProps) {
  const [hipotese, setHipotese] = useState("");
  const [plataforma, setPlataforma] = useState("");
  const [resultadoPercebido, setResultadoPercebido] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCriar = async () => {
    if (!hipotese.trim() || !plataforma) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("testes_rapidos").insert({
      nicho_id: nichoId,
      hipotese: hipotese.trim(),
      plataforma,
      status: "em_teste",
    });

    if (error) {
      toast({
        title: "Erro ao criar teste",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Teste criado" });
      setHipotese("");
      setPlataforma("");
      onOpenChange(false);
      onSuccess();
    }
    setLoading(false);
  };

  const handleDecidir = async (status: "funcionou" | "nao_funcionou") => {
    if (!testeId) return;

    setLoading(true);
    const { error } = await supabase
      .from("testes_rapidos")
      .update({
        status,
        resultado_percebido: resultadoPercebido.trim() || null,
      })
      .eq("id", testeId);

    if (error) {
      toast({
        title: "Erro ao atualizar teste",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: status === "funcionou" ? "Marcado como funcionou" : "Marcado como não funcionou",
      });
      setResultadoPercebido("");
      onOpenChange(false);
      onSuccess();
    }
    setLoading(false);
  };

  const handleClose = () => {
    setHipotese("");
    setPlataforma("");
    setResultadoPercebido("");
    onOpenChange(false);
  };

  if (mode === "decidir") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Decidir Teste</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resultado">Resultado percebido (opcional)</Label>
              <Textarea
                id="resultado"
                placeholder="O que você observou?"
                value={resultadoPercebido}
                onChange={(e) => setResultadoPercebido(e.target.value)}
                maxLength={200}
                rows={2}
              />
              <p className="text-xs text-muted-foreground text-right">
                {resultadoPercebido.length}/200
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleDecidir("funcionou")}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-1" />
                Funcionou
              </Button>
              <Button
                onClick={() => handleDecidir("nao_funcionou")}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Não funcionou
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Teste</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hipotese">Hipótese</Label>
            <Input
              id="hipotese"
              placeholder="Ex: Formato X segura mais atenção"
              value={hipotese}
              onChange={(e) => setHipotese(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">
              {hipotese.length}/100
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plataforma">Plataforma</Label>
            <Select value={plataforma} onValueChange={setPlataforma}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a plataforma" />
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

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleCriar} disabled={loading}>
              Criar Teste
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
