import { cn } from "@/lib/utils";
import { DayStatus } from "@/hooks/queries/useAccountTasks";

interface Props {
  status: DayStatus;
  isToday?: boolean;
  isFuture?: boolean;
  onClick?: () => void;
  readOnly?: boolean;
}

export function DayDot({ status, isToday, isFuture, onClick, readOnly }: Props) {
  const base = "h-6 w-6 rounded-full border transition-all flex items-center justify-center text-[10px]";
  const color =
    status === "success"
      ? "bg-emerald-500 border-emerald-400 text-white"
      : status === "failed"
        ? "bg-red-500 border-red-400 text-white"
        : "bg-muted/40 border-border/60 hover:border-primary/60";
  const interactive = !readOnly && !isFuture ? "cursor-pointer hover:scale-110" : "cursor-default opacity-60";
  const ring = isToday ? "ring-2 ring-primary/60 ring-offset-1 ring-offset-background" : "";

  return (
    <button
      type="button"
      disabled={readOnly || isFuture}
      onClick={onClick}
      className={cn(base, color, interactive, ring)}
      aria-label={`Status: ${status}`}
    >
      {status === "success" ? "✓" : status === "failed" ? "✕" : ""}
    </button>
  );
}
