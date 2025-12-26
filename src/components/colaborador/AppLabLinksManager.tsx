import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Link2, LinkIcon, Search, FlaskConical, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLabApp } from "./AppLabCard";
import { differenceInDays } from "date-fns";

interface Conta {
  id: string;
  nome_conta: string;
  plataforma: string;
  status: string | null;
}

interface AppLink {
  id: string;
  conta_id: string;
  status_vinculo: "ativo" | "pausado";
  observacao: string | null;
  validando: string | null;
  duracao_teste: "7_dias" | "30_dias" | "3_meses" | null;
  data_inicio_teste: string | null;
}

interface AppLabLinksManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: AppLabApp | null;
  nichoId: string;
  onLinksUpdated: () => void;
}

const PLATAFORMA_ICONS: Record<string, string> = {
  tiktok: "🎵",
  instagram: "📷",
  youtube: "🎬",
  facebook: "📘",
  twitter: "🐦",
  linkedin: "💼",
  whatsapp: "💬",
  telegram: "✈️",
  site: "🌐",
  outros: "📱",
};

const DURACAO_CONFIG = {
  "7_dias": { label: "7 Dias", dias: 7, emoji: "🧪", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  "30_dias": { label: "30 Dias", dias: 30, emoji: "🔬", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  "3_meses": { label: "3 Meses", dias: 90, emoji: "🧫", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30" },
};

type DuracaoTeste = keyof typeof DURACAO_CONFIG;

const FILTRO_OPTIONS = [
  { value: "todos", label: "Todos", emoji: "📋" },
  { value: "7_dias", label: "7 Dias", emoji: "🧪" },
  { value: "30_dias", label: "30 Dias", emoji: "🔬" },
  { value: "3_meses", label: "3 Meses", emoji: "🧫" },
  { value: "expirados", label: "Expirados", emoji: "⚠️" },
];

function calcularProgresso(dataInicio: string | null, duracao: DuracaoTeste | null): { diasRestantes: number; progresso: number; expirado: boolean } {
  if (!dataInicio || !duracao) return { diasRestantes: 0, progresso: 0, expirado: false };
  
  const inicio = new Date(dataInicio);
  const totalDias = DURACAO_CONFIG[duracao].dias;
  const diasPassados = differenceInDays(new Date(), inicio);
  const diasRestantes = Math.max(0, totalDias - diasPassados);
  const progresso = Math.min(100, (diasPassados / totalDias) * 100);
  const expirado = diasRestantes === 0;
  
  return { diasRestantes, progresso, expirado };
}

export function AppLabLinksManager({
  open,
  onOpenChange,
  app,
  nichoId,
  onLinksUpdated,
}: AppLabLinksManagerProps) {
  const [contas, setContas] = useState<Conta[]>([]);
  const [links, setLinks] = useState<AppLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState("todos");
  
  // Form state for new link
  const [linkingConta, setLinkingConta] = useState<Conta | null>(null);
  const [formValidando, setFormValidando] = useState("");
  const [formDuracao, setFormDuracao] = useState<DuracaoTeste>("7_dias");

  useEffect(() => {
    if (open && app) {
      fetchData();
    }
  }, [open, app]);

  const fetchData = async () => {
    if (!app) return;
    setLoading(true);

    try {
      // Fetch contas do nicho
      const { data: contasData, error: contasError } = await supabase
        .from("contas_redes_sociais")
        .select("id, nome_conta, plataforma, status")
        .eq("nicho_id", nichoId)
        .order("nome_conta");

      if (contasError) throw contasError;
      setContas(contasData || []);

      // Fetch links existentes com novos campos
      const { data: linksData, error: linksError } = await supabase
        .from("applab_account_links")
        .select("id, conta_id, status_vinculo, observacao, validando, duracao_teste, data_inicio_teste")
        .eq("app_id", app.id);

      if (linksError) throw linksError;
      setLinks((linksData || []).map((l: any) => ({
        ...l,
        status_vinculo: l.status_vinculo as "ativo" | "pausado",
        duracao_teste: l.duracao_teste as DuracaoTeste | null,
      })));
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLinking = (conta: Conta) => {
    setLinkingConta(conta);
    setFormValidando("");
    setFormDuracao("7_dias");
  };

  const handleConfirmLink = async () => {
    if (!app || !linkingConta) return;

    setSaving(linkingConta.id);

    try {
      const { data, error } = await supabase
        .from("applab_account_links")
        .insert({
          app_id: app.id,
          conta_id: linkingConta.id,
          nicho_id: nichoId,
          status_vinculo: "ativo",
          validando: formValidando || null,
          duracao_teste: formDuracao,
          data_inicio_teste: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const newLink: AppLink = {
        id: data.id,
        conta_id: data.conta_id,
        status_vinculo: data.status_vinculo as "ativo" | "pausado",
        observacao: data.observacao,
        validando: data.validando,
        duracao_teste: data.duracao_teste as DuracaoTeste,
        data_inicio_teste: data.data_inicio_teste,
      };

      setLinks((prev) => [...prev, newLink]);
      toast.success(`Vinculado a ${linkingConta.nome_conta}`);
      setLinkingConta(null);
      onLinksUpdated();
    } catch (error: any) {
      toast.error("Erro ao vincular conta: " + error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleUnlink = async (conta: Conta) => {
    if (!app) return;

    const existingLink = links.find((l) => l.conta_id === conta.id);
    if (!existingLink) return;

    setSaving(conta.id);

    try {
      const { error } = await supabase
        .from("applab_account_links")
        .delete()
        .eq("id", existingLink.id);

      if (error) throw error;

      setLinks((prev) => prev.filter((l) => l.id !== existingLink.id));
      toast.success(`Desvinculado de ${conta.nome_conta}`);
      onLinksUpdated();
    } catch (error: any) {
      toast.error("Erro ao desvincular: " + error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleToggleStatus = async (link: AppLink) => {
    setSaving(link.conta_id);

    try {
      const newStatus = link.status_vinculo === "ativo" ? "pausado" : "ativo";

      const { error } = await supabase
        .from("applab_account_links")
        .update({ status_vinculo: newStatus })
        .eq("id", link.id);

      if (error) throw error;

      setLinks((prev) =>
        prev.map((l) =>
          l.id === link.id ? { ...l, status_vinculo: newStatus } : l
        )
      );

      toast.success(newStatus === "ativo" ? "Vínculo ativado" : "Vínculo pausado");
      onLinksUpdated();
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateValidando = async (link: AppLink, newValidando: string) => {
    try {
      const { error } = await supabase
        .from("applab_account_links")
        .update({ validando: newValidando || null })
        .eq("id", link.id);

      if (error) throw error;

      setLinks((prev) =>
        prev.map((l) =>
          l.id === link.id ? { ...l, validando: newValidando || null } : l
        )
      );
    } catch (error: any) {
      toast.error("Erro ao atualizar validação: " + error.message);
    }
  };

  // Filter logic
  const filteredContas = contas.filter((conta) =>
    conta.nome_conta.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const linkedContas = filteredContas.filter((conta) => {
    const link = links.find((l) => l.conta_id === conta.id);
    if (!link) return false;
    
    if (filtroAtivo === "todos") return true;
    if (filtroAtivo === "expirados") {
      const { expirado } = calcularProgresso(link.data_inicio_teste, link.duracao_teste);
      return expirado;
    }
    return link.duracao_teste === filtroAtivo;
  });

  const unlinkedContas = filteredContas.filter(
    (conta) => !links.some((l) => l.conta_id === conta.id)
  );

  // Count expirados
  const expiradosCount = links.filter((link) => {
    const { expirado } = calcularProgresso(link.data_inicio_teste, link.duracao_teste);
    return expirado;
  }).length;

  if (!app) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Vinculações: {app.nome_app}
          </DialogTitle>
          <DialogDescription>
            Vincule contas e defina o que está validando em cada teste
          </DialogDescription>
        </DialogHeader>

        {/* Linking Form */}
        {linkingConta && (
          <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{PLATAFORMA_ICONS[linkingConta.plataforma] || "📱"}</span>
              <span className="font-medium">{linkingConta.nome_conta}</span>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">O que está validando?</Label>
              <Textarea
                placeholder="Ex: Testando conversão via stories, engajamento orgânico..."
                value={formValidando}
                onChange={(e) => setFormValidando(e.target.value)}
                className="min-h-[60px] resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Duração do teste</Label>
              <Select value={formDuracao} onValueChange={(v) => setFormDuracao(v as DuracaoTeste)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DURACAO_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.emoji} {config.label} ({config.dias} dias)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setLinkingConta(null)}>
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={handleConfirmLink}
                disabled={saving === linkingConta.id}
              >
                {saving === linkingConta.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LinkIcon className="h-4 w-4 mr-2" />
                )}
                Vincular
              </Button>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {links.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {FILTRO_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={filtroAtivo === opt.value ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setFiltroAtivo(opt.value)}
                >
                  {opt.emoji} {opt.label}
                  {opt.value === "expirados" && expiradosCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                      {expiradosCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="max-h-[350px] pr-4">
            <div className="space-y-4">
              {/* Linked Contas */}
              {linkedContas.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Vinculadas ({linkedContas.length})
                  </Label>
                  <div className="mt-2 space-y-2">
                    {linkedContas.map((conta) => {
                      const link = links.find((l) => l.conta_id === conta.id)!;
                      const isActive = link.status_vinculo === "ativo";
                      const duracao = link.duracao_teste || "7_dias";
                      const duracaoConfig = DURACAO_CONFIG[duracao];
                      const { diasRestantes, progresso, expirado } = calcularProgresso(
                        link.data_inicio_teste,
                        link.duracao_teste
                      );

                      return (
                        <div
                          key={conta.id}
                          className={cn(
                            "p-3 rounded-lg border transition-colors",
                            expirado
                              ? "bg-destructive/5 border-destructive/30"
                              : isActive
                              ? "bg-primary/5 border-primary/20"
                              : "bg-muted/20 border-border/30"
                          )}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {PLATAFORMA_ICONS[conta.plataforma] || "📱"}
                              </span>
                              <span className="font-medium text-sm">{conta.nome_conta}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge
                                variant="outline"
                                className={cn("text-xs", duracaoConfig.bg, duracaoConfig.color, duracaoConfig.border)}
                              >
                                {duracaoConfig.emoji} {duracaoConfig.label}
                              </Badge>
                              {expirado && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Expirado
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Validando */}
                          {link.validando && (
                            <div className="flex items-start gap-2 mb-2 text-sm">
                              <FlaskConical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">{link.validando}</span>
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Progresso do teste
                              </span>
                              <span className={expirado ? "text-destructive font-medium" : ""}>
                                {expirado ? "Teste concluído" : `${diasRestantes} dias restantes`}
                              </span>
                            </div>
                            <Progress 
                              value={progresso} 
                              className={cn("h-2", expirado && "[&>div]:bg-destructive")}
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  isActive
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                    : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                )}
                              >
                                {isActive ? "Ativo" : "Pausado"}
                              </Badge>
                              <Switch
                                checked={isActive}
                                onCheckedChange={() => handleToggleStatus(link)}
                                disabled={saving === conta.id}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnlink(conta)}
                              disabled={saving === conta.id}
                              className="text-destructive hover:text-destructive h-7 text-xs"
                            >
                              {saving === conta.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Desvincular"
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Unlinked Contas */}
              {!linkingConta && unlinkedContas.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Disponíveis ({unlinkedContas.length})
                  </Label>
                  <div className="mt-2 space-y-2">
                    {unlinkedContas.map((conta) => (
                      <div
                        key={conta.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-surface/30 border-border/20"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {PLATAFORMA_ICONS[conta.plataforma] || "📱"}
                          </span>
                          <div>
                            <p className="font-medium text-sm text-muted-foreground">
                              {conta.nome_conta}
                            </p>
                            <p className="text-xs text-muted-foreground/70 capitalize">
                              {conta.plataforma}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartLinking(conta)}
                          disabled={saving === conta.id}
                        >
                          <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                          Vincular
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredContas.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {searchTerm
                    ? "Nenhuma conta encontrada"
                    : "Nenhuma conta cadastrada no nicho"}
                </p>
              )}

              {linkedContas.length === 0 && filtroAtivo !== "todos" && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma vinculação com este filtro
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
