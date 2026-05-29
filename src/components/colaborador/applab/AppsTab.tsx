import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Search, Boxes } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AppLabApp,
  useCreateAppLabApp,
  useDeleteAppLabApp,
  useUpdateAppLabApp,
} from "@/hooks/queries/useAppLabApps";
import { AppLabClient, useAppLabClients } from "@/hooks/queries/useAppLabClients";
import { AppCard } from "./AppCard";
import { AppFormDialog } from "./AppFormDialog";
import { AppDetailDialog } from "./AppDetailDialog";
import { ClientDetailDialog } from "./ClientDetailDialog";
import { TypeFilter } from "./AppLabFilters";
import { cn } from "@/lib/utils";

interface Props {
  nichoId: string;
  apps: AppLabApp[];
  isLoading: boolean;
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

export function AppsTab({ nichoId, apps, isLoading }: Props) {
  const { data: clients = [] } = useAppLabClients(nichoId);
  const createMut = useCreateAppLabApp(nichoId);
  const updateMut = useUpdateAppLabApp(nichoId);
  const deleteMut = useDeleteAppLabApp(nichoId);

  const countFor = (id: string) => clients.filter((c) => c.app_id === id).length;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusActive, setStatusActive] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppLabApp | null>(null);
  const [detail, setDetail] = useState<AppLabApp | null>(null);
  const [toDelete, setToDelete] = useState<AppLabApp | null>(null);
  const [clientDetail, setClientDetail] = useState<AppLabClient | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return apps.filter((a) => {
      if (q && !a.name.toLowerCase().includes(q)) return false;
      if (typeFilter !== "all" && a.app_type !== typeFilter) return false;
      if (statusActive && a.status !== "active") return false;
      return true;
    });
  }, [apps, search, typeFilter, statusActive]);

  const handleSubmit = async (input: any) => {
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, input });
    } else {
      await createMut.mutateAsync(input);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const appName = (id: string | null) => apps.find((a) => a.id === id)?.name ?? null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Pastas de apps com clientes vinculados</p>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Novo App
        </Button>
      </div>

      <div className="space-y-2">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar app..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>Todos tipos</Chip>
          <Chip active={typeFilter === "b2b"} onClick={() => setTypeFilter("b2b")}>B2B</Chip>
          <Chip active={typeFilter === "b2c"} onClick={() => setTypeFilter("b2c")}>B2C</Chip>
          <span className="w-px bg-border/40 mx-1" />
          <Chip active={statusActive} onClick={() => setStatusActive((v) => !v)}>Só ativos</Chip>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Boxes className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {apps.length === 0 ? "Nenhum app cadastrado ainda" : "Nenhum resultado com esses filtros"}
          </p>
          {apps.length === 0 && (
            <Button variant="outline" className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Adicionar primeiro
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((a) => (
            <AppCard key={a.id} app={a} clientCount={countFor(a.id)} onClick={setDetail} />
          ))}
        </div>
      )}

      <AppFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        app={editing}
        onSubmit={handleSubmit}
        isLoading={createMut.isPending || updateMut.isPending}
      />

      <AppDetailDialog
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        app={detail}
        clients={clients}
        onEdit={(a) => {
          setDetail(null);
          setEditing(a);
          setFormOpen(true);
        }}
        onDelete={(a) => {
          setDetail(null);
          setToDelete(a);
        }}
        onOpenClient={(c) => {
          setDetail(null);
          setClientDetail(c);
        }}
      />

      <ClientDetailDialog
        open={!!clientDetail}
        onOpenChange={(o) => !o && setClientDetail(null)}
        client={clientDetail}
        appName={clientDetail ? appName(clientDetail.app_id) : null}
        onEdit={() => setClientDetail(null)}
        onDelete={() => setClientDetail(null)}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir app?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá "{toDelete?.name}". Os clientes vinculados serão desvinculados (não excluídos).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (toDelete) await deleteMut.mutateAsync(toDelete.id);
                setToDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
