import { Folder, Users } from "lucide-react";
import { AppLabApp } from "@/hooks/queries/useAppLabApps";
import { paisInfo } from "@/lib/paises";
import { cn } from "@/lib/utils";

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
  app: AppLabApp;
  clientCount: number;
  onClick: (a: AppLabApp) => void;
}

export function AppCard({ app, clientCount, onClick }: Props) {
  const pais = paisInfo(app.country);
  const isInactive = app.status === "inactive";
  const isPending = app.status === "pending";

  return (
    <button
      type="button"
      onClick={() => onClick(app)}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-2 p-5 rounded-xl border bg-card/50 hover:bg-card transition-all text-left",
        "border-border/40 hover:border-primary/40",
        isInactive && "opacity-60",
        isPending && "border-amber-500/40",
      )}
    >
      <div className="relative">
        <Folder
          className={cn(
            "h-12 w-12 transition-colors",
            isPending ? "text-amber-400/70 group-hover:text-amber-400" : "text-primary/70 group-hover:text-primary",
          )}
          strokeWidth={1.5}
        />
        {clientCount > 0 && (
          <span className="absolute -top-1 -right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
            {clientCount}
          </span>
        )}
      </div>
      <div className="text-center min-w-0 w-full">
        <div className="font-semibold text-sm truncate">{app.name}</div>
        {app.category && <div className="text-xs text-muted-foreground truncate">{app.category}</div>}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] flex-wrap justify-center">
        <span
          className={cn(
            "px-1.5 py-0.5 rounded border uppercase font-medium",
            app.app_type === "b2b"
              ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
              : "bg-purple-500/15 text-purple-400 border-purple-500/30",
          )}
        >
          {app.app_type}
        </span>
        <span className={cn("px-1.5 py-0.5 rounded border", STATUS_STYLE[app.status])}>
          {STATUS_LABEL[app.status]}
        </span>
        {pais && (
          <span className="px-1.5 py-0.5 rounded border border-border/40 text-muted-foreground">
            {pais.flag} {pais.value}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Users className="h-3 w-3" /> {clientCount} cliente{clientCount === 1 ? "" : "s"}
      </div>
    </button>
  );
}
