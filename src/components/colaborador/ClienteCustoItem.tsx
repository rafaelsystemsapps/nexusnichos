import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, Globe, CreditCard, Key, Package } from "lucide-react";
import { ClienteApp, useUpdateClienteApp, useDeleteClienteApp, CategoriaClienteApp } from "@/hooks/queries/useClienteApps";
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

interface ClienteCustoItemProps {
  app: ClienteApp;
  onEdit: (app: ClienteApp) => void;
  nichoId: string;
}

const CATEGORIA_CONFIG: Record<CategoriaClienteApp, { label: string; icon: typeof Globe; colorClass: string }> = {
  dominio: { label: "Domínio", icon: Globe, colorClass: "text-cyan-400 bg-cyan-500/10" },
  assinatura: { label: "Assinatura", icon: CreditCard, colorClass: "text-purple-400 bg-purple-500/10" },
  licenca: { label: "Licença", icon: Key, colorClass: "text-amber-400 bg-amber-500/10" },
  outro: { label: "Outro", icon: Package, colorClass: "text-muted-foreground bg-muted/50" },
};

export function ClienteCustoItem({ app, onEdit, nichoId }: ClienteCustoItemProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const updateApp = useUpdateClienteApp();
  const deleteApp = useDeleteClienteApp();

  const categoria = (app.categoria || "dominio") as CategoriaClienteApp;
  const config = CATEGORIA_CONFIG[categoria];
  const Icon = config.icon;

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

  const formatarCustoMensal = () => {
    if (app.periodicidade === "anual") {
      const valorMensal = app.valor / 12;
      return `(${valorMensal.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}/mês)`;
    }
    return null;
  };

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
        {/* Ícone por Categoria */}
        <div className={cn("p-1.5 rounded-md", config.colorClass.split(" ")[1])}>
          <Icon className={cn("h-4 w-4", config.colorClass.split(" ")[0])} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <span className={cn("text-sm font-medium truncate block", !app.ativo && "line-through")}>
            {app.nome_app}
          </span>
        </div>

        {/* Valor */}
        <div className="text-right whitespace-nowrap">
          <div className="text-sm font-medium">{formatarValor()}</div>
          {formatarCustoMensal() && (
            <div className="text-xs text-muted-foreground">{formatarCustoMensal()}</div>
          )}
        </div>

        {/* Toggle Ativo */}
        <Switch
          checked={app.ativo}
          onCheckedChange={handleToggleAtivo}
          className="data-[state=checked]:bg-emerald-500"
        />

        {/* Ações */}
        <div className="flex items-center gap-1">
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
            <AlertDialogTitle>Remover {config.label}</AlertDialogTitle>
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
