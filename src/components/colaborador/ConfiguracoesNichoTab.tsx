import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceLink, useUpsertWorkspaceLink } from "@/hooks/queries/useWorkspaceLinks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  DollarSign, 
  Settings, 
  Package, 
  Radio, 
  Archive, 
  Users, 
  AlertTriangle, 
  GitBranch, 
  FlaskConical, 
  BookOpen, 
  UserCheck,
  Briefcase,
  Smartphone,
  Gem,
  FlaskRound,
  Brain,
  Save,
  Loader2,
  Link,
} from "lucide-react";
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
    alertas_habilitado?: boolean;
    clientes_habilitado?: boolean;
    apps_habilitado?: boolean;
    offer_vault_habilitado?: boolean;
    applab_habilitado?: boolean;
    ordem_abas?: string[] | null;
  };
  onConfigUpdate: () => void;
}

// Configuração de módulos para facilitar a manutenção
const MODULOS_CONFIG = [
  {
    id: "financeiro",
    dbField: "financeiro_habilitado",
    label: "Módulo Financeiro",
    description: "Registre vendas e acompanhe o faturamento do seu nicho",
    icon: DollarSign,
    color: "emerald",
  },
  {
    id: "pedidos",
    dbField: "pedidos_habilitado",
    label: "Módulo Pedidos",
    description: "Gerencie pedidos e acompanhe envios",
    icon: Package,
    color: "orange",
  },
  {
    id: "contas",
    dbField: "contas_habilitado",
    label: "Controle de Contas",
    description: "Gerencie suas contas de redes sociais",
    icon: UserCheck,
    color: "blue",
  },
  {
    id: "clientes",
    dbField: "clientes_habilitado",
    label: "Gestao de Clientes + Apps",
    description: "Gerencie clientes, influenciadores e aplicativos SaaS",
    icon: Briefcase,
    color: "purple",
    linkedModules: ["apps"],
  },
  {
    id: "apps",
    dbField: "apps_habilitado",
    label: "Aplicativos SaaS",
    description: "Cadastre apps, vincule a clientes e registre resultados",
    icon: Smartphone,
    color: "cyan",
    hidden: true,
  },
  {
    id: "time",
    dbField: "time_habilitado",
    label: "Gestão de Time",
    description: "Gerencie os membros da equipe do nicho",
    icon: Users,
    color: "violet",
  },
  {
    id: "radar",
    dbField: "radar_habilitado",
    label: "Radar de Oportunidades",
    description: "Monitore tendências e oportunidades do mercado",
    icon: Radio,
    color: "cyan",
  },
  {
    id: "offer_vault",
    dbField: "offer_vault_habilitado",
    label: "OfferVault",
    description: "Cofre de ofertas - memória estratégica do mercado",
    icon: Gem,
    color: "amber",
  },
  {
    id: "applab",
    dbField: "applab_habilitado",
    label: "AppLab",
    description: "Laboratório operacional de apps e ferramentas",
    icon: FlaskRound,
    color: "cyan",
  },
  {
    id: "alertas",
    dbField: "alertas_habilitado",
    label: "Alertas de Risco",
    description: "Receba alertas sobre riscos e problemas",
    icon: AlertTriangle,
    color: "amber",
  },
  {
    id: "mapa_dependencia",
    dbField: "mapa_dependencia_habilitado",
    label: "Mapa de Dependência",
    description: "Visualize dependências e gargalos do nicho",
    icon: GitBranch,
    color: "pink",
  },
  {
    id: "teste_rapido",
    dbField: "teste_rapido_habilitado",
    label: "Testes Rápidos",
    description: "Registre e acompanhe experimentos e testes",
    icon: FlaskConical,
    color: "lime",
  },
  {
    id: "logs_aprendizado",
    dbField: "logs_aprendizado_habilitado",
    label: "Logs de Aprendizado",
    description: "Documente aprendizados e insights do nicho",
    icon: BookOpen,
    color: "indigo",
  },
  {
    id: "lembretes_hoje",
    dbField: "lembretes_hoje_habilitado",
    label: "Lembretes de Hoje",
    description: "Pressão temporal consciente para o fim do dia",
    icon: AlertTriangle,
    color: "amber",
  },
  {
    id: "cemiterio",
    dbField: "cemiterio_habilitado",
    label: "Módulo Cemitério",
    description: "Arquivo morto de ativos e ideias encerradas",
    icon: Archive,
    color: "slate",
  },
] as const;

type ModuloConfig = typeof MODULOS_CONFIG[number];

const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-500" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-500" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-500" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-500" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-500" },
  lime: { bg: "bg-lime-500/10", text: "text-lime-500" },
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-500" },
  slate: { bg: "bg-slate-500/10", text: "text-slate-500" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500" },
};

const MINDMAP_PROVIDERS = [
  { value: "tldraw", label: "Tldraw" },
  { value: "docs", label: "Google Docs" },
  { value: "miro", label: "Miro" },
] as const;

type MindmapProvider = typeof MINDMAP_PROVIDERS[number]["value"];

function validateUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function ConfiguracoesNichoTab({ nichoId, nicho, onConfigUpdate }: ConfiguracoesNichoTabProps) {
  const [modulosState, setModulosState] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  
  // Mapa Mental state
  const { data: mindmapLink, isLoading: mindmapLoading } = useWorkspaceLink(nichoId, "mindmap");
  const upsertMindmap = useUpsertWorkspaceLink();
  const [mindmapProvider, setMindmapProvider] = useState<MindmapProvider>("tldraw");
  const [mindmapUrl, setMindmapUrl] = useState("");
  
  useEffect(() => {
    if (mindmapLink) {
      setMindmapProvider((mindmapLink.provider as MindmapProvider) || "tldraw");
      setMindmapUrl(mindmapLink.url);
    }
  }, [mindmapLink]);
  
  useEffect(() => {
    const state: Record<string, boolean> = {};
    MODULOS_CONFIG.forEach((modulo) => {
      state[modulo.id] = (nicho as any)[modulo.dbField] ?? false;
    });
    setModulosState(state);
  }, [nicho]);

  const handleSaveMindmap = async () => {
    if (!mindmapUrl.trim()) {
      toast.error("A URL é obrigatória");
      return;
    }

    if (!validateUrl(mindmapUrl.trim())) {
      toast.error("A URL deve começar com http:// ou https://");
      return;
    }

    try {
      await upsertMindmap.mutateAsync({
        nicho_id: nichoId,
        type: "mindmap",
        provider: mindmapProvider,
        title: "Mapa Mental",
        url: mindmapUrl.trim(),
      });
      toast.success("Mapa mental salvo!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    }
  };

  const handleToggle = async (modulo: ModuloConfig, enabled: boolean) => {
    const moduloId = modulo.id;
    const dbField = modulo.dbField;
    const label = modulo.label;
    
    setSaving(moduloId);
    setModulosState((prev) => ({ ...prev, [moduloId]: enabled }));

    try {
      // Build update payload with linked modules
      const updatePayload: Record<string, any> = { [dbField]: enabled };
      const linkedIds: string[] = [];
      
      // If this module has linked modules, update them too
      if ('linkedModules' in modulo && modulo.linkedModules) {
        for (const linkedId of modulo.linkedModules) {
          const linkedModulo = MODULOS_CONFIG.find(m => m.id === linkedId);
          if (linkedModulo) {
            updatePayload[linkedModulo.dbField] = enabled;
            linkedIds.push(linkedId);
            setModulosState((prev) => ({ ...prev, [linkedId]: enabled }));
          }
        }
      }

      // Se estamos habilitando modulos, garantir que estejam no ordem_abas
      if (enabled && linkedIds.length > 0) {
        const currentOrdem = nicho.ordem_abas || [];
        const missingFromOrder = linkedIds.filter(id => !currentOrdem.includes(id));
        if (missingFromOrder.length > 0) {
          // Adicionar logo após o módulo principal na ordem
          const mainIndex = currentOrdem.indexOf(moduloId);
          const insertIndex = mainIndex >= 0 ? mainIndex + 1 : currentOrdem.length;
          const newOrdem = [...currentOrdem];
          newOrdem.splice(insertIndex, 0, ...missingFromOrder);
          updatePayload.ordem_abas = newOrdem;
        }
      }

      const { error } = await supabase
        .from("nichos")
        .update(updatePayload)
        .eq("id", nichoId);

      if (error) throw error;

      toast.success(enabled ? `${label} ativado!` : `${label} desativado!`);
      onConfigUpdate();
    } catch (error: any) {
      setModulosState((prev) => ({ ...prev, [moduloId]: !enabled }));
      toast.error("Erro ao salvar configuracao: " + error.message);
    } finally {
      setSaving(null);
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

      {/* Links do Projeto */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Link className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Links do Projeto</CardTitle>
              <CardDescription>Configure os links externos do workspace</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mapa Mental */}
          <div className="p-4 rounded-lg border border-border/30 bg-surface/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-1.5 rounded-md bg-purple-500/10">
                <Brain className="h-4 w-4 text-purple-400" />
              </div>
              <Label className="font-medium">Mapa Mental</Label>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Provedor</Label>
                <Select value={mindmapProvider} onValueChange={(v) => setMindmapProvider(v as MindmapProvider)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {MINDMAP_PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">URL</Label>
                <Input
                  placeholder="https://..."
                  value={mindmapUrl}
                  onChange={(e) => setMindmapUrl(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={handleSaveMindmap} 
              disabled={upsertMindmap.isPending}
              size="sm"
              className="mt-4"
            >
              {upsertMindmap.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Módulos */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Módulos</CardTitle>
          <CardDescription>Ative ou desative módulos do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {MODULOS_CONFIG.filter(m => !('hidden' in m && m.hidden)).map((modulo) => {
            const Icon = modulo.icon;
            const colorClass = COLOR_CLASSES[modulo.color];
            const isEnabled = modulosState[modulo.id] ?? false;

            return (
              <div
                key={modulo.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  isEnabled 
                    ? "bg-surface/50 border-border/30" 
                    : "bg-muted/20 border-border/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${colorClass.bg}`}>
                    <Icon className={`h-5 w-5 ${colorClass.text}`} />
                  </div>
                  <div>
                    <Label 
                      htmlFor={modulo.id} 
                      className={`text-base font-medium cursor-pointer ${!isEnabled && "text-muted-foreground"}`}
                    >
                      {modulo.label}
                    </Label>
                    <p className={`text-sm ${isEnabled ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
                      {modulo.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={modulo.id}
                  checked={isEnabled}
                  onCheckedChange={(enabled) => handleToggle(modulo, enabled)}
                  disabled={saving !== null}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Ordem das Abas */}
      <OrdemAbasEditor nichoId={nichoId} nicho={nicho} onConfigUpdate={onConfigUpdate} />
    </div>
  );
}
