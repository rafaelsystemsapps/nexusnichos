import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp, Globe, CreditCard, Key, Package } from "lucide-react";
import {
  useClienteApps,
  calcularCustoMensal,
  ClienteApp,
  CategoriaClienteApp,
} from "@/hooks/queries/useClienteApps";
import { ClienteCustoItem } from "./ClienteCustoItem";
import { ClienteCustoForm } from "./ClienteCustoForm";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ClienteCustosSectionProps {
  clienteId: string;
  nichoId: string;
}

const CATEGORIA_CONFIG: Record<CategoriaClienteApp, { label: string; icon: typeof Globe; colorClass: string }> = {
  dominio: { label: "Domínios", icon: Globe, colorClass: "text-cyan-400 bg-cyan-500/10" },
  assinatura: { label: "Assinaturas", icon: CreditCard, colorClass: "text-purple-400 bg-purple-500/10" },
  licenca: { label: "Licenças", icon: Key, colorClass: "text-amber-400 bg-amber-500/10" },
  outro: { label: "Outros", icon: Package, colorClass: "text-muted-foreground bg-muted/50" },
};

export function ClienteCustosSection({
  clienteId,
  nichoId,
}: ClienteCustosSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ClienteApp | null>(null);
  const [defaultCategoria, setDefaultCategoria] = useState<CategoriaClienteApp>("dominio");

  const { data: apps = [], isLoading } = useClienteApps(clienteId);

  const custoMensal = calcularCustoMensal(apps);

  // Agrupar por categoria
  const custosPorCategoria = apps.reduce((acc, item) => {
    const cat = (item.categoria || "dominio") as CategoriaClienteApp;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<CategoriaClienteApp, ClienteApp[]>);

  const categoriasAtivas = Object.keys(custosPorCategoria) as CategoriaClienteApp[];

  const handleEdit = (app: ClienteApp) => {
    setEditingApp(app);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingApp(null);
  };

  const handleAddCategoria = (categoria: CategoriaClienteApp) => {
    setDefaultCategoria(categoria);
    setEditingApp(null);
    setFormOpen(true);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="border-t border-border/30 pt-3 mt-1">
      {/* Header Principal */}
      <div
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Custos</span>
          {apps.length > 0 && (
            <span className="text-xs text-muted-foreground">({apps.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={(e) => {
              e.stopPropagation();
              setDefaultCategoria("dominio");
              setEditingApp(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </div>
      </div>

      {/* Resumo Simples */}
      {apps.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 text-sm">
          <span className="text-muted-foreground">Custo:</span>
          <span className="font-medium">{formatCurrency(custoMensal)}/mês</span>
        </div>
      )}

      {/* Lista de Custos (expandida) */}
      {expanded && (
        <div className="mt-3 space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : apps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum custo cadastrado
            </p>
          ) : (
            // Renderizar por categoria
            categoriasAtivas.map((categoria) => {
              const config = CATEGORIA_CONFIG[categoria];
              const itens = custosPorCategoria[categoria];
              const Icon = config.icon;
              
              return (
                <div key={categoria} className="space-y-2">
                  {/* Header da Categoria */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1 rounded", config.colorClass.split(" ")[1])}>
                        <Icon className={cn("h-3.5 w-3.5", config.colorClass.split(" ")[0])} />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {config.label} ({itens.length})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5"
                      onClick={() => handleAddCategoria(categoria)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Itens da Categoria */}
                  {itens.map((app) => (
                    <ClienteCustoItem key={app.id} app={app} onEdit={handleEdit} nichoId={nichoId} />
                  ))}
                </div>
              );
            })
          )}
          
          {/* Botões para adicionar novas categorias */}
          {apps.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/20">
              {(["dominio", "assinatura", "licenca", "outro"] as CategoriaClienteApp[])
                .filter(cat => !categoriasAtivas.includes(cat))
                .map((categoria) => {
                  const config = CATEGORIA_CONFIG[categoria];
                  const Icon = config.icon;
                  return (
                    <Button
                      key={categoria}
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => handleAddCategoria(categoria)}
                    >
                      <Icon className={cn("h-3 w-3", config.colorClass.split(" ")[0])} />
                      + {config.label}
                    </Button>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <ClienteCustoForm
        open={formOpen}
        onOpenChange={handleFormClose}
        clienteId={clienteId}
        nichoId={nichoId}
        app={editingApp}
        defaultCategoria={defaultCategoria}
      />
    </div>
  );
}
