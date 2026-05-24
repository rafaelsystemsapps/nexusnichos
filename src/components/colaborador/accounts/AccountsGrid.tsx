import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts, statusFromDB } from "@/hooks/queries";
import { AccountFolderCard } from "./AccountFolderCard";
import { AccountFormDialog, PLATAFORMAS, PAISES } from "./AccountFormDialog";

interface Props {
  nichoId: string;
}

export function AccountsGrid({ nichoId }: Props) {
  const { data: accounts = [], isLoading } = useAccounts(nichoId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todas");
  const [filterPlataforma, setFilterPlataforma] = useState("todas");
  const [filterPais, setFilterPais] = useState("todos");

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const s = statusFromDB(a.status);
      if (filterStatus !== "todas" && s !== filterStatus) return false;
      if (filterPlataforma !== "todas" && a.plataforma !== filterPlataforma) return false;
      if (filterPais !== "todos" && a.pais !== filterPais) return false;
      if (search) {
        const q = search.toLowerCase().replace(/^@/, "");
        const hay = `${a.username ?? ""} ${a.nome_conta}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [accounts, filterStatus, filterPlataforma, filterPais, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Contas</h2>
          <p className="text-xs text-muted-foreground">Hub operacional de contas do workspace</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nova Conta
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por @username..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos status</SelectItem>
            <SelectItem value="ativa">Ativas</SelectItem>
            <SelectItem value="desabilitada">Desabilitadas</SelectItem>
            <SelectItem value="banida">Banidas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPlataforma} onValueChange={setFilterPlataforma}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Plataformas</SelectItem>
            {PLATAFORMAS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPais} onValueChange={setFilterPais}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos países</SelectItem>
            {PAISES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border/40 rounded-lg">
          {accounts.length === 0 ? "Nenhuma conta ainda. Clique em + Nova Conta." : "Nenhuma conta corresponde aos filtros."}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((a) => (
            <AccountFolderCard key={a.id} account={a} nichoId={nichoId} />
          ))}
        </div>
      )}

      <AccountFormDialog open={dialogOpen} onOpenChange={setDialogOpen} nichoId={nichoId} />
    </div>
  );
}
