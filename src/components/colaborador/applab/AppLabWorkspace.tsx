import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, FlaskRound } from "lucide-react";
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
  AppLabClient,
  useAppLabClients,
  useCreateAppLabClient,
  useDeleteAppLabClient,
  useUpdateAppLabClient,
} from "@/hooks/queries/useAppLabClients";
import { AppLabStats } from "./AppLabStats";
import {
  AppLabFilters,
  BillingFilter,
  StatusFilter,
  TypeFilter,
} from "./AppLabFilters";
import { ClientCard } from "./ClientCard";
import { ClientFormDialog } from "./ClientFormDialog";
import { ClientDetailDialog } from "./ClientDetailDialog";
import { computeBillingStatus } from "@/lib/applab-billing";

interface Props {
  nichoId: string;
}

export function AppLabWorkspace({ nichoId }: Props) {
  const { data: clients = [], isLoading } = useAppLabClients(nichoId);
  const createMut = useCreateAppLabClient(nichoId);
  const updateMut = useUpdateAppLabClient(nichoId);
  const deleteMut = useDeleteAppLabClient(nichoId);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [billingFilter, setBillingFilter] = useState<BillingFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppLabClient | null>(null);
  const [detail, setDetail] = useState<AppLabClient | null>(null);
  const [toDelete, setToDelete] = useState<AppLabClient | null>(null);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== "all" && c.app_type !== typeFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (billingFilter !== "all") {
        if (c.app_type !== "b2b") return false;
        if (computeBillingStatus(c.billing) !== billingFilter) return false;
      }
      return true;
    });
  }, [clients, search, typeFilter, statusFilter, billingFilter]);

  const handleSubmit = async (input: any) => {
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, input });
    } else {
      await createMut.mutateAsync(input);
    }
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FlaskRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">App Lab</h2>
            <p className="text-sm text-muted-foreground">Gestor de clientes e apps (B2B & B2C)</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Cliente / App
        </Button>
      </div>

      <AppLabStats clients={clients} />

      <AppLabFilters
        search={search}
        onSearch={setSearch}
        typeFilter={typeFilter}
        onType={setTypeFilter}
        statusFilter={statusFilter}
        onStatus={setStatusFilter}
        billingFilter={billingFilter}
        onBilling={setBillingFilter}
        showBilling={clients.some((c) => c.app_type === "b2b")}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FlaskRound className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {clients.length === 0 ? "Nenhum cliente cadastrado ainda" : "Nenhum resultado com esses filtros"}
          </p>
          {clients.length === 0 && (
            <Button variant="outline" className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Adicionar primeiro
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((c) => (
            <ClientCard key={c.id} client={c} onClick={setDetail} />
          ))}
        </div>
      )}

      <ClientFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        client={editing}
        onSubmit={handleSubmit}
        isLoading={createMut.isPending || updateMut.isPending}
      />

      <ClientDetailDialog
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        client={detail}
        onEdit={(c) => {
          setDetail(null);
          setEditing(c);
          setFormOpen(true);
        }}
        onDelete={(c) => {
          setDetail(null);
          setToDelete(c);
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá "{toDelete?.name}" e seus dados de assinatura. Esta ação não pode ser desfeita.
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
