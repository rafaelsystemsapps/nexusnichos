import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Folder, Pencil, Trash2 } from "lucide-react";
import { AppLabApp } from "@/hooks/queries/useAppLabApps";
import { AppLabClient } from "@/hooks/queries/useAppLabClients";
import { paisInfo } from "@/lib/paises";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: AppLabApp | null;
  clients: AppLabClient[];
  onEdit: (a: AppLabApp) => void;
  onDelete: (a: AppLabApp) => void;
  onOpenClient: (c: AppLabClient) => void;
}

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  pending: "Aguardando",
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm">{value || <span className="text-muted-foreground/60">—</span>}</div>
    </div>
  );
}

export function AppDetailDialog({ open, onOpenChange, app, clients, onEdit, onDelete, onOpenClient }: Props) {
  if (!app) return null;
  const pais = paisInfo(app.country);
  const linked = clients.filter((c) => c.app_id === app.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {app.name}
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded border uppercase",
                app.app_type === "b2b"
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                  : "bg-purple-500/15 text-purple-400 border-purple-500/30",
              )}
            >
              {app.app_type}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Identidade do app</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status" value={STATUS_LABEL[app.status]} />
              <Field label="Categoria" value={app.category} />
              <Field label="País" value={pais ? `${pais.flag} ${pais.label}` : "—"} />
              <Field label="Criado em" value={format(new Date(app.created_at), "dd/MM/yyyy")} />
            </div>
            {app.description && <Field label="Descrição" value={app.description} />}
          </section>

          <section className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground">
              Clientes vinculados ({linked.length})
            </h4>
            {linked.length === 0 ? (
              <p className="text-sm text-muted-foreground/60">Nenhum cliente vinculado a este app.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {linked.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onOpenClient(c)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg border border-border/40 bg-card/50 hover:bg-card hover:border-primary/40 transition-all",
                      c.status === "inactive" && "opacity-60",
                    )}
                  >
                    <Folder className="h-7 w-7 text-primary/70" strokeWidth={1.5} />
                    <span className="text-xs font-medium truncate w-full text-center">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground">{STATUS_LABEL[c.status]}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            <Button variant="outline" size="sm" onClick={() => onDelete(app)}>
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
            <Button size="sm" onClick={() => onEdit(app)}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
