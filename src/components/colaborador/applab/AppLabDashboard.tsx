import { useMemo } from "react";
import { AppLabClient } from "@/hooks/queries/useAppLabClients";
import { AppLabApp } from "@/hooks/queries/useAppLabApps";
import { computeBillingStatus, daysUntil } from "@/lib/applab-billing";
import { cn } from "@/lib/utils";

interface Props {
  clients: AppLabClient[];
  apps: AppLabApp[];
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="px-4 py-3 rounded-xl border border-border/40 bg-card/50">
      <div className={cn("text-2xl font-semibold", accent)}>{value}</div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs uppercase tracking-wider text-muted-foreground">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">{children}</div>
    </div>
  );
}

export function AppLabDashboard({ clients, apps }: Props) {
  const m = useMemo(() => {
    const totalApps = apps.length;
    const appsActive = apps.filter((a) => a.status === "active").length;

    const totalClients = clients.length;
    const clientsActive = clients.filter((c) => c.status === "active").length;
    const clientsPending = clients.filter((c) => c.status === "pending").length;
    const clientsInactive = clients.filter((c) => c.status === "inactive").length;

    const b2b = clients.filter((c) => c.app_type === "b2b");
    const b2c = clients.filter((c) => c.app_type === "b2c");

    const mrr = b2b
      .filter((c) => c.status === "active")
      .reduce((sum, c) => sum + Number(c.billing?.monthly_value || 0), 0);
    const atrasados = b2b.filter((c) => computeBillingStatus(c.billing) === "atrasado").length;
    const emDia = b2b.length - atrasados;
    const proximos = b2b.filter((c) => {
      const d = daysUntil(c.billing?.next_payment);
      return d !== null && d >= 0 && d <= 7;
    }).length;

    return {
      totalApps, appsActive, totalClients, clientsActive, clientsPending,
      clientsInactive, b2bLen: b2b.length, b2cLen: b2c.length, mrr, atrasados, emDia, proximos,
    };
  }, [clients, apps]);

  const {
    totalApps, appsActive, totalClients, clientsActive, clientsPending,
    clientsInactive, b2bLen, b2cLen, mrr, atrasados, emDia, proximos,
  } = m;


  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      <Section title="Totais">
        <Stat label="Apps" value={totalApps} />
        <Stat label="Apps ativos" value={appsActive} accent="text-emerald-400" />
        <Stat label="Clientes" value={totalClients} />
        <Stat label="Clientes ativos" value={clientsActive} accent="text-emerald-400" />
        <Stat label="Aguardando" value={clientsPending} accent="text-amber-400" />
        <Stat label="Inativos" value={clientsInactive} accent="text-zinc-400" />
      </Section>

      <Section title="Financeiro (B2B)">
        <Stat label="MRR total" value={fmt(mrr)} accent="text-emerald-400" />
        <Stat label="Em dia" value={emDia} accent="text-emerald-400" />
        <Stat label="Atrasados" value={atrasados} accent="text-red-400" />
        <Stat label="Vencimentos próximos" value={proximos} accent="text-amber-400" />
      </Section>

      <Section title="Split">
        <Stat label="B2B" value={b2b.length} accent="text-blue-400" />
        <Stat label="B2C" value={b2c.length} accent="text-purple-400" />
      </Section>
    </div>
  );
}
