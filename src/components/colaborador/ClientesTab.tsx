import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Users, Filter, Percent, DollarSign, Target } from "lucide-react";
import { ClienteCard } from "./ClienteCard";
import { ClienteForm } from "./ClienteForm";
import { ProspectsTab } from "./ProspectsTab";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientes, useUpdateClienteOrdem, useInvalidateClientes } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ClientesTabProps {
  nichoId: string;
}

// Sortable wrapper for ClienteCard
function SortableClienteCard({
  cliente,
  onUpdate,
  nichoId,
}: {
  cliente: any;
  onUpdate: () => void;
  nichoId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cliente.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ClienteCard
        cliente={cliente}
        onUpdate={onUpdate}
        nichoId={nichoId}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function ClientesTab({ nichoId }: ClientesTabProps) {
  const { data: clientes = [], isLoading: loading } = useClientes(nichoId);
  const updateOrdem = useUpdateClienteOrdem(nichoId);
  const invalidateClientes = useInvalidateClientes(nichoId);
  const queryClient = useQueryClient();
  
  const [formOpen, setFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterPagamento, setFilterPagamento] = useState<string>("todos");
  const [activeTab, setActiveTab] = useState("clientes");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const filteredClientes = useMemo(() => {
    return clientes.filter((cliente) => {
      const matchSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTipo = filterTipo === "todos" || cliente.tipo === filterTipo;
      const matchStatus = filterStatus === "todos" || cliente.status === filterStatus;
      const matchPagamento = filterPagamento === "todos" || cliente.modelo_pagamento === filterPagamento;
      return matchSearch && matchTipo && matchStatus && matchPagamento;
    });
  }, [clientes, searchTerm, filterTipo, filterStatus, filterPagamento]);

  // Verificar se há filtros ativos
  const hasActiveFilters = searchTerm !== "" || filterTipo !== "todos" || filterStatus !== "todos" || filterPagamento !== "todos";

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = clientes.findIndex((c) => c.id === active.id);
    const newIndex = clientes.findIndex((c) => c.id === over.id);

    const newClientes = arrayMove([...clientes], oldIndex, newIndex);
    
    // Optimistic update
    queryClient.setQueryData(["clientes", nichoId], newClientes);

    // Persist
    const updates = newClientes.map((cliente, index) => ({
      id: cliente.id,
      ordem: index,
    }));
    
    updateOrdem.mutate(updates);
  };

  // Stats
  const stats = useMemo(() => ({
    total: clientes.length,
    rodando: clientes.filter(c => c.status === "rodando").length,
    pausado: clientes.filter(c => c.status === "pausado").length,
    influencers: clientes.filter(c => c.tipo === "influencer").length,
    negocios: clientes.filter(c => c.tipo === "negocio_local").length,
    porcentagem: clientes.filter(c => c.modelo_pagamento === "porcentagem").length,
    valorFixo: clientes.filter(c => c.modelo_pagamento === "valor_fixo").length,
  }), [clientes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="space-y-4 w-full max-w-3xl">
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 rounded-lg skeleton-pulse bg-muted" />
            ))}
          </div>
          <div className="h-12 rounded-lg skeleton-pulse bg-muted" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-40 rounded-lg skeleton-pulse bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 tab-content">
      {/* Sub-Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="prospeccao" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Prospecção
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="mt-6 tab-content">
          {/* Header Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
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
              <p className="text-xs text-muted-foreground">Negocios</p>
            </div>
            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-cyan-400" />
                <p className="text-2xl font-bold text-cyan-400">{stats.porcentagem}</p>
              </div>
              <p className="text-xs text-muted-foreground">Porcentagem</p>
            </div>
            <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/20">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-teal-400" />
                <p className="text-2xl font-bold text-teal-400">{stats.valorFixo}</p>
              </div>
              <p className="text-xs text-muted-foreground">Valor Fixo</p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
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
              <Select value={filterPagamento} onValueChange={setFilterPagamento}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="porcentagem">Porcentagem</SelectItem>
                  <SelectItem value="valor_fixo">Valor Fixo</SelectItem>
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
          ) : hasActiveFilters ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredClientes.map((cliente) => (
                <ClienteCard
                  key={cliente.id}
                  cliente={cliente}
                  onUpdate={invalidateClientes}
                  nichoId={nichoId}
                />
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={clientes.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {clientes.map((cliente) => (
                    <SortableClienteCard
                      key={cliente.id}
                      cliente={cliente}
                      onUpdate={invalidateClientes}
                      nichoId={nichoId}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <ClienteForm
            open={formOpen}
            onOpenChange={setFormOpen}
            nichoId={nichoId}
            onSave={invalidateClientes}
          />
        </TabsContent>

        <TabsContent value="prospeccao" className="mt-6 tab-content">
          <ProspectsTab nichoId={nichoId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
