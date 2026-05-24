import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FilterKey = "all" | "active" | "inactive" | "week_success" | "week_failed";

interface Props {
  filter: FilterKey;
  onFilter: (f: FilterKey) => void;
  search: string;
  onSearch: (s: string) => void;
}

export function TrackerHeader({ filter, onFilter, search, onSearch }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
      <h3 className="font-semibold text-sm">Rotina Operacional</h3>
      <div className="flex gap-2 items-center">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar..."
            className="h-8 w-40 pl-7 text-xs"
          />
        </div>
        <Select value={filter} onValueChange={(v) => onFilter(v as FilterKey)}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="inactive">Inativas</SelectItem>
            <SelectItem value="week_success">Concluídas semana</SelectItem>
            <SelectItem value="week_failed">Falhadas semana</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
