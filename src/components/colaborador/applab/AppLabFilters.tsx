import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type TypeFilter = "all" | "b2b" | "b2c";
export type StatusFilter = "all" | "active" | "inactive" | "pending";
export type BillingFilter = "all" | "em_dia" | "atrasado";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  typeFilter: TypeFilter;
  onType: (v: TypeFilter) => void;
  statusFilter: StatusFilter;
  onStatus: (v: StatusFilter) => void;
  billingFilter: BillingFilter;
  onBilling: (v: BillingFilter) => void;
  showBilling: boolean;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      className={cn("h-7 text-xs", !active && "bg-card/50")}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function AppLabFilters({
  search,
  onSearch,
  typeFilter,
  onType,
  statusFilter,
  onStatus,
  billingFilter,
  onBilling,
  showBilling,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip active={typeFilter === "all"} onClick={() => onType("all")}>Todos tipos</Chip>
        <Chip active={typeFilter === "b2b"} onClick={() => onType("b2b")}>B2B</Chip>
        <Chip active={typeFilter === "b2c"} onClick={() => onType("b2c")}>B2C</Chip>
        <span className="w-px bg-border/40 mx-1" />
        <Chip active={statusFilter === "all"} onClick={() => onStatus("all")}>Todos status</Chip>
        <Chip active={statusFilter === "active"} onClick={() => onStatus("active")}>Ativos</Chip>
        <Chip active={statusFilter === "pending"} onClick={() => onStatus("pending")}>Aguardando</Chip>
        <Chip active={statusFilter === "inactive"} onClick={() => onStatus("inactive")}>Inativos</Chip>
        {showBilling && (
          <>
            <span className="w-px bg-border/40 mx-1" />
            <Chip active={billingFilter === "all"} onClick={() => onBilling("all")}>Todos billing</Chip>
            <Chip active={billingFilter === "em_dia"} onClick={() => onBilling("em_dia")}>🟢 Em dia</Chip>
            <Chip active={billingFilter === "atrasado"} onClick={() => onBilling("atrasado")}>🔴 Atrasado</Chip>
          </>
        )}
      </div>
    </div>
  );
}
