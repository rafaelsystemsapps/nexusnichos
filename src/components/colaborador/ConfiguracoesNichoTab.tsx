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
  Settings,
  UserCheck,
  FlaskRound,
  Brain,
  Save,
  Loader2,
  Link,
} from "lucide-react";

interface ConfiguracoesNichoTabProps {
  nichoId: string;
  nicho: {
    contas_habilitado?: boolean;
    applab_habilitado?: boolean;
  };
  onConfigUpdate: () => void;
}

const MODULOS_CONFIG = [
  {
    id: "contas",
    dbField: "contas_habilitado",
    label: "Controle de Contas",
    description: "Gerencie suas contas de redes sociais",
    icon: UserCheck,
    color: "blue",
  },
  {
    id: "applab",
    dbField: "applab_habilitado",
    label: "AppLab",
    description: "Laboratório operacional de apps e ferramentas",
    icon: FlaskRound,
    color: "cyan",
  },
] as const;

type ModuloConfig = typeof MODULOS_CONFIG[number];

const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-500" },
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

  const { data: mindmapLink } = useWorkspaceLink(nichoId, "mindmap");
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
    setSaving(modulo.id);
    setModulosState((prev) => ({ ...prev, [modulo.id]: enabled }));

    try {
      const { error } = await supabase
        .from("nichos")
        .update({ [modulo.dbField]: enabled })
        .eq("id", nichoId);

      if (error) throw error;

      toast.success(enabled ? `${modulo.label} ativado!` : `${modulo.label} desativado!`);
      onConfigUpdate();
    } catch (error: any) {
      setModulosState((prev) => ({ ...prev, [modulo.id]: !enabled }));
      toast.error("Erro ao salvar configuração: " + error.message);
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

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Módulos</CardTitle>
          <CardDescription>Ative ou desative módulos do sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {MODULOS_CONFIG.map((modulo) => {
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
    </div>
  );
}
