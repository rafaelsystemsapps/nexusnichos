import { Link } from "react-router-dom";
import { Folder } from "lucide-react";
import { AccountRow, statusFromDB } from "@/hooks/queries";
import type { OperationalStatus } from "@/hooks/queries/useAccountTasks";
import { paisInfo } from "@/lib/paises";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  ativa: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  desabilitada: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  banida: "bg-red-500/15 text-red-400 border-red-500/30",
};

const OP_BORDER: Record<OperationalStatus, string> = {
  pending: "border-yellow-500/60 hover:border-yellow-400",
  completed: "border-emerald-500/60 hover:border-emerald-400",
  neutral: "border-border/40 hover:border-primary/40",
};

interface Props {
  account: AccountRow;
  nichoId: string;
  operationalStatus?: OperationalStatus;
}

export function AccountFolderCard({ account, nichoId, operationalStatus = "neutral" }: Props) {
  const status = statusFromDB(account.status);
  const at = account.username ? `@${account.username}` : account.nome_conta;
  const pais = paisInfo(account.pais);
  const isInactive = status !== "ativa";
  return (
    <Link
      to={`/workspace/${nichoId}/contas/${account.id}`}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-2 p-5 rounded-xl border bg-card/50 hover:bg-card transition-all",
        OP_BORDER[operationalStatus],
        isInactive && "opacity-60",
      )}
    >
      <Folder className="h-12 w-12 text-primary/70 group-hover:text-primary transition-colors" strokeWidth={1.5} />
      <div className="text-center min-w-0 w-full">
        <div className="font-semibold text-sm truncate">{at}</div>
        {account.username && (
          <div className="text-xs text-muted-foreground truncate">{account.nome_conta}</div>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] flex-wrap justify-center">
        <span className="capitalize text-muted-foreground">{account.plataforma}</span>
        <span className={cn("px-1.5 py-0.5 rounded border", STATUS_STYLE[status])}>
          {status === "ativa" ? "Ativa" : status === "desabilitada" ? "Inativa" : "Banida"}
        </span>
        {pais && (
          <span className="px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground">
            {pais.flag} {pais.value}
          </span>
        )}
      </div>
    </Link>
  );
}
