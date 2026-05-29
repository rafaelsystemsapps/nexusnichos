import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { AppLabClient } from "@/hooks/queries/useAppLabClients";
import { PasswordField } from "@/components/shared/PasswordField";
import { paisInfo } from "@/lib/paises";
import { billingDueLabel, computeBillingStatus } from "@/lib/applab-billing";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: AppLabClient | null;
  appName?: string | null;
  onEdit: (c: AppLabClient) => void;
  onDelete: (c: AppLabClient) => void;
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

export function ClientDetailDialog({ open, onOpenChange, client, onEdit, onDelete }: Props) {
  if (!client) return null;
  const pais = paisInfo(client.country);
  const billingStatus = client.app_type === "b2b" ? computeBillingStatus(client.billing) : null;
  const dueLabel = client.app_type === "b2b" ? billingDueLabel(client.billing?.next_payment) : null;
  const fmt = (v?: number | null) =>
    v == null
      ? "—"
      : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {client.name}
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded border uppercase",
                client.app_type === "b2b"
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                  : "bg-purple-500/15 text-purple-400 border-purple-500/30",
              )}
            >
              {client.app_type}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Identidade */}
          <section className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Identidade</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status" value={STATUS_LABEL[client.status]} />
              <Field label="País" value={pais ? `${pais.flag} ${pais.label}` : "—"} />
              <Field
                label="Criado em"
                value={format(new Date(client.created_at), "dd/MM/yyyy")}
              />
              <Field label="Tipo" value={client.app_type.toUpperCase()} />
            </div>
            {client.description && <Field label="Descrição" value={client.description} />}
          </section>

          {/* Credenciais */}
          <section className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Credenciais</h4>
            <Field label="Login / Email" value={client.login_email} />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Senha</div>
              {client.password ? (
                <PasswordField value={client.password} readOnly allowCopy />
              ) : (
                <span className="text-sm text-muted-foreground/60">—</span>
              )}
            </div>
            {client.notes && <Field label="Observações" value={client.notes} />}
          </section>

          {/* Billing */}
          {client.app_type === "b2b" && (
            <section className="space-y-2 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-wider text-blue-400">Assinatura</h4>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded border",
                    billingStatus === "em_dia"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-red-500/15 text-red-400 border-red-500/30",
                  )}
                >
                  {billingStatus === "em_dia" ? "🟢 Em dia" : "🔴 Atrasado"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor mensal" value={fmt(client.billing?.monthly_value)} />
                <Field label="Plano" value={client.billing?.plan} />
                <Field
                  label="Vencimento"
                  value={client.billing?.due_date ? format(new Date(client.billing.due_date + "T00:00:00"), "dd/MM/yyyy") : "—"}
                />
                <Field
                  label="Próximo pagamento"
                  value={
                    client.billing?.next_payment ? (
                      <>
                        {format(new Date(client.billing.next_payment + "T00:00:00"), "dd/MM/yyyy")}
                        {dueLabel && <span className="block text-xs text-muted-foreground">{dueLabel}</span>}
                      </>
                    ) : "—"
                  }
                />
              </div>
            </section>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            <Button variant="outline" size="sm" onClick={() => onDelete(client)}>
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
            <Button size="sm" onClick={() => onEdit(client)}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
