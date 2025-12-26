import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AplicativoCard } from "./AplicativoCard";
import { AplicativoForm } from "./AplicativoForm";
import { AppsDashboard } from "./AppsDashboard";

interface AplicativosTabProps {
  nichoId: string;
}

interface Aplicativo {
  id: string;
  nome: string;
  descricao: string | null;
  tipo_app: string | null;
  status: string | null;
  tecnologias: string | null;
  url_producao: string | null;
  url_repositorio: string | null;
  data_criacao: string | null;
  data_lancamento: string | null;
  clientes_count?: number;
  resultados?: Array<{
    id: string;
    tipo: string;
    valor: number | null;
    data: string;
    observacao: string | null;
  }>;
}

interface Transacao {
  id: string;
  app_id: string | null;
  preco_venda: number;
  preco_custo: number;
}

export function AplicativosTab({ nichoId }: AplicativosTabProps) {
  const [aplicativos, setAplicativos] = useState<Aplicativo[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");

  const fetchAplicativos = useCallback(async () => {
    try {
      // Buscar aplicativos
      const { data: apps, error: appsError } = await supabase
        .from("aplicativos")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("created_at", { ascending: false });

      if (appsError) throw appsError;

      // Buscar contagem de clientes por app
      const { data: clientes, error: clientesError } = await supabase
        .from("clientes")
        .select("app_id")
        .eq("nicho_id", nichoId)
        .not("app_id", "is", null);

      if (clientesError) throw clientesError;

      // Buscar resultados
      const { data: resultados, error: resultadosError } = await supabase
        .from("resultados_app")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("data", { ascending: false });

      if (resultadosError) throw resultadosError;

      // Buscar transações vinculadas a apps
      const { data: transacoesData, error: transacoesError } = await supabase
        .from("transacoes_financeiras")
        .select("id, app_id, preco_venda, preco_custo")
        .eq("nicho_id", nichoId)
        .not("app_id", "is", null);

      if (transacoesError) throw transacoesError;
      setTransacoes(transacoesData || []);

      // Mapear dados
      const appsWithData = (apps || []).map((app) => {
        const clientesCount = (clientes || []).filter((c) => c.app_id === app.id).length;
        const appResultados = (resultados || []).filter((r) => r.app_id === app.id);
        
        return {
          ...app,
          clientes_count: clientesCount,
          resultados: appResultados,
        };
      });

      setAplicativos(appsWithData);
    } catch (error: any) {
      toast.error("Erro ao carregar aplicativos: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [nichoId]);

  useEffect(() => {
    fetchAplicativos();
  }, [fetchAplicativos]);

  const filteredApps = aplicativos.filter((app) => {
    const matchesSearch = app.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.descricao?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "todos" || app.status === statusFilter;
    const matchesTipo = tipoFilter === "todos" || app.tipo_app === tipoFilter;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  const stats = {
    total: aplicativos.length,
    ativos: aplicativos.filter((a) => a.status === "ativo" || a.status === "lancado").length,
    desenvolvimento: aplicativos.filter((a) => a.status === "desenvolvimento").length,
    ideias: aplicativos.filter((a) => a.status === "ideia").length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard de Métricas */}
      <AppsDashboard aplicativos={aplicativos} transacoes={transacoes} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{stats.total} apps</span>
          <span className="text-primary">{stats.ativos} ativos</span>
          <span className="text-amber-500">{stats.desenvolvimento} em dev</span>
          <span>{stats.ideias} ideias</span>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo App
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aplicativo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            <SelectItem value="ideia">Ideia</SelectItem>
            <SelectItem value="desenvolvimento">Em Dev</SelectItem>
            <SelectItem value="lancado">Lancado</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="pausado">Pausado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Tipos</SelectItem>
            <SelectItem value="guia">Guia Digital</SelectItem>
            <SelectItem value="gestao">Gestao</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Apps Grid */}
      {filteredApps.length === 0 ? (
        <div className="text-center py-12">
          <Smartphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "todos" || tipoFilter !== "todos"
              ? "Nenhum aplicativo encontrado com esses filtros"
              : "Nenhum aplicativo cadastrado ainda"}
          </p>
          {!searchTerm && statusFilter === "todos" && tipoFilter === "todos" && (
            <Button variant="outline" className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro app
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredApps.map((app) => (
            <AplicativoCard
              key={app.id}
              aplicativo={app}
              nichoId={nichoId}
              onUpdate={fetchAplicativos}
            />
          ))}
        </div>
      )}

      <AplicativoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        nichoId={nichoId}
        onSave={fetchAplicativos}
      />
    </div>
  );
}
