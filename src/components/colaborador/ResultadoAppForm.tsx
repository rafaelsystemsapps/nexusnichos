import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ResultadoAppFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nichoId: string;
  appId: string;
  onSave: () => void;
}

export function ResultadoAppForm({ open, onOpenChange, nichoId, appId, onSave }: ResultadoAppFormProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    tipo: "receita",
    valor: "",
    data: new Date().toISOString().split("T")[0],
    observacao: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("resultados_app")
        .insert({
          app_id: appId,
          nicho_id: nichoId,
          tipo: formData.tipo,
          valor: formData.valor ? parseFloat(formData.valor) : null,
          data: formData.data,
          observacao: formData.observacao || null,
        });

      if (error) throw error;
      toast.success("Resultado registrado!");
      
      setFormData({
        tipo: "receita",
        valor: "",
        data: new Date().toISOString().split("T")[0],
        observacao: "",
      });
      
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Resultado</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tipo de Metrica</Label>
            <Select
              value={formData.tipo}
              onValueChange={(v) => setFormData({ ...formData, tipo: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita (R$)</SelectItem>
                <SelectItem value="downloads">Downloads</SelectItem>
                <SelectItem value="usuarios_ativos">Usuarios Ativos</SelectItem>
                <SelectItem value="novos_usuarios">Novos Usuarios</SelectItem>
                <SelectItem value="pedidos">Pedidos</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor</Label>
              <Input
                type="number"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Observacao</Label>
            <Textarea
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              placeholder="Detalhes ou notas..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
