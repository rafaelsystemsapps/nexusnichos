import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DollarSign, Settings } from "lucide-react";

interface ConfiguracoesNichoTabProps {
  nichoId: string;
  nicho: {
    financeiro_habilitado: boolean;
  };
  onConfigUpdate: () => void;
}

export function ConfiguracoesNichoTab({ nichoId, nicho, onConfigUpdate }: ConfiguracoesNichoTabProps) {
  const [financeiroHabilitado, setFinanceiroHabilitado] = useState(nicho.financeiro_habilitado);
  const [saving, setSaving] = useState(false);

  // Sincroniza estado local quando o nicho é atualizado
  useEffect(() => {
    setFinanceiroHabilitado(nicho.financeiro_habilitado);
  }, [nicho.financeiro_habilitado]);

  const handleToggleFinanceiro = async (enabled: boolean) => {
    setSaving(true);
    setFinanceiroHabilitado(enabled);

    try {
      const { error } = await supabase
        .from("nichos")
        .update({ financeiro_habilitado: enabled })
        .eq("id", nichoId);

      if (error) throw error;

      toast.success(enabled ? "Módulo Financeiro ativado!" : "Módulo Financeiro desativado!");
      onConfigUpdate();
    } catch (error: any) {
      setFinanceiroHabilitado(!enabled);
      toast.error("Erro ao salvar configuração: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Configurações do Workspace</h2>
          <p className="text-sm text-muted-foreground">Personalize as funcionalidades do seu nicho</p>
        </div>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Módulos</CardTitle>
          <CardDescription>Ative ou desative módulos do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-surface/50 border border-border/30">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <Label htmlFor="financeiro" className="text-base font-medium cursor-pointer">
                  Módulo Financeiro
                </Label>
                <p className="text-sm text-muted-foreground">
                  Registre vendas e acompanhe o faturamento do seu nicho
                </p>
              </div>
            </div>
            <Switch
              id="financeiro"
              checked={financeiroHabilitado}
              onCheckedChange={handleToggleFinanceiro}
              disabled={saving}
            />
          </div>

          {/* Placeholder para futuros módulos */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-surface/30 border border-border/20 opacity-50">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-muted/50">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-medium text-muted-foreground">
                  Mais módulos em breve...
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Calendário, Biblioteca, Relatórios e mais
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
