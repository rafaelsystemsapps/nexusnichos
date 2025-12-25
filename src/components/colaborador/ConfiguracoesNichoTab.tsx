import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DollarSign, Settings, Package, Radio, Archive } from "lucide-react";
import { ProdutosList } from "./ProdutosList";
import { OrdemAbasEditor } from "./OrdemAbasEditor";

interface ConfiguracoesNichoTabProps {
  nichoId: string;
  nicho: {
    financeiro_habilitado: boolean;
    pedidos_habilitado?: boolean;
    radar_habilitado?: boolean;
    cemiterio_habilitado?: boolean;
    contas_habilitado?: boolean;
    time_habilitado?: boolean;
    mapa_dependencia_habilitado?: boolean;
    teste_rapido_habilitado?: boolean;
    logs_aprendizado_habilitado?: boolean;
    ordem_abas?: string[] | null;
  };
  onConfigUpdate: () => void;
}

export function ConfiguracoesNichoTab({ nichoId, nicho, onConfigUpdate }: ConfiguracoesNichoTabProps) {
  const [financeiroHabilitado, setFinanceiroHabilitado] = useState(nicho.financeiro_habilitado);
  const [pedidosHabilitado, setPedidosHabilitado] = useState(nicho.pedidos_habilitado ?? false);
  const [radarHabilitado, setRadarHabilitado] = useState(nicho.radar_habilitado ?? false);
  const [cemiterioHabilitado, setCemiterioHabilitado] = useState(nicho.cemiterio_habilitado ?? false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFinanceiroHabilitado(nicho.financeiro_habilitado);
    setPedidosHabilitado(nicho.pedidos_habilitado ?? false);
    setRadarHabilitado(nicho.radar_habilitado ?? false);
    setCemiterioHabilitado(nicho.cemiterio_habilitado ?? false);
  }, [nicho.financeiro_habilitado, nicho.pedidos_habilitado, nicho.radar_habilitado, nicho.cemiterio_habilitado]);

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

  const handleTogglePedidos = async (enabled: boolean) => {
    setSaving(true);
    setPedidosHabilitado(enabled);

    try {
      const { error } = await supabase
        .from("nichos")
        .update({ pedidos_habilitado: enabled })
        .eq("id", nichoId);

      if (error) throw error;

      toast.success(enabled ? "Módulo Pedidos ativado!" : "Módulo Pedidos desativado!");
      onConfigUpdate();
    } catch (error: any) {
      setPedidosHabilitado(!enabled);
      toast.error("Erro ao salvar configuração: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRadar = async (enabled: boolean) => {
    setSaving(true);
    setRadarHabilitado(enabled);

    try {
      const { error } = await supabase
        .from("nichos")
        .update({ radar_habilitado: enabled })
        .eq("id", nichoId);

      if (error) throw error;

      toast.success(enabled ? "Radar de Oportunidades ativado!" : "Radar de Oportunidades desativado!");
      onConfigUpdate();
    } catch (error: any) {
      setRadarHabilitado(!enabled);
      toast.error("Erro ao salvar configuração: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCemiterio = async (enabled: boolean) => {
    setSaving(true);
    setCemiterioHabilitado(enabled);

    try {
      const { error } = await supabase
        .from("nichos")
        .update({ cemiterio_habilitado: enabled })
        .eq("id", nichoId);

      if (error) throw error;

      toast.success(enabled ? "Módulo Cemitério ativado!" : "Módulo Cemitério desativado!");
      onConfigUpdate();
    } catch (error: any) {
      setCemiterioHabilitado(!enabled);
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

      {/* Módulos */}
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

          <div className="flex items-center justify-between p-4 rounded-lg bg-surface/50 border border-border/30">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Package className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <Label htmlFor="pedidos" className="text-base font-medium cursor-pointer">
                  Módulo Pedidos
                </Label>
                <p className="text-sm text-muted-foreground">
                  Gerencie pedidos e acompanhe envios
                </p>
              </div>
            </div>
            <Switch
              id="pedidos"
              checked={pedidosHabilitado}
              onCheckedChange={handleTogglePedidos}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-surface/50 border border-border/30">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Radio className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <Label htmlFor="radar" className="text-base font-medium cursor-pointer">
                  Radar de Oportunidades
                </Label>
                <p className="text-sm text-muted-foreground">
                  Monitore tendências e oportunidades do mercado
                </p>
              </div>
            </div>
            <Switch
              id="radar"
              checked={radarHabilitado}
              onCheckedChange={handleToggleRadar}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/20">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-muted/30">
                <Archive className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <Label htmlFor="cemiterio" className="text-base font-medium cursor-pointer text-muted-foreground">
                  Módulo Cemitério
                </Label>
                <p className="text-sm text-muted-foreground/70">
                  Arquivo morto de ativos e ideias encerradas
                </p>
              </div>
            </div>
            <Switch
              id="cemiterio"
              checked={cemiterioHabilitado}
              onCheckedChange={handleToggleCemiterio}
              disabled={saving}
            />
          </div>

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

      {/* Ordem das Abas */}
      <OrdemAbasEditor nichoId={nichoId} nicho={nicho} onConfigUpdate={onConfigUpdate} />

      {/* Produtos Cadastrados */}
      <ProdutosList nichoId={nichoId} />
    </div>
  );
}
