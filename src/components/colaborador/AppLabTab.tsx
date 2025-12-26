import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { FlaskRound, Plus, Search, Loader2 } from "lucide-react";
import { AppLabCard, AppLabApp } from "./AppLabCard";
import { AppLabForm } from "./AppLabForm";
import { AppLabLinksManager } from "./AppLabLinksManager";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

interface AppLabTabProps {
  nichoId: string;
}

type StatusFilter = "all" | "em_analise" | "em_teste" | "validado" | "descartado";

const STATUS_ORDER: Record<AppLabApp["status_teste"], number> = {
  em_teste: 1,
  em_analise: 2,
  validado: 3,
  descartado: 4,
};

const DURACAO_DIAS: Record<string, number> = {
  "7_dias": 7,
  "30_dias": 30,
  "3_meses": 90,
};

function calcularLinksSummary(links: any[]): AppLabApp["links_summary"] {
  const summary = { "7_dias": 0, "30_dias": 0, "3_meses": 0, expirados: 0 };
  
  links.forEach((link) => {
    const duracao = link.duracao_teste || "7_dias";
    const dataInicio = link.data_inicio_teste;
    
    if (dataInicio) {
      const dias = DURACAO_DIAS[duracao] || 7;
      const diasPassados = differenceInDays(new Date(), new Date(dataInicio));
      
      if (diasPassados >= dias) {
        summary.expirados++;
      } else if (duracao in summary) {
        summary[duracao as keyof typeof summary]++;
      }
    } else if (duracao in summary) {
      summary[duracao as keyof typeof summary]++;
    }
  });
  
  return summary;
}

export function AppLabTab({ nichoId }: AppLabTabProps) {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AppLabApp | null>(null);
  const [linksManagerApp, setLinksManagerApp] = useState<AppLabApp | null>(null);
  const [deleteApp, setDeleteApp] = useState<AppLabApp | null>(null);

  // Fetch apps with links count and details
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["applab-apps", nichoId],
    queryFn: async () => {
      // Get apps
      const { data: appsData, error: appsError } = await supabase
        .from("applab_apps")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("updated_at", { ascending: false });

      if (appsError) throw appsError;

      // Get all links for these apps
      const appIds = (appsData || []).map((a) => a.id);
      const { data: linksData, error: linksError } = await supabase
        .from("applab_account_links")
        .select("app_id, duracao_teste, data_inicio_teste")
        .in("app_id", appIds.length > 0 ? appIds : ["none"]);

      if (linksError) throw linksError;

      // Group links by app
      const linksByApp: Record<string, any[]> = {};
      (linksData || []).forEach((link) => {
        if (!linksByApp[link.app_id]) linksByApp[link.app_id] = [];
        linksByApp[link.app_id].push(link);
      });

      return (appsData || []).map((app: any) => ({
        ...app,
        links_count: linksByApp[app.id]?.length || 0,
        links_summary: calcularLinksSummary(linksByApp[app.id] || []),
      })) as AppLabApp[];
    },
  });

  // Create app mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<AppLabApp, "id" | "created_at" | "updated_at" | "links_count">) => {
      const { error } = await supabase.from("applab_apps").insert({
        nicho_id: nichoId,
        nome_app: data.nome_app,
        descricao_curta: data.descricao_curta || null,
        status_teste: data.status_teste,
        usuarios_ativos: data.usuarios_ativos,
        usuarios_ativos_atualizado_em: data.usuarios_ativos > 0 ? new Date().toISOString() : null,
        observacoes: data.observacoes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applab-apps", nichoId] });
      toast.success("App criado com sucesso!");
      setFormOpen(false);
    },
    onError: (error: any) => {
      toast.error("Erro ao criar app: " + error.message);
    },
  });

  // Update app mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<AppLabApp> & { id: string }) => {
      const updateData: any = { ...data };
      
      // Update usuarios_ativos_atualizado_em if usuarios_ativos changed
      if ("usuarios_ativos" in data) {
        updateData.usuarios_ativos_atualizado_em = new Date().toISOString();
      }

      const { error } = await supabase
        .from("applab_apps")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applab-apps", nichoId] });
      toast.success("App atualizado!");
      setEditingApp(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar app: " + error.message);
    },
  });

  // Delete app mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("applab_apps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applab-apps", nichoId] });
      toast.success("App excluído!");
      setDeleteApp(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir app: " + error.message);
    },
  });

  // Filter and sort apps
  const filteredApps = useMemo(() => {
    let result = apps;

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (app) =>
          app.nome_app.toLowerCase().includes(term) ||
          app.descricao_curta?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((app) => app.status_teste === statusFilter);
    }

    // Sort by status priority, then by updated_at
    result = [...result].sort((a, b) => {
      const prioA = STATUS_ORDER[a.status_teste];
      const prioB = STATUS_ORDER[b.status_teste];
      if (prioA !== prioB) return prioA - prioB;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return result;
  }, [apps, searchTerm, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: apps.length,
      em_teste: apps.filter((a) => a.status_teste === "em_teste").length,
      em_analise: apps.filter((a) => a.status_teste === "em_analise").length,
      validado: apps.filter((a) => a.status_teste === "validado").length,
      descartado: apps.filter((a) => a.status_teste === "descartado").length,
    };
  }, [apps]);

  const handleStatusChange = (app: AppLabApp, newStatus: AppLabApp["status_teste"]) => {
    updateMutation.mutate({ id: app.id, status_teste: newStatus });
  };

  const handleFormSubmit = async (data: any) => {
    if (editingApp) {
      await updateMutation.mutateAsync({ id: editingApp.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FlaskRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AppLab</h2>
            <p className="text-sm text-muted-foreground">
              Laboratório operacional de apps e ferramentas
            </p>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo App
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs">
          {stats.total} apps
        </Badge>
        <Badge
          variant="outline"
          className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30"
        >
          🔵 {stats.em_teste} em teste
        </Badge>
        <Badge
          variant="outline"
          className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30"
        >
          🟡 {stats.em_analise} em análise
        </Badge>
        <Badge
          variant="outline"
          className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
        >
          🟢 {stats.validado} validados
        </Badge>
        <Badge
          variant="outline"
          className="text-xs bg-red-500/10 text-red-400 border-red-500/30"
        >
          🔴 {stats.descartado} descartados
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar apps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="em_teste">🔵 Em Teste</SelectItem>
            <SelectItem value="em_analise">🟡 Em Análise</SelectItem>
            <SelectItem value="validado">🟢 Validado</SelectItem>
            <SelectItem value="descartado">🔴 Descartado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-12">
          <FlaskRound className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all"
              ? "Nenhum app encontrado com esses filtros"
              : "Nenhum app cadastrado ainda"}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setFormOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar primeiro app
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredApps.map((app) => (
            <AppLabCard
              key={app.id}
              app={app}
              onEdit={(app) => setEditingApp(app)}
              onDelete={(app) => setDeleteApp(app)}
              onManageLinks={(app) => setLinksManagerApp(app)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <AppLabForm
        open={formOpen || !!editingApp}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditingApp(null);
          }
        }}
        app={editingApp}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Links Manager */}
      <AppLabLinksManager
        open={!!linksManagerApp}
        onOpenChange={(open) => {
          if (!open) setLinksManagerApp(null);
        }}
        app={linksManagerApp}
        nichoId={nichoId}
        onLinksUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["applab-apps", nichoId] });
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteApp} onOpenChange={(open) => !open && setDeleteApp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir app?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá remover o app "{deleteApp?.nome_app}" e todas as suas
              vinculações. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteApp && deleteMutation.mutate(deleteApp.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
