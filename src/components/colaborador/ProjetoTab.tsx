import { useState } from "react";
import { useWorkspaceLink, useUpsertWorkspaceLink, useDeleteWorkspaceLink } from "@/hooks/queries/useWorkspaceLinks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Brain, ExternalLink, Pencil, Trash2, Save, FolderKanban, Loader2 } from "lucide-react";

interface ProjetoTabProps {
  nichoId: string;
}

const PROVIDERS = [
  { value: "tldraw", label: "Tldraw" },
  { value: "docs", label: "Google Docs" },
  { value: "miro", label: "Miro" },
] as const;

type Provider = typeof PROVIDERS[number]["value"];

const PROVIDER_COLORS: Record<Provider, string> = {
  tldraw: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  docs: "bg-green-500/20 text-green-400 border-green-500/30",
  miro: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

function validateUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function truncateUrl(url: string, maxLength = 50): string {
  if (url.length <= maxLength) return url;
  return url.slice(0, maxLength) + "...";
}

export function ProjetoTab({ nichoId }: ProjetoTabProps) {
  const { data: mindmapLink, isLoading } = useWorkspaceLink(nichoId, "mindmap");
  const upsertMutation = useUpsertWorkspaceLink();
  const deleteMutation = useDeleteWorkspaceLink();

  const [isEditing, setIsEditing] = useState(false);
  const [provider, setProvider] = useState<Provider>("tldraw");
  const [url, setUrl] = useState("");

  const isConfigured = !!mindmapLink;

  const handleStartEdit = () => {
    if (mindmapLink) {
      setProvider((mindmapLink.provider as Provider) || "tldraw");
      setUrl(mindmapLink.url);
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProvider("tldraw");
    setUrl("");
  };

  const handleSave = async () => {
    if (!url.trim()) {
      toast.error("A URL é obrigatória");
      return;
    }

    if (!validateUrl(url.trim())) {
      toast.error("A URL deve começar com http:// ou https://");
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        nicho_id: nichoId,
        type: "mindmap",
        provider,
        title: "Mapa Mental",
        url: url.trim(),
      });
      toast.success("Mapa mental salvo!");
      setIsEditing(false);
      setProvider("tldraw");
      setUrl("");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    }
  };

  const handleOpen = () => {
    if (mindmapLink?.url) {
      window.open(mindmapLink.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ nichoId, type: "mindmap" });
      toast.success("Mapa mental removido!");
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <FolderKanban className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Projeto</h2>
          <p className="text-sm text-muted-foreground">Visão geral e links principais do workspace</p>
        </div>
      </div>

      {/* Card Mapa Mental */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Brain className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Mapa Mental</CardTitle>
                <CardDescription>Link externo para o mapa visual do projeto</CardDescription>
              </div>
            </div>
            {isConfigured && !isEditing && mindmapLink?.provider && (
              <Badge variant="outline" className={PROVIDER_COLORS[mindmapLink.provider as Provider]}>
                {PROVIDERS.find(p => p.value === mindmapLink.provider)?.label || mindmapLink.provider}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Estado Vazio ou Editando */}
          {(!isConfigured || isEditing) && (
            <div className="space-y-4">
              {!isConfigured && !isEditing && (
                <p className="text-sm text-muted-foreground">Configure o mapa mental do projeto</p>
              )}
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">Onde está o mapa?</Label>
                  <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">URL do mapa</Label>
                  <Input
                    placeholder="Cole aqui o link do mapa mental..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={upsertMutation.isPending}
                  size="sm"
                >
                  {upsertMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isEditing ? "Salvar alterações" : "Salvar"}
                </Button>
                {isEditing && (
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Estado Configurado */}
          {isConfigured && !isEditing && mindmapLink && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-mono">
                {truncateUrl(mindmapLink.url)}
              </p>

              <div className="flex items-center gap-2">
                <Button onClick={handleOpen} size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir
                </Button>
                <Button variant="outline" size="sm" onClick={handleStartEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover Mapa Mental?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso vai remover o link do mapa mental do projeto. Você pode configurar novamente depois.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
