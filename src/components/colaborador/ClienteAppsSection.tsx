import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, ChevronDown, ChevronUp, DollarSign, Layers, TrendingUp, TrendingDown } from "lucide-react";
import {
  useClienteApps,
  calcularCustoMensal,
  calcularCustoEstrutural,
  calcularMargemBruta,
  ClienteApp,
} from "@/hooks/queries/useClienteApps";
import { ClienteAppItem } from "./ClienteAppItem";
import { ClienteAppForm } from "./ClienteAppForm";
import { Skeleton } from "@/components/ui/skeleton";

interface ClienteAppsSectionProps {
  clienteId: string;
  nichoId: string;
  valorContrato: number | null;
  modeloPagamento: string | null;
}

export function ClienteAppsSection({
  clienteId,
  nichoId,
  valorContrato,
  modeloPagamento,
}: ClienteAppsSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ClienteApp | null>(null);

  const { data: apps = [], isLoading } = useClienteApps(clienteId);

  const custoMensal = calcularCustoMensal(apps);
  const custoEstrutural = calcularCustoEstrutural(apps);
  const margem = calcularMargemBruta(valorContrato, modeloPagamento, custoMensal);

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
          <span className="text-sm font-medium">Apps & Custos</span>
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

      {/* Resumo Inteligente (sempre visível se há apps) */}
      {apps.length > 0 && (
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm">
            <DollarSign className="h-4 w-4 text-blue-400" />
            <span className="text-muted-foreground">Mensal:</span>
            <span className="font-medium">{formatCurrency(custoMensal)}</span>
          </div>
          {custoEstrutural > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <Layers className="h-4 w-4 text-amber-400" />
              <span className="text-muted-foreground">Estrutural:</span>
              <span className="font-medium">{formatCurrency(custoEstrutural)}</span>
            </div>
          )}
          {margem !== null && (
            <div className="flex items-center gap-1.5 text-sm">
              {margem >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <span className="text-muted-foreground">Margem:</span>
              <span
                className={cn(
                  "font-medium",
                  margem >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {margem >= 0 ? "+" : ""}
                {formatCurrency(margem)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Lista de Apps (expandida) */}
      {expanded && (
        <div className="mt-3 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : apps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum app cadastrado
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
