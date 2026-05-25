import { AppLabClient } from "@/hooks/queries/useAppLabClients";
import { computeBillingStatus } from "@/lib/applab-billing";
import { cn } from "@/lib/utils";

interface Props {
  clients: AppLabClient[];
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="px-3 py-2 rounded-lg border border-border/40 bg-card/50 min-w-[88px]">
      <div className={cn("text-base font-semibold", accent)}>{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

export function AppLabStats({ clients }: Props) {
  const total = clients.length;
  const active = clients.filter((c) => c.status === "active").length;
  const inactive = clients.filter((c) => c.status === "inactive").length;
  const pending = clients.filter((c) => c.status === "pending").length;
  const b2b = clients.filter((c) => c.app_type === "b2b");
  const b2c = clients.filter((c) => c.app_type === "b2c");
  const mrr = b2b
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + Number(c.billing?.monthly_value || 0), 0);
  const atrasados = b2b.filter((c) => computeBillingStatus(c.billing) === "atrasado").length;
  const emDia = b2b.length - atrasados;

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="flex flex-wrap gap-2">
      <Stat label="Total" value={total} />
      <Stat label="Ativos" value={active} accent="text-emerald-400" />
      <Stat label="Aguardando" value={pending} accent="text-amber-400" />
      <Stat label="Inativos" value={inactive} accent="text-zinc-400" />
      <Stat label="B2B" value={b2b.length} accent="text-blue-400" />
      <Stat label="B2C" value={b2c.length} accent="text-purple-400" />
      {b2b.length > 0 && (
        <>
          <Stat label="MRR" value={fmt(mrr)} accent="text-emerald-400" />
          <Stat label="Em dia" value={emDia} accent="text-emerald-400" />
          <Stat label="Atrasados" value={atrasados} accent="text-red-400" />
        </>
      )}
    </div>
  );
}
