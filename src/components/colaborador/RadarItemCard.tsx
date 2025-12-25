import { Button } from "@/components/ui/button";
import { Pencil, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RadarItem {
  id: string;
  tema: string;
  plataforma: string;
  status_termico: string;
  data_validade: string | null;
  observacao: string | null;
  created_at: string;
}

interface RadarItemCardProps {
  item: RadarItem;
  expired: boolean;
  onStatusChange: (status: "quente" | "morno" | "morto") => void;
  onEdit: () => void;
  onArchive: () => void;
}

const STATUS_CONFIG = {
  quente: {
    emoji: "🟢",
    label: "Quente",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/40",
    textColor: "text-emerald-400",
  },
  morno: {
    emoji: "🟡",
    label: "Morno",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/40",
    textColor: "text-amber-400",
  },
  morto: {
    emoji: "🔴",
    label: "Morto",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/40",
    textColor: "text-red-400",
  },
};

const PLATAFORMAS = ["TikTok", "Instagram", "YouTube", "Facebook", "Twitter", "LinkedIn", "Outros"];

export function RadarItemCard({
  item,
  expired,
  onStatusChange,
  onEdit,
  onArchive,
}: RadarItemCardProps) {
  const statusKey = (item.status_termico as keyof typeof STATUS_CONFIG) || "morno";
  const config = STATUS_CONFIG[statusKey];

  const cycleStatus = () => {
    const order = ["quente", "morno", "morto"];
    const currentIdx = order.indexOf(item.status_termico);
    const nextIdx = (currentIdx + 1) % order.length;
    onStatusChange(order[nextIdx] as "quente" | "morno" | "morto");
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all",
        config.bgColor,
        config.borderColor,
        expired && "opacity-50"
      )}
    >
      {/* Status Button */}
      <button
        onClick={cycleStatus}
        className="text-3xl hover:scale-110 transition-transform cursor-pointer select-none"
        title={`Status: ${config.label} (clique para alterar)`}
      >
        {config.emoji}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn("font-semibold truncate", config.textColor)}>
            {item.tema}
          </h3>
          {expired && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground shrink-0">
              expirado
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          <span className="font-medium">{item.plataforma}</span>
          <span>•</span>
          <span className="text-muted-foreground/70">
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: false, locale: ptBR })}
          </span>
          {item.data_validade && (
            <>
              <span>•</span>
              <span className={expired ? "text-muted-foreground/50" : ""}>
                até {format(new Date(item.data_validade), "dd MMM", { locale: ptBR })}
              </span>
            </>
          )}
        </div>
        {item.observacao && (
          <p className="text-sm text-muted-foreground/80 mt-1 truncate">
            {item.observacao}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onArchive}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Arquivar"
        >
          <Archive className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
