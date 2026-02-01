import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, RefreshCw, Layers, Brain } from "lucide-react";
import { ClienteApp, useUpdateClienteApp, useDeleteClienteApp } from "@/hooks/queries/useClienteApps";
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

interface ClienteAppItemProps {
  app: ClienteApp;
  onEdit: (app: ClienteApp) => void;
  nichoId: string;
}

export function ClienteAppItem({ app, onEdit, nichoId }: ClienteAppItemProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const updateApp = useUpdateClienteApp();
  const deleteApp = useDeleteClienteApp();

  const handleToggleAtivo = () => {
    updateApp.mutate({ id: app.id, ativo: !app.ativo });
  };

  const handleDelete = () => {
    deleteApp.mutate(
      { id: app.id, clienteId: app.cliente_id, nichoId },
      { onSuccess: () => setDeleteOpen(false) }
    );
  };

  const formatarValor = () => {
    const valor = app.valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    if (app.periodicidade === "anual") return `${valor}/ano`;
    if (app.periodicidade === "unico") return valor;
    return `${valor}/mês`;
  };

  const TipoIcon = app.tipo_custo === "recorrente" ? RefreshCw : Layers;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 p-2.5 rounded-lg border transition-all",
          app.ativo
            ? "bg-muted/30 border-border/40"
            : "bg-muted/10 border-border/20 opacity-60"
        )}
      >
        {/* Ícone de Tipo */}
        <div
          className={cn(
            "p-1.5 rounded-md",
            app.tipo_custo === "recorrente"
              ? "bg-blue-500/10 text-blue-400"
              : "bg-amber-500/10 text-amber-400"
          )}
        >
          <TipoIcon className="h-4 w-4" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-medium truncate", !app.ativo && "line-through")}>
              {app.nome_app}
            </span>
            {app.rateio === "compartilhado" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                Compartilhado
              </Badge>
            )}
          </div>
          {app.observacao && (
            <p className="text-xs text-muted-foreground truncate">{app.observacao}</p>
          )}
        </div>

        {/* Valor */}
        <div className="text-sm font-medium text-right whitespace-nowrap">
          {formatarValor()}
        </div>

        {/* Toggle Ativo */}
        <Switch
          checked={app.ativo}
          onCheckedChange={handleToggleAtivo}
          className="data-[state=checked]:bg-emerald-500"
        />

        {/* Ações */}
        <div className="flex items-center gap-1">
          {app.mapa_mental_url && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-violet-500 hover:text-violet-600 hover:bg-violet-500/10"
              onClick={() => window.open(app.mapa_mental_url!, "_blank")}
              title="Abrir Mapa Mental"
            >
              <Brain className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(app)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover App</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{app.nome_app}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteApp.isPending}
            >
              {deleteApp.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
