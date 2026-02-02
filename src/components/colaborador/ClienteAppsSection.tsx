import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp, Globe } from "lucide-react";
import {
  useClienteApps,
  calcularCustoMensal,
  ClienteApp,
} from "@/hooks/queries/useClienteApps";
import { ClienteAppItem } from "./ClienteAppItem";
import { ClienteAppForm } from "./ClienteAppForm";
import { Skeleton } from "@/components/ui/skeleton";

interface ClienteAppsSectionProps {
  clienteId: string;
  nichoId: string;
}

export function ClienteAppsSection({
  clienteId,
  nichoId,
}: ClienteAppsSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ClienteApp | null>(null);

  const { data: apps = [], isLoading } = useClienteApps(clienteId);

  const custoMensal = calcularCustoMensal(apps);

  const handleEdit = (app: ClienteApp) => {
    setEditingApp(app);
    setFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingApp(null);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="border-t border-border/30 pt-3 mt-1">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-medium">Domínios</span>
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

      {/* Lista de Domínios (expandida) */}
      {expanded && (
        <div className="mt-3 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : apps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum domínio cadastrado
            </p>
          ) : (
            apps.map((app) => (
              <ClienteAppItem key={app.id} app={app} onEdit={handleEdit} nichoId={nichoId} />
            ))
          )}
        </div>
      )}

      {/* Form Modal */}
      <ClienteAppForm
        open={formOpen}
        onOpenChange={handleFormClose}
        clienteId={clienteId}
        nichoId={nichoId}
        app={editingApp}
      />
    </div>
  );
}
