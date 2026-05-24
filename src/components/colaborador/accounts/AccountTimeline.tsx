import { useAccountLogs } from "@/hooks/queries";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ACTION_TYPES } from "./AccountQuickLog";

interface Props {
  accountId: string;
}

const typeLabel = (t: string) => ACTION_TYPES.find((a) => a.value === t)?.label ?? t;

export function AccountTimeline({ accountId }: Props) {
  const { data: logs = [], isLoading } = useAccountLogs(accountId);

  return (
    <div className="space-y-2 p-4 rounded-lg border border-border/40 bg-card/30">
      <h3 className="font-semibold text-sm">Histórico</h3>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : logs.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem atividades registradas ainda.</p>
      ) : (
        <ul className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {logs.map((l) => (
            <li key={l.id} className="text-xs flex gap-2 border-l-2 border-primary/30 pl-2 py-0.5">
              <span className="text-muted-foreground shrink-0">
                {format(new Date(l.created_at), "dd/MM HH:mm", { locale: ptBR })}
              </span>
              <span className="font-medium">{typeLabel(l.action_type)}</span>
              {l.description && <span className="text-muted-foreground truncate">— {l.description}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
