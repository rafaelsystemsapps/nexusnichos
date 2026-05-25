import { Folder } from "lucide-react";
import { AppLabClient } from "@/hooks/queries/useAppLabClients";
import { paisInfo } from "@/lib/paises";
import { cn } from "@/lib/utils";
import { billingDueLabel, computeBillingStatus } from "@/lib/applab-billing";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  inactive: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  pending: "Aguardando",
};

interface Props {
  client: AppLabClient;
  onClick: (c: AppLabClient) => void;
}

export function ClientCard({ client, onClick }: Props) {
  const pais = paisInfo(client.country);
  const isInactive = client.status === "inactive";
  const isPending = client.status === "pending";
  const billingStatus = client.app_type === "b2b" ? computeBillingStatus(client.billing) : null;
  const dueLabel = client.app_type === "b2b" ? billingDueLabel(client.billing?.next_payment) : null;

  return (
    <button
      type="button"
      onClick={() => onClick(client)}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-2 p-5 rounded-xl border bg-card/50 hover:bg-card transition-all text-left",
        "border-border/40 hover:border-primary/40",
        isInactive && "opacity-60",
        isPending && "border-amber-500/40",
      )}
    >
      <Folder
        className={cn(
          "h-12 w-12 transition-colors",
          isPending ? "text-amber-400/70 group-hover:text-amber-400" : "text-primary/70 group-hover:text-primary",
        )}
        strokeWidth={1.5}
      />
      <div className="text-center min-w-0 w-full">
        <div className="font-semibold text-sm truncate">{client.name}</div>
        {client.description && (
          <div className="text-xs text-muted-foreground truncate">{client.description}</div>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] flex-wrap justify-center">
        <span
          className={cn(
            "px-1.5 py-0.5 rounded border uppercase font-medium",
            client.app_type === "b2b"
              ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
              : "bg-purple-500/15 text-purple-400 border-purple-500/30",
          )}
        >
          {client.app_type}
        </span>
        <span className={cn("px-1.5 py-0.5 rounded border", STATUS_STYLE[client.status])}>
          {STATUS_LABEL[client.status]}
        </span>
        {pais && (
          <span className="px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground">
            {pais.flag} {pais.value}
          </span>
        )}
      </div>
      {client.app_type === "b2b" && client.billing && (
        <div className="flex flex-col items-center gap-0.5 text-[10px]">
          <span
            className={cn(
              "px-1.5 py-0.5 rounded border",
              billingStatus === "em_dia"
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/15 text-red-400 border-red-500/30",
            )}
          >
            {billingStatus === "em_dia" ? "🟢 Em dia" : "🔴 Atrasado"}
          </span>
          {dueLabel && <span className="text-muted-foreground">{dueLabel}</span>}
        </div>
      )}
    </button>
  );
}
