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
import { toast } from "sonner";
import { Loader2, Link2, LinkIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLabApp } from "./AppLabCard";

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

      // Fetch links existentes
      const { data: linksData, error: linksError } = await supabase
        .from("applab_account_links")
        .select("id, conta_id, status_vinculo, observacao")
        .eq("app_id", app.id);

      if (linksError) throw linksError;
      setLinks((linksData || []).map((l: any) => ({
        ...l,
        status_vinculo: l.status_vinculo as "ativo" | "pausado",
      })));
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLink = async (conta: Conta) => {
    if (!app) return;

    const existingLink = links.find((l) => l.conta_id === conta.id);
    setSaving(conta.id);

    try {
      if (existingLink) {
        // Remove link
        const { error } = await supabase
          .from("applab_account_links")
          .delete()
          .eq("id", existingLink.id);

        if (error) throw error;

        setLinks((prev) => prev.filter((l) => l.id !== existingLink.id));
        toast.success(`Desvinculado de ${conta.nome_conta}`);
      } else {
        // Create link
        const { data, error } = await supabase
          .from("applab_account_links")
          .insert({
            app_id: app.id,
            conta_id: conta.id,
            nicho_id: nichoId,
            status_vinculo: "ativo",
          })
          .select()
          .single();

        if (error) throw error;

        const newLink: AppLink = {
          id: data.id,
          conta_id: data.conta_id,
          status_vinculo: data.status_vinculo as "ativo" | "pausado",
          observacao: data.observacao,
        };

        setLinks((prev) => [...prev, newLink]);
        toast.success(`Vinculado a ${conta.nome_conta}`);
      }

      onLinksUpdated();
    } catch (error: any) {
      toast.error("Erro ao atualizar vínculo: " + error.message);
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

  const filteredContas = contas.filter((conta) =>
    conta.nome_conta.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const linkedContas = filteredContas.filter((conta) =>
    links.some((l) => l.conta_id === conta.id)
  );

  const unlinkedContas = filteredContas.filter(
    (conta) => !links.some((l) => l.conta_id === conta.id)
  );

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
            Vincule este app às contas onde ele está sendo usado
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
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

                      return (
                        <div
                          key={conta.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-colors",
                            isActive
                              ? "bg-primary/5 border-primary/20"
                              : "bg-muted/20 border-border/30"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">
                              {PLATAFORMA_ICONS[conta.plataforma] || "📱"}
                            </span>
                            <div>
                              <p className="font-medium text-sm">
                                {conta.nome_conta}
                              </p>
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
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={isActive}
                              onCheckedChange={() => handleToggleStatus(link)}
                              disabled={saving === conta.id}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleLink(conta)}
                              disabled={saving === conta.id}
                              className="text-destructive hover:text-destructive"
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
              {unlinkedContas.length > 0 && (
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
                          onClick={() => handleToggleLink(conta)}
                          disabled={saving === conta.id}
                        >
                          {saving === conta.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                              Vincular
                            </>
                          )}
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
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
