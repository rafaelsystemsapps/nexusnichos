import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Users, Filter } from "lucide-react";
import { ClienteCard } from "./ClienteCard";
import { ClienteForm } from "./ClienteForm";
import { cn } from "@/lib/utils";

interface ClientesTabProps {
  nichoId: string;
}

export function ClientesTab({ nichoId }: ClientesTabProps) {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  useEffect(() => {
    fetchClientes();
  }, [nichoId]);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("ordem", { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar clientes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = clientes.filter((cliente) => {
    const matchSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === "todos" || cliente.tipo === filterTipo;
    const matchStatus = filterStatus === "todos" || cliente.status === filterStatus;
    return matchSearch && matchTipo && matchStatus;
  });

  // Stats
  const stats = {
    total: clientes.length,
    rodando: clientes.filter(c => c.status === "rodando").length,
    pausado: clientes.filter(c => c.status === "pausado").length,
    influencers: clientes.filter(c => c.tipo === "influencer").length,
    negocios: clientes.filter(c => c.tipo === "negocio_local").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-lg bg-card/50 border border-border/50">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-2xl font-bold text-emerald-400">{stats.rodando}</p>
          <p className="text-xs text-muted-foreground">Rodando</p>
        </div>
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-2xl font-bold text-amber-400">{stats.pausado}</p>
          <p className="text-xs text-muted-foreground">Pausados</p>
        </div>
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <p className="text-2xl font-bold text-purple-400">{stats.influencers}</p>
          <p className="text-xs text-muted-foreground">Influencers</p>
        </div>
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-2xl font-bold text-blue-400">{stats.negocios}</p>
          <p className="text-xs text-muted-foreground">Negócios</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente..."
              className="pl-9 w-[200px]"
            />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="influencer">Influencer</SelectItem>
              <SelectItem value="negocio_local">Negócio Local</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="rodando">Rodando</SelectItem>
              <SelectItem value="pausado">Pausado</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Lista de Clientes */}
      {filteredClientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted/30 mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Nenhum cliente encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || filterTipo !== "todos" || filterStatus !== "todos"
              ? "Tente ajustar os filtros"
              : "Comece adicionando seu primeiro cliente"}
          </p>
          {!searchTerm && filterTipo === "todos" && filterStatus === "todos" && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClientes.map((cliente) => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              onUpdate={fetchClientes}
              nichoId={nichoId}
            />
          ))}
        </div>
      )}

      <ClienteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        nichoId={nichoId}
        onSave={fetchClientes}
      />
    </div>
  );
}
